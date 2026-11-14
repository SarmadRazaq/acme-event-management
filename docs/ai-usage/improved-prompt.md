# Improved Prompt

This is the prompt I used to drive the AI assistant (Claude Code, model Claude Opus 5.5). It is a rewrite of my
original request, which was:

> Look up to Assignment-03-Corporate-Event-Management-FastAPI.pdf and Assignment-03-Grading-Rubric-FastAPI (1).xlsx.
> You have to go through it thoroughly then Write the specs for it and then start development. Tools are mentioned
> there but you have to use state management etc at frontend and all the production environment setup. And the
> tools for backend are mentioned there too. You have to do incremental pushes to github so create a repo and do it.

---

## Role
You are a senior full-stack engineer helping me build my course assignment. I must be able to explain every line,
so keep the code clear, commented and conventional.

## Inputs
- `Assignment-03-Corporate-Event-Management-FastAPI.pdf`: the assignment brief (required features, bonus
  features, Git rules, code quality rules, AI usage policy, submission list, demo video contents).
- `Assignment-03-Grading-Rubric-FastAPI (1).xlsx`: the grading rubric (M1–M12 mandatory = 100 marks,
  B1–B5 bonus = 20 marks).

Read both fully before writing any code.

## Deliverable 1: Specification
Write `docs/SPEC.md` containing:
1. The data model (Event, Registration, User) with field types and constraints.
2. Every endpoint: method, path, auth requirement, request/response schema, and every status code it can return.
3. The business rules (no duplicate registration → 409, no registration beyond capacity → 409, no registration
   for a non-existent event → 404) and where each is enforced.
4. The validation rules from the brief.
5. Non-functional requirements: fully async DB access, tests, OpenAPI docs, Docker, CI.
6. A traceability table that maps every rubric row (M1–M12, B1–B5) to the files/features that satisfy it.

## Deliverable 2: Backend (mandatory + all bonus features)
- **Stack (from the brief):** FastAPI, PostgreSQL, SQLAlchemy 2.0 (async engine + AsyncSession, asyncpg),
  Pydantic v2, JWT, pytest.
- **Structure (graded, M1):** keep the brief's five files: `db.py`, `models.py`, `schemas.py`, `services.py`,
  `main.py`. All business logic and DB queries live in `services.py`, and routes in `main.py` stay thin. Small
  helpers (`config.py`, `security.py`) are allowed.
- **Features:** event CRUD, registrations with the three business rules, Pydantic validation, correct HTTP codes
  (200/201/204/401/404/409/422), fully documented Swagger at `/docs` (tags, summaries, response models, examples).
- **Bonus:** `skip`/`limit` pagination on all list endpoints, `title` (partial, case-insensitive) + `date` filters
  that combine with pagination, JWT auth (hashed passwords, create/update/delete protected, reads public),
  fully async, and a pytest suite covering success and failure paths that actually passes.
- **Quality (graded, M8):** docstrings on every module/class/function, meaningful comments, PEP 8 via ruff,
  no duplication, proper exception handling.
- Migrations with Alembic, and settings from environment variables (`.env.example` provided, no hard-coded secrets).

## Deliverable 3: Frontend (optional in the brief, used in the demo)
React + Vite + TypeScript with proper state management:
- **TanStack Query** for server state (caching, invalidation after mutations, loading/error states).
- **Zustand** for client/auth state (JWT + current user, persisted).
- React Router (with protected routes), React Hook Form + Zod (mirroring backend validation), Tailwind CSS.
- It must show event create/list/update/delete, registration, cancellation, and the duplicate/capacity errors.

## Deliverable 4: Production setup
- Dockerfiles for the backend (gunicorn + uvicorn workers, non-root user) and frontend (multi-stage build → nginx).
- `docker-compose.yml` for the full stack (Postgres with volume + healthcheck, backend running migrations on start,
  nginx serving the SPA and proxying `/api`), plus a dev override with hot reload.
- GitHub Actions CI: lint + tests against a Postgres service + frontend typecheck/build.

## Git workflow (graded, M9)
- Create the public GitHub repo `acme-event-management`. `main` is the stable branch.
- One `feature/*` branch per feature (`feature/project-setup`, `feature/event-crud`, `feature/registrations`,
  `feature/validation-error-handling`, `feature/jwt-auth`, `feature/pagination-filtering`, `feature/tests`,
  `feature/frontend`, `feature/docker-production`, `feature/ci`, `docs/readme-and-submission`).
- Several small commits per branch with meaningful messages. Push each branch, open a PR, and merge it into `main`.

## Submission docs
- `README.md`: installation, PostgreSQL configuration, how to run (local and Docker), how to run tests.
- `requirements.txt` with every dependency.
- Swagger UI screenshots for every endpoint in `docs/screenshots/`.
- AI usage docs in `docs/ai-usage/` (this prompt, the tools and models used, settings).
- A demo video script that covers every point the brief requires.

## Definition of done
All tests pass locally and in CI, `/docs` works, `docker compose up --build` runs the full stack, every rubric
row maps to working code, and every feature reached `main` through its own branch and PR.
