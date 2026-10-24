"""Audit trail: changes are attributed to the signed-in user, readable, and visible only to the school's admins."""

from django.core.cache import cache
from django.test import TestCase
from rest_framework.test import APIClient
from rest_framework_simplejwt.tokens import RefreshToken

from academic.models import Class, Student
from core.audit import RECORD, current_actor
from core.models import FieldChangeLog
from schools.models import School
from users.models import User


class AuditTrailTests(TestCase):
    def setUp(self):
        cache.clear()
        self.addCleanup(cache.clear)
        self.school = School.objects.create(name="Audit School", domain="audit")
        self.jss1 = Class.objects.create(school=self.school, name="JSS 1")
        self.jss2 = Class.objects.create(school=self.school, name="JSS 2")
        self.admin = User.objects.create_user(
            username="head@audit",
            first_name="Grace",
            last_name="Bello",
            password="Strong-Pass!2026",
            role="SCHOOL_ADMIN",
            school=self.school,
        )
        self.student = Student.objects.create(
            school=self.school, names="Ada Obi", student_no="A1", gender="Female", current_class=self.jss1
        )

    def client_for(self, user, school=None):
        client = APIClient()
        token = str(RefreshToken.for_user(user).access_token)
        client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}", HTTP_X_TENANT_ID=(school or self.school).domain)
        return client

    def test_edits_are_attributed_and_readable(self):
        client = self.client_for(self.admin)
        r = client.patch(
            f"/api/academic/students/{self.student.pk}/",
            {"names": "Ada Obi-Okafor", "class_id": self.jss2.pk},
            format="json",
        )
        self.assertEqual(r.status_code, 200, r.data)

        rows = client.get("/api/core/audit-trail/", {"area": "Students"}).data["results"]
        by_field = {row["field"]: row for row in rows}
        self.assertEqual(by_field["Names"]["old"], "Ada Obi")
        self.assertEqual(by_field["Names"]["new"], "Ada Obi-Okafor")
        self.assertEqual(by_field["Names"]["user"]["name"], "Grace Bello")
        # Links show names, not database ids.
        self.assertEqual((by_field["Current class"]["old"], by_field["Current class"]["new"]), ("JSS 1", "JSS 2"))
        self.assertIn("Ada Obi-Okafor", by_field["Names"]["record"])
        self.assertIsNone(current_actor().get("user"))  # cleared after the request

        people = client.get("/api/core/audit-trail/people/").data
        self.assertEqual(people[0]["name"], "Grace Bello")

    def test_deletions_are_recorded(self):
        client = self.client_for(self.admin)
        self.assertEqual(client.delete(f"/api/academic/students/{self.student.pk}/").status_code, 204)
        row = FieldChangeLog.objects.get(action="DELETE", content_type="academic.student")
        self.assertEqual((row.field_name, row.user, row.school), (RECORD, self.admin, self.school))
        self.assertIn("Ada Obi", row.object_label)

    def test_only_this_schools_admins_can_read_it(self):
        self.client_for(self.admin).patch(f"/api/academic/students/{self.student.pk}/", {"names": "X"}, format="json")
        teacher = User.objects.create_user(
            username="t@audit", password="Strong-Pass!2026", role="TEACHER", school=self.school
        )
        self.assertEqual(self.client_for(teacher).get("/api/core/audit-trail/").status_code, 403)

        other = School.objects.create(name="Other", domain="audit-other")
        other_admin = User.objects.create_user(
            username="head@audit-other", password="Strong-Pass!2026", role="SCHOOL_ADMIN", school=other
        )
        self.assertEqual(self.client_for(other_admin, other).get("/api/core/audit-trail/").data["count"], 0)

    def test_changes_outside_a_request_have_no_user(self):
        self.student.names = "Changed By Script"
        self.student.save()
        self.assertIsNone(FieldChangeLog.objects.get(field_name="names").user)
