"""Pydantic schemas used to validate requests and shape responses.

Each resource has separate schemas for its different jobs:

* ``*Create``: body of a POST request (all required fields)
* ``*Update``: body of a PUT request (fields optional, so partial updates work)
* ``*Read``: what the API returns (includes server-generated fields such as ``id``)
"""

from datetime import datetime
from typing import Annotated

from pydantic import BaseModel, ConfigDict, Field, StringConstraints

# Reusable constrained string types. ``strip_whitespace`` turns "   " into "", which then
# fails ``min_length=1``, so blank titles are rejected with a 422.
Title = Annotated[str, StringConstraints(strip_whitespace=True, min_length=1, max_length=200)]
Location = Annotated[str, StringConstraints(strip_whitespace=True, min_length=1, max_length=200)]
Description = Annotated[str, StringConstraints(strip_whitespace=True, max_length=5000)]
Capacity = Annotated[int, Field(gt=0, le=100_000, description="Maximum number of attendees.")]


class HealthResponse(BaseModel):
    """Response body of the ``/health`` endpoint."""

    status: str = Field(examples=["ok"])
    database: str = Field(examples=["ok"])


# --------------------------------------------------------------------------- events


class EventBase(BaseModel):
    """Fields shared by event create and read schemas."""

    title: Title = Field(description="Short name of the event.")
    description: Description | None = Field(default=None, description="Longer description.")
    event_date: datetime = Field(description="Date and time of the event (ISO 8601).")
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
    event_date: datetime | None = None
    location: Location | None = None
    max_capacity: Capacity | None = None


class EventRead(EventBase):
    """An event as returned by the API."""

    model_config = ConfigDict(from_attributes=True)

    id: int
    created_at: datetime
    updated_at: datetime
