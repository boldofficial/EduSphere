# Authentication & Security Analysis Report

## 1. Executive Summary
This specific analysis of the authentication flow for the School Manager SaaS platform reveals a generally sound architectural foundation (Next.js + Django + JWT) but identifies **critical security vulnerabilities** and **incomplete features** that must be addressed before production deployment.

**Key Findings:**
- **CRITICAL**: Tenant validation logic in the login serializer is explicitly disabled (commented out), allowing "Wrong Door" access.
- **CRITICAL**: The "Student Login" flow is currently unimplemented/broken, as it relies on an unauthenticated fetch of the entire student database.
- **High Risk**: Database persistence is configured for SQLite by default, which is unsuitable for a scalable SaaS.
- **Compliance**: JWT handling uses secure HTTPOnly cookies, aligning with OWASP recommendations, but token lifetimes need alignment.

---

## 2. Architecture Overview

The system employs a **decoupled authentication architecture**:

- **Frontend (Next.js)**:
  - **Middleware (`middleware.ts`)**: Handles tenant resolution via Subdomains or Custom Domains, injecting the `X-Tenant-ID` header.
  - **Auth Logic**: Uses `features/LoginView.tsx` and `app/api/auth/login` as a proxy.
  - **Storage**: Stores JWTs (`access_token`, `refresh_token`) in **HTTPOnly, Secure Cookies**.

- **Backend (Django REST Framework)**:
  - **Auth Provider**: `rest_framework_simplejwt`.
  - **Middleware**: `TenantMiddleware` resolves the tenant from headers or hostnames.
  - **Authorization**: `TenantViewSet` enforces data isolation at the ORM level.

---

## 3. Vulnerability Assessment

### 3.1. "Wrong Door" Access (Critical)
**Location**: `backend/users/serializers.py` (Lines 27-39)
**Issue**: The code intended to validate that a user belongs to the requested tenant is **commented out**.
```python
# TEMPORARILY DISABLED TENANT CHECK FOR DEBUGGING
# if self.user.role != 'SUPER_ADMIN':
#     ...
#     if user_school.domain != tenant_id:
#         raise AuthenticationFailed(...)
```
**Impact**: A user registered at **School A** can log in via **School B**'s subdomain.
- While `TenantViewSet` inherently filters data by `user.school` (preventing them from seeing School B's data), this allows a user to access the platform through an unauthorized entry point, potentially leaking the fact that they have a valid account on the platform and confusing the audit logs.

### 3.2. Broken Student Authentication (Critical)
**Location**: `components/features/LoginView.tsx` & `lib/hooks/use-data.ts`
**Issue**:
- The student login form does **not** call the backend validation endpoint (`/api/auth/login`).
- Instead, it calls `useStudents`, which attempts to fetch **ALL** students via `GET /api/proxy/students/`.
- The `StudentViewSet` is protected (`IsAuthenticated`), so this request fails with `401 Unauthorized` for a user trying to log in.
**Impact**: Students **cannot log in**. The current implementation appears to be a leftover from a "Demo Mode" or client-side prototype.

### 3.3. Database Scalability (High)
**Location**: `backend/config/settings.py`
**Issue**: `DATABASES` defaults to **SQLite**.
```python
'default': dj_database_url.config(
    default=f"sqlite:///{BASE_DIR / 'db.sqlite3'}",
    ...
)
```
**Impact**: SQLite allows only one writer at a time. In a multitenant SaaS environment, this will cause immediate deadlocks and performance degradation under even moderate load.

### 3.4. Token Lifetime Mismatch (Medium)
**Location**: `app/api/auth/login/route.ts` vs `settings.py`
**Issue**:
- **Cookie**: `maxAge: 60 * 60 * 24` (1 Day).
- **Backend Token**: Defaults to 7 Days (`JWT_REFRESH_TOKEN_LIFETIME_DAYS`).
**Impact**: Users may be logged out by the browser cookie expiring effectively after 1 day, while the backend considers the session valid for 7 days. This creates inconsistent user experiences.

### 3.5. Audit Logging Gaps (Low)
**Location**: `backend/core/middleware.py`
**Issue**: The `AuditLogMiddleware` explicitly skips `/token/` and `/login/` routes.
```python
if '/token/' in request.path or '/login/' in request.path:
    return response
```
**Impact**: While this prevents password leakage in logs, it also means **failed login attempts** (brute force attacks) are not recorded in the application's `GlobalActivityLog`.

---

## 4. Scalability & Multitenancy Review

### 4.1. Tenant Isolation
- **Strengths**: The `TenantViewSet` implementation provides robust **Row-Level Security** by forcing filters based on `request.user.school`. This effectively prevents cross-tenant data leaks even if the application logic flaws allow access.
- **Weaknesses**: Reliance on application-level filtering (Django `queryset.filter`) is less secure than database-level isolation (e.g., Postgres Schemas or RLS policies). For the current scale, it is acceptable, but strict code review is required for every new ViewSet to ensure it inherits `TenantViewSet`.

### 4.2. Performance
- **Bottlenecks**:
  - **SQLite**: Must be replaced with PostgreSQL.
  - **Full Table Scans**: Code references `Student.objects.all()` in some contexts. Ensure `select_related` (present in current ViewSets) is consistently used.
  - **Frontend Fetching**: `useStudents` fetching *all* students is not scalable.

---

## 5. Actionable Recommendations

### Immediate Fixes (Security & functionality)
1.  **Re-enable Tenant Validation**: Uncomment the validation logic in `backend/users/serializers.py` immediately. Ensure `user_school` is properly defined (e.g., `user_school = self.user.school`) before usage.
2.  **Implement Real Student Auth**:
    - Update `LoginView.tsx` to handle student login the same way as Admin login: send `username` (Student No) and `password` to `/api/auth/login`.
    - Ensure the backend supports Student login via the same endpoint (User model seems unified, so this should work if Students have `User` accounts).
3.  **Switch to PostgreSQL**: Configure the production environment to strictly require `DATABASE_URL` and fail if it defaults to SQLite.

### Enhancements (Best Practices)
4.  **Align Token Lifetimes**: Update the Next.js cookie `maxAge` to match the Django `REFRESH_TOKEN_LIFETIME` (recommend 7 days for UX, or reduce backend to 1 day for security).
5.  **Rate Limiting**: Increase the default `anon` throttle rate in `settings.py` if legitimate traffic is blocked, but ensure login endpoints have stricter, separate throttling (e.g., `ScopedRateThrottle`).
6.  **Audit Logging**: Modify `AuditLogMiddleware` to log **failed** responses (401/403) from `/login/` routes without logging the request body (password), to track brute force attempts.

---

## 6. Compliance Checklist (OWASP/NIST)

| Check | Status | Notes |
| :--- | :--- | :--- |
| **Transport Security** | ✅ PASS | `SECURE_SSL_REDIRECT`, HSTS enabled in Prod. |
| **Credential Storage** | ✅ PASS | PBKDF2 (Django Default). |
| **Session Mgmt** | ✅ PASS | HTTPOnly Cookies, Short-lived Access Tokens. |
| **Access Control** | ⚠️ WARN | Role-based applied, but Tenant check disabled. |
| **Mass Assignment** | ✅ PASS | DRF Serializers generally prevent this. |
| **Data Isolation** | ✅ PASS | Logic exists (`TenantViewSet`), needs strict enforcement. |
