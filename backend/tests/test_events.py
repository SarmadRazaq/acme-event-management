"""Tests for the event CRUD endpoints, their validation rules and authentication."""

import pytest
from httpx import AsyncClient

from tests.conftest import CreateEvent, event_payload, registration_payload

# --------------------------------------------------------------------------- create


async def test_create_event(client: AsyncClient, auth_headers: dict) -> None:
    response = await client.post("/events", json=event_payload(), headers=auth_headers)

    assert response.status_code == 201
    body = response.json()
    assert body["id"] == 1
    assert body["title"] == "Python Async Workshop"
    assert body["location"] == "Conference Room B"
    assert body["max_capacity"] == 3
    assert body["registered_count"] == 0
    assert body["available_spots"] == 3
    assert body["created_by_id"] == 1


async def test_create_event_strips_whitespace_and_assumes_utc(
    client: AsyncClient, auth_headers: dict
) -> None:
    payload = event_payload(title="  Launch Party  ", event_date="2026-11-20T10:00:00")
    response = await client.post("/events", json=payload, headers=auth_headers)

    assert response.status_code == 201
    assert response.json()["title"] == "Launch Party"
    assert response.json()["event_date"] == "2026-11-20T10:00:00Z"


async def test_create_event_requires_authentication(client: AsyncClient) -> None:
    response = await client.post("/events", json=event_payload())

    assert response.status_code == 401
    assert response.headers["www-authenticate"] == "Bearer"


@pytest.mark.parametrize(
    ("field", "value"),
    [
        ("title", ""),
        ("title", "   "),
        ("title", "x" * 201),
        ("location", ""),
        ("event_date", "not-a-date"),
        ("event_date", "2026-02-30T10:00:00Z"),
        ("max_capacity", 0),
        ("max_capacity", -5),
        ("max_capacity", "many"),
        ("unexpected_field", "value"),
    ],
)
async def test_create_event_invalid_data_is_rejected(
    client: AsyncClient, auth_headers: dict, field: str, value: object
) -> None:
    response = await client.post(
        "/events", json=event_payload(**{field: value}), headers=auth_headers
    )

    assert response.status_code == 422
    assert any(field in error["loc"] for error in response.json()["detail"])


@pytest.mark.parametrize("missing", ["title", "event_date", "location", "max_capacity"])
async def test_create_event_missing_required_field_is_rejected(
    client: AsyncClient, auth_headers: dict, missing: str
) -> None:
    payload = event_payload()
    del payload[missing]
    response = await client.post("/events", json=payload, headers=auth_headers)

    assert response.status_code == 422


# --------------------------------------------------------------------------- read


async def test_get_event(client: AsyncClient, create_event: CreateEvent) -> None:
    event = await create_event()
    response = await client.get(f"/events/{event['id']}")

    assert response.status_code == 200
    assert response.json() == event


async def test_get_missing_event_is_not_found(client: AsyncClient) -> None:
    response = await client.get("/events/999")

    assert response.status_code == 404
    assert response.json() == {"detail": "Event with id 999 not found."}


@pytest.mark.parametrize("bad_id", ["0", "-1", "abc"])
async def test_get_event_with_invalid_id_is_rejected(client: AsyncClient, bad_id: str) -> None:
    response = await client.get(f"/events/{bad_id}")
    assert response.status_code == 422


async def test_list_events_is_public_and_sorted_by_date(
    client: AsyncClient, create_event: CreateEvent
) -> None:
    await create_event(title="Later", event_date="2026-12-01T10:00:00Z")
    await create_event(title="Sooner", event_date="2026-11-18T10:00:00Z")

    response = await client.get("/events")  # no auth header

    assert response.status_code == 200
    body = response.json()
    assert body["total"] == 2
    assert [event["title"] for event in body["items"]] == ["Sooner", "Later"]


# --------------------------------------------------------------------------- update


async def test_update_event_partially(
    client: AsyncClient, auth_headers: dict, create_event: CreateEvent
) -> None:
    event = await create_event()
    response = await client.put(
        f"/events/{event['id']}",
        json={"location": "Main Auditorium", "max_capacity": 50},
        headers=auth_headers,
    )

    assert response.status_code == 200
    body = response.json()
    assert body["location"] == "Main Auditorium"
    assert body["max_capacity"] == 50
    assert body["title"] == event["title"]  # untouched fields stay the same


async def test_update_event_can_clear_description(
    client: AsyncClient, auth_headers: dict, create_event: CreateEvent
) -> None:
    event = await create_event()
    response = await client.put(
        f"/events/{event['id']}", json={"description": None}, headers=auth_headers
    )

    assert response.status_code == 200
    assert response.json()["description"] is None


@pytest.mark.parametrize(
    "body",
    [{}, {"title": None}, {"title": "  "}, {"max_capacity": 0}, {"event_date": "tomorrow"}],
)
async def test_update_event_invalid_data_is_rejected(
    client: AsyncClient, auth_headers: dict, create_event: CreateEvent, body: dict
) -> None:
    event = await create_event()
    response = await client.put(f"/events/{event['id']}", json=body, headers=auth_headers)
    assert response.status_code == 422


async def test_update_missing_event_is_not_found(client: AsyncClient, auth_headers: dict) -> None:
    response = await client.put("/events/999", json={"title": "New"}, headers=auth_headers)
    assert response.status_code == 404


async def test_update_event_requires_authentication(
    client: AsyncClient, create_event: CreateEvent
) -> None:
    event = await create_event()
    response = await client.put(f"/events/{event['id']}", json={"title": "Hacked"})
    assert response.status_code == 401


async def test_capacity_cannot_drop_below_registrations(
    client: AsyncClient, auth_headers: dict, create_event: CreateEvent
) -> None:
    event = await create_event(max_capacity=5)
    for n in range(3):
        await client.post(
            f"/events/{event['id']}/registrations",
            json=registration_payload(employee_email=f"user{n}@acme.com"),
        )

    response = await client.put(
        f"/events/{event['id']}", json={"max_capacity": 2}, headers=auth_headers
    )

    assert response.status_code == 409
    assert "already registered" in response.json()["detail"]


# --------------------------------------------------------------------------- delete


async def test_delete_event(
    client: AsyncClient, auth_headers: dict, create_event: CreateEvent
) -> None:
    event = await create_event()

    response = await client.delete(f"/events/{event['id']}", headers=auth_headers)
    assert response.status_code == 204
    assert response.content == b""

    assert (await client.get(f"/events/{event['id']}")).status_code == 404


async def test_delete_event_removes_its_registrations(
    client: AsyncClient, auth_headers: dict, create_event: CreateEvent
) -> None:
    event = await create_event()
    registration = await client.post(
        f"/events/{event['id']}/registrations", json=registration_payload()
    )

    await client.delete(f"/events/{event['id']}", headers=auth_headers)

    response = await client.delete(
        f"/registrations/{registration.json()['id']}", headers=auth_headers
    )
    assert response.status_code == 404


async def test_delete_missing_event_is_not_found(client: AsyncClient, auth_headers: dict) -> None:
    response = await client.delete("/events/999", headers=auth_headers)
    assert response.status_code == 404


async def test_delete_event_requires_authentication(
    client: AsyncClient, create_event: CreateEvent
) -> None:
    event = await create_event()
    response = await client.delete(f"/events/{event['id']}")
    assert response.status_code == 401
