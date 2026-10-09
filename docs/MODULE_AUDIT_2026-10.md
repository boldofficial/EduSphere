# EduSphere / Registra — Module Audit & Enhancement Plan (Oct 2026)

Scope: all 18 backend apps and the Next.js frontend, commit `9f3c46e`. Findings marked
**confirmed** were verified by reading the code path; **likely** means the pattern was found
but not exercised end to end.

---

## 1. Critical security bugs — fix before anything else

These are live in production and expose real school data.

| #   | Module                                                 | Problem                                                                                                                                                                                                                             | Who can exploit                 | Status                                                |
| --- | ------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------- | ----------------------------------------------------- |
| S1  | Staff / Teachers (`academic/serializers/teachers.py`)  | `/api/academic/teachers/` returns every staff member's **basic salary, bank name, account number, PFA/pension number, tax ID, home address and phone**. Reads are open to every role.                                               | Any logged-in student or parent | confirmed                                             |
| S2  | Staff / Teachers                                       | `TeacherSerializer.user` defaults to `User.objects.all()`; it is narrowed to the school's users only when the request has a school context, so super-admin requests without a tenant can link any user. Low risk.                   | Super admin (misuse)            | confirmed (corrected: lower risk than first reported) |
| S3  | HR & Payroll (`hr/views.py`)                           | No permission classes; inherits the academic default (read for everyone, write for teachers). Salary structures, allowances, deductions and payrolls are readable by students/parents, and **teachers can create or edit payroll**. | Any logged-in user              | confirmed                                             |
| S4  | CBT quizzes (`learning/serializers.py`)                | Quiz and question responses include `options[].is_correct` — the **answer key** — to students, including for unpublished quizzes.                                                                                                   | Students (browser network tab)  | confirmed                                             |
| S5  | CBT quizzes (`learning/views.py`)                      | `LearningTenantViewSet` is `IsAuthenticated` only: students can create/edit/delete quizzes and questions, and **PATCH their own attempt's `total_score`**.                                                                          | Students                        | confirmed                                             |
| S6  | Question bank / exams (`learning/serializers_exam.py`) | `BankQuestionSerializer.correct_answer` is returned to every role (read-for-all default).                                                                                                                                           | Students                        | confirmed                                             |
| S7  | CBT submit                                             | No check that the quiz is published or inside its start/end window or duration; a question repeated in the payload is **scored twice**.                                                                                             | Students                        | confirmed                                             |
| S8  | Inventory, Transport, Library                          | Inherit read-for-all / teacher-write. Students can read stock, supplier and cost data and transport assignments (home addresses); teachers can edit inventory.                                                                      | Students, teachers              | confirmed (permissions)                               |

**Fix pattern (one change, applied everywhere):** a single role/permission matrix in `core`
(e.g. `ModulePermission(module="hr", read={"SCHOOL_ADMIN","STAFF"}, write={"SCHOOL_ADMIN"})`)
used by every viewset, replacing the three different `TenantViewSet`/`IsAdminOrReadOnly`
copies in `academic`, `bursary` and `learning`. Plus:

- Split `TeacherSerializer` into a **public** version (name, role, photo, subjects) and an
  **HR** version (salary, bank, PFA, tax) served only to admins/HR.
- Students get a `QuizTakingSerializer` without `is_correct`/`correct_answer`; only published
  quizzes in their class and time window.
- Attempts: score fields read-only; submission deduplicates questions, enforces the window and
  duration, runs in a transaction, and loads questions/options in one query.

---

## 2. Bugs (non-security)

| #   | Module                               | Problem                                                                                                                                                                             | Status    |
| --- | ------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------- |
| B1  | CBT submit                           | Two queries per answer and no transaction; a crash mid-loop leaves a half-graded attempt with `submit_time` unset.                                                                  | confirmed |
| B2  | Auth (`core/password_validators.py`) | Password-history validator never works (wrong data source; its error is swallowed by `except Exception`).                                                                           | confirmed |
| B3  | Frontend                             | 27 `window.confirm`/`alert` calls — blocked in some in-app browsers, can't be styled, and break on mobile PWA.                                                                      | confirmed |
| B4  | Inventory, Library, Transport        | Several custom actions return whole lists without pagination (`inventory/views.py:68,179`, `library/views.py:172`, `transport/views.py:52`). Correct today, slow for large schools. | confirmed |

---

## 3. Performance & scaling

| #   | Where                                      | Problem                                                                                                                                       | Impact                                                                                   |
| --- | ------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| P1  | `StudentSerializer.get_performance_trend`  | One `ReportCard` query **per student** on every student list (up to 500 rows per page).                                                       | The most-used screen does 100–500 extra queries per page.                                |
| P2  | Library, Inventory, Blog, Exam serializers | Per-row `.count()` / `.filter()` in `SerializerMethodField`s (book counts, borrow counts, asset counts, question counts, recent assignments). | N+1 on every list; fix with `annotate(Count(...))` and `Prefetch`.                       |
| P3  | `core/serializers/messaging.py`            | Per-conversation participant lookup.                                                                                                          | Inbox slows as conversations grow.                                                       |
| P4  | Frontend screens still loading full lists  | Messages, Announcements, ID cards, Broadsheet, Grading, Teacher dashboard.                                                                    | Heavy first load on large schools.                                                       |
| P5  | Media                                      | Passports/logos stored as base64 or URLs in text fields and re-sent in list payloads.                                                         | Large JSON responses; move to R2 URLs everywhere with thumbnails.                        |
| P6  | Background work                            | Report-card PDF generation and bulk emails run in the request in places.                                                                      | Timeouts at term end, when every school generates at once. Move to Celery with progress. |

---

### Phase 2 status (Oct 2026)

- **P1 fixed:** the student list annotates the latest report-card trend in one subquery; a test
  asserts the query count does not grow with the number of students.
- **P2 fixed:** library categories and members, inventory categories, question banks, exams and blog
  categories use `annotate(Count(...))`, `select_related` and `prefetch_related` instead of per-row
  queries.
- **P3 was a false positive:** the inbox already annotates the last message and unread count.
- **B4 fixed:** the low-stock, reorder-alert, overdue and route-students endpoints are paginated
  (none are used by the frontend today).
- **New P7:** the inventory, library and transport pages each download every student
  (`fetchAll('academic/students/')`) just to fill a picker. Replace with a search-as-you-type student
  picker that queries `?search=`. Planned with the design-system components in phase 3.

## 4. Design & layout audit

The product has strong building blocks (`components/ui`: button, card, table, modal, tabs,
skeleton, pagination) but they are used inconsistently, so screens feel like different apps.

| Finding             | Measure                                                                                                                                                                                    |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Unreadable text     | **~480 uses of 6–11px text** (`text-[10px]` ×351, `text-[9px]` ×48, `text-[7px]`/`[6px]` ×31). Below 12px fails accessibility and is hard to read on the phones most Nigerian parents use. |
| No colour system    | **19 colour families** in use. Two neutrals (`gray` ×3,466 and `slate` ×318), and duplicate meanings: `green`/`emerald`, `red`/`rose`, `yellow`/`amber`, `blue`/`indigo`/`sky`.            |
| Components bypassed | 323 raw `<button>` vs 268 `<Button>`; 184 raw `<input>` vs 154 `<Input>`; 45 raw `<table>`.                                                                                                |
| No empty states     | 0 shared empty-state component; lists show blank space or a grey sentence.                                                                                                                 |
| Dark mode           | Only 29 `dark:` classes — effectively unsupported.                                                                                                                                         |
| Monolith screens    | 15 components over 560 lines (ReportCardTemplate 1,111; StudentsView 1,089; BulkDiscountManager 884). Hard to keep visually consistent.                                                    |

### Proposed design system ("Registra UI")

1. **Tokens** in `app/globals.css` `@theme`:
   - One neutral (`gray`), the existing `brand` navy, `accent` gold.
   - Semantic colours: `success` (emerald), `warning` (amber), `danger` (rose), `info` (sky).
   - Radius scale (8 / 12 / 16), two shadow levels, and dark-mode values for every token.
2. **Type scale:** 12 / 14 / 16 / 18 / 24 / 30 / 36. Nothing below 12px. One display font for
   headings and Inter for UI, both via `next/font`.
3. **Shared patterns:**
   - `PageHeader`: title, breadcrumb, primary action.
   - `StatCard`: KPI with a trend.
   - `DataTable`: sort, filter, server pagination, bulk select, and cards on mobile.
   - `EmptyState`: illustration, one-line explanation, call to action.
   - `ConfirmDialog`: replaces `window.confirm`.
   - `FormSection`, `StatusBadge` (semantic), `FilterBar` and `Drawer` (for detail views).
4. **Layout shell:** one dashboard layout (collapsible sidebar on desktop, bottom nav on
   mobile, sticky page header), 16px mobile gutters, 1280px max content width.
5. **Lint guardrails:** ESLint/Tailwind rules that flag arbitrary `text-[Npx]`, raw colour
   families outside the tokens, and raw `<button>`/`<input>` in feature code.

---

### Phase 3 status (Oct 2026) — design foundation

- **Tokens:** semantic `success`/`warning`/`danger`/`info` colours, `rounded-card`/`rounded-control`,
  `shadow-card`/`shadow-raised` in `app/globals.css`.
- **Type:** 351 uses of 6–11px text in app screens raised to 12px. Printed documents (report cards,
  ID cards, payslips, invoices, receipts) keep their small print sizes.
- **Colour:** 583 classes unified onto one family per meaning (slate→gray, emerald→green,
  rose→red, yellow→amber, sky→blue, violet→purple) across app screens; the marketing sites keep
  their palettes.
- **Components** (`components/ui`): `PageHeader`, `StatCard`, `EmptyState`, `StatusBadge`,
  `ConfirmDialog`/`useConfirm`, `StudentPicker`. `Modal` now closes on Escape/backdrop, locks page
  scroll, has dialog roles, and is a bottom sheet on phones.
- **B3 fixed:** all 27 `window.confirm`/`alert` calls replaced with the confirm dialog or toasts.
- **P7 fixed + bug:** inventory, library and transport use the search-as-you-type `StudentPicker`
  instead of downloading every student. Their old dropdowns showed `first_name`/`last_name`, which
  students do not have, so every option was blank.
- **Fonts:** report-card font choices (Montserrat, Playfair, Roboto) load only on report cards, not
  on every page.
- **Guardrails:** ESLint errors on `confirm`/`alert`, text below 12px and the retired colour
  families in app screens.
- **Review page:** `/design-system` shows every token and component (404s in production unless
  `ENABLE_DESIGN_SYSTEM_PAGE=true`).
- **Bug noted, not fixed:** the blog editor's Delete button confirms and then does nothing.
- **Not done yet:** dark mode, a shared `DataTable`, and applying `PageHeader`/`StatCard`/`EmptyState`
  across screens — that is phase 4 (screen redesigns).

## 5. Module-by-module enhancements

| Module                        | Functional enhancements                                                                                                                   | Design / UX enhancements                                                                                                         |
| ----------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| **Dashboard**                 | Role-specific "today" view: fees due, absences, pending approvals, upcoming exams                                                         | KPI `StatCard` row, one chart, action list; no more wall of tiles                                                                |
| **Students**                  | Guardian records (link parents properly instead of `parent_email` matching); documents; medical notes; sibling links                      | Student profile as a tabbed page (overview, academics, fees, attendance, conduct) instead of modals; photo-first cards on mobile |
| **Staff / HR**                | Leave requests, payslips (PDF, self-service), payroll approval flow (draft → approved → paid)                                             | Payroll run as a step-by-step wizard with a review table                                                                         |
| **Attendance**                | One-tap register per class, late/excused reasons, parent alert on absence (SMS credits)                                                   | Big tap targets, class roster grid, "mark all present"                                                                           |
| **Grading & Report cards**    | Score-entry grid per class with keyboard navigation and autosave; moderation/approval before publishing; bulk PDF via Celery              | Spreadsheet-style entry; report-card template editor with live preview                                                           |
| **Broadsheet**                | Server-side aggregation, export to Excel                                                                                                  | Frozen first column, sticky header, colour scale for scores                                                                      |
| **Bursary**                   | Payment proof upload by parents → bursar approval queue; termly instalment tracking; debtors list with reminder sending; receipts with QR | Fee status chips per student; debtors table with bulk "remind"                                                                   |
| **Admissions**                | Online application → review → offer → enrolment pipeline; entrance-exam link to CBT                                                       | Kanban-style pipeline board                                                                                                      |
| **CBT / Exams**               | Secure taking mode (one question per screen, timer, autosave, resume), randomised order, item analysis after grading                      | Distraction-free exam screen, progress bar, review page before submit                                                            |
| **LMS / Learning**            | Assignments with due dates and rubrics, submissions with feedback, class discussion threads                                               | Course page per subject: materials, assignments, discussions                                                                     |
| **Timetable**                 | Clash detection, teacher load view, printable class/teacher timetables                                                                    | Week grid with drag-and-drop                                                                                                     |
| **Messaging & Announcements** | Read receipts, broadcast to class/parents, SMS/WhatsApp fallback using credits                                                            | Inbox layout with thread list and conversation pane                                                                              |
| **Library**                   | Barcode/ISBN lookup, overdue fines into bursary, reservations                                                                             | Book cover grid, borrow/return quick actions                                                                                     |
| **Inventory**                 | Low-stock alerts, purchase requests, asset assignment history                                                                             | Stock level bars, alert badges                                                                                                   |
| **Transport**                 | Routes with stops, student-to-route assignment, driver contacts, fees linked to bursary                                                   | Route list with stop timeline                                                                                                    |
| **Analytics**                 | Term-over-term comparison, at-risk students (attendance + grades), fee-collection rate                                                    | Clean chart grid with filters; export                                                                                            |
| **Settings**                  | Guided setup checklist for new schools (session/terms, classes, subjects, fees, staff)                                                    | Settings split into sections with left nav instead of one long page                                                              |
| **Public website / CMS**      | Template themes per school, SEO fields, admission form embed                                                                              | Modern templates using the school's colours                                                                                      |
| **Parent portal**             | One view per child: results, fees, attendance, messages; pay-by-transfer with proof upload                                                | Mobile-first, card-based, very large type                                                                                        |

---

## 6. Recommended roadmap

| Phase                    | Scope                                                                                                          | Why first                                            |
| ------------------------ | -------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------- |
| **1. Security (now)**    | S1–S8: role matrix, staff serializer split, CBT answer-key and score fixes, HR/inventory/transport permissions | Real data is exposed in production today             |
| **2. Performance**       | P1–P3 N+1 fixes, paginate custom actions, remaining full-list screens                                          | Cheap, big speed-up on the busiest screens           |
| **3. Design foundation** | Tokens, type scale, `PageHeader`/`DataTable`/`EmptyState`/`ConfirmDialog`, layout shell, lint guardrails       | Every later screen change gets the new look for free |
| **4. Screen redesigns**  | Dashboard, Students, Bursary, Grading/report cards, Parent portal                                              | Most-used screens, biggest perceived quality jump    |
| **5. Module features**   | Payment-proof approval, CBT secure mode, payroll wizard, admissions pipeline, guided setup                     | New value on the redesigned base                     |
