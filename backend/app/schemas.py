"""Pydantic schemas used to validate requests and shape responses.

Each resource has separate schemas for its different jobs:

* ``*Create``: body of a POST request (all required fields)
* ``*Update``: body of a PUT request (fields optional, so partial updates work)
* ``*Read``: what the API returns (includes server-generated fields such as ``id``)
"""

from datetime import UTC, datetime
from typing import Annotated, Generic, Self, TypeVar

from pydantic import (
    AfterValidator,
    BaseModel,
    ConfigDict,
    EmailStr,
    Field,
    StringConstraints,
    computed_field,
    field_validator,
    model_validator,
)


def _assume_utc(value: datetime) -> datetime:
    """Treat a datetime without a timezone ("naive") as UTC so all stored dates are comparable."""
    return value.replace(tzinfo=UTC) if value.tzinfo is None else value


# Reusable constrained string types. ``strip_whitespace`` turns "   " into "", which then
# fails ``min_length=1``, so blank titles are rejected with a 422.
Title = Annotated[str, StringConstraints(strip_whitespace=True, min_length=1, max_length=200)]
Location = Annotated[str, StringConstraints(strip_whitespace=True, min_length=1, max_length=200)]
Description = Annotated[str, StringConstraints(strip_whitespace=True, max_length=5000)]
PersonName = Annotated[str, StringConstraints(strip_whitespace=True, min_length=1, max_length=120)]
Department = Annotated[str, StringConstraints(strip_whitespace=True, max_length=100)]
Capacity = Annotated[int, Field(gt=0, le=100_000, description="Maximum number of attendees.")]
EventDate = Annotated[datetime, AfterValidator(_assume_utc)]


ItemT = TypeVar("ItemT")


class Page(BaseModel, Generic[ItemT]):
    """A page of results plus the information needed to fetch the next one."""

    items: list[ItemT]
    total: int = Field(description="Total number of matching records (across all pages).")
    skip: int = Field(description="Number of records skipped.")
    limit: int = Field(description="Maximum number of records in this page.")


class ErrorResponse(BaseModel):
    """Body of every error response produced by the API (except 422 validation errors)."""

    detail: str = Field(examples=["Event with id 42 not found."])


class HealthResponse(BaseModel):
    """Response body of the ``/health`` endpoint."""

    status: str = Field(examples=["ok"])
    database: str = Field(examples=["ok"])


# --------------------------------------------------------------------------- users & auth


class UserCreate(BaseModel):
    """Request body for creating a user account."""

    model_config = ConfigDict(
        extra="forbid",
        json_schema_extra={
            "example": {
                "email": "organizer@acme.com",
                "full_name": "Event Organizer",
                "password": "Str0ngPassw0rd!",
            }
        },
    )

    email: EmailStr
    full_name: PersonName
    password: str = Field(min_length=8, max_length=128, description="At least 8 characters.")

    @field_validator("email")
    @classmethod
    def normalise_email(cls, value: str) -> str:
        """Store e-mails in lower case so logins are case-insensitive."""
        return value.lower()


class UserRead(BaseModel):
    """A user as returned by the API (never includes the password hash)."""

    model_config = ConfigDict(from_attributes=True)

    id: int
    email: EmailStr
    full_name: str
    created_at: datetime


class Token(BaseModel):
    """OAuth2-compatible access-token response."""

    access_token: str = Field(examples=["eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."])
    token_type: str = Field(default="bearer", examples=["bearer"])


# --------------------------------------------------------------------------- events


class EventBase(BaseModel):
    """Fields shared by event create and read schemas."""

    title: Title = Field(description="Short name of the event.")
    description: Description | None = Field(default=None, description="Longer description.")
    event_date: EventDate = Field(
        description="Date and time of the event (ISO 8601). Times without a timezone are UTC."
    )
    location: Location = Field(description="Where the event takes place.")
    max_capacity: Capacity


class EventCreate(EventBase):
    """Request body for creating an event."""

    model_config = ConfigDict(
        extra="forbid",
        json_schema_extra={
            "example": {
                "title": "Python Async Workshop",
                "description": "Hands-on session on asyncio, FastAPI and async SQLAlchemy.",
                "event_date": "2026-11-20T10:00:00Z",
                "location": "Conference Room B, HQ",
                "max_capacity": 30,
            }
        },
    )


class EventUpdate(BaseModel):
    """Request body for updating an event; only the fields that are sent are changed."""

    model_config = ConfigDict(
        extra="forbid",
        json_schema_extra={"example": {"location": "Main Auditorium", "max_capacity": 50}},
    )

    title: Title | None = None
    description: Description | None = None
    event_date: EventDate | None = None
    location: Location | None = None
    max_capacity: Capacity | None = None

    @model_validator(mode="after")
    def check_fields(self) -> Self:
        """Reject empty updates and ``null`` for fields that the database requires.

        Only ``description`` may be cleared with ``null``; for the other fields ``null``
        would break the NOT NULL columns, so it is reported as a 422 validation error.
        """
        if not self.model_fields_set:
            raise ValueError("Provide at least one field to update.")
        for field in ("title", "event_date", "location", "max_capacity"):
            if field in self.model_fields_set and getattr(self, field) is None:
                raise ValueError(f"'{field}' cannot be null.")
        return self


class EventRead(EventBase):
    """An event as returned by the API."""

    model_config = ConfigDict(from_attributes=True)

    id: int
    created_by_id: int | None = Field(default=None, description="Id of the user who created it.")
    registered_count: int = Field(default=0, description="Number of current registrations.")
    created_at: datetime
    updated_at: datetime

    @computed_field(description="Seats still available.")  # type: ignore[prop-decorator]
    @property
    def available_spots(self) -> int:
        """Return how many seats are left (never negative)."""
        return max(self.max_capacity - self.registered_count, 0)


# --------------------------------------------------------------------------- registrations


class RegistrationCreate(BaseModel):
    """Request body for registering an employee for an event."""

    model_config = ConfigDict(
        extra="forbid",
        json_schema_extra={
            "example": {
                "employee_name": "Ayesha Khan",
                "employee_email": "ayesha.khan@acme.com",
                "department": "Engineering",
            }
        },
    )

    employee_name: PersonName = Field(description="Full name of the employee.")
    employee_email: EmailStr = Field(description="Work e-mail address of the employee.")
    department: Department | None = Field(default=None, description="Optional department.")

    @field_validator("employee_email")
    @classmethod
    def normalise_email(cls, value: str) -> str:
        """Store e-mails in lower case so ``A@acme.com`` and ``a@acme.com`` count as one person."""
        return value.lower()


class RegistrationRead(BaseModel):
    """A registration as returned by the API."""

    model_config = ConfigDict(from_attributes=True)

    id: int
    event_id: int
    employee_name: str
    employee_email: EmailStr
    department: str | None
    created_at: datetime
