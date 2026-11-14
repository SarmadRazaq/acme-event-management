"""Business logic and database operations.

Route handlers in ``main.py`` stay thin: they validate input with schemas and then call
the functions in this module, which hold all business rules and queries.

Services never return HTTP responses. When something goes wrong they raise one of the
domain exceptions defined below, and ``main.py`` maps it to the right status code.
"""

from sqlalchemy import func, select, text
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from app import models, schemas

# --------------------------------------------------------------------------- exceptions


class ServiceError(Exception):
    """Base class for errors raised by the service layer."""

    def __init__(self, message: str) -> None:
        """Store a human-readable ``message`` that is returned to the client."""
        super().__init__(message)
        self.message = message


class NotFoundError(ServiceError):
    """The requested resource does not exist (HTTP 404)."""


class ConflictError(ServiceError):
    """The request conflicts with the current state, e.g. a duplicate or full event (HTTP 409)."""


# --------------------------------------------------------------------------- health


async def check_database(session: AsyncSession) -> bool:
    """Return ``True`` if the database answers a trivial query, ``False`` otherwise."""
    try:
        await session.execute(text("SELECT 1"))
    except Exception:  # any failure at all means the database is unhealthy
        return False
    return True


# --------------------------------------------------------------------------- events


async def get_event(session: AsyncSession, event_id: int) -> models.Event:
    """Return the event with ``event_id`` or raise ``NotFoundError``."""
    event = await session.get(models.Event, event_id)
    if event is None:
        raise NotFoundError(f"Event with id {event_id} not found.")
    return event


async def list_events(session: AsyncSession) -> list[models.Event]:
    """Return all events, soonest first."""
    result = await session.scalars(
        select(models.Event).order_by(models.Event.event_date, models.Event.id)
    )
    return list(result.all())


async def create_event(session: AsyncSession, data: schemas.EventCreate) -> models.Event:
    """Create and persist a new event from validated ``data``."""
    event = models.Event(**data.model_dump())
    session.add(event)
    await session.commit()
    # Reload server-generated columns (id, created_at, updated_at).
    await session.refresh(event)
    return event


async def update_event(
    session: AsyncSession, event_id: int, data: schemas.EventUpdate
) -> models.Event:
    """Apply the fields present in ``data`` to an existing event."""
    event = await get_event(session, event_id)
    changes = data.model_dump(exclude_unset=True)

    # Business rule: capacity cannot drop below the number of people already registered,
    # otherwise the event would be "over-booked".
    new_capacity = changes.get("max_capacity")
    if new_capacity is not None and new_capacity < event.registered_count:
        raise ConflictError(
            f"Cannot set max_capacity to {new_capacity}: "
            f"{event.registered_count} employees are already registered."
        )

    # ``exclude_unset`` keeps fields the client did not send unchanged.
    for field, value in changes.items():
        setattr(event, field, value)
    await session.commit()
    await session.refresh(event)
    return event


async def delete_event(session: AsyncSession, event_id: int) -> None:
    """Delete an event, or raise ``NotFoundError`` if it does not exist."""
    event = await get_event(session, event_id)
    await session.delete(event)
    await session.commit()


# --------------------------------------------------------------------------- registrations


async def list_registrations(session: AsyncSession, event_id: int) -> list[models.Registration]:
    """Return all registrations for an event, oldest first (404 if the event is missing)."""
    await get_event(session, event_id)
    result = await session.scalars(
        select(models.Registration)
        .where(models.Registration.event_id == event_id)
        .order_by(models.Registration.created_at, models.Registration.id)
    )
    return list(result.all())


async def register_for_event(
    session: AsyncSession, event_id: int, data: schemas.RegistrationCreate
) -> models.Registration:
    """Register an employee for an event while enforcing the business rules.

    Rules:
        1. The event must exist                          -> ``NotFoundError`` (404)
        2. The employee must not already be registered   -> ``ConflictError`` (409)
        3. The event must not be at maximum capacity     -> ``ConflictError`` (409)

    The event row is locked with ``SELECT ... FOR UPDATE`` for the rest of the transaction.
    Two simultaneous requests for the last seat therefore run one after the other, and the
    second one sees the event as full instead of both succeeding.
    """
    locked_id = await session.scalar(
        select(models.Event.id).where(models.Event.id == event_id).with_for_update()
    )
    if locked_id is None:
        raise NotFoundError(f"Event with id {event_id} not found.")
    event = await get_event(session, event_id)

    already_registered = await session.scalar(
        select(models.Registration.id).where(
            models.Registration.event_id == event_id,
            models.Registration.employee_email == data.employee_email,
        )
    )
    if already_registered is not None:
        raise ConflictError(f"{data.employee_email} is already registered for this event.")

    current_count = await session.scalar(
        select(func.count(models.Registration.id)).where(models.Registration.event_id == event_id)
    )
    if current_count >= event.max_capacity:
        raise ConflictError(
            f"Event '{event.title}' is full: all {event.max_capacity} seats are taken."
        )

    registration = models.Registration(event_id=event_id, **data.model_dump())
    session.add(registration)
    try:
        await session.commit()
    except IntegrityError as exc:
        # Safety net: the unique constraint caught a duplicate that slipped past the check.
        await session.rollback()
        raise ConflictError(f"{data.employee_email} is already registered for this event.") from exc
    await session.refresh(registration)
    return registration


async def cancel_registration(session: AsyncSession, registration_id: int) -> None:
    """Cancel (delete) a registration, or raise ``NotFoundError`` if it does not exist."""
    registration = await session.get(models.Registration, registration_id)
    if registration is None:
        raise NotFoundError(f"Registration with id {registration_id} not found.")
    await session.delete(registration)
    await session.commit()
