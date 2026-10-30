"""Academic calendar: sessions and terms, the current term, dates and school days."""

from datetime import date, datetime

from django.test import TestCase
from django.utils import timezone
from rest_framework.test import APIClient

from academic.calendar import CalendarError, parse_session, school_days
from academic.models import AcademicSession, AcademicTerm, SchoolEvent
from schools.models import School, SchoolSettings
from users.models import User


class CalendarTests(TestCase):
    def setUp(self):
        self.school = School.objects.create(name="Calendar School", domain="calendar")
        SchoolSettings.objects.create(school=self.school, current_session="2025/26", current_term="Second Term")
        self.admin = User.objects.create_user(
            username="head@calendar", password="Strong-Pass!2026", role="SCHOOL_ADMIN", school=self.school
        )
        self.teacher = User.objects.create_user(
            username="teacher@calendar", password="Strong-Pass!2026", role="TEACHER", school=self.school
        )
        self.client = self.client_for(self.admin)

    def client_for(self, user):
        client = APIClient()
        client.force_authenticate(user)
        client.credentials(HTTP_X_TENANT_ID=self.school.domain)
        return client

    def calendar(self):
        return self.client.get("/api/academic/calendar/").data

    def test_session_names(self):
        self.assertEqual(parse_session("2025/2026"), (2025, "2025/2026"))
        self.assertEqual(parse_session("2025-26")[1], "2025/2026")
        for bad in ("2025", "2025/2027", "twenty"):
            with self.assertRaises(CalendarError):
                parse_session(bad)

    def test_existing_school_gets_a_calendar(self):
        # An old term row with a guessed date is kept and linked.
        AcademicTerm.objects.create(
            school=self.school, session="2025/2026", name="Second Term", start_date=date(2026, 1, 5), is_current=True
        )
        data = self.calendar()
        self.assertEqual(data["current"]["session"], "2025/2026")
        self.assertEqual(data["current"]["term"], "Second Term")
        terms = data["sessions"][0]["terms"]
        self.assertEqual([t["status"] for t in terms], ["closed", "active", "upcoming"])
        self.assertEqual(terms[1]["start_date"], "2026-01-05")
        self.assertEqual(AcademicTerm.objects.filter(school=self.school).count(), 3)
        # The mistyped session in settings is now the canonical name.
        self.assertEqual(SchoolSettings.objects.get(school=self.school).current_session, "2025/2026")

    def test_dates_school_days_and_next_term(self):
        self.calendar()
        second = AcademicTerm.objects.get(school=self.school, name="Second Term")
        third = AcademicTerm.objects.get(school=self.school, name="Third Term")
        # Mon 5 Jan - Fri 30 Jan 2026 = 20 weekdays; mid-term Mon 19 - Tue 20 Jan; one holiday on Fri 9 Jan.
        response = self.client.patch(
            f"/api/academic/calendar/terms/{second.pk}/",
            {
                "start_date": "2026-01-05",
                "end_date": "2026-01-30",
                "mid_term_start": "2026-01-19",
                "mid_term_end": "2026-01-20",
            },
            format="json",
        )
        self.assertEqual(response.status_code, 200, response.data)
        SchoolEvent.objects.create(
            school=self.school,
            title="Public holiday",
            event_type="holiday",
            start_date=timezone.make_aware(datetime(2026, 1, 9, 9)),
        )
        second.refresh_from_db()
        self.assertEqual(school_days(second), 17)

        self.client.patch(f"/api/academic/calendar/terms/{third.pk}/", {"start_date": "2026-04-20"}, format="json")
        self.assertEqual(SchoolSettings.objects.get(school=self.school).next_term_begins, date(2026, 4, 20))

        overlap = self.client.patch(
            f"/api/academic/calendar/terms/{third.pk}/", {"start_date": "2026-01-25"}, format="json"
        )
        self.assertEqual(overlap.status_code, 400)
        self.assertIn("must start after Second Term ends", overlap.data["detail"])

    def test_new_session_copies_dates_and_start_term(self):
        self.calendar()
        second = AcademicTerm.objects.get(school=self.school, name="Second Term")
        self.client.patch(
            f"/api/academic/calendar/terms/{second.pk}/",
            {"start_date": "2026-01-05", "end_date": "2026-04-02"},
            format="json",
        )
        created = self.client.post("/api/academic/calendar/", {}, format="json")
        self.assertEqual(created.status_code, 201, created.data)
        self.assertEqual(created.data["name"], "2026/2027")
        self.assertEqual(created.data["terms"][1]["start_date"], "2027-01-05")
        self.assertEqual(self.client.post("/api/academic/calendar/", {"name": "2026/27"}).status_code, 400)

        third = AcademicTerm.objects.get(school=self.school, session="2025/2026", name="Third Term")
        self.assertEqual(self.client.post(f"/api/academic/calendar/terms/{third.pk}/start/").status_code, 200)
        settings = SchoolSettings.objects.get(school=self.school)
        self.assertEqual((settings.current_session, settings.current_term), ("2025/2026", "Third Term"))
        second.refresh_from_db()
        self.assertEqual(second.status, "closed")
        self.assertFalse(second.is_current)
        self.assertEqual(self.client.post(f"/api/academic/calendar/terms/{second.pk}/start/").status_code, 400)

        # An unused session can be removed; one that has started cannot.
        new = AcademicSession.objects.get(school=self.school, name="2026/2027")
        self.assertEqual(self.client.delete(f"/api/academic/calendar/sessions/{new.pk}/").status_code, 204)
        old = AcademicSession.objects.get(school=self.school, name="2025/2026")
        self.assertEqual(self.client.delete(f"/api/academic/calendar/sessions/{old.pk}/").status_code, 400)

    def test_only_admins_change_it_and_settings_cannot_retype_it(self):
        self.calendar()
        term = AcademicTerm.objects.get(school=self.school, name="Third Term")
        teacher = self.client_for(self.teacher)
        self.assertEqual(teacher.get("/api/academic/calendar/").status_code, 200)
        self.assertEqual(teacher.post(f"/api/academic/calendar/terms/{term.pk}/start/").status_code, 403)
        self.assertEqual(teacher.post("/api/academic/calendar/", {}).status_code, 403)

        self.client.put(
            "/api/core/settings/", {"current_session": "2030/31", "current_term": "First Term"}, format="json"
        )
        settings = SchoolSettings.objects.get(school=self.school)
        self.assertEqual((settings.current_session, settings.current_term), ("2025/2026", "Second Term"))

    def test_other_schools_terms_are_out_of_reach(self):
        other = School.objects.create(name="Other", domain="other")
        SchoolSettings.objects.create(school=other)
        self.calendar()
        other_admin = User.objects.create_user(
            username="head@other", password="Strong-Pass!2026", role="SCHOOL_ADMIN", school=other
        )
        mine = AcademicTerm.objects.get(school=self.school, name="Third Term")
        client = APIClient()
        client.force_authenticate(other_admin)
        client.credentials(HTTP_X_TENANT_ID=other.domain)
        self.assertEqual(client.post(f"/api/academic/calendar/terms/{mine.pk}/start/").status_code, 404)
        self.assertEqual(client.patch(f"/api/academic/calendar/terms/{mine.pk}/", {}).status_code, 404)
