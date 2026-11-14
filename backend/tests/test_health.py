"""Tests for the health check and the generated API documentation."""

from httpx import AsyncClient


async def test_health_reports_database_ok(client: AsyncClient) -> None:
    response = await client.get("/health")

    assert response.status_code == 200
    assert response.json() == {"status": "ok", "database": "ok"}


async def test_openapi_documents_all_endpoints(client: AsyncClient) -> None:
    schema = (await client.get("/openapi.json")).json()

    expected = {
        ("post", "/events"),
        ("get", "/events"),
        ("get", "/events/{event_id}"),
        ("put", "/events/{event_id}"),
        ("delete", "/events/{event_id}"),
        ("post", "/events/{event_id}/registrations"),
        ("get", "/events/{event_id}/registrations"),
        ("delete", "/registrations/{registration_id}"),
        ("post", "/auth/register"),
        ("post", "/auth/login"),
        ("get", "/auth/me"),
    }
    documented = {(method, path) for path, ops in schema["paths"].items() for method in ops}
    assert expected <= documented
    # Every operation has a human-written summary and at least one tag.
    for path, ops in schema["paths"].items():
        for method, op in ops.items():
            assert op.get("summary"), f"{method.upper()} {path} has no summary"
            assert op.get("tags"), f"{method.upper()} {path} has no tags"


async def test_swagger_ui_is_served(client: AsyncClient) -> None:
    response = await client.get("/docs")

    assert response.status_code == 200
    assert "swagger-ui" in response.text
