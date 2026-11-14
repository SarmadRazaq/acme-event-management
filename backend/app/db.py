"""Database connection and session management.

This module creates the SQLAlchemy 2.0 **async** engine (driver: asyncpg) and a session
factory, and exposes ``get_session`` which FastAPI uses as a dependency to give every
request its own ``AsyncSession``.
"""

from collections.abc import AsyncIterator

from sqlalchemy import MetaData
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import DeclarativeBase

from app.config import settings

# A naming convention gives constraints predictable names, which keeps Alembic
# migrations stable and makes database errors easier to read.
NAMING_CONVENTION = {
    "ix": "ix_%(column_0_label)s",
    "uq": "uq_%(table_name)s_%(column_0_name)s",
    "ck": "ck_%(table_name)s_%(constraint_name)s",
    "fk": "fk_%(table_name)s_%(column_0_name)s_%(referred_table_name)s",
    "pk": "pk_%(table_name)s",
}


class Base(DeclarativeBase):
    """Base class that every ORM model inherits from."""

    metadata = MetaData(naming_convention=NAMING_CONVENTION)


# The engine owns the connection pool. ``pool_pre_ping`` checks a connection is still
# alive before using it, which avoids errors after the database restarts.
engine = create_async_engine(settings.database_url, echo=settings.sql_echo, pool_pre_ping=True)

# ``expire_on_commit=False`` keeps loaded attributes usable after commit. Without it,
# reading an attribute would trigger a lazy (implicit sync) refresh, which async SQLAlchemy forbids.
SessionLocal = async_sessionmaker(bind=engine, class_=AsyncSession, expire_on_commit=False)


async def get_session() -> AsyncIterator[AsyncSession]:
    """Yield a database session for a single request and always close it afterwards.

    Used as a FastAPI dependency: ``session: AsyncSession = Depends(get_session)``.
    """
    async with SessionLocal() as session:
        yield session
