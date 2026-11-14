"""Pydantic schemas used to validate requests and shape responses."""

from pydantic import BaseModel, Field


class HealthResponse(BaseModel):
    """Response body of the ``/health`` endpoint."""

    status: str = Field(examples=["ok"])
    database: str = Field(examples=["ok"])
