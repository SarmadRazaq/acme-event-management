"""Tests for registrations and the three business rules (duplicates, capacity, missing event)."""

import asyncio

import pytest
from httpx import AsyncClient

from tests.conftest import CreateEvent, registration_payload


async def test_register_for_event(client: AsyncClient, create_event: CreateEvent) -> None:
    """An employee can register for an event and a seat is taken."""
    event = await create_event()
    response = await client.post(
        f"/events/{event['id']}/registrations",
        json=registration_payload(employee_email="Ayesha.Khan@ACME.com"),
    )

    assert response.status_code == 201
    body = response.json()
    assert body["event_id"] == event["id"]
    assert body["employee_name"] == "Ayesha Khan"
    assert body["employee_email"] == "ayesha.khan@acme.com"  # normalised to lower case

    updated = (await client.get(f"/events/{event['id']}")).json()
    assert updated["registered_count"] == 1
    assert updated["available_spots"] == event["max_capacity"] - 1


async def test_duplicate_registration_is_conflict(
    client: AsyncClient, create_event: CreateEvent
) -> None:
    """Registering the same e-mail twice for one event returns 409."""
    event = await create_event()
    url = f"/events/{event['id']}/registrations"
    await client.post(url, json=registration_payload())

    # Same person, different capitalisation: still a duplicate.
    response = await client.post(
        url, json=registration_payload(employee_email="AYESHA.KHAN@acme.com")
    )

    assert response.status_code == 409
    assert "already registered" in response.json()["detail"]


async def test_same_employee_can_join_different_events(
    client: AsyncClient, create_event: CreateEvent
) -> None:
    """One employee may register for several different events."""
    first, second = await create_event(), await create_event(title="Another Event")

    for event in (first, second):
        response = await client.post(
            f"/events/{event['id']}/registrations", json=registration_payload()
        )
        assert response.status_code == 201


async def test_full_event_rejects_registration(
    client: AsyncClient, create_event: CreateEvent
) -> None:
    """Registering for an event at capacity returns 409."""
    event = await create_event(max_capacity=2)
    url = f"/events/{event['id']}/registrations"
    for n in range(2):
        response = await client.post(
            url, json=registration_payload(employee_email=f"e{n}@acme.com")
        )
        assert response.status_code == 201

    response = await client.post(url, json=registration_payload(employee_email="late@acme.com"))

    assert response.status_code == 409
    assert "full" in response.json()["detail"]


async def test_concurrent_registrations_cannot_overbook(
    client: AsyncClient, create_event: CreateEvent
) -> None:
    """Five people race for one seat: exactly one wins, the rest get 409."""
    event = await create_event(max_capacity=1)
    url = f"/events/{event['id']}/registrations"

    responses = await asyncio.gather(
        *(
            client.post(url, json=registration_payload(employee_email=f"racer{n}@acme.com"))
            for n in range(5)
        )
    )

    codes = sorted(response.status_code for response in responses)
    assert codes == [201, 409, 409, 409, 409]
    assert (await client.get(f"/events/{event['id']}")).json()["registered_count"] == 1


async def test_register_for_missing_event_is_not_found(client: AsyncClient) -> None:
    """Registering for an unknown event returns 404."""
    response = await client.post("/events/999/registrations", json=registration_payload())

    assert response.status_code == 404
    assert response.json() == {"detail": "Event with id 999 not found."}


@pytest.mark.parametrize(
    "body",
    [
        registration_payload(employee_email="not-an-email"),
        registration_payload(employee_name="   "),
        registration_payload(employee_name=""),
        {"employee_name": "No Email"},
        {"employee_email": "no.name@acme.com"},
        registration_payload(role="admin"),
        {},
    ],
)
async def test_invalid_registration_data_is_rejected(
    client: AsyncClient, create_event: CreateEvent, body: dict
) -> None:
    """Missing, blank or invalid fields, or unknown fields, return 422."""
    event = await create_event()
    response = await client.post(f"/events/{event['id']}/registrations", json=body)
    assert response.status_code == 422


async def test_list_registrations(client: AsyncClient, create_event: CreateEvent) -> None:
    """An event's registrations are listed with their details."""
    event = await create_event()
    url = f"/events/{event['id']}/registrations"
    for n in range(2):
        await client.post(url, json=registration_payload(employee_email=f"p{n}@acme.com"))

    response = await client.get(url)

    assert response.status_code == 200
    body = response.json()
    assert body["total"] == 2
    assert [r["employee_email"] for r in body["items"]] == ["p0@acme.com", "p1@acme.com"]


async def test_list_registrations_for_missing_event_is_not_found(client: AsyncClient) -> None:
    """Listing registrations for an unknown event returns 404."""
    response = await client.get("/events/999/registrations")
    assert response.status_code == 404


async def test_cancel_registration_frees_a_seat(
    client: AsyncClient, auth_headers: dict, create_event: CreateEvent
) -> None:
    """Cancelling a registration returns 204 and frees a seat."""
    event = await create_event(max_capacity=1)
    url = f"/events/{event['id']}/registrations"
    registration = (await client.post(url, json=registration_payload())).json()

    response = await client.delete(f"/registrations/{registration['id']}", headers=auth_headers)
    assert response.status_code == 204

    # The seat is free again, so someone else can take it.
    response = await client.post(url, json=registration_payload(employee_email="next@acme.com"))
    assert response.status_code == 201


async def test_cancel_missing_registration_is_not_found(
    client: AsyncClient, auth_headers: dict
) -> None:
    """Cancelling an unknown registration returns 404."""
    response = await client.delete("/registrations/999", headers=auth_headers)

    assert response.status_code == 404
    assert response.json() == {"detail": "Registration with id 999 not found."}


async def test_cancel_registration_requires_authentication(
    client: AsyncClient, create_event: CreateEvent
) -> None:
    """Cancelling a registration without a token returns 401."""
    event = await create_event()
    registration = (
        await client.post(f"/events/{event['id']}/registrations", json=registration_payload())
    ).json()

    response = await client.delete(f"/registrations/{registration['id']}")
    assert response.status_code == 401
