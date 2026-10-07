# EduSphere (Registra)

Multi-tenant school management platform. One deployment serves many schools; each school gets its own
subdomain (`<school>.myregistra.net`) or custom domain, and every record is scoped to its school.

**Modules:** students, staff, classes and timetables, attendance, exams and CBT, grading and report
cards, broadsheet, bursary (fees, payments, expenses, discounts), admissions, HR, library, inventory,
transport, LMS, messaging, announcements, blog and CMS, analytics.

School fees are paid by **bank transfer or cash**: each school enters its bank account details in
Settings → Payment Methods, and invoices show those details. Paystack is used only for schools' platform
subscriptions.

## Stack

| Layer    | Tech                                                                               |
| -------- | ---------------------------------------------------------------------------------- |
| Frontend | Next.js 16 (App Router), React 19, TypeScript, Tailwind, React Query, Zustand, PWA |
| Backend  | Django 5 + Django REST Framework, SimpleJWT, drf-spectacular                       |
| Data     | PostgreSQL (via PgBouncer), Redis (cache, throttling, Celery broker)               |
| Jobs     | Celery worker + beat                                                               |
| Storage  | Cloudflare R2 (S3-compatible)                                                      |
| Deploy   | Docker Compose on Coolify                                                          |

The browser talks only to Next.js; `app/api/proxy/[...path]` forwards API calls to Django with the JWT
from an httpOnly cookie and an `X-Tenant-ID` header. Django's `TenantMiddleware` resolves the school, and
`get_request_school()` rejects requests whose tenant doesn't match the user's school.

## Local development

Prerequisites: Node 22+, Python 3.12+, [uv](https://docs.astral.sh/uv/), Docker.

```bash
cp .env.example .env.local
npm install
npm run docker:up          # Postgres + Redis
cd backend && uv sync && uv run python manage.py migrate && cd ..
npm run backend:win        # Django on 127.0.0.1:8001 (use `npm run backend` on macOS/Linux)
npm run dev                # Next.js on http://localhost:3000
```

Use `<school>.localhost:3000` to open a tenant site locally.

## Checks (same as CI)

```bash
npm run lint && npm run check-types && npm run format:check && npm run test:run
cd backend && uvx ruff check . && uvx black --check . && uv run python manage.py test
```

CI (`.github/workflows`) runs these on pushes and pull requests to `main` and `development`.

## Deployment

Coolify builds `docker-compose.yaml` on push. The backend container runs `migrate` on start.
See [docs/COOLIFY_DEPLOYMENT.md](docs/COOLIFY_DEPLOYMENT.md) and [docs/DEPLOYMENT_GUIDE.md](docs/DEPLOYMENT_GUIDE.md).
Load test staging with [scripts/loadtest/school-load.js](scripts/loadtest/school-load.js).

## Docs

- [docs/CODE_REVIEW_2026-10.md](docs/CODE_REVIEW_2026-10.md) — current review, known issues and next steps
- [docs/API_REFERENCE.md](docs/API_REFERENCE.md), [docs/how_to_guide.md](docs/how_to_guide.md)
- [docs/archive/](docs/archive/) — earlier phase reports and plans (historical)
