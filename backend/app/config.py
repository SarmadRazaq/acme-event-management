"""Application settings loaded from environment variables (or a local ``.env`` file).

Keeping configuration in one typed object means nothing secret is hard-coded in the source
and the same code can run on a laptop, in CI, and in Docker by changing only the environment.
"""

from functools import lru_cache

from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Typed application settings.

    Every attribute can be overridden by an environment variable with the same name
    (case-insensitive), e.g. ``DATABASE_URL`` or ``JWT_SECRET_KEY``.
    """

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    app_name: str = "Acme Corp Event Management API"
    app_version: str = "1.0.0"

    # Database ------------------------------------------------------------------
    database_url: str = "postgresql+asyncpg://postgres:postgres@localhost:5432/acme_events"
    test_database_url: str = (
        "postgresql+asyncpg://postgres:postgres@localhost:5432/acme_events_test"
    )
    sql_echo: bool = False

    # Authentication --------------------------------------------------------------
    jwt_secret_key: str = Field(default="dev-only-insecure-secret-change-me", min_length=16)
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = Field(default=60, gt=0)

    # CORS --------------------------------------------------------------------------
    # Stored as a comma-separated string so it is easy to set from an env var.
    cors_origins: str = "http://localhost:5173,http://localhost"

    @field_validator("database_url", "test_database_url")
    @classmethod
    def use_async_driver(cls, value: str) -> str:
        """Make sure the URL uses the asyncpg driver required by the async engine.

        Hosting providers often hand out ``postgres://`` or ``postgresql://`` URLs;
        we rewrite them so they work with SQLAlchemy's async engine.
        """
        for prefix in ("postgres://", "postgresql://"):
            if value.startswith(prefix):
                return "postgresql+asyncpg://" + value[len(prefix) :]
        return value

    @property
    def cors_origin_list(self) -> list[str]:
        """Return the configured CORS origins as a clean list."""
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]


@lru_cache
def get_settings() -> Settings:
    """Return a cached ``Settings`` instance so the environment is only parsed once."""
    return Settings()


settings = get_settings()
