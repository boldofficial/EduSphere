"""
Public Views

Public-facing views that require no authentication:
- PublicPlanListView
- VerifySchoolSlugView
- RegisterSchoolView
"""

import logging

from django.contrib.auth import get_user_model
from django.db import transaction
from django.utils import timezone
from rest_framework.exceptions import ValidationError
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from core.models import GlobalActivityLog
from core.tenant_utils import get_request_school

from .models import School, SchoolPaymentConfig, Subscription, SubscriptionPlan
from .serializers import RegisterSchoolSerializer, SchoolPaymentConfigPublicSerializer, SubscriptionPlanSerializer

User = get_user_model()
logger = logging.getLogger(__name__)


class PublicPlanListView(APIView):
    """List all active subscription plans (public access)."""

    permission_classes = [AllowAny]
    throttle_classes = []  # Disable throttling for public endpoint

    def get(self, request):
        # Priced tiers by price, custom-priced (Enterprise) last.
        plans = SubscriptionPlan.objects.filter(is_active=True).order_by("is_custom_price", "price")
        serializer = SubscriptionPlanSerializer(plans, many=True)
        return Response(serializer.data)


class VerifySchoolSlugView(APIView):
    """Check if a school slug exists (public access)."""

    permission_classes = [AllowAny]
    throttle_classes = []  # Disable throttling for public endpoint

    def get(self, request, slug):
        from django.db.models import Q

        school = School.objects.filter(Q(domain=slug) | Q(custom_domain=slug)).first()
        if school:
            return Response(
                {"exists": True, "name": school.name, "slug": school.domain, "custom_domain": school.custom_domain}
            )
        return Response({"exists": False}, status=404)


class PublicSchoolPaymentOptionsView(APIView):
    """Public/sanitized payment options for a tenant."""

    permission_classes = [AllowAny]
    throttle_classes = []  # Disable throttling for public endpoint

    def get(self, request):
        school = get_request_school(request, allow_super_admin_tenant=True)
        if not school:
            return Response({"detail": "School not found for this request context."}, status=404)

        config, _ = SchoolPaymentConfig.objects.get_or_create(school=school)
        serializer = SchoolPaymentConfigPublicSerializer(config)
        return Response(serializer.data)


class RegisterSchoolView(APIView):
    """Register a new school (public access)."""

    permission_classes = [AllowAny]
    throttle_classes = []  # Disable throttling for public endpoint

    def post(self, request):
        logger.info("School registration request received.")
        serializer = RegisterSchoolSerializer(data=request.data)
        if not serializer.is_valid():
            logger.error(f"Registration validation failed: {serializer.errors}")
            return Response({"error": "Validation failed", "details": serializer.errors}, status=400)

        data = serializer.validated_data

        # Check domain uniqueness
        if School.objects.filter(domain=data["domain"]).exists():
            raise ValidationError({"domain": "This domain is already taken"})

        # Check email uniqueness
        if User.objects.filter(email=data["email"]).exists():
            raise ValidationError({"email": "This email is already registered"})

        try:
            with transaction.atomic():
                # 1. Create School
                school = School.objects.create(
                    name=data["school_name"],
                    domain=data["domain"],
                    phone=data.get("phone"),
                    email=data.get("school_email"),
                    address=data.get("address"),
                    contact_person=data.get("contact_person"),
                )

                # 2. Create School Admin User
                admin_user = User.objects.create_user(
                    username=data["email"],
                    email=data["email"],
                    password=data["password"],
                    role="SCHOOL_ADMIN",
                    school=school,
                )

                # 3. Every school starts on Free. A paid plan is activated by a super admin once
                # payment is confirmed; the plan they picked is recorded in the notification below.
                plan = SubscriptionPlan.objects.filter(slug="free", is_active=True).first()
                if not plan:
                    raise ValidationError({"plan_slug": "Free plan is not configured. Please contact support."})
                requested = SubscriptionPlan.objects.filter(slug=data.get("plan_slug"), is_active=True).first()

                Subscription.objects.create(
                    school=school,
                    plan=plan,
                    status="active",
                    payment_method="bank_transfer",
                    payment_proof=None,
                    end_date=timezone.now() + timezone.timedelta(days=plan.duration_days),
                )

                # 4. Notify Super Admins
                from core.models import Notification

                super_admins = User.objects.filter(role="SUPER_ADMIN")
                for sa in super_admins:
                    Notification.objects.create(
                        user=sa,
                        school=school,
                        title="New School Registration",
                        message=(
                            f"School '{school.name}' has registered on Free."
                            + (f" Requested plan: {requested.name}." if requested and requested.slug != "free" else "")
                        ),
                        category="system",
                        link="/super-admin/schools",
                    )

                # 5. Log the event
                GlobalActivityLog.objects.create(
                    action="SCHOOL_SIGNUP",
                    school=school,
                    user=admin_user,
                    description=f"New school '{school.name}' registered (Status: ACTIVE) with plan '{plan.name}'",
                )

            logger.info(f"New school registered: '{school.name}' by {data['email']}")

            return Response({"success": True, "school_id": school.id}, status=201)

        except ValidationError:
            raise
        except Exception as e:
            logger.exception(f"School registration failed: {e}")
            raise ValidationError({"detail": "Registration failed. Please try again."})


from .serializers import DemoRequestSerializer


class DemoRequestViewSet(APIView):
    """
    Handle demo requests from the landing page.
    Public access for creation.
    """

    permission_classes = [AllowAny]
    throttle_classes = []  # Disable throttling for public endpoint

    def post(self, request):
        serializer = DemoRequestSerializer(data=request.data)
        if serializer.is_valid():
            demo_request = serializer.save()

            # TODO: Trigger notification to admin (email/in-app)
            # For now, just log it
            logger.info(f"New Demo Request: {demo_request}")

            return Response({"success": True, "message": "Request submitted successfully"}, status=201)
        return Response(serializer.errors, status=400)
