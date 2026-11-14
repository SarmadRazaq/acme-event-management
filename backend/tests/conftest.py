"""Shared pytest fixtures.

The tests run against a **real PostgreSQL database** (``TEST_DATABASE_URL``) so they exercise
the same SQL, constraints and row locks as production. Setup works like this:

* once per test run: drop and recreate every table on the test database
* for every test: the app's ``get_session`` dependency is overridden to use the test
  database, and all tables are truncated afterwards so tests never affect each other
"""

from collections.abc import AsyncIterator, Awaitable, Callable
from typing import Any

import pytest
from httpx import ASGITransport, AsyncClient
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.pool import NullPool

from app import models
from app.config import settings
from app.db import get_session
from app.main import app

# NullPool opens a fresh connection per session. That avoids sharing pooled connections
# between event loops and lets the concurrency test use truly parallel transactions.
test_engine = create_async_engine(settings.test_database_url, poolclass=NullPool)
TestSessionLocal = async_sessionmaker(bind=test_engine, expire_on_commit=False)

TABLES = ", ".join(table.name for table in models.Base.metadata.sorted_tables)


@pytest.fixture(scope="session", autouse=True)
async def create_schema() -> AsyncIterator[None]:
    """Create a fresh schema on the test database once for the whole test run."""
    async with test_engine.begin() as conn:
        await conn.run_sync(models.Base.metadata.drop_all)
        await conn.run_sync(models.Base.metadata.create_all)
    yield
    await test_engine.dispose()


async def override_get_session() -> AsyncIterator[AsyncSession]:
    """Replacement for ``app.db.get_session`` that points at the test database."""
    async with TestSessionLocal() as session:
        yield session


@pytest.fixture(autouse=True)
async def clean_tables() -> AsyncIterator[None]:
    """Empty every table (and reset ids) after each test."""
    yield
    async with test_engine.begin() as conn:
        await conn.execute(text(f"TRUNCATE {TABLES} RESTART IDENTITY CASCADE"))


@pytest.fixture
async def client() -> AsyncIterator[AsyncClient]:
    """HTTP client that calls the FastAPI app in-process (no server needed)."""
    app.dependency_overrides[get_session] = override_get_session
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as http_client:
        yield http_client
    app.dependency_overrides.clear()


USER = {"email": "organizer@acme.com", "full_name": "Event Organizer", "password": "Passw0rd!"}


@pytest.fixture
async def auth_headers(client: AsyncClient) -> dict[str, str]:
    """Register a user, log in, and return an ``Authorization`` header for that user."""
    response = await client.post("/auth/register", json=USER)
    assert response.status_code == 201
    response = await client.post(
        "/auth/login", data={"username": USER["email"], "password": USER["password"]}
    )
    assert response.status_code == 200
    return {"Authorization": f"Bearer {response.json()['access_token']}"}


def event_payload(**overrides: Any) -> dict[str, Any]:
    """Return a valid event body, optionally overriding some fields."""
    payload = {
        "title": "Python Async Workshop",
        "description": "Hands-on asyncio and FastAPI session.",
        "event_date": "2026-11-20T10:00:00Z",
        "location": "Conference Room B",
        "max_capacity": 3,
    }
    payload.update(overrides)
    return payload


def registration_payload(**overrides: Any) -> dict[str, Any]:
    """Return a valid registration body, optionally overriding some fields."""
    payload = {
        "employee_name": "Ayesha Khan",
        "employee_email": "ayesha.khan@acme.com",
        "department": "Engineering",
    }
    payload.update(overrides)
    return payload


CreateEvent = Callable[..., Awaitable[dict[str, Any]]]


@pytest.fixture
def create_event(client: AsyncClient, auth_headers: dict[str, str]) -> CreateEvent:
    """Return a helper that creates an event through the API and returns its JSON."""

    async def _create(**overrides: Any) -> dict[str, Any]:
        response = await client.post(
            "/events", json=event_payload(**overrides), headers=auth_headers
        )
        assert response.status_code == 201, response.text
        return response.json()

    return _create
