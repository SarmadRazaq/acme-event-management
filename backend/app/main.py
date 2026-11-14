"""FastAPI application entry point and API routes.

Run locally with::

    uvicorn app.main:app --reload

Interactive documentation is then available at http://127.0.0.1:8000/docs.
"""

from fastapi import Depends, FastAPI
from fastapi.middleware.cors import CORSMiddleware
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
