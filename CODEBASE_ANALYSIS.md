# School Management System - Comprehensive Codebase Analysis

## Project Overview

**ng-school-management-system** is a comprehensive, multi-tenant SaaS platform designed to streamline school administration, academics, and finance. It features a sophisticated separation between platform governance and tenant-specific operations.

### Key Characteristics
- **Multi-tenant Architecture**: Each school operates independently within the platform
- **Role-based Access Control**: 6 distinct user roles with specific permissions
- **Subscription-based Model**: Schools subscribe to feature modules via subscription plans
- **Full-stack Implementation**: Modern Next.js frontend + Django REST backend
- **Enterprise-ready**: Includes payment processing, analytics, and audit logging

---

## Tech Stack

### Frontend
- **Framework**: Next.js 16 with React 19
- **Language**: TypeScript 5.8
- **Styling**: Tailwind CSS 4.1 + PostCSS
- **HTTP Client**: Axios with custom interceptors and token refresh
- **State Management**: Zustand 5
- **Form Handling**: React Hook Form + Zod validation
- **UI Components**: Lucide React icons
- **Data Fetching**: TanStack React Query 5.90
- **PDF Generation**: html2pdf.js
- **QR Codes**: qrcode.react
- **Charts**: Recharts 3.7
- **Rate Limiting**: @upstash/ratelimit
- **Error Tracking**: Sentry
- **Storage**: AWS S3 (via @aws-sdk/client-s3)

### Backend
- **Framework**: Django 6.0.1 + Django REST Framework 3.15
- **Language**: Python
- **Database**: PostgreSQL (via psycopg3)
- **Authentication**: JWT (djangorestframework-simplejwt)
- **API Docs**: drf-spectacular (OpenAPI/Swagger)
- **CORS**: django-cors-headers
- **Caching**: Django Redis 5.4
- **Background Jobs**: Celery 5.3 with Redis broker
- **File Storage**: AWS S3 (boto3 + django-storages)
- **Production**: Gunicorn + WhiteNoise
- **Environment**: python-dotenv

---

## System Architecture

### 1. Multi-Tenant Design

**TenantModel (Abstract Base)**
```
TenantModel (Abstract)
├── school (ForeignKey to School)
├── created_at
└── updated_at
```

All school-specific data inherits from `TenantModel`:
- Academic models (Students, Teachers, Classes, ReportCards, Attendance, Subjects)
- Bursary models (Payments, Expenses, Fees, StudentFees)

**Tenant Identification**
- Header-based: `X-Tenant-ID` from Next.js middleware
- Fallback: Host header parsing for subdomain routing
- Enforced via `TenantMiddleware` in every request

### 2. User Roles & Permissions

**6 Role Hierarchy** (in `users/models.py`):
```
SUPER_ADMIN     → Platform administrator (full control)
SCHOOL_ADMIN    → School-level administrator
TEACHER         → Teaching staff with class assignments
STUDENT         → Enrolled learners
PARENT          → Guardians with student view access
STAFF           → Support staff (non-academic)
```

### 3. Module-Based Feature Control

**PlatformModule System** - Dynamic feature toggling:
- **16 Feature Modules** with independent activation:
  1. `students` - Student Management
  2. `teachers` - Teacher Management
  3. `staff` - Non-Academic Staff
  4. `classes` - Class Management
  5. `grading` - Grading & Results
  6. `attendance` - Attendance Tracking
  7. `bursary` - Bursary & Finance
  8. `announcements` - Internal Broadcasts
  9. `calendar` - School Calendar
  10. `analytics` - School Analytics
  11. `id_cards` - ID Card Generator
  12. `broadsheet` - Master Broadsheet
  13. `admissions` - Online Admissions
  14. `newsletter` - School Newsletter
  15. `messages` - Direct Messaging
  16. `cms` - Website CMS

**Subscription Plans**
- Define which modules are included
- Tied to payment and duration
- Auto-renewal support

---

## Data Models & Database Schema

### Core Entities

#### 1. **Schools & Tenancy** (`schools/models.py`)
```
School
├── name
├── domain (unique subdomain)
├── address, phone, email
├── contact_person
├── logo (URL)
├── created_at, updated_at
└── Indexes: [domain], [created_at]
```

#### 2. **Users & Authentication** (`users/models.py`)
```
User (extends Django AbstractUser)
├── role (choice: SUPER_ADMIN, SCHOOL_ADMIN, etc.)
├── school (ForeignKey to School)
├── username, password (encrypted)
├── email, first_name, last_name
└── is_active, is_staff, is_superuser
```

#### 3. **Academic Entities** (`academic/models.py`)
```
Subject (TenantModel)
├── name
└── school

Teacher (TenantModel)
├── user (OneToOne with User)
├── name, address, phone, email
├── passport_url (AWS S3)
└── school

Class (TenantModel)
├── name
├── class_teacher (FK → Teacher)
├── subjects (M2M)
└── school

Student (TenantModel)
├── user (OneToOne with User)
├── student_no (unique per school)
├── names, gender, dob
├── current_class (FK → Class)
├── parent_name, parent_email, parent_phone
├── address, passport_url
├── school
└── Unique Constraint: [school, student_no]

ReportCard (TenantModel)
├── student (FK → Student)
├── student_class (FK → Class)
├── session, term
├── average, position, total_score
├── teacher_remark, head_teacher_remark
├── Unique Constraint: [student, session, term]

SubjectScore (TenantModel)
├── report_card (FK → ReportCard)
├── subject (FK → Subject)
├── ca1, ca2, exam (component scores)
└── total (computed)

AttendanceSession (TenantModel)
├── student_class (FK → Class)
├── session, term, date

AttendanceRecord (TenantModel)
├── attendance_session (FK)
├── student (FK → Student)
├── status (Present/Absent/Late)
```

#### 4. **Bursary & Finance** (`bursary/models.py`)
```
FeeCategory (TenantModel)
├── name
├── description
└── is_optional

FeeItem (TenantModel)
├── category (FK → FeeCategory)
├── amount, session, term
├── target_class (FK → Class, optional)
└── active

StudentFee (TenantModel)
├── student (FK → Student)
├── fee_item (FK → FeeItem)
├── discount_amount
└── Unique: [student, fee_item]

Payment (TenantModel)
├── student (FK → Student)
├── amount, date, reference
├── method (cash/transfer/pos/online)
├── status (pending/completed/failed/refunded)
├── category (FK → FeeCategory, optional)
├── remark, recorded_by
├── session, term
└── Ordering: [-date, -created_at]

Expense (TenantModel)
├── category (salary/maintenance/supplies/utilities/other)
├── amount, date, description
├── recorded_by, approved_by (optional)
└── school
```

#### 5. **Subscription & Platform Management** (`schools/models.py`)
```
SubscriptionPlan
├── name, slug (unique)
├── price, duration_days
├── description
├── features (JSON - marketing text)
├── allowed_modules (JSON - list of module IDs)
└── is_active

Subscription
├── school (OneToOne)
├── plan (FK → SubscriptionPlan)
├── status (active/expired/cancelled/pending)
├── start_date, end_date
├── auto_renew
└── created_at, updated_at

SchoolPayment
├── school (FK → School)
├── amount, reference, status
├── date

PlatformModule
├── module_id (unique: students, grading, etc.)
├── name, description
├── is_active (global feature switch)
└── sync_from_registry() - keeps DB in sync with MODULES constant
```

#### 6. **Audit & Governance** (`core/models.py`)
```
GlobalActivityLog
├── action (SCHOOL_SIGNUP, PAYMENT_RECORDED, etc.)
├── school (FK, nullable)
├── user (FK, nullable)
├── description
├── metadata (JSON)
├── created_at
└── Indexes: [action], [created_at]

PlatformAnnouncement
├── title, message
├── priority (low/medium/high/critical)
├── is_active
├── target_role
├── created_by (FK → User)
├── created_at, expires_at
└── Ordering: [-created_at]
```

### Database Indexing Strategy
- Composite indexes on frequently queried combinations: `[school, session, term]`, `[school, student_no]`
- Unique constraints prevent duplicate data
- Soft-delete could be added via `is_deleted` fields if needed

---

## API Architecture

### Frontend-Backend Communication

**Proxy Pattern** (`app/api/proxy/[...path]/route.ts`)
- Next.js acts as a gateway to Django backend
- Handles authentication token management
- Cookie-based token storage (secure)
- Automatic token refresh on 401 errors
- Forwards `X-Tenant-ID` header from frontend to backend

**Authentication Flow**
```
1. User logs in via POST /api/auth/login
2. Django returns access + refresh tokens (JWT)
3. Tokens stored in cookies (httpOnly)
4. Proxy middleware attaches tokens to backend requests
5. On 401, automatically refresh tokens
6. Queue pending requests during refresh
```

### API Endpoints Overview

**Authentication** (`users/`)
- `POST /auth/login/` - CustomTokenObtainPairView
- `GET /me/` - MeView (current user info)
- `POST /impersonate/` - ImpersonateUserView (super admin only)

**Schools & Platform** (`schools/`)
- `GET /plans/` - PublicPlanListView
- `GET /modules/` - PlatformModulesView (list active modules)
- `POST /modules/toggle/` - ModuleToggleView
- `GET /schools/` - SchoolManagementView
- `POST /schools/revenue/` - SchoolRevenueView
- `POST /payments/record/` - RecordPaymentView
- `GET /plans/management/` - PlanManagementView
- `GET /health/` - SystemHealthView
- `GET /analytics/` - StrategicAnalyticsView
- `GET /governance/` - PlatformGovernanceView
- `GET /search/` - GlobalSearchView
- `POST /maintenance/` - MaintenanceModeView
- `GET /announcements/` - UserAnnouncementsView
- `POST /register/` - RegisterSchoolView

**Academic** (`academic/`)
- ViewSets: `SubjectViewSet`, `TeacherViewSet`, `ClassViewSet`, `StudentViewSet`
- ViewSets: `ReportCardViewSet`, `SubjectScoreViewSet`
- ViewSets: `AttendanceSessionViewSet`, `AttendanceRecordViewSet`
- All inherit from `TenantViewSet` (auto-filters by school)

**Bursary** (implied)
- ViewSets likely for: Payments, Expenses, FeeCategories, FeeItems, StudentFees

**Core Settings** (`core/`)
- `GET/POST /settings/` - SettingsView
- `GET /stats/` - PublicStatsView
- `POST /upload/` - FileUploadView (AWS S3)

### Response Interceptors & Error Handling
- Automatic retry on network failures
- Token refresh queue system (prevents multiple refresh calls)
- Customized error responses with metadata
- Sentry integration for production error tracking

---

## Frontend Structure

### Pages & Routes

**Public Routes**
- `/` - Public landing page
- `/login` - Authentication
- `/privacy-policy`
- `/terms-of-service`
- `/admission` - Online admissions form

**Dashboard Routes (Protected)**
- `/(dashboard)` - Main app shell with navigation
  - `/dashboard` - Main dashboard
  - `/students` - StudentsView
  - `/teachers` - TeachersView
  - `/staff` - StaffView
  - `/classes` - ClassesView
  - `/attendance` - AttendanceView
  - `/grading` - GradingView
  - `/bursary` - BursaryView
  - `/admissions` - AdmissionsView
  - `/announcements` - AnnouncementsView
  - `/messages` - MessagesView
  - `/calendar` - CalendarView
  - `/analytics` - AnalyticsView
  - `/broadsheet` - BroadsheetView
  - `/id_cards` - IDCardView
  - `/newsletter` - NewsletterView
  - `/settings` - SettingsView
  - `/data` - DataManagementView

**Role-Specific Views**
- `StudentDashboardView` - Personalized student portal
- `TeacherDashboardView` - Teacher workspace
- `StaffDashboardView` - Staff operations
- `DashboardView` - Admin oversight

### Component Architecture

**Organizational Structure**
```
components/
├── features/
│   ├── [Feature]View.tsx (16 main feature views)
│   ├── attendance/
│   ├── bursary/
│   ├── dashboard/
│   ├── grading/
│   └── LandingPage.tsx, LoginView.tsx, etc.
├── providers/
│   └── (Context providers, theme, auth)
└── ui/
    └── (Reusable UI components)
```

**State Management** (Zustand stores in `lib/store.ts`)
- User authentication state
- School context
- Module availability
- Navigation state
- Form state (via React Hook Form)

### Data Service Layer

**lib/api-client.ts**
- Axios instance with custom interceptors
- Token refresh logic
- Error handling
- Request/response transformation

**lib/data-service.ts**
- High-level API methods
- Caching logic (React Query)
- Business logic abstraction

**lib/types.ts** (333 lines)
- TypeScript interfaces for all entities
- Settings type (detailed configuration schema)
- Strong typing throughout frontend

**lib/api-utils.ts**
- Helper functions for API calls
- Response parsing
- Error extraction

### Styling & UI

**Tailwind CSS 4.1**
- Utility-first CSS framework
- Customized theme in `tailwind.config.js`
- Dark mode support

**PostCSS Pipeline**
- Autoprefixer for browser compatibility
- CSS processing

---

## Security Architecture

### Authentication & Authorization

**JWT-based Authentication**
- `djangorestframework-simplejwt` for token generation
- Access tokens + Refresh tokens
- Token blacklist for logout (via `rest_framework_simplejwt.token_blacklist`)
- Custom serializer: `CustomTokenObtainPairSerializer`

**Role-Based Access Control**
- 6 roles with implicit hierarchies
- Frontend route protection
- Backend view-level permission checks
- Module-level feature gates

### Middleware Security

**TenantMiddleware** (`core/middleware.py`)
- Extracts tenant from `X-Tenant-ID` header
- Validates subdomain routing
- Attaches `request.tenant` to all requests
- QuerySets auto-filtered by tenant

**Request Headers** (from `next.config.js`)
- `X-DNS-Prefetch-Control: on`
- `Strict-Transport-Security` (HSTS with preload)
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY` (clickjacking protection)
- `X-XSS-Protection: 1; mode=block`
- `Referrer-Policy: origin-when-cross-origin`
- `Permissions-Policy` (camera, microphone, geolocation disabled)

### API Security

**Rate Limiting** (`lib/rate-limit.ts`)
- `@upstash/ratelimit` + `@upstash/redis`
- Prevents brute force and abuse

**CORS** (`django-cors-headers`)
- Restricted cross-origin requests
- Configured per environment

**File Upload Security** (`app/api/upload/route.ts`)
- Authorization checks
- AWS S3 integration via presigned URLs
- File type validation (implied)

---

## Storage & Infrastructure

### File Storage

**AWS S3 / Cloudflare R2**
- School logos: `logo` field in School model (URL)
- Student/Teacher passports: `passport_url` fields
- Profile pictures: Generic media uploads
- Report card backgrounds (watermarks): `watermark_media` in Settings
- Hero images: `landing_hero_image` for CMS

**Remote Pattern Configuration** (next.config.js)
```javascript
remotePatterns: [
    {protocol: 'https', hostname: '**.r2.cloudflarestorage.com'},
    {protocol: 'https', hostname: '**.r2.dev'}
]
```

### Caching Strategy

**Backend Caching** (`django-redis`)
- Redis-backed caching layer
- Reduces database queries
- Session storage

**Frontend Caching** (`React Query`)
- Automatic request caching
- Stale-while-revalidate patterns
- Cache invalidation on mutations

### Background Tasks

**Celery** (configured in `config/celery.py`)
- Asynchronous job processing
- Email sending (newsletters, announcements)
- Report generation
- Payment processing callbacks
- Subscription renewal checks

---

## Notable Features & Implementation Details

### 1. Report Card Generation

**Data Model Support**
- `ReportCard`: Session/Term aggregates
- `SubjectScore`: Component scores (CA1, CA2, Exam)
- Automatic total calculation
- Position ranking per term/session/class

**PDF Generation** (`lib/pdf-utils.ts`)
- `html2pdf.js` library
- Customizable watermark/branding
- School signature integration
- Configurable fonts and scaling

### 2. Settings Management

**Global Configuration** (`SettingsView` in backend, `Settings` type in frontend)
- School branding (logo, colors, tagline)
- Academic periods (session, terms, terms list)
- Signatories (director, head of school + signatures)
- Report card templates
- Landing page CMS configuration
- Promotion rules (Phase 2 feature)

### 3. Multi-Tenant Data Isolation

**Tenant Model Pattern**
- Every model explicitly scoped to school
- No global data exposure
- Queries auto-filtered via TenantViewSet
- Impossible to access another school's data

**Subdomain Routing**
- `vine.edusphere.ng` → Vine School
- Platform recognizes schools by domain
- Header-based tenant identification in frontend

### 4. Subscription & Monetization

**Feature Gating**
- School can only access allowed modules
- Module toggling at platform level
- Subscription status checked on requests
- Expired subscriptions auto-disable features

**Payment Processing**
- School payment tracking (`SchoolPayment` model)
- Reference tracking (for payment gateway integration - Paystack implied)
- Multi-status pipeline (pending → success/failed)
- Audit trail via `GlobalActivityLog`

### 5. API Documentation

**drf-spectacular Integration**
- Auto-generated OpenAPI/Swagger schemas
- Available at `/api/schema/`
- Swagger UI at `/api/schema/swagger-ui/`
- ReDoc at `/api/schema/redoc/`

---

## Development Workflow

### Environment Configuration

**Backend** (Django settings.py)
- `DJANGO_SECRET_KEY` - cryptographic key
- `DEBUG` - development mode toggle
- `ALLOWED_HOSTS` - CORS-like host restriction
- `INSTALLED_APPS` - 8 apps (auth, rest_framework, cors, spectacular, core, schools, users, academic, bursary)
- Database: PostgreSQL (psycopg)
- Redis: Caching & Celery broker

**Frontend** (.env.local)
- `GEMINI_API_KEY` - Google Gemini API (AI features)
- Backend API URL (implicit from proxy pattern)

### Database Migrations

**Django ORM**
- Alembic-style migrations in each app's `migrations/` folder
- Initial migration generation: `python manage.py makemigrations`
- Apply: `python manage.py migrate`

**Seed Data**
- `seed_data.py` - Initial school/user/academic data
- `seed_plans.py` - Subscription plans
- `create_admin.py` - Super admin creation script

### Testing

**Backend**
- `tests.py` files in each app
- Django TestCase framework (implied)

**Frontend**
- Component testing (implied via Next.js)
- E2E testing infrastructure (not visible in current structure)

### Running Locally

**Backend**
```bash
cd backend
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver
```

**Frontend**
```bash
npm install
npm run dev  # Next.js dev server on http://localhost:3000
```

---

## Potential Enhancement Opportunities

### 1. **Performance Optimizations**
- Add pagination to all list endpoints
- Implement query optimization (select_related, prefetch_related)
- Cache API responses at CDN level
- Implement GraphQL for flexible data fetching
- Database query profiling and optimization

### 2. **Feature Completeness**
- Implement Phase 2: Automated promotion rules
- Message queue for attendance sync
- Mobile app (React Native)
- Offline-first sync capabilities
- Bulk import/export tools (CSV, Excel)

### 3. **Analytics & Reporting**
- Advanced reporting builder (custom reports)
- Predictive analytics (student performance forecasting)
- Dashboard customization per role
- Scheduled report generation & distribution
- Real-time data visualizations

### 4. **Communication Features**
- WhatsApp/SMS integration for announcements
- Email templates for notifications
- Two-way messaging (parents ↔ teachers)
- Broadcast scheduling
- Message delivery tracking

### 5. **Payment Integration**
- Paystack/Stripe webhook handling
- Invoice generation
- Payment reminders (automated)
- Salary processing automation
- Expense approval workflows

### 6. **Academic Features**
- Lesson planning & resource library
- Online assignment submission
- Quiz/exam builder
- Competency-based grading
- Parent-teacher conference scheduling

### 7. **Admin & Operations**
- Advanced audit logging with diffs
- User impersonation with full session replay
- Bulk operations (student bulk import)
- Subscription management UI
- School analytics dashboard (platform-level)

### 8. **Security Enhancements**
- Two-factor authentication (2FA)
- SSO integration (Google, Microsoft Entra ID)
- Data encryption at rest
- GDPR/privacy compliance features
- IP whitelist for API access

### 9. **DevOps & Infrastructure**
- Docker containerization
- Kubernetes deployment manifests
- CI/CD pipeline (GitHub Actions/GitLab CI)
- Automated testing & coverage
- Database backup automation

### 10. **Code Quality**
- Type checking for Python (mypy)
- Linting configuration (pylint, black)
- Frontend test coverage
- API endpoint documentation improvements
- Dependency updates & security scanning

---

## Key Files Reference

| File | Purpose |
|------|---------|
| [package.json](package.json) | Frontend dependencies |
| [backend/requirements.txt](backend/requirements.txt) | Backend dependencies |
| [backend/config/settings.py](backend/config/settings.py) | Django configuration |
| [backend/config/urls.py](backend/config/urls.py) | Backend routing |
| [lib/types.ts](lib/types.ts) | Frontend type definitions |
| [lib/api-client.ts](lib/api-client.ts) | HTTP client setup |
| [backend/academic/models.py](backend/academic/models.py) | Academic data models |
| [backend/bursary/models.py](backend/bursary/models.py) | Finance data models |
| [backend/schools/models.py](backend/schools/models.py) | Platform models |
| [backend/users/models.py](backend/users/models.py) | User & auth models |
| [app/api/proxy/[...path]/route.ts](app/api/proxy/[...path]/route.ts) | Backend proxy handler |
| [backend/core/middleware.py](backend/core/middleware.py) | Tenant middleware |
| [next.config.js](next.config.js) | Next.js configuration |
| [tailwind.config.js](tailwind.config.js) | Tailwind styling |

---

## Summary

This is a **sophisticated, production-ready school management SaaS platform** with:
- ✅ Proper multi-tenancy architecture
- ✅ Robust authentication & authorization
- ✅ Comprehensive data models
- ✅ Modern frontend/backend separation
- ✅ Enterprise features (subscriptions, payments, analytics)
- ✅ Security best practices
- ✅ Extensible module system

The codebase demonstrates strong software engineering practices with clear separation of concerns, proper abstraction layers, and scalable architecture. Ready for enhancement with focus on performance, advanced features, and operational excellence.

---

*Analysis Date: January 24, 2026*
*Codebase Version: 0.1.0*
