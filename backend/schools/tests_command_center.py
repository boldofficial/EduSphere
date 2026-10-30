"""Super admin command center: real numbers and a queue of what needs doing."""

from datetime import timedelta
from decimal import Decimal

from django.test import TestCase
from django.utils import timezone
from rest_framework.test import APIClient

from users.models import User

from .models import DemoRequest, School, SchoolPayment, Subscription, SubscriptionPlan, SupportTicket


class CommandCenterTests(TestCase):
    def setUp(self):
        now = timezone.now()
        self.monthly = SubscriptionPlan.objects.create(name="Standard", slug="cc-standard", price=30000)
        self.yearly = SubscriptionPlan.objects.create(name="Yearly", slug="cc-yearly", price=365000, duration_days=365)
        self.paying = School.objects.create(name="Paying School", domain="cc-paying")
        self.waiting = School.objects.create(name="Waiting School", domain="cc-waiting")
        self.lapsed = School.objects.create(name="Lapsed School", domain="cc-lapsed")
        School.objects.create(name="Planless School", domain="cc-planless")
        Subscription.objects.create(
            school=self.paying, plan=self.monthly, status="active", end_date=now + timedelta(days=5), auto_renew=False
        )
        Subscription.objects.create(
            school=self.waiting, plan=self.yearly, status="pending", end_date=now + timedelta(days=365)
        )
        Subscription.objects.create(
            school=self.lapsed, plan=self.yearly, status="active", end_date=now - timedelta(days=3)
        )
        SchoolPayment.objects.create(school=self.paying, amount=30000, reference="cc-1", status="success")
        self.owner = User.objects.create_user(
            username="owner@platform", password="Strong-Pass!2026", role="SUPER_ADMIN"
        )
        head = User.objects.create_user(
            username="head@cc", password="Strong-Pass!2026", role="SCHOOL_ADMIN", school=self.paying
        )
        SupportTicket.objects.create(
            school=self.paying, user=head, subject="Cannot print results", priority="urgent", description="..."
        )
        DemoRequest.objects.create(name="Mr Bello", email="bello@example.com", school_name="Bright Future")
        self.client = APIClient()
        self.client.force_authenticate(self.owner)

    def test_numbers_and_queue(self):
        data = self.client.get("/api/schools/command-center/").data
        kpis = data["kpis"]
        self.assertEqual(kpis["schools"]["total"], 4)
        # The lapsed subscription is past its end date, so only one is really active.
        self.assertEqual(kpis["schools"]["active"], 1)
        self.assertEqual(kpis["mrr"], 30000.0)
        self.assertEqual(kpis["revenue"]["this_month"], 30000.0)

        queue = {item["key"]: item for item in data["attention"]}
        self.assertEqual(
            set(queue),
            {
                "subscriptions_pending",
                "tickets_urgent",
                "subscriptions_overdue",
                "subscriptions_ending",
                "demos_pending",
                "schools_without_plan",
            },
        )
        self.assertEqual(data["attention"][0]["severity"], "critical")
        self.assertEqual(queue["subscriptions_pending"]["items"][0]["label"], "Waiting School")
        self.assertEqual(queue["subscriptions_overdue"]["items"][0]["label"], "Lapsed School")

        self.assertEqual([r["school"] for r in data["renewals"]], ["Paying School"])
        self.assertEqual(len(data["trends"]), 12)
        self.assertEqual(data["trends"][-1]["revenue"], 30000.0)
        yearly = next(p for p in data["plans"] if p["name"] == "Yearly")
        self.assertEqual(yearly["schools"], 0)
        self.assertEqual(Decimal(str(next(p for p in data["plans"] if p["name"] == "Standard")["mrr"])), 30000)

    def test_activity_leaves_out_request_noise(self):
        from core.models import GlobalActivityLog

        GlobalActivityLog.objects.create(action="RECORDS_MUTATED", description="POST request to /api/x/")
        GlobalActivityLog.objects.create(action="SCHOOL_SIGNUP", description="Bright Future signed up")
        data = self.client.get("/api/schools/command-center/").data
        self.assertEqual([a["description"] for a in data["activity"]], ["Bright Future signed up"])

    def test_school_admins_cannot_see_it(self):
        head = User.objects.get(username="head@cc")
        self.client.force_authenticate(head)
        self.assertEqual(self.client.get("/api/schools/command-center/").status_code, 403)
