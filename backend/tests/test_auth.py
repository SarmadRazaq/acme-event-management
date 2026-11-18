"""Tests for sign-up, login, the current-user endpoint and token handling."""

from datetime import timedelta

import pytest
from httpx import AsyncClient

from app import security
from tests.conftest import USER


async def test_register_returns_user_without_password(client: AsyncClient) -> None:
    """Registering returns 201 and never exposes the password hash."""
    response = await client.post("/auth/register", json={**USER, "email": "New.User@Acme.com"})

    assert response.status_code == 201
    body = response.json()
    assert body["email"] == "new.user@acme.com"  # stored in lower case
    assert body["full_name"] == USER["full_name"]
    assert "password" not in body and "hashed_password" not in body


async def test_register_duplicate_email_is_conflict(client: AsyncClient) -> None:
    """Registering an e-mail that already exists returns 409."""
    await client.post("/auth/register", json=USER)
    response = await client.post("/auth/register", json={**USER, "email": USER["email"].upper()})

    assert response.status_code == 409
    assert "already exists" in response.json()["detail"]


@pytest.mark.parametrize(
    "overrides",
    [
        {"email": "not-an-email"},
        {"password": "short"},
        {"full_name": "   "},
        {"is_admin": True},  # unknown fields are rejected
    ],
)
async def test_register_invalid_data_is_rejected(client: AsyncClient, overrides: dict) -> None:
    """Invalid e-mail, short password, blank name or unknown fields return 422."""
    response = await client.post("/auth/register", json={**USER, **overrides})
    assert response.status_code == 422


async def test_login_returns_bearer_token(client: AsyncClient) -> None:
    """Valid credentials return a Bearer access token."""
    await client.post("/auth/register", json=USER)
    response = await client.post(
        "/auth/login", data={"username": USER["email"].upper(), "password": USER["password"]}
    )

    assert response.status_code == 200
    body = response.json()
    assert body["token_type"] == "bearer"
    assert security.decode_access_token(body["access_token"]) == 1


@pytest.mark.parametrize(
    ("username", "password"),
    [(USER["email"], "wrong-password"), ("nobody@acme.com", USER["password"])],
)
async def test_login_with_bad_credentials_is_unauthorized(
    client: AsyncClient, username: str, password: str
) -> None:
    """A wrong password or unknown e-mail returns 401."""
    await client.post("/auth/register", json=USER)
    response = await client.post("/auth/login", data={"username": username, "password": password})

    assert response.status_code == 401
    assert response.headers["www-authenticate"] == "Bearer"
    assert response.json()["detail"] == "Incorrect e-mail or password."


async def test_me_returns_current_user(client: AsyncClient, auth_headers: dict) -> None:
    """GET /auth/me returns the user who owns the token."""
    response = await client.get("/auth/me", headers=auth_headers)

    assert response.status_code == 200
    assert response.json()["email"] == USER["email"]


async def test_me_without_token_is_unauthorized(client: AsyncClient) -> None:
    """GET /auth/me without a token returns 401."""
    response = await client.get("/auth/me")
    assert response.status_code == 401


@pytest.mark.parametrize(
    "token",
    [
        "not-a-jwt",
        security.create_access_token(1, expires_delta=timedelta(minutes=-1)),  # expired
        security.create_access_token(1) + "tampered",
    ],
)
async def test_me_with_invalid_token_is_unauthorized(client: AsyncClient, token: str) -> None:
    """GET /auth/me with a malformed or forged token returns 401."""
    await client.post("/auth/register", json=USER)
    response = await client.get("/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert response.status_code == 401


async def test_token_for_deleted_user_is_unauthorized(client: AsyncClient) -> None:
    """A valid token whose user no longer exists returns 401."""
    token = security.create_access_token(999)  # no user with this id exists
    response = await client.get("/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert response.status_code == 401


def test_password_hashing_round_trip() -> None:
    """A hashed password verifies against the original and rejects others."""
    hashed = security.hash_password("S3cret-pass")

    assert hashed != "S3cret-pass"
    assert security.verify_password("S3cret-pass", hashed)
    assert not security.verify_password("wrong", hashed)
