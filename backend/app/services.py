"""Business logic and database operations.

Route handlers in ``main.py`` stay thin: they validate input with schemas and then call
the functions in this module, which hold all business rules and queries.

Services never return HTTP responses. When something goes wrong they raise one of the
domain exceptions defined below, and ``main.py`` maps it to the right status code.
"""

from datetime import UTC, date, datetime, time, timedelta
from typing import Any

from sqlalchemy import Select, func, select, text
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from app import models, schemas, security

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


class AuthenticationError(ServiceError):
    """Login failed because the e-mail or password is wrong (HTTP 401)."""


# --------------------------------------------------------------------------- helpers


async def _paginate(
    session: AsyncSession, statement: Select[Any], skip: int, limit: int
) -> tuple[list[Any], int]:
    """Run ``statement`` for one page and also count every matching row.

    Shared by all list endpoints so pagination behaves the same everywhere.

    Returns:
        A ``(items, total)`` tuple.
    """
    # Count over the filtered query without ORDER BY (ordering is irrelevant to a count).
    total = await session.scalar(
        select(func.count()).select_from(statement.order_by(None).subquery())
    )
    result = await session.scalars(statement.offset(skip).limit(limit))
    return list(result.all()), total or 0


def _escape_like(value: str) -> str:
    """Escape SQL ``LIKE`` wildcards so user input such as ``100%`` is matched literally."""
    return value.replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_")


# --------------------------------------------------------------------------- health


async def check_database(session: AsyncSession) -> bool:
    """Return ``True`` if the database answers a trivial query, ``False`` otherwise."""
    try:
        await session.execute(text("SELECT 1"))
    except Exception:  # any failure at all means the database is unhealthy
        return False
    return True


# --------------------------------------------------------------------------- users & auth


async def register_user(session: AsyncSession, data: schemas.UserCreate) -> models.User:
    """Create a user account with a hashed password (409 if the e-mail is taken)."""
    existing = await session.scalar(select(models.User.id).where(models.User.email == data.email))
    if existing is not None:
        raise ConflictError(f"An account with e-mail {data.email} already exists.")

    user = models.User(
        email=data.email,
        full_name=data.full_name,
        hashed_password=security.hash_password(data.password),
    )
    session.add(user)
    try:
        await session.commit()
    except IntegrityError as exc:  # two sign-ups with the same e-mail at the same moment
        await session.rollback()
        raise ConflictError(f"An account with e-mail {data.email} already exists.") from exc
    await session.refresh(user)
    return user


async def authenticate_user(session: AsyncSession, email: str, password: str) -> schemas.Token:
    """Check the credentials and return a JWT access token.

    The same error is raised for an unknown e-mail and for a wrong password, so an
    attacker cannot use the login form to find out which e-mails have accounts.
    """
    user = await session.scalar(select(models.User).where(models.User.email == email.lower()))
    if user is None or not security.verify_password(password, user.hashed_password):
        raise AuthenticationError("Incorrect e-mail or password.")
    return schemas.Token(access_token=security.create_access_token(user.id))


# --------------------------------------------------------------------------- events


async def get_event(session: AsyncSession, event_id: int) -> models.Event:
    """Return the event with ``event_id`` or raise ``NotFoundError``."""
    event = await session.get(models.Event, event_id)
    if event is None:
        raise NotFoundError(f"Event with id {event_id} not found.")
    return event


async def list_events(
    session: AsyncSession,
    *,
    skip: int = 0,
    limit: int = 10,
    title: str | None = None,
    on_date: date | None = None,
) -> tuple[list[models.Event], int]:
    """Return one page of events (soonest first) and the total number of matches.

    Args:
        session: Database session.
        skip: Number of events to skip (offset).
        limit: Maximum number of events to return.
        title: Optional case-insensitive partial match on the title.
        on_date: Optional calendar day (UTC); only events on that day are returned.
    """
    statement = select(models.Event).order_by(models.Event.event_date, models.Event.id)

    if title:
        pattern = f"%{_escape_like(title.strip())}%"
        statement = statement.where(models.Event.title.ilike(pattern, escape="\\"))
    if on_date is not None:
        # A half-open range [day 00:00, next day 00:00) is used instead of casting the
        # column to a date, so the index on ``event_date`` can still be used.
        start = datetime.combine(on_date, time.min, tzinfo=UTC)
        statement = statement.where(
            models.Event.event_date >= start,
            models.Event.event_date < start + timedelta(days=1),
        )

    return await _paginate(session, statement, skip, limit)


async def create_event(
    session: AsyncSession, data: schemas.EventCreate, created_by: models.User
) -> models.Event:
    """Create and persist a new event from validated ``data``, owned by ``created_by``."""
    event = models.Event(**data.model_dump(), created_by_id=created_by.id)
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


async def list_registrations(
    session: AsyncSession, event_id: int, *, skip: int = 0, limit: int = 10
) -> tuple[list[models.Registration], int]:
    """Return one page of an event's registrations (oldest first) and the total count.

    Raises:
        NotFoundError: If the event does not exist.
    """
    await get_event(session, event_id)
    statement = (
        select(models.Registration)
        .where(models.Registration.event_id == event_id)
        .order_by(models.Registration.created_at, models.Registration.id)
    )
    return await _paginate(session, statement, skip, limit)


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
