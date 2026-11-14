"""FastAPI application entry point and API routes.

Run locally with::

    uvicorn app.main:app --reload

Interactive documentation is then available at http://127.0.0.1:8000/docs.

Route handlers here are intentionally thin. Each one receives already-validated input
(Pydantic schemas, path parameters and dependencies), calls a function in ``services.py``,
and returns the result. All business rules live in the service layer.
"""

import logging
from typing import Annotated, Any

from fastapi import Depends, FastAPI, Path, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy.ext.asyncio import AsyncSession

from app import schemas, services
from app.config import settings
from app.db import get_session

logger = logging.getLogger("app")

# Metadata shown in Swagger UI. Tags group endpoints into sections.
TAGS_METADATA = [
    {"name": "Events", "description": "Create, browse, update and delete corporate events."},
    {"name": "Registrations", "description": "Register employees for events and cancel seats."},
    {"name": "Health", "description": "Liveness and database connectivity check."},
]

app = FastAPI(
    title=settings.app_name,
    version=settings.app_version,
    description=(
        "Internal REST API for **Acme Corp's Event Management System**.\n\n"
        "Employees can browse product launches, workshops, team-building activities and "
        "conferences, and register for them. Business rules:\n\n"
        "* an employee cannot register for the same event twice (**409**)\n"
        "* an event cannot accept registrations beyond its capacity (**409**)\n"
        "* registering for a non-existent event is rejected (**404**)"
    ),
    openapi_tags=TAGS_METADATA,
    contact={"name": "Acme Corp Platform Team"},
)

# Allow the React frontend (served from another origin during development) to call the API.
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --------------------------------------------------------------------------- shared bits

# Reusable dependency/parameter types keep the route signatures short and consistent.
SessionDep = Annotated[AsyncSession, Depends(get_session)]
EventId = Annotated[int, Path(gt=0, description="Numeric id of the event.", examples=[1])]
RegistrationId = Annotated[
    int, Path(gt=0, description="Numeric id of the registration.", examples=[1])
]


def error_doc(description: str) -> dict[str, Any]:
    """Build an OpenAPI ``responses`` entry that documents an error status code."""
    return {"model": schemas.ErrorResponse, "description": description}


NOT_FOUND_EVENT = {status.HTTP_404_NOT_FOUND: error_doc("Event not found.")}


# --------------------------------------------------------------------------- error handlers


@app.exception_handler(services.NotFoundError)
async def not_found_handler(_: Request, exc: services.NotFoundError) -> JSONResponse:
    """Turn a ``NotFoundError`` from the service layer into an HTTP 404 response."""
    return JSONResponse(status_code=status.HTTP_404_NOT_FOUND, content={"detail": exc.message})


@app.exception_handler(services.ConflictError)
async def conflict_handler(_: Request, exc: services.ConflictError) -> JSONResponse:
    """Turn a ``ConflictError`` (duplicate, full event, ...) into an HTTP 409 response."""
    return JSONResponse(status_code=status.HTTP_409_CONFLICT, content={"detail": exc.message})


@app.exception_handler(Exception)
async def unhandled_error_handler(request: Request, exc: Exception) -> JSONResponse:
    """Log unexpected errors and return a generic 500 without leaking internal details."""
    logger.exception("Unhandled error on %s %s", request.method, request.url.path, exc_info=exc)
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"detail": "An unexpected error occurred. Please try again later."},
    )


# --------------------------------------------------------------------------- health


@app.get(
    "/health",
    response_model=schemas.HealthResponse,
    tags=["Health"],
    summary="Health check",
    description="Reports whether the API is running and can reach the database. "
    "Used by Docker health checks.",
)
async def health(session: SessionDep) -> schemas.HealthResponse:
    """Return the health of the API and its database connection."""
    db_ok = await services.check_database(session)
    return schemas.HealthResponse(status="ok", database="ok" if db_ok else "unavailable")


# --------------------------------------------------------------------------- events


@app.post(
    "/events",
    response_model=schemas.EventRead,
    status_code=status.HTTP_201_CREATED,
    tags=["Events"],
    summary="Create an event",
    description="Create a new corporate event. `title` and `location` cannot be blank, "
    "`event_date` must be a valid ISO 8601 datetime and `max_capacity` must be greater than 0.",
)
async def create_event(payload: schemas.EventCreate, session: SessionDep) -> Any:
    """Create a new event."""
    return await services.create_event(session, payload)


@app.get(
    "/events",
    response_model=list[schemas.EventRead],
    tags=["Events"],
    summary="List events",
    description="Return all events ordered by date (soonest first).",
)
async def list_events(session: SessionDep) -> Any:
    """Return all events, soonest first."""
    return await services.list_events(session)


@app.get(
    "/events/{event_id}",
    response_model=schemas.EventRead,
    tags=["Events"],
    summary="Get an event",
    description="Return a single event, including how many seats are still available.",
    responses=NOT_FOUND_EVENT,
)
async def get_event(event_id: EventId, session: SessionDep) -> Any:
    """Return a single event by its id."""
    return await services.get_event(session, event_id)


@app.put(
    "/events/{event_id}",
    response_model=schemas.EventRead,
    tags=["Events"],
    summary="Update an event",
    description="Update one or more fields of an event. Fields that are not sent stay "
    "unchanged. `max_capacity` cannot be lowered below the current number of registrations.",
    responses={
        **NOT_FOUND_EVENT,
        status.HTTP_409_CONFLICT: error_doc("New capacity is below current registrations."),
    },
)
async def update_event(event_id: EventId, payload: schemas.EventUpdate, session: SessionDep) -> Any:
    """Update an existing event."""
    return await services.update_event(session, event_id, payload)


@app.delete(
    "/events/{event_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    tags=["Events"],
    summary="Delete an event",
    description="Delete an event together with all of its registrations.",
    responses=NOT_FOUND_EVENT,
)
async def delete_event(event_id: EventId, session: SessionDep) -> None:
    """Delete an event."""
    await services.delete_event(session, event_id)


# --------------------------------------------------------------------------- registrations


@app.post(
    "/events/{event_id}/registrations",
    response_model=schemas.RegistrationRead,
    status_code=status.HTTP_201_CREATED,
    tags=["Registrations"],
    summary="Register for an event",
    description="Register an employee for an event. E-mail addresses are compared "
    "case-insensitively.",
    responses={
        **NOT_FOUND_EVENT,
        status.HTTP_409_CONFLICT: error_doc(
            "The employee is already registered, or the event is full."
        ),
    },
)
async def register_for_event(
    event_id: EventId, payload: schemas.RegistrationCreate, session: SessionDep
) -> Any:
    """Register an employee for an event."""
    return await services.register_for_event(session, event_id, payload)


@app.get(
    "/events/{event_id}/registrations",
    response_model=list[schemas.RegistrationRead],
    tags=["Registrations"],
    summary="List registrations for an event",
    description="Return every registration for an event, oldest first.",
    responses=NOT_FOUND_EVENT,
)
async def list_registrations(event_id: EventId, session: SessionDep) -> Any:
    """Return every registration for an event."""
    return await services.list_registrations(session, event_id)


@app.delete(
    "/registrations/{registration_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    tags=["Registrations"],
    summary="Cancel a registration",
    description="Cancel a registration, freeing the seat for someone else.",
    responses={status.HTTP_404_NOT_FOUND: error_doc("Registration not found.")},
)
async def cancel_registration(registration_id: RegistrationId, session: SessionDep) -> None:
    """Cancel a registration."""
    await services.cancel_registration(session, registration_id)
