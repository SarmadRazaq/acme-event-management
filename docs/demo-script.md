# Demo Video Script (~12–15 minutes)

A checklist that covers every point the brief requires for the video. Times are suggestions.

## Before recording
```bash
docker compose up -d --build                         # full stack
docker compose exec backend python -m scripts.seed_demo
```
Open: VS Code, http://127.0.0.1:8000/docs, http://localhost:8080, a terminal and the GitHub repo.

---

### 1. Introduction & purpose (1 min)
- Acme Corp needs an internal system to create events, let employees register, and track registrations.
- Stack: FastAPI, PostgreSQL, async SQLAlchemy 2.0, Pydantic, JWT, pytest, plus a React frontend.

### 2. Project structure (2 min)
Open `backend/app/` and follow one request through the files:
- `main.py`: routes are thin; show `register_for_event` calling a service
- `schemas.py`: `EventCreate` / `EventUpdate` / `EventRead`, the `Title` constraint, the `check_fields` validator
- `services.py`: business logic; domain exceptions mapped to 404/409 by handlers in `main.py`
- `models.py`: tables, `CHECK` and `UNIQUE` constraints, the `registered_count` sub-query
- `db.py`: async engine, `get_session` dependency
- `config.py` and `security.py` as helpers

### 3. Database integration (1.5 min)
- `alembic/versions`: migrations; `alembic upgrade head`
- Show the tables in psql:
  `docker compose exec db psql -U postgres -d acme_events -c "\d registrations"`
- Point out the unique constraint and `ON DELETE CASCADE`

### 4. Key business logic walkthrough (2 min)
`services.register_for_event`:
1. lock the event row (`with_for_update`) → 404 if it is missing
2. duplicate check → 409
3. capacity check → 409
4. `IntegrityError` safety net
Explain why the lock matters (two people taking the last seat at the same moment).

### 5. Run the application & test ALL endpoints in Swagger (4 min)
1. `GET /health`
2. `POST /auth/register`, `POST /auth/login`, wrong password → 401
3. `POST /events` without a token → 401, then **Authorize**
4. `POST /events` → 201; invalid body (blank title, capacity 0) → 422
5. `GET /events` with `skip`, `limit`, `title=python`, `date=…`
6. `GET /events/{id}` → 200, and 999 → 404
7. `PUT /events/{id}` → 200, `{"title": null}` → 422
8. `POST /events/{id}/registrations` → 201, same e-mail in upper case → 409, fill the event → 409 "full", event 999 → 404
9. `GET /events/{id}/registrations`
10. `DELETE /registrations/{id}` → 204, again → 404
11. `DELETE /events/{id}` → 204, again → 404

### 6. Tests (1 min)
`cd backend && pytest -v --cov=app`: 89 passed. Open `test_concurrent_registrations_cannot_overbook`.

### 7. Frontend (2 min)
- Browse events, search by title, filter by date, paginate
- Log in, create an event (show client-side validation), edit it
- Register, then trigger the duplicate and full errors (the API's 409 is shown inline), cancel a registration
- Explain state management: TanStack Query for server state, Zustand for auth, filters in the URL

### 8. Key decisions & production setup (1 min)
- Docker: non-root images, migrations on start, gunicorn workers, nginx reverse proxy
- GitHub: feature branches → PRs → `main`, CI on every PR
- Security: Argon2, JWT secret from the environment (production refuses the default)
