"""SQLAlchemy ORM models (database tables).

Models are declared with the SQLAlchemy 2.0 typed ``Mapped[...]`` style, so every column
has a Python type that editors and type checkers understand.
"""

from datetime import datetime

from sqlalchemy import (
    CheckConstraint,
    DateTime,
    ForeignKey,
    Integer,
    String,
    Text,
    UniqueConstraint,
    func,
    select,
)
from sqlalchemy.orm import Mapped, column_property, mapped_column, relationship

from app.db import Base


class TimestampMixin:
    """Adds ``created_at`` / ``updated_at`` columns maintained by the database."""

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False
    )


class User(Base):
    """An Acme Corp employee account that can log in and manage events."""

    __tablename__ = "users"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    email: Mapped[str] = mapped_column(String(255), unique=True, nullable=False, index=True)
    full_name: Mapped[str] = mapped_column(String(120), nullable=False)
    # Only the Argon2 hash is stored, never the plain-text password.
    hashed_password: Mapped[str] = mapped_column(String(255), nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    def __repr__(self) -> str:
        """Return a short developer-friendly representation."""
        return f"<User id={self.id} email={self.email!r}>"


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
    # Who created the event. If that account is deleted the event is kept (SET NULL).
    created_by_id: Mapped[int | None] = mapped_column(
        ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )

    # One event has many registrations. ``passive_deletes`` lets PostgreSQL's
    # ON DELETE CASCADE remove them, instead of SQLAlchemy loading each one first.
    registrations: Mapped[list["Registration"]] = relationship(
        back_populates="event", cascade="all, delete-orphan", passive_deletes=True
    )

    def __repr__(self) -> str:
        """Return a short developer-friendly representation."""
        return f"<Event id={self.id} title={self.title!r}>"


class Registration(Base):
    """An employee's registration (seat) for a specific event."""

    __tablename__ = "registrations"
    # The same e-mail address may only register once per event. The service layer checks
    # this first for a friendly error, and the constraint guarantees it even under races.
    __table_args__ = (
        UniqueConstraint("event_id", "employee_email", name="uq_registrations_event_email"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    event_id: Mapped[int] = mapped_column(
        ForeignKey("events.id", ondelete="CASCADE"), nullable=False, index=True
    )
    employee_name: Mapped[str] = mapped_column(String(120), nullable=False)
    employee_email: Mapped[str] = mapped_column(String(255), nullable=False)
    department: Mapped[str | None] = mapped_column(String(100), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    event: Mapped[Event] = relationship(back_populates="registrations")

    def __repr__(self) -> str:
        """Return a short developer-friendly representation."""
        return f"<Registration id={self.id} event_id={self.event_id} email={self.employee_email!r}>"


# Number of registrations for an event, computed by the database in the same query that
# loads the event (a correlated sub-query). That avoids an extra query per event (N+1)
# and works with async sessions, which cannot lazy-load.
Event.registered_count = column_property(
    select(func.count(Registration.id))
    .where(Registration.event_id == Event.id)
    .correlate_except(Registration)
    .scalar_subquery()
)
