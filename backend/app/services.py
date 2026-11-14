"""Business logic and database operations.

Route handlers in ``main.py`` stay thin: they validate input with schemas and then call
the functions in this module, which hold all business rules and queries.
"""

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession


async def check_database(session: AsyncSession) -> bool:
    """Return ``True`` if the database answers a trivial query, ``False`` otherwise."""
    try:
        await session.execute(text("SELECT 1"))
    except Exception:  # noqa: BLE001 - any failure means "unhealthy"; we never re-raise here
        return False
    return True
