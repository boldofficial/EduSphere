"""
Public Views

Public-facing views that require no authentication:
- PublicPlanListView
- VerifySchoolSlugView
- RegisterSchoolView
"""

from django.db import transaction
from django.contrib.auth import get_user_model
from django.utils import timezone
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from rest_framework.exceptions import ValidationError
from .models import SubscriptionPlan, School, Subscription
from .serializers import SubscriptionPlanSerializer, RegisterSchoolSerializer
from core.models import GlobalActivityLog
import logging

User = get_user_model()
logger = logging.getLogger(__name__)


class PublicPlanListView(APIView):
    """List all active subscription plans (public access)."""
    permission_classes = [AllowAny]

    def get(self, request):
        plans = SubscriptionPlan.objects.filter(is_active=True).order_by('price')
        serializer = SubscriptionPlanSerializer(plans, many=True)
        return Response(serializer.data)


class VerifySchoolSlugView(APIView):
    """Check if a school slug exists (public access)."""
    permission_classes = [AllowAny]

    def get(self, request, slug):
        from django.db.models import Q
        school = School.objects.filter(Q(domain=slug) | Q(custom_domain=slug)).first()
        if school:
            return Response({
                'exists': True,
                'name': school.name,
                'slug': school.domain,
                'custom_domain': school.custom_domain
            })
        return Response({'exists': False}, status=404)


class RegisterSchoolView(APIView):
    """Register a new school (public access)."""
    permission_classes = [AllowAny]

    def post(self, request):
        print(f"!!! Hits RegisterSchoolView POST: {request.data.get('email')}")
        serializer = RegisterSchoolSerializer(data=request.data)
        if not serializer.is_valid():
            logger.error(f"Registration validation failed: {serializer.errors}")
            return Response({'error': 'Validation failed', 'details': serializer.errors}, status=400)
        
        data = serializer.validated_data
        
        # Check domain uniqueness
        if School.objects.filter(domain=data['domain']).exists():
            raise ValidationError({'domain': 'This domain is already taken'})
        
        # Check email uniqueness
        if User.objects.filter(email=data['email']).exists():
            raise ValidationError({'email': 'This email is already registered'})

        try:
            with transaction.atomic():
                # 1. Create School
                school = School.objects.create(
                    name=data['school_name'],
                    domain=data['domain'],
                    phone=data.get('phone'),
                    email=data.get('school_email'),
                    address=data.get('address'),
                    contact_person=data.get('contact_person')
                )

                # 2. Create School Admin User
                admin_user = User.objects.create_user(
                    username=data['email'],
                    email=data['email'],
                    password=data['password'],
                    role='SCHOOL_ADMIN',
                    school=school
                )
                
                # 3. Create Subscription
                try:
                    plan = SubscriptionPlan.objects.get(slug=data['plan_slug'])
                except SubscriptionPlan.DoesNotExist:
                    raise ValidationError({'plan_slug': 'Invalid plan selected'})
                
                Subscription.objects.create(
                    school=school,
                    plan=plan,
                    status='pending', # Default to pending until super admin approval
                    payment_method=data.get('payment_method', 'paystack'),
                    payment_proof=data.get('payment_proof'),
                    end_date=timezone.now() + timezone.timedelta(days=plan.duration_days)
                )

                # 4. Notify Super Admins
                from core.models import Notification
                super_admins = User.objects.filter(role='SUPER_ADMIN')
                for sa in super_admins:
                    Notification.objects.create(
                        user=sa,
                        school=school,
                        title="New School Registration",
                        message=f"School '{school.name}' has registered and is pending approval.",
                        category='system',
                        link=f"/super-admin/schools" # Assuming this is the frontend route
                    )

                # 5. Log the event
                GlobalActivityLog.objects.create(
                    action='SCHOOL_SIGNUP',
                    school=school,
                    user=admin_user,
                    description=f"New school '{school.name}' registered (Status: PENDING) with plan '{plan.name}'"
                )

            logger.info(f"New school registered: '{school.name}' by {data['email']}")
            return Response({'success': True, 'school_id': school.id}, status=201)

        except ValidationError:
            raise
        except Exception as e:
            logger.exception(f"School registration failed: {e}")
            raise ValidationError({'detail': 'Registration failed. Please try again.'})
