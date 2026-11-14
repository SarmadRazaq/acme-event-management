"""Business logic and database operations.

Route handlers in ``main.py`` stay thin: they validate input with schemas and then call
the functions in this module, which hold all business rules and queries.

Services never return HTTP responses. When something goes wrong they raise one of the
domain exceptions defined below, and ``main.py`` maps it to the right status code.
"""

from sqlalchemy import select, text
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
    # ``exclude_unset`` keeps fields the client did not send unchanged.
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(event, field, value)
    await session.commit()
    await session.refresh(event)
    return event


async def delete_event(session: AsyncSession, event_id: int) -> None:
    """Delete an event, or raise ``NotFoundError`` if it does not exist."""
    event = await get_event(session, event_id)
    await session.delete(event)
    await session.commit()
