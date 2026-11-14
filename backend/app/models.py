"""SQLAlchemy ORM models (database tables).

Models are declared with the SQLAlchemy 2.0 typed ``Mapped[...]`` style, so every column
has a Python type that editors and type checkers understand.
"""

from datetime import datetime

from sqlalchemy import CheckConstraint, DateTime, Integer, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column

from app.db import Base


class TimestampMixin:
    """Adds ``created_at`` / ``updated_at`` columns maintained by the database."""

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False
    )


class Event(TimestampMixin, Base):
    """A corporate event (product launch, workshop, team-building, conference, ...)."""

    __tablename__ = "events"
    # Validation also happens in the Pydantic schemas, but the database is the last line of
    # defence: a capacity of zero or less can never be stored, even by a buggy script.
    __table_args__ = (CheckConstraint("max_capacity > 0", name="max_capacity_positive"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    title: Mapped[str] = mapped_column(String(200), nullable=False, index=True)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    event_date: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, index=True
    )
    location: Mapped[str] = mapped_column(String(200), nullable=False)
    max_capacity: Mapped[int] = mapped_column(Integer, nullable=False)

    def __repr__(self) -> str:
        """Return a short developer-friendly representation."""
        return f"<Event id={self.id} title={self.title!r}>"
