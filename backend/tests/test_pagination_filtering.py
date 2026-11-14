"""Tests for pagination (skip/limit) and search/filtering (title, date) on list endpoints."""

import pytest
from httpx import AsyncClient

from tests.conftest import CreateEvent, registration_payload


@pytest.fixture
async def sample_events(create_event: CreateEvent) -> None:
    """Create five events on different days with different titles."""
    for title, when in [
        ("Python Basics", "2026-11-20T09:00:00Z"),
        ("Advanced python", "2026-11-20T23:30:00Z"),
        ("Team 100% Fun Day", "2026-11-21T10:00:00Z"),
        ("Product_Launch", "2026-12-01T10:00:00Z"),
        ("Leadership Summit", "2026-12-05T10:00:00Z"),
    ]:
        await create_event(title=title, event_date=when)


def titles(response_json: dict) -> list[str]:
    """Return the event titles in a page response."""
    return [event["title"] for event in response_json["items"]]


@pytest.mark.usefixtures("sample_events")
async def test_default_page_size_and_envelope(client: AsyncClient) -> None:
    body = (await client.get("/events")).json()

    assert body["total"] == 5
    assert body["skip"] == 0
    assert body["limit"] == 10
    assert len(body["items"]) == 5


@pytest.mark.usefixtures("sample_events")
async def test_skip_and_limit(client: AsyncClient) -> None:
    body = (await client.get("/events", params={"skip": 1, "limit": 2})).json()

    assert body["total"] == 5  # total ignores pagination
    assert titles(body) == ["Advanced python", "Team 100% Fun Day"]


@pytest.mark.usefixtures("sample_events")
async def test_skip_beyond_end_returns_empty_page(client: AsyncClient) -> None:
    body = (await client.get("/events", params={"skip": 50})).json()
    assert body["items"] == [] and body["total"] == 5


@pytest.mark.parametrize("params", [{"skip": -1}, {"limit": 0}, {"limit": 101}, {"limit": "ten"}])
async def test_invalid_pagination_is_rejected(client: AsyncClient, params: dict) -> None:
    response = await client.get("/events", params=params)
    assert response.status_code == 422


@pytest.mark.usefixtures("sample_events")
async def test_filter_by_title_is_partial_and_case_insensitive(client: AsyncClient) -> None:
    body = (await client.get("/events", params={"title": "PYTHON"})).json()

    assert body["total"] == 2
    assert titles(body) == ["Python Basics", "Advanced python"]


@pytest.mark.usefixtures("sample_events")
@pytest.mark.parametrize(
    ("term", "expected"), [("100%", ["Team 100% Fun Day"]), ("_", ["Product_Launch"])]
)
async def test_title_wildcards_are_matched_literally(
    client: AsyncClient, term: str, expected: list[str]
) -> None:
    body = (await client.get("/events", params={"title": term})).json()
    assert titles(body) == expected


@pytest.mark.usefixtures("sample_events")
async def test_filter_by_date(client: AsyncClient) -> None:
    body = (await client.get("/events", params={"date": "2026-11-20"})).json()

    # Both events on 20 Nov (09:00 and 23:30 UTC) match; 21 Nov does not.
    assert titles(body) == ["Python Basics", "Advanced python"]


@pytest.mark.usefixtures("sample_events")
async def test_filters_combine_with_each_other_and_pagination(client: AsyncClient) -> None:
    params = {"title": "python", "date": "2026-11-20", "skip": 1, "limit": 1}
    body = (await client.get("/events", params=params)).json()

    assert body["total"] == 2
    assert titles(body) == ["Advanced python"]


@pytest.mark.usefixtures("sample_events")
async def test_filter_with_no_matches(client: AsyncClient) -> None:
    body = (await client.get("/events", params={"title": "kubernetes"})).json()
    assert body == {"items": [], "total": 0, "skip": 0, "limit": 10}


async def test_invalid_date_filter_is_rejected(client: AsyncClient) -> None:
    response = await client.get("/events", params={"date": "2026-13-45"})
    assert response.status_code == 422


async def test_registrations_are_paginated(client: AsyncClient, create_event: CreateEvent) -> None:
    event = await create_event(max_capacity=10)
    url = f"/events/{event['id']}/registrations"
    for n in range(4):
        await client.post(url, json=registration_payload(employee_email=f"p{n}@acme.com"))

    body = (await client.get(url, params={"skip": 2, "limit": 5})).json()

    assert body["total"] == 4
    assert [r["employee_email"] for r in body["items"]] == ["p2@acme.com", "p3@acme.com"]
