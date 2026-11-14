"""Password hashing and JWT helpers, plus the ``get_current_user`` dependency.

Flow:
    1. A user signs up; their password is hashed with Argon2 and only the hash is stored.
    2. ``POST /auth/login`` checks the password and returns a signed JWT access token.
    3. Protected routes depend on ``get_current_user``, which reads the ``Authorization:
       Bearer <token>`` header, verifies the signature and expiry, and loads the user.
       Any problem results in **401 Unauthorized**.
"""

from datetime import UTC, datetime, timedelta
from typing import Annotated

import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from pwdlib import PasswordHash
from sqlalchemy.ext.asyncio import AsyncSession

from app import models
from app.config import settings
from app.db import get_session

# Argon2 is the current OWASP-recommended password hashing algorithm.
password_hasher = PasswordHash.recommended()

# Tells FastAPI (and Swagger's "Authorize" button) where tokens come from.
# ``auto_error=False`` lets us return our own, consistent 401 message.
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login", auto_error=False)

# One shared exception so every authentication failure looks the same to clients
# (we do not reveal *why* a token was rejected).
CREDENTIALS_EXCEPTION = HTTPException(
    status_code=status.HTTP_401_UNAUTHORIZED,
    detail="Could not validate credentials. Please log in again.",
    headers={"WWW-Authenticate": "Bearer"},
)


def hash_password(plain_password: str) -> str:
    """Return a salted Argon2 hash of ``plain_password``."""
    return password_hasher.hash(plain_password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Return ``True`` if ``plain_password`` matches the stored hash."""
    return password_hasher.verify(plain_password, hashed_password)


def create_access_token(user_id: int, expires_delta: timedelta | None = None) -> str:
    """Create a signed JWT whose subject (``sub``) is the user's id."""
    now = datetime.now(UTC)
    expire = now + (expires_delta or timedelta(minutes=settings.access_token_expire_minutes))
    payload = {"sub": str(user_id), "iat": now, "exp": expire}
    return jwt.encode(payload, settings.jwt_secret_key, algorithm=settings.jwt_algorithm)


def decode_access_token(token: str) -> int:
    """Validate ``token`` and return the user id it was issued for.

    Raises:
        HTTPException: 401 if the token is malformed, tampered with or expired.
    """
    try:
        payload = jwt.decode(
            token,
            settings.jwt_secret_key,
            algorithms=[settings.jwt_algorithm],
            options={"require": ["sub", "exp"]},
        )
        return int(payload["sub"])
    except (jwt.PyJWTError, ValueError) as exc:
        raise CREDENTIALS_EXCEPTION from exc


async def get_current_user(
    token: Annotated[str | None, Depends(oauth2_scheme)],
    session: Annotated[AsyncSession, Depends(get_session)],
) -> models.User:
    """FastAPI dependency that returns the logged-in user or raises 401."""
    if token is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated. Log in and send 'Authorization: Bearer <token>'.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    user = await session.get(models.User, decode_access_token(token))
    if user is None:  # the user was deleted after the token was issued
        raise CREDENTIALS_EXCEPTION
    return user


# Shorthand used in route signatures: ``current_user: CurrentUser``.
CurrentUser = Annotated[models.User, Depends(get_current_user)]
