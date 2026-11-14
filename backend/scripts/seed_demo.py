"""Fill the database with realistic demo data (handy for the demo video).

Usage (from the ``backend`` folder, after ``alembic upgrade head``)::

    python -m scripts.seed_demo

It creates an organizer account (``organizer@acme.com`` / ``Str0ngPassw0rd!``), a handful of
events and some registrations. It goes through the normal service functions, so every
business rule and validation still applies. Running it twice is safe: existing data is skipped.
"""

import asyncio
from datetime import UTC, datetime, timedelta

from sqlalchemy import select

from app import models, schemas, services
from app.db import SessionLocal, engine

ORGANIZER = schemas.UserCreate(
    email="organizer@acme.com", full_name="Event Organizer", password="Str0ngPassw0rd!"
)

# (title, description, days from now, hour UTC, location, capacity)
EVENTS = [
    (
        "Product Launch: Acme Cloud 2.0",
        "Keynote and live demos of our new platform.",
        6,
        15,
        "Main Auditorium",
        150,
    ),
    (
        "Python Async Workshop",
        "Hands-on asyncio, FastAPI and async SQLAlchemy.",
        6,
        10,
        "Conference Room B",
        3,
    ),
    (
        "Kubernetes for Developers",
        "Deploying and debugging services on our clusters.",
        13,
        9,
        "Training Lab 2",
        25,
    ),
    (
        "Quarterly Team-Building: Escape Room",
        "Teams of five, pizza afterwards.",
        20,
        16,
        "Downtown Escape Rooms",
        40,
    ),
    (
        "Security Awareness Training",
        "Phishing, passwords and safe data handling.",
        27,
        11,
        "Online (Teams)",
        500,
    ),
    (
        "Annual Tech Conference",
        "Two days of talks from engineering and product.",
        45,
        8,
        "Grand Hotel Conference Center",
        300,
    ),
]

ATTENDEES = [
    ("Ayesha Khan", "ayesha.khan@acme.com", "Engineering"),
    ("Bilal Ahmed", "bilal.ahmed@acme.com", "Sales"),
    ("Sara Malik", "sara.malik@acme.com", "Design"),
    ("Usman Tariq", "usman.tariq@acme.com", "Engineering"),
    ("Hira Siddiqui", "hira.siddiqui@acme.com", "HR"),
]


async def seed() -> None:
    """Create the organizer, events and registrations if they do not exist yet."""
    async with SessionLocal() as session:
        user = await session.scalar(select(models.User).where(models.User.email == ORGANIZER.email))
        if user is None:
            user = await services.register_user(session, ORGANIZER)
            print(f"Created user {user.email}")

        today = datetime.now(UTC).replace(minute=0, second=0, microsecond=0)
        for title, description, days, hour, location, capacity in EVENTS:
            exists = await session.scalar(
                select(models.Event.id).where(models.Event.title == title)
            )
            if exists:
                continue
            event = await services.create_event(
                session,
                schemas.EventCreate(
                    title=title,
                    description=description,
                    event_date=(today + timedelta(days=days)).replace(hour=hour),
                    location=location,
                    max_capacity=capacity,
                ),
                created_by=user,
            )
            # Fill small events up completely so the "event is full" rule is easy to demo.
            for name, email, department in ATTENDEES[: min(capacity, 4)]:
                await services.register_for_event(
                    session,
                    event.id,
                    schemas.RegistrationCreate(
                        employee_name=name, employee_email=email, department=department
                    ),
                )
            print(f"Created event {event.title!r}")
    await engine.dispose()


if __name__ == "__main__":
    asyncio.run(seed())
