# EduSphere / Registra — Code Review (Oct 2026)

Scope: Django backend (16 apps), Next.js 16 frontend, deployment config. Commit `0d5fd5a`.
Method: read core tenancy, permission and payment code paths; grep-based sweep of all modules; ran the
backend test suite and the TypeScript check; production build verified earlier.

## Status update (7 Oct 2026)

School-level Paystack/Flutterwave were removed: schools now enter bank account details manually
(`SchoolPaymentConfig` keeps cash + bank transfer only; migration `schools/0024` moves any gateway default
to bank transfer). The public invoice page (`/pay/<hash>`) shows the school's bank details instead of a
Paystack button. Platform subscription payments (onboarding, super-admin settings) are unchanged.

| Item                                                             | Status                                                                                                                        |
| ---------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| P0 #1–2, #4 Paystack verify/webhook/initialize bugs              | Removed with the school gateway code                                                                                          |
| P0 #3 Anyone could write payments/fees                           | Fixed — writes need SCHOOL_ADMIN/STAFF/SUPER_ADMIN; expenses + bursary dashboard finance-only; parents scoped to own children |
| P0 #5 `fetchAll` truncation                                      | Fixed — follows every page (200/page)                                                                                         |
| P0 #6 Students/parents see all students                          | Fixed — student/report-card/score lists scoped to self/children, unpublished report cards hidden, broadsheet staff-only       |
| P0 #7 Broken test suite                                          | Fixed — 67/67 backend tests pass (added role-permission tests)                                                                |
| New: payments/expenses from the dashboard returned 400           | Fixed — `recorded_by` is set server-side from the logged-in user                                                              |
| New: editing students/scores/fees/payments crashed (500)         | Fixed — missing `log_field_change` import in `core/security_utils.py`                                                         |
| New: payments without a date crashed (500)                       | Fixed — `DateField` defaults use `timezone.localdate`                                                                         |
| P1 #2–3 per-request count + INFO logs                            | Fixed                                                                                                                         |
| P1 #4 cache invalidation SCAN on every write                     | Fixed — opt-in only (nothing was cached under those keys)                                                                     |
| P1 #5 LocMemCache in prod                                        | Warns at startup when `REDIS_URL` is missing                                                                                  |
| P1 #6 contact form rate limit                                    | Uses the shared Upstash limiter                                                                                               |
| P1 #7 stale tenant cache                                         | Fixed — caches the id and re-validates against the domain                                                                     |
| Frontend unit tests                                              | Runner fixed (`vi.stubEnv`); 19 of 28 tests are still stale and fail — rewrite pending                                        |
| P1 #1, #8, #9 (server-side pagination, PgBouncer, CI type-check) | Open                                                                                                                          |

## Status update 2 (7 Oct 2026)

| Item                     | Status                                                                                                                                                                   |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Teacher access           | Teachers see only students (and their fees/payments, history, achievements) in classes they teach                                                                        |
| Report cards             | Removed a duplicate `get_queryset`; the live one already limits students/parents to published cards                                                                      |
| Whole-collection loading | New `/api/academic/analytics/` aggregates in SQL; Analytics page, header bell, staff dashboard and conduct log no longer download all records                            |
| Runtime NameErrors       | Fixed `inch` (broadsheet + QR PDFs) and `models`/`date` (library views)                                                                                                  |
| CI                       | Runs on `main` + `development`, Node 22, Redis service; ruff pinned to correctness rules; black + Prettier applied; ESLint 0 errors; 14 frontend + 70 backend tests pass |
| PgBouncer                | App traffic goes through `pgbouncer:6432` (scram auth, transaction pooling)                                                                                              |
| Exposed ports            | Postgres, Redis and PgBouncer are no longer published on the host                                                                                                        |
| Repo hygiene             | README rewritten; reports moved to `docs/archive/`; passport photos, `scratch/` and generated service-worker files untracked                                             |

Still open:

- Remaining full-list screens for staff: messages, announcements, ID cards, broadsheet, grading,
  teacher dashboard (correct, but heavier than needed for large schools).
- `core/password_validators.py` password-history check never works (wrong data source, and its
  `ValidationError` is swallowed by `except Exception`). Needs a password-history table.
- Ruff ignores (E402, E741, F841) and 441 ESLint warnings (mostly React Compiler advisories) are debt.
- Passport photos remain in git history; purge with `git filter-repo` if the repo is ever shared.
- Load test has not been run; needs a seeded staging environment.

## Verdict

The architecture is sound for a multi-tenant SaaS (shared DB with a `school` FK, JWT, Redis cache,
Celery, Postgres, Docker). Tenant isolation at the query level is mostly done right. But it is **not
production-safe yet**: there are confirmed bugs in payments and role permissions, list screens silently
truncate data, and the test suite is broken so none of this is caught. Fix the P0 items before onboarding
more schools.

## P0 — Confirmed bugs (fix now)

| #   | Where                                                                                                    | Problem                                                                                                                                                                                    | Impact                                                                                                                                            |
| --- | -------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | `bursary/views.py` `VerifyPaystackPayment`                                                               | `Payment.objects.get_or_create(...)` never sets `school`, but `Payment.school` is non-nullable (`TenantModel`).                                                                            | Every online Paystack payment fails to record ("Failed to record payment", 500) even though the parent was charged.                               |
| 2   | `bursary/views.py` `PaystackWebhook`                                                                     | Webhook only updates an existing `Payment`; it never creates one.                                                                                                                          | If the parent closes the browser before the verify call (or #1 fails), money is received and never recorded. Webhook must be the source of truth. |
| 3   | `bursary/views.py` `PaymentViewSet`, `StudentFeeViewSet`                                                 | Only `IsAuthenticated` — no role check on writes.                                                                                                                                          | Any STUDENT, PARENT or TEACHER can `POST/PATCH/DELETE` payments and fee assignments (e.g. mark own fees as paid).                                 |
| 4   | `bursary/views.py` `InitializePaystackPayment`                                                           | Uses `request.tenant.id` without a null check; ignores `get_request_school`.                                                                                                               | 500 error when no tenant header/host resolves.                                                                                                    |
| 5   | `lib/hooks/use-data.ts` `fetchAll`                                                                       | Returns only `response.data.results` — page 1. Used by 32 hooks (students, teachers, payments, scores, fees…).                                                                             | Any school with >50–100 records sees incomplete lists; bursary totals and dashboards are wrong. Silent.                                           |
| 6   | `academic/views/students.py`, `academic/views/reports.py` `BroadsheetView`, academic `IsAdminOrReadOnly` | Reads are open to every role in the school. Only scores/fees filter STUDENT to self.                                                                                                       | Students/parents can list every student's personal data and whole-class results. Privacy (NDPR) exposure.                                         |
| 7   | Backend tests                                                                                            | `learning/` has both `tests.py` and `tests/` → `manage.py test` aborts on import. Excluding it: **21 of 41 tests fail** (stale URLs → 404, `core/tests.py` imports removed `ActivityLog`). | CI (`backend-ci.yml` runs `manage.py test`) cannot be passing; regressions ship unnoticed.                                                        |

## P1 — Scalability / performance

1. **Unbounded "load everything" pattern.** The frontend fetches whole collections and filters client-side.
   Fixing #5 by looping pages will make it correct but slow at scale. Move to server-side pagination,
   filtering and aggregation (DRF `django-filter`, dashboard aggregate endpoints).
2. **Extra query per request:** `StudentViewSet.get_queryset` runs `qs.count()` just to log it.
3. **Log volume:** `TenantMiddleware` logs at INFO on every request (two lines). At scale this is
   disk/ingest cost; drop to DEBUG.
4. **Global cache invalidation:** `CachingMixin.invalidate_cache` deletes `api:<Model>:*` for _all_
   schools on any write, and runs twice per write (TenantViewSet + mixin). Scope keys by school id.
5. **Cache falls back to LocMemCache** when `REDIS_URL` is unset — per-process, not shared across
   gunicorn workers; throttling and tenant caches become inconsistent. Fail loudly in production instead.
6. **Contact form rate limit is in-memory** (`app/api/contact/route.ts`) — resets per instance/deploy.
   Use the Upstash limiter already in `lib/rate-limit.ts`.
7. **Tenant lookup caches the whole `School` model object** for 5 min — school deactivation/settings
   changes lag; cache the id and re-check `is_active`.
8. **Gunicorn** `5 workers × 4 threads` each holding a persistent DB connection (`CONN_MAX_AGE=60`) plus
   Celery workers: ~25+ Postgres connections per backend container. Add PgBouncer before scaling
   horizontally.
9. **Type errors don't fail builds** (`ignoreBuildErrors: true`). Now that `tsc` is clean, run
   `npm run check-types` in CI so it stays clean without risking build-server OOM.

## Best practices — what's good

- Tenant FK + `get_request_school()` rejects header/user school mismatch — prevents the obvious
  `X-Tenant-ID` spoof.
- Cross-tenant FK checks on create/update (`_enforce_related_school`).
- JWT 15-min access tokens, rotation + blacklist; DRF throttling; Paystack webhook HMAC verified.
- Async audit logging via Celery; `select_related` used on the hot viewsets; composite indexes on
  `(school, created_at)`.
- Security headers/CSP in `next.config.js`; secrets read from env; migrations run on container start.

## Best practices — gaps

- Two different `TenantViewSet` / `IsAdminOrReadOnly` classes (academic vs bursary) with different role
  rules. Consolidate into `core` with one explicit role-permission matrix.
- Role checks are string comparisons scattered through views; no object-level permissions.
- Root docs: ~20 overlapping status/report markdown files; `README.md` is still the AI Studio template.
- Debug artifacts committed or present: `backend/db.sqlite3`, `*.log` files, `scratch/`.
- Coolify deploys the `development` branch into the app named "main".

## Next steps (in order)

1. **Payments (P0 #1–4):** set `school=student.school` in verify; make the webhook create-or-update the
   `Payment` from metadata (idempotent on `gateway_reference`, add a unique constraint); restrict
   Payment/StudentFee writes to SCHOOL_ADMIN/STAFF(bursar); null-check tenant. Add tests for each.
2. **Data truncation (P0 #5):** short term, make `fetchAll` follow `next` links; then convert large
   screens (students, payments, scores) to paginated/server-filtered queries.
3. **Role permissions (P0 #6):** define a role matrix (admin, teacher, staff, student, parent); scope
   student/parent reads to self/children on every viewset; restrict broadsheet to staff.
4. **Tests (P0 #7):** delete `learning/tests.py` (or merge into the package), fix the 21 failing tests,
   make CI required on `main`.
5. **Scale hygiene (P1):** remove per-request count/INFO logs, tenant-scoped cache keys, require Redis in
   prod, PgBouncer, CI type-check.
6. **Load test** a realistic school (≈2,000 students, 3 terms of scores/payments) with k6/Locust against
   staging before the next onboarding push.
