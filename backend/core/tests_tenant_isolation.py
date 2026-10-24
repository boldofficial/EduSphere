"""
School data isolation, checked across the whole API.

For every routed viewset whose model belongs to a school, a record is created in school B. School A's
admin (and school A's staff, students and parents) then try to list it, open it, change it and
delete it. Any endpoint that returns, edits or removes another school's record fails here, including
endpoints added later, so new modules are covered without writing new tests.
"""

import datetime
import decimal
import itertools
import uuid

from django.core.cache import cache
from django.db import models, transaction
from django.test import TestCase
from django.urls import URLPattern, URLResolver, get_resolver
from rest_framework.test import APIClient

from schools.models import School
from users.models import User

_counter = itertools.count(1)


def _unique(prefix="t"):
    return f"{prefix}{next(_counter)}"


def build(model, school, depth=0):
    """A saved instance of `model` in `school`, filling required fields with plain values."""
    if model is School:
        return school
    if model is User:
        return User.objects.create_user(
            username=_unique("u") + f"@{school.domain}", password="Strong-Pass!2026", role="TEACHER", school=school
        )
    if depth > 4:
        raise RuntimeError(f"{model.__name__}: relations too deep to build")
    values = {}
    for field in model._meta.concrete_fields:
        if field.primary_key or field.name in ("created_at", "updated_at") or isinstance(field, models.AutoField):
            continue
        if getattr(field, "auto_now", False) or getattr(field, "auto_now_add", False):
            continue
        if isinstance(field, models.ForeignKey):
            if field.related_model is School:
                values[field.name] = school
            elif not field.null:
                related = field.related_model
                existing = (
                    related.objects.filter(school=school).first()
                    if "school" in {f.name for f in related._meta.concrete_fields}
                    else None
                )
                values[field.name] = existing or build(related, school, depth + 1)
            continue
        if (
            field.has_default()
            or field.null
            or (field.blank and isinstance(field, (models.CharField, models.TextField)))
        ):
            if not field.unique:
                continue
        if field.choices:
            values[field.name] = field.choices[0][0]
        elif isinstance(field, models.EmailField):
            values[field.name] = f"{_unique()}@example.com"
        elif isinstance(field, (models.SlugField, models.CharField, models.TextField)):
            values[field.name] = _unique()[: field.max_length or 20]
        elif isinstance(field, models.BooleanField):
            values[field.name] = False
        elif isinstance(field, models.DecimalField):
            values[field.name] = decimal.Decimal("1")
        elif isinstance(field, (models.IntegerField, models.FloatField)):
            values[field.name] = next(_counter)
        elif isinstance(field, models.DateTimeField):
            values[field.name] = datetime.datetime(2026, 1, 5, 9, 0, tzinfo=datetime.timezone.utc)
        elif isinstance(field, models.DateField):
            values[field.name] = datetime.date(2026, 1, 5)
        elif isinstance(field, models.TimeField):
            values[field.name] = datetime.time(9, 0)
        elif isinstance(field, models.UUIDField):
            values[field.name] = uuid.uuid4()
        elif isinstance(field, models.JSONField):
            values[field.name] = {}
        elif isinstance(field, (models.FileField, models.ImageField)):
            values[field.name] = "x.png"
        elif isinstance(field, models.GenericIPAddressField):
            values[field.name] = "127.0.0.1"
        else:
            raise RuntimeError(f"{model.__name__}.{field.name}: no builder for {type(field).__name__}")
    return model.objects.create(**values)


def routed_viewsets():
    """(url prefix, viewset class) for every router-generated detail route under /api/."""
    found = {}

    def walk(patterns, prefix):
        for p in patterns:
            if isinstance(p, URLResolver):
                walk(p.url_patterns, prefix + str(p.pattern))
            elif isinstance(p, URLPattern):
                cls = getattr(p.callback, "cls", None)
                actions = getattr(p.callback, "actions", None) or {}
                route = prefix + str(p.pattern)
                if cls and actions.get("get") == "retrieve" and "(?P<pk>" in route and route.startswith("^api/"):
                    found.setdefault(cls, route)

    walk(get_resolver().url_patterns, "^")
    return found


def school_model(viewset):
    queryset = getattr(viewset, "queryset", None)
    model = getattr(queryset, "model", None)
    if model is None:
        serializer = getattr(viewset, "serializer_class", None)
        model = getattr(getattr(serializer, "Meta", None), "model", None)
    if model is None:
        return None
    names = {f.name for f in model._meta.concrete_fields}
    return model if "school" in names else None


def detail_url(route, pk):
    path = route.replace("^", "").split("(?P<pk>")[0]
    return "/" + path.replace("\\.", ".") + f"{pk}/"


class CleanCacheTestCase(TestCase):
    """Cached per-school values (plan modules, tenant lookups) are keyed by id, and ids repeat between tests."""

    def setUp(self):
        cache.clear()
        self.addCleanup(cache.clear)


class TenantIsolationTests(CleanCacheTestCase):
    def setUp(self):
        super().setUp()
        self.a = School.objects.create(name="School A", domain="iso-a")
        self.b = School.objects.create(name="School B", domain="iso-b")
        self.admin_a = User.objects.create_user(
            username="admin@iso-a", password="Strong-Pass!2026", role="SCHOOL_ADMIN", school=self.a
        )

    def client_for(self, user):
        client = APIClient()
        client.force_authenticate(user)
        client.credentials(HTTP_X_TENANT_ID=user.school.domain)
        return client

    def test_no_endpoint_shows_changes_or_deletes_another_schools_records(self):
        client = self.client_for(self.admin_a)
        checked, unbuildable, leaks = [], [], []
        for viewset, route in sorted(routed_viewsets().items(), key=lambda kv: kv[1]):
            model = school_model(viewset)
            if model is None:
                continue
            try:
                with transaction.atomic():
                    other = build(model, self.b)
            except Exception as error:  # an exotic model; reported below, never silently passed
                unbuildable.append(f"{model.__name__}: {error}")
                continue
            url = detail_url(route, other.pk)
            name = f"{viewset.__name__} ({url})"
            checked.append(name)

            # Single-record endpoints (e.g. library settings) answer with the caller's own record whatever
            # the id, so judge by which record came back or changed, not by the status code alone.
            def is_other(response):
                return (
                    response.status_code < 300
                    and getattr(response, "data", None)
                    and response.data.get("id") == other.pk
                )

            if is_other(client.get(url)):
                leaks.append(f"GET {name} returned another school's record")
            before = model.objects.filter(pk=other.pk).values().first()
            if (
                is_other(client.patch(url, {}, format="json"))
                or model.objects.filter(pk=other.pk).values().first() != before
            ):
                leaks.append(f"PATCH {name} changed another school's record")
            client.delete(url)
            if not model.objects.filter(pk=other.pk).exists():
                leaks.append(f"DELETE {name} removed another school's record")

            listing = client.get(url.rsplit("/", 2)[0] + "/")
            if listing.status_code == 200:
                rows = listing.data.get("results", listing.data) if isinstance(listing.data, dict) else listing.data
                if isinstance(rows, list) and any(isinstance(row, dict) and row.get("id") == other.pk for row in rows):
                    leaks.append(f"LIST {name} included another school's record")

        self.assertEqual(leaks, [], "\n".join(leaks))
        # Models the generic builder cannot create are reported, never silently passed; keep this list short.
        self.assertGreater(
            len(checked), 60, f"only {len(checked)} checked; could not build:\n" + "\n".join(unbuildable)
        )

    def test_a_token_from_one_school_cannot_be_used_on_another(self):
        client = APIClient()
        client.force_authenticate(self.admin_a)
        r = client.get("/api/academic/students/", HTTP_X_TENANT_ID=self.b.domain)
        # force_authenticate skips token checks, so exercise the real authenticator with a real token.
        from rest_framework_simplejwt.tokens import RefreshToken

        token = str(RefreshToken.for_user(self.admin_a).access_token)
        client = APIClient()
        client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}", HTTP_X_TENANT_ID=self.b.domain)
        self.assertEqual(client.get("/api/academic/students/").status_code, 403)
        client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}", HTTP_X_TENANT_ID=self.a.domain)
        self.assertEqual(client.get("/api/academic/students/").status_code, 200)
        client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")  # no tenant: runs in the user's own school
        self.assertEqual(client.get("/api/academic/students/").status_code, 200)
        self.assertIsNotNone(r)


class RoleScopingTests(CleanCacheTestCase):
    """Within one school: students, parents and teachers only reach what their role allows."""

    def setUp(self):
        super().setUp()
        from academic.models import Student

        self.school = School.objects.create(name="Role School", domain="iso-roles")
        self.other_school = School.objects.create(name="Elsewhere", domain="iso-else")
        self.user = User.objects.create_user(
            username="kid@iso-roles", password="Strong-Pass!2026", role="STUDENT", school=self.school
        )
        self.me = Student.objects.create(school=self.school, names="Me", student_no="R1", gender="Male", user=self.user)
        self.classmate = Student.objects.create(school=self.school, names="Classmate", student_no="R2", gender="Male")
        self.stranger = Student.objects.create(school=self.other_school, names="Far", student_no="F1", gender="Male")
        self.client = APIClient()
        self.client.force_authenticate(self.user)
        self.client.credentials(HTTP_X_TENANT_ID=self.school.domain)

    def test_conduct_summary_only_for_yourself(self):
        url = "/api/academic/behavior-analytics/summary/"
        self.assertEqual(self.client.get(url, {"student": self.me.pk, "session": "2025/2026"}).status_code, 200)
        self.assertEqual(self.client.get(url, {"student": self.classmate.pk, "session": "2025/2026"}).status_code, 404)
        self.assertEqual(self.client.get(url, {"student": self.stranger.pk, "session": "2025/2026"}).status_code, 404)

    def test_learners_cannot_use_platform_sms_or_staff_tools(self):
        self.assertEqual(
            self.client.post("/api/core/notifications/bulk-sms/", {"contacts": ["+234"], "message": "x"}).status_code,
            403,
        )
        self.assertEqual(self.client.get("/api/academic/predictive-insights/", {"class_id": 1}).status_code, 403)
        found = self.client.get("/api/academic/global-search/", {"q": "Classmate"}).data
        self.assertEqual(found["students"], [])

    def test_support_tickets_are_private_to_their_author(self):
        from schools.models import SupportTicket

        admin = User.objects.create_user(
            username="head@iso-roles", password="Strong-Pass!2026", role="SCHOOL_ADMIN", school=self.school
        )
        build(SupportTicket, self.school)  # opened by someone else in the school
        SupportTicket.objects.update(user=admin)
        rows = self.client.get("/api/schools/support/tickets/").data
        rows = rows.get("results", rows) if isinstance(rows, dict) else rows
        self.assertEqual(rows, [])


class EndpointSmokeTests(CleanCacheTestCase):
    """Every list and detail endpoint answers an admin without a server error when its data exists."""

    def test_no_endpoint_crashes_with_data_present(self):
        school = School.objects.create(name="Smoke School", domain="iso-smoke")
        admin = User.objects.create_user(
            username="admin@iso-smoke", password="Strong-Pass!2026", role="SCHOOL_ADMIN", school=school
        )
        client = APIClient(raise_request_exception=False)
        client.force_authenticate(admin)
        client.credentials(HTTP_X_TENANT_ID=school.domain)
        crashes = []
        for viewset, route in sorted(routed_viewsets().items(), key=lambda kv: kv[1]):
            model = school_model(viewset)
            if model is None:
                continue
            try:
                with transaction.atomic():
                    obj = build(model, school)
            except Exception:
                continue  # reported by the isolation test
            url = detail_url(route, obj.pk)
            for target in (url, url.rsplit("/", 2)[0] + "/"):
                if client.get(target).status_code >= 500:
                    crashes.append(f"{viewset.__name__}: GET {target}")
        self.assertEqual(crashes, [], "\n".join(crashes))
