"""FastAPI application entry point and API routes.

Run locally with::

    uvicorn app.main:app --reload

Interactive documentation is then available at http://127.0.0.1:8000/docs.
"""

from fastapi import Depends, FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy.ext.asyncio import AsyncSession

from app import schemas, services
from app.config import settings
from app.db import get_session

app = FastAPI(
    title=settings.app_name,
    version=settings.app_version,
    description="Internal REST API that lets Acme Corp employees create and manage events "
    "and register for them.",
)

# Allow the React frontend (served from another origin during development) to call the API.
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(services.NotFoundError)
async def not_found_handler(_: Request, exc: services.NotFoundError) -> JSONResponse:
    """Turn a ``NotFoundError`` from the service layer into an HTTP 404 response."""
    return JSONResponse(status_code=status.HTTP_404_NOT_FOUND, content={"detail": exc.message})


# --------------------------------------------------------------------------- health


@app.get(
    "/health",
    response_model=schemas.HealthResponse,
    tags=["Health"],
    summary="Health check",
    description="Reports whether the API is running and can reach the database. "
    "Used by Docker health checks.",
)
async def health(session: AsyncSession = Depends(get_session)) -> schemas.HealthResponse:
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
)
async def create_event(
    payload: schemas.EventCreate, session: AsyncSession = Depends(get_session)
) -> schemas.EventRead:
    """Create a new event."""
    return await services.create_event(session, payload)


@app.get("/events", response_model=list[schemas.EventRead], tags=["Events"], summary="List events")
async def list_events(session: AsyncSession = Depends(get_session)) -> list[schemas.EventRead]:
    """Return all events, soonest first."""
    return await services.list_events(session)


@app.get(
    "/events/{event_id}", response_model=schemas.EventRead, tags=["Events"], summary="Get an event"
)
async def get_event(
    event_id: int, session: AsyncSession = Depends(get_session)
) -> schemas.EventRead:
    """Return a single event by its id."""
    return await services.get_event(session, event_id)


@app.put(
    "/events/{event_id}",
    response_model=schemas.EventRead,
    tags=["Events"],
    summary="Update an event",
)
async def update_event(
    event_id: int, payload: schemas.EventUpdate, session: AsyncSession = Depends(get_session)
) -> schemas.EventRead:
    """Update an existing event."""
    return await services.update_event(session, event_id, payload)


@app.delete(
    "/events/{event_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    tags=["Events"],
    summary="Delete an event",
)
async def delete_event(event_id: int, session: AsyncSession = Depends(get_session)) -> None:
    """Delete an event."""
    await services.delete_event(session, event_id)
