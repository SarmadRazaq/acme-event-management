# Acme Corp Event Management: Specification

## 1. Purpose
Acme Corp wants an internal system where employees can create and manage company events (product launches,
workshops, team-building, conferences), register for them, and keep track of registrations. This spec covers
the REST API (the graded part) and an optional React frontend used in the demo.

## 2. Data model

### User (organizers who can manage events)
| Field | Type | Constraints |
|---|---|---|
| id | int | PK |
| email | varchar(255) | unique, not null, valid email |
| full_name | varchar(120) | not null, 1–120 chars |
| hashed_password | varchar(255) | Argon2 hash, never returned by the API |
| created_at | timestamptz | server default `now()` |

### Event
| Field | Type | Constraints |
|---|---|---|
| id | int | PK |
| title | varchar(200) | not null, not blank (whitespace is stripped), 1–200 chars |
| description | text | optional, ≤ 5000 chars |
| event_date | timestamptz | not null, valid ISO-8601 datetime |
| location | varchar(200) | not null, not blank |
| max_capacity | int | not null, > 0 (DB `CHECK` too), ≤ 100 000 |
| created_by_id | int | FK → users.id, `ON DELETE SET NULL` |
| created_at / updated_at | timestamptz | maintained by the server |

The response also includes the computed fields `registered_count` and `available_spots`.

### Registration
| Field | Type | Constraints |
|---|---|---|
| id | int | PK |
| event_id | int | FK → events.id, `ON DELETE CASCADE` |
| employee_name | varchar(120) | not null, not blank |
| employee_email | varchar(255) | not null, valid email, stored lower-case |
| department | varchar(100) | optional |
| created_at | timestamptz | server default `now()` |

`UNIQUE(event_id, employee_email)` stops the same employee registering for the same event twice.

## 3. Endpoints
🔒 = needs `Authorization: Bearer <JWT>`; missing or invalid token → **401**.

| Method | Path | Auth | Success | Errors |
|---|---|---|---|---|
| GET | `/health` | – | 200 | – |
| POST | `/auth/register` | – | 201 `UserRead` | 409 email taken, 422 |
| POST | `/auth/login` | – | 200 `Token` (form: username, password) | 401 bad credentials, 422 |
| GET | `/auth/me` | 🔒 | 200 `UserRead` | 401 |
| POST | `/events` | 🔒 | 201 `EventRead` | 401, 422 |
| GET | `/events` | – | 200 `Page[EventRead]` | 422 bad query params |
| GET | `/events/{id}` | – | 200 `EventRead` | 404, 422 |
| PUT | `/events/{id}` | 🔒 | 200 `EventRead` | 401, 404, 409 capacity below current registrations, 422 |
| DELETE | `/events/{id}` | 🔒 | 204 | 401, 404 |
| POST | `/events/{id}/registrations` | – | 201 `RegistrationRead` | 404 event, 409 duplicate, 409 full, 422 |
| GET | `/events/{id}/registrations` | – | 200 `Page[RegistrationRead]` | 404 event, 422 |
| DELETE | `/registrations/{id}` | 🔒 | 204 | 401, 404 |

Reads and registering are public, so employees can browse and sign up. Creating, updating and deleting events,
and cancelling a registration, need a logged-in user.

### List query parameters (bonus B1/B2)
- `skip` (int ≥ 0, default 0), `limit` (int 1–100, default 10). These apply to both list endpoints.
- `GET /events` also takes `title` (partial, case-insensitive `ILIKE`) and `date` (`YYYY-MM-DD`, matches
  the calendar date of `event_date` in UTC). Filters combine with each other and with pagination.
- Events are sorted by `event_date` ascending, then by `id`.
- Response envelope: `{ "items": [...], "total": int, "skip": int, "limit": int }`.

### Error format
Every error is JSON `{"detail": "<human readable message>"}`. For 422 errors, `detail` is FastAPI's list of
field errors.

## 4. Business rules (enforced in `services.py`)
| Rule | Status | Mechanism |
|---|---|---|
| Registering for a non-existent event is rejected | 404 | event looked up first and `NotFoundError` raised if missing |
| The same employee cannot register twice | 409 | lookup by (event_id, lower(email)); the DB unique constraint catches races and `IntegrityError` becomes a 409 |
| An event cannot exceed its max capacity | 409 | event row locked with `SELECT … FOR UPDATE`, registrations counted, rejected when count ≥ capacity |
| Capacity cannot be lowered below the current number of registrations | 409 | checked in `update_event` |

## 5. Validation rules (Pydantic v2, `schemas.py`)
- The title cannot be empty or only whitespace (`StringConstraints(strip_whitespace=True, min_length=1)`).
- The event date must be a valid datetime (Pydantic parsing). Naive datetimes are treated as UTC.
- Max capacity must be > 0 (`Field(gt=0)`).
- Required fields must be present (missing field → 422).
- Registration data: name not blank, valid `EmailStr`, unknown fields rejected (`extra="forbid"`).
- Separate `*Create`, `*Update` (all fields optional for partial updates, but at least one must be given) and
  `*Read` schemas.

## 6. Non-functional requirements
- **Async (B4):** SQLAlchemy 2.0 `create_async_engine` + `async_sessionmaker` + asyncpg. Every DB call uses `await`.
- **Auth (B3):** PyJWT HS256 tokens with `sub` and `exp` (default 60 min). Passwords hashed with Argon2 (pwdlib).
  The secret comes from the environment.
- **Docs (M7):** `/docs` and `/redoc`, with tags, summaries, descriptions, response models, documented error
  responses and example payloads.
- **Migrations:** Alembic (async `env.py`).
- **Testing (B5):** pytest + pytest-asyncio + httpx `AsyncClient` against a real PostgreSQL test database.
  Covers success and failure paths for every endpoint.
- **Quality (M8):** docstrings everywhere, ruff lint + format, type hints.
- **Production:** Docker images (non-root), gunicorn with uvicorn workers, nginx for the SPA and `/api` reverse
  proxy, docker-compose with healthchecks, GitHub Actions CI.

## 7. Frontend (optional)
React 18 + Vite + TypeScript, Tailwind CSS.
- **Server state:** TanStack Query (query keys per resource, cache invalidation after mutations).
- **Client state:** Zustand store for auth (token + user, persisted to localStorage). Logout clears it
  together with the query cache.
- **Routing:** React Router with a `ProtectedRoute` for create/edit pages.
- **Forms:** React Hook Form + Zod schemas that follow the backend rules. API errors (409/422) are shown inline
  and as toasts.
- **Pages:** Events (search by title/date, pagination), Event detail (register, attendee list, cancel),
  Login, Sign up, New/Edit event.

## 8. Rubric traceability
| Rubric | Where it is satisfied |
|---|---|
| M1 Structure | `backend/app/{db,models,schemas,services,main}.py`; routes only call services |
| M2 Event CRUD | `main.py` event routes → `services.py` event functions; persisted in PostgreSQL |
| M3 Registration endpoints | `POST/GET /events/{id}/registrations`, `DELETE /registrations/{id}` |
| M4 Business rules | `services.register_for_event` (404/409/409) |
| M5 Validation | `schemas.py` Field constraints + validators; separate Create/Update/Read |
| M6 Error handling | domain exceptions + handlers in `main.py`; status codes in the table above |
| M7 Docs | route metadata, `responses=`, schema examples, tags |
| M8 Code quality | docstrings, comments, ruff config, CI lint |
| M9 Git | feature branches → PRs → `main`, small meaningful commits |
| M10 README/requirements | `README.md`, `backend/requirements.txt` |
| M11 Screenshots + AI docs | `docs/screenshots/`, `docs/ai-usage/` |
| M12 Demo video | `docs/demo-script.md` (recorded by the student) |
| B1 Pagination | `skip`/`limit` on both list endpoints, bounds validated |
| B2 Search/filter | `title` + `date` on `GET /events`, combinable |
| B3 JWT | `security.py`, `/auth/*`, protected routes |
| B4 Async | `db.py` async engine, all services `async def` |
| B5 Tests | `backend/tests/`, run in CI |

## 9. Delivery roadmap (one branch + PR each)
1. `feature/project-setup` 2. `feature/event-crud` 3. `feature/registrations`
4. `feature/validation-error-handling` 5. `feature/jwt-auth` 6. `feature/pagination-filtering`
7. `feature/tests` 8. `feature/frontend` 9. `feature/docker-production` 10. `feature/ci`
11. `docs/readme-and-submission`
