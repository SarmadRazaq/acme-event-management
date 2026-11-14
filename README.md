# Acme Corp Event Management

[![CI](https://github.com/SarmadRazaq/acme-event-management/actions/workflows/ci.yml/badge.svg)](https://github.com/SarmadRazaq/acme-event-management/actions/workflows/ci.yml)

Internal event management system for **Acme Corp**. Employees can create and manage events
(product launches, technical workshops, team-building activities and conferences), register
for them, and track registrations.

* **Backend (graded):** FastAPI · PostgreSQL · SQLAlchemy 2.0 (async) · Pydantic v2 · JWT · pytest
* **Frontend (optional):** React · TypeScript · TanStack Query · Zustand · React Router · Tailwind
* **Production:** Docker (non-root images) · gunicorn + uvicorn workers · nginx · Alembic · GitHub Actions CI

Full specification: [docs/SPEC.md](docs/SPEC.md)

---

## Contents
1. [Features](#features)
2. [Project structure](#project-structure)
3. [Quick start with Docker](#quick-start-with-docker-full-stack)
4. [Local setup without Docker](#local-setup-without-docker)
5. [Running the tests](#running-the-tests)
6. [API reference](#api-reference)
7. [Design decisions](#design-decisions)
8. [Git workflow](#git-workflow)
9. [Screenshots](#screenshots)
10. [AI usage](#ai-usage)

---

## Features

**Mandatory**
- Event CRUD: `POST/GET /events`, `GET/PUT/DELETE /events/{id}` (id, title, description, date, location, max capacity)
- Registrations: `POST/GET /events/{id}/registrations`, `DELETE /registrations/{id}`
- Business rules (all enforced in `services.py`):
  - an employee cannot register for the same event twice → **409** (e-mail compared case-insensitively)
  - an event cannot accept registrations beyond its capacity → **409** (safe under concurrent requests)
  - registering for a non-existent event → **404**
- Pydantic validation: blank titles, invalid dates, capacity ≤ 0, missing fields and bad registration data → **422**
- Consistent JSON errors with the correct status codes: 200, 201, 204, 401, 404, 409, 422
- Fully documented Swagger UI at **http://127.0.0.1:8000/docs** (tags, summaries, examples, error models)

**Bonus**
- **Pagination:** `skip` / `limit` on *both* list endpoints (bounds validated: `skip ≥ 0`, `1 ≤ limit ≤ 100`)
- **Search & filtering:** `?title=` (partial, case-insensitive) and `?date=YYYY-MM-DD`, combinable with pagination
- **JWT authentication:** Argon2-hashed passwords; create, update and delete require a Bearer token; reads stay public
- **Async database:** SQLAlchemy 2.0 `AsyncEngine` + `AsyncSession` (asyncpg) end to end
- **Unit tests:** 89 pytest tests, 96 % coverage, run against a real PostgreSQL database and in CI

---

## Project structure

```
acme-event-management/
├── backend/
│   ├── app/
│   │   ├── db.py          # async engine, session factory, Base, get_session dependency
│   │   ├── models.py      # SQLAlchemy models: User, Event, Registration
│   │   ├── schemas.py     # Pydantic request/response schemas (Create / Update / Read)
│   │   ├── services.py    # business logic + all database queries
│   │   ├── main.py        # FastAPI app, routes (thin), exception handlers, OpenAPI metadata
│   │   ├── config.py      # typed settings from environment variables
│   │   └── security.py    # password hashing, JWT creation/validation, get_current_user
│   ├── alembic/           # database migrations
│   ├── scripts/seed_demo.py
│   ├── tests/             # pytest suite
│   ├── requirements.txt / requirements-dev.txt
│   ├── Dockerfile, docker-entrypoint.sh, gunicorn.conf.py
│   └── .env.example
├── frontend/              # React + Vite + TypeScript client (see frontend/README.md)
├── docs/                  # SPEC, screenshots, AI usage, demo script
├── docker-compose.yml     # db + backend + frontend
├── docker-compose.dev.yml # hot-reload override
└── .github/workflows/ci.yml
```

**How the files work together:** a request reaches a route in `main.py`. FastAPI validates the
body and query parameters with the schemas from `schemas.py`, and injects a database session
(`db.get_session`) and, for protected routes, the current user (`security.get_current_user`).
The route then calls one function in `services.py`, which applies the business rules and reads or
writes the `models.py` tables. If a rule is broken, the service raises a domain exception
(`NotFoundError`, `ConflictError`, `AuthenticationError`), and an exception handler in `main.py`
turns it into the right HTTP status code.

---

## Quick start with Docker (full stack)

Requirements: Docker Desktop.

```bash
git clone https://github.com/SarmadRazaq/acme-event-management.git
cd acme-event-management
cp .env.example .env
# edit .env: set JWT_SECRET_KEY (python -c "import secrets; print(secrets.token_urlsafe(48))")
#            and POSTGRES_PASSWORD
docker compose up -d --build
```

| URL | What |
|---|---|
| http://localhost:8080 | React frontend (nginx, proxies `/api` → backend) |
| http://127.0.0.1:8000/docs | Swagger UI |
| http://127.0.0.1:8000/redoc | ReDoc |

Migrations run automatically when the backend container starts. Optional demo data:

```bash
docker compose exec backend python -m scripts.seed_demo
# log in as organizer@acme.com / Str0ngPassw0rd!
```

---

## Local setup without Docker

Requirements: Python 3.12+, PostgreSQL 14+ (or `docker compose up -d db`), Node 20+ (frontend only).

### 1. PostgreSQL configuration

Either start the bundled database container, which also creates the test database:

```bash
docker compose up -d db
```

or use your own PostgreSQL server and create the two databases:

```sql
CREATE DATABASE acme_events;       -- application database
CREATE DATABASE acme_events_test;  -- used by pytest (tables are recreated on every run)
```

### 2. Backend

```bash
cd backend
python -m venv .venv
# Windows: .venv\Scripts\activate      macOS/Linux: source .venv/bin/activate
pip install -r requirements-dev.txt
cp .env.example .env                 # adjust DATABASE_URL if your credentials differ
alembic upgrade head                 # create the tables
python -m scripts.seed_demo          # optional demo data
uvicorn app.main:app --reload        # http://127.0.0.1:8000/docs
```

Environment variables (`backend/.env`):

| Variable | Default | Purpose |
|---|---|---|
| `DATABASE_URL` | `postgresql+asyncpg://postgres:postgres@localhost:5432/acme_events` | app database |
| `TEST_DATABASE_URL` | `…/acme_events_test` | pytest database |
| `JWT_SECRET_KEY` | dev-only value | token signing key (**required** in production) |
| `JWT_ALGORITHM` | `HS256` | |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | `60` | token lifetime |
| `CORS_ORIGINS` | `http://localhost:5173,http://localhost` | allowed browser origins |
| `ENVIRONMENT` | `development` | `production` refuses insecure secrets |

### 3. Frontend (optional)

```bash
cd frontend
npm install
npm run dev     # http://localhost:5173 (proxies /api to http://127.0.0.1:8000)
```

### Using protected endpoints in Swagger
1. `POST /auth/register` to create an account (or use the seeded `organizer@acme.com`).
2. Click **Authorize**, enter your e-mail as *username* and your password, then click **Authorize** again.
3. 🔒 endpoints now send the Bearer token automatically.

---

## Running the tests

The tests use a separate PostgreSQL database (`TEST_DATABASE_URL`, default `acme_events_test`).
They create the schema themselves and empty every table after each test.

```bash
cd backend
pytest -v                                    # run all tests
pytest --cov=app --cov-report=term-missing   # with coverage
pytest tests/test_registrations.py -v        # one file
ruff check . && ruff format --check .        # lint
```

Latest result: **89 passed, 96 % coverage**.

| Test file | What it covers |
|---|---|
| `test_events.py` | CRUD, 14 invalid-input cases, missing fields, 401 on protected routes, cascade delete |
| `test_registrations.py` | duplicate (409), full (409), missing event (404), invalid data (422), cancel, **5 concurrent requests for the last seat** |
| `test_pagination_filtering.py` | skip/limit bounds, title and date filters, combinations, literal `%`/`_` |
| `test_auth.py` | sign-up, login, wrong password, expired/tampered tokens |
| `test_health.py` | health check, every route documented in OpenAPI |

Frontend checks: `cd frontend && npm run lint && npm run typecheck && npm run build`.
CI runs all of this on every push and pull request.

---

## API reference

🔒 = requires `Authorization: Bearer <token>`.

| Method | Endpoint | Description | Success | Errors |
|---|---|---|---|---|
| GET | `/health` | API + DB health | 200 | |
| POST | `/auth/register` | create account | 201 | 409, 422 |
| POST | `/auth/login` | get JWT (form: `username`, `password`) | 200 | 401, 422 |
| GET | `/auth/me` 🔒 | current user | 200 | 401 |
| POST | `/events` 🔒 | create event | 201 | 401, 422 |
| GET | `/events` | list (`skip`, `limit`, `title`, `date`) | 200 | 422 |
| GET | `/events/{id}` | get one | 200 | 404, 422 |
| PUT | `/events/{id}` 🔒 | partial update | 200 | 401, 404, 409, 422 |
| DELETE | `/events/{id}` 🔒 | delete (+ its registrations) | 204 | 401, 404 |
| POST | `/events/{id}/registrations` | register employee | 201 | 404, 409, 422 |
| GET | `/events/{id}/registrations` | list (`skip`, `limit`) | 200 | 404, 422 |
| DELETE | `/registrations/{id}` 🔒 | cancel registration | 204 | 401, 404 |

Example:

```bash
TOKEN=$(curl -s -X POST localhost:8000/auth/login \
  -d "username=organizer@acme.com&password=Str0ngPassw0rd!" | python -c "import sys,json;print(json.load(sys.stdin)['access_token'])")

curl -X POST localhost:8000/events -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"title":"Python Async Workshop","event_date":"2026-11-20T10:00:00Z","location":"Room B","max_capacity":30}'

curl "localhost:8000/events?title=python&date=2026-11-20&skip=0&limit=10"
```

---

## Design decisions

- **Thin routes, fat services.** `main.py` only wires HTTP to `services.py`. Services raise domain
  exceptions instead of `HTTPException`, so the business logic does not depend on HTTP and is easy to test.
- **No overbooking under load.** `register_for_event` locks the event row (`SELECT … FOR UPDATE`)
  before counting registrations. Two people racing for the last seat are served one after the
  other; a test fires five concurrent requests at a one-seat event and expects exactly one 201.
- **Two lines of defence.** Pydantic validates the input, and the database enforces the same rules
  with `CHECK (max_capacity > 0)`, `UNIQUE (event_id, employee_email)` and foreign keys with `ON DELETE CASCADE`.
- **No N+1 queries.** `registered_count` is a correlated sub-query (`column_property`) loaded with
  the event in one query. Async sessions cannot lazy-load anyway.
- **Who can do what.** Browsing and registering are public, since any employee should be able to sign up.
  Changing events and cancelling registrations require a login.
- **Time zones.** Dates are stored as `timestamptz`. A datetime without a time zone is treated as UTC,
  and the date filter matches the UTC calendar day using an index-friendly range.
- **Security.** Argon2 password hashes; identical errors for an unknown e-mail and a wrong
  password; secrets come only from the environment, and production refuses the default one;
  non-root containers; nginx security headers.
- **Frontend state.** Server state (events, registrations) lives in TanStack Query's cache and is
  invalidated after each mutation. Client state (JWT, user) lives in a persisted Zustand store.
  Filters live in the URL, so a search can be shared or bookmarked.

---

## Git workflow

`main` is the stable branch. Each feature was built on its own branch, committed in small steps,
and merged through a pull request once CI passed:

| PR | Branch | Feature |
|---|---|---|
| #1 | `feature/project-setup` | skeleton, async DB, Alembic, Postgres |
| #2 | `feature/event-crud` | event model + CRUD |
| #3 | `feature/registrations` | registrations + business rules |
| #4 | `feature/validation-error-handling` | validation, error handlers, OpenAPI docs |
| #5 | `feature/jwt-auth` | JWT authentication |
| #6 | `feature/pagination-filtering` | pagination, search, filters |
| #7 | `feature/tests` | pytest suite |
| #8 | `feature/frontend` | React frontend |
| #9 | `feature/docker-production` | Docker, nginx, gunicorn |
| #10 | `feature/ci` | GitHub Actions |
| #11 | `docs/readme-and-submission` | README, screenshots, AI docs |
| #12 | `feature/ui-polish` | shadcn/ui components, dark mode, accessibility fixes |
| #13 | `feature/event-theme-redesign` | event-site layout: hero, pill nav, image cards |
| #14 | `feature/indigo-apricot-theme` | first colour scheme (indigo + apricot) |
| #15 | `feature/bright-blue-theme` | purple replaced with bright blue |
| #16 | `feature/light-soft-wash` | light "soft wash" design |
| #17 | `feature/date-picker` | styled calendar date picker |
| #18 | `docs/sync-after-ui-work` | docs and screenshots brought up to date |

---

## Screenshots

Swagger UI with live requests and responses for **every endpoint**, both successes and failures:
[docs/screenshots/swagger](docs/screenshots/swagger). Highlights:

| | |
|---|---|
| ![Create event 201](docs/screenshots/swagger/09-events-create-201.png) | ![Event full 409](docs/screenshots/swagger/21-registrations-event-full-409.png) |
| ![Filter + pagination](docs/screenshots/swagger/13-events-list-paginated-filtered-200.png) | ![Validation 422](docs/screenshots/swagger/10-events-create-invalid-422.png) |

Frontend: [docs/screenshots/frontend](docs/screenshots/frontend)

![Frontend: events page](docs/screenshots/frontend/home-light.png)

![Frontend: duplicate registration](docs/screenshots/frontend/03-duplicate-409.png)

---

## AI usage

AI assistance was used and is documented in [docs/ai-usage](docs/ai-usage/README.md):
the tools and models, settings, the full list of prompts, and how to get the chat history.
