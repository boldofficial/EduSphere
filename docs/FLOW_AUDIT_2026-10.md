# EduSphere / Registra — Flow, Scalability & Standards Audit (Oct 2026)

Scope: end-to-end user flows not covered by `MODULE_AUDIT_2026-10.md`, plus standardization.
Commit `ec1c855`. "Confirmed" findings were reproduced against a local backend with the exact
payloads the frontend sends.

---

## 1. Broken flows (fix first — users are losing data today)

| #   | Flow                                         | What happens                                                                                                                                                                                                                                    | Status                 |
| --- | -------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------- |
| F1  | **Taking attendance**                        | The register posts `class_id` and nested `records`, but the API requires `student_class` and ignores `records` (read-only). Every new register returns **400**, yet the page shows "Attendance saved successfully" before the request finishes. | confirmed              |
| F2  | **Attendance data corruption**               | When no register exists for the chosen class/date, the page falls back to `attendance[0]` and **PATCHes the first existing register** with today's date/term — moving another class's or day's register.                                        | confirmed (code path)  |
| F3  | **Assigning subject teachers**               | Sends `teacher_id`/`class_id`; API requires `teacher`/`student_class` → always **400**, while the screen says "assignment added".                                                                                                               | confirmed              |
| F4  | **Class-targeted calendar events**           | `class_id`, `session`, `term` are silently dropped (not in the event model/serializer), so a "JSS 1 only" event goes to everyone.                                                                                                               | confirmed (serializer) |
| F5  | **Success toasts before the server answers** | Attendance, subject teachers and others call `mutate()` then immediately show a success toast, so failures are invisible.                                                                                                                       | confirmed (pattern)    |

**Root cause of F1–F4:** frontend types (`class_id`, `teacher_id`, `student_id`) and backend field
names (`student_class`, `teacher`, `student`) drifted apart, and nothing checks them against each
other. Some serializers translate (`StudentSerializer`, `FeeItemSerializer`, report cards), most do not.

---

## 2. Security & access control

| #   | Area                  | Problem                                                                                                                                                                                               | Status                  |
| --- | --------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------- |
| S9  | Plans                 | `allowed_modules` only hides menu items. **No API checks it**, so a Free school (or anyone editing the menu) can use bursary, CBT, library, transport, HR via the API.                                | confirmed               |
| S10 | Subscriptions         | Expired/suspended/pending schools are blocked **only at login**. Token refresh is the stock view with rotation (new 24h refresh token every time), so existing sessions continue indefinitely.        | confirmed               |
| S11 | File uploads          | `POST /api/core/upload/` accepts **any file type and size** from any logged-in user (students included) into public storage — `.html`/`.svg` with scripts can be hosted on the school's media domain. | confirmed               |
| S12 | Image fields          | `Base64ImageField` (passports, logos, transfer receipts) trusts the client's `data:` header for type/extension; no image verification or size limit.                                                  | confirmed               |
| S13 | Admissions            | Read access falls back to "everyone in the school": students/parents/teachers can list **all applications** (child names, DOB, parent contacts). Teachers can convert applicants to students.         | confirmed (permissions) |
| S14 | Conduct               | Warnings, commendations and behaviour analytics have no learner scoping — any student/parent can read every student's disciplinary record.                                                            | confirmed (permissions) |
| S15 | Public admission form | No CAPTCHA/honeypot; only the global anonymous throttle (100/hour per IP). Spam risk.                                                                                                                 | likely                  |

---

## 3. Scalability

| #   | Where                                                     | Problem                                                                                                                                                                                                |
| --- | --------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| P8  | Bulk report-card PDF (`classes/<id>/export-report-cards`) | Generated in the web request; gunicorn times out at 120s. A full class at term end will fail. Move to Celery + "we'll notify you when it's ready" with a download link.                                |
| P9  | CSV import (`data_import`)                                | Runs in the request, 2–3 queries per row (existence check, capacity count, upsert). Large imports time out. Move to Celery, batch the existence checks, compute capacity once.                         |
| P10 | Student/parent dashboard (`StudentDashboardView`)         | Still downloads all-period payments, fees, scores and attendance (now scoped to the learner, so smaller), plus the full teacher list. Switch to the per-student profile endpoint like the parent home. |
| P11 | Remaining full-list screens                               | Messages, announcements, ID cards, broadsheet, grading still use `fetchAll`.                                                                                                                           |

---

## 4. Standardization

| Area                            | Today                                                                                                                                                     | Standard to adopt                                                                                                                     |
| ------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| **API contracts**               | Hand-written TS types drift from serializers (root cause of F1–F4).                                                                                       | Generate TS types from the existing drf-spectacular OpenAPI schema (`openapi-typescript`) in CI; type mismatches then fail the build. |
| **Base viewsets & permissions** | 4 variants: academic `TenantViewSet`, bursary `TenantViewSet`, `LearningTenantViewSet`, and the new `core.permissions` role matrix (only partly adopted). | One `core` tenant viewset + `RolePermission` per module everywhere; module-plan check in the same place (fixes S9).                   |
| **Error responses**             | Mix of `{"error"}`, `{"detail"}`, `{"errors": {...}}`, plain strings.                                                                                     | One shape: `{"detail": str, "errors": {field: [msgs]}}` via the existing custom exception handler.                                    |
| **Mutations in the UI**         | `mutate()` + immediate success toast.                                                                                                                     | `await mutateAsync()`; toast on success, show field errors on failure.                                                                |
| **Dead code**                   | `views_old_backup.py`, `serializers_old_backup.py` (academic, core) — ~3,100 lines unused; a second unused `ConductEntryViewSet` in `views_conduct.py`.   | Delete; git history keeps them.                                                                                                       |
| **Next.js**                     | `middleware.ts` convention is deprecated in Next 16 (build warning).                                                                                      | Rename to `proxy.ts` (`npx @next/codemod middleware-to-proxy .`).                                                                     |

---

## 5. Recommended order

1. **F1–F5** — attendance, subject teachers, event targeting, honest success/error feedback. Data is being lost now.
2. **S10, S11, S12** — session revocation on expiry, upload allow-list + size limit + image verification.
3. **S13, S14** — admissions and conduct scoping (same pattern as the earlier fixes).
4. **S9** — enforce plan modules in the API (also makes pricing tiers real).
5. **API contract generation** — prevents the whole F-class of bugs from coming back.
6. **P8–P11** — background jobs for PDFs/imports; finish moving screens off full-list loads.
7. **Standardization clean-up** — one viewset base, one error shape, delete dead code, `proxy.ts`.
