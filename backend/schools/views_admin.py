"""
Admin Views

Super Admin views for managing schools, plans, modules, and platform settings:
- SchoolManagementView
- SchoolRevenueView
- RecordPaymentView
- PlanManagementView
- PlatformSettingsView
- PlatformModulesView
- ModuleToggleView
"""

from django.db import transaction
from django.utils import timezone
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.exceptions import PermissionDenied, NotFound, ValidationError
from .models import SubscriptionPlan, School, Subscription, SchoolPayment, PlatformModule
from .serializers import SubscriptionPlanSerializer, SchoolSerializer
from core.models import GlobalActivityLog
import logging

logger = logging.getLogger(__name__)


class PlatformModulesView(APIView):
    """List all available modules on the platform."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        modules = PlatformModule.objects.all().order_by('id')
        return Response([{
            'id': m.module_id,
            'name': m.name,
            'description': m.description,
            'is_active': m.is_active
        } for m in modules])


class ModuleToggleView(APIView):
    """Toggle a module's global active state (Super Admin only)."""
    permission_classes = [IsAuthenticated]

    def post(self, request):
        if request.user.role != 'SUPER_ADMIN':
            raise PermissionDenied('Only Super Admins can toggle modules')
        
        module_id = request.data.get('module_id')
        action = request.data.get('action') # 'on' or 'off'
        
        if not module_id or not action:
            raise ValidationError({'detail': 'module_id and action are required'})
        
        try:
            mod = PlatformModule.objects.get(module_id=module_id)
            mod.is_active = (action == 'on')
            mod.save()
            
            # Log the change
            GlobalActivityLog.objects.create(
                action='MODULE_TOGGLED',
                user=request.user,
                description=f"Global module '{mod.name}' turned {action.upper()}"
            )
            
            return Response({'success': True, 'is_active': mod.is_active})
        except PlatformModule.DoesNotExist:
            raise NotFound('Module not found')


class SchoolManagementView(APIView):
    """Manage schools (Super Admin only)."""
    permission_classes = [IsAuthenticated]

    def check_super_admin(self, request):
        """Verify the user has super admin privileges."""
        if request.user.role != 'SUPER_ADMIN':
            raise PermissionDenied('Only Super Admins can access this resource')

    def get(self, request):
        """List all schools."""
        self.check_super_admin(request)
        schools = School.objects.all().order_by('-created_at')
        serializer = SchoolSerializer(schools, many=True)
        return Response(serializer.data)

    def delete(self, request, pk=None):
        """Delete a school by ID."""
        self.check_super_admin(request)
        
        if not pk:
            raise ValidationError({'detail': 'School ID is required'})
        
        try:
            school = School.objects.get(pk=pk)
            school_name = school.name
            school.delete()
            
            GlobalActivityLog.objects.create(
                action='SCHOOL_DELETED',
                user=request.user,
                description=f"Deleted school '{school_name}' (ID: {pk})"
            )
            
            logger.info(f"School '{school_name}' (ID: {pk}) deleted by {request.user.email}")
            return Response({'success': True})
        except School.DoesNotExist:
            raise NotFound('School not found')
            
    def patch(self, request, pk=None):
        """Update school subscription status (suspend/activate/approve)."""
        self.check_super_admin(request)
        
        if not pk:
            raise ValidationError({'detail': 'School ID is required'})
        
        try:
            school = School.objects.get(pk=pk)
        except School.DoesNotExist:
            raise NotFound('School not found')
        
        if not hasattr(school, 'subscription'):
            raise ValidationError({'detail': 'School has no subscription'})
        
        action = request.data.get('action')
        if not action:
            raise ValidationError({'detail': 'Action is required'})
        
        sub = school.subscription
        
        if action == 'suspend':
            sub.status = 'cancelled'
        elif action == 'activate':
            sub.status = 'active'
        elif action == 'approve':
            sub.status = 'active'
            sub.start_date = timezone.now()
            sub.end_date = timezone.now() + timezone.timedelta(days=sub.plan.duration_days)
        else:
            raise ValidationError({'detail': f'Unknown action: {action}'})
        
        sub.save()
        
        log_action = 'SCHOOL_SUSPENDED' if action == 'suspend' else 'SCHOOL_ACTIVATED'
        GlobalActivityLog.objects.create(
            action=log_action,
            school=school,
            user=request.user,
            description=f"{action.capitalize()}d school '{school.name}'"
        )
        
        logger.info(f"School '{school.name}' subscription {action}d by {request.user.email}")
        return Response({'success': True, 'status': sub.status})

    def put(self, request, pk=None):
        """Update full school details (Super Admin only)."""
        self.check_super_admin(request)
        if not pk:
            raise ValidationError({'detail': 'School ID is required'})
        
        try:
            school = School.objects.get(pk=pk)
        except School.DoesNotExist:
            raise NotFound('School not found')
        
        # Simple field update
        school.name = request.data.get('name', school.name)
        school.domain = request.data.get('domain', school.domain)
        school.custom_domain = request.data.get('custom_domain', school.custom_domain)
        school.email = request.data.get('email', school.email)
        school.phone = request.data.get('phone', school.phone)
        school.address = request.data.get('address', school.address)
        school.contact_person = request.data.get('contact_person', school.contact_person)
        school.save()

        # Manual Subscription Update
        plan_id = request.data.get('plan_id')
        sub_status = request.data.get('subscription_status')
        sub_end_date = request.data.get('subscription_end_date')

        if plan_id or sub_status or sub_end_date:
            logger.info(f"Subscription update triggered: plan_id={plan_id}, status={sub_status}, end_date={sub_end_date}")
            with transaction.atomic():
                sub, _ = Subscription.objects.get_or_create(
                    school=school,
                    defaults={'plan': SubscriptionPlan.objects.first(), 'end_date': timezone.now()}
                )
                
                if plan_id:
                    try:
                        plan = SubscriptionPlan.objects.get(pk=plan_id)
                        sub.plan = plan
                        logger.info(f"Updated plan to: {plan.name}")
                    except SubscriptionPlan.DoesNotExist:
                        logger.error(f"SubscriptionPlan with ID {plan_id} not found")
                
                if sub_status:
                    sub.status = sub_status
                
                if sub_end_date:
                    sub.end_date = sub_end_date
                
                sub.save()
                
                GlobalActivityLog.objects.create(
                    action='SUBSCRIPTION_UPDATED',
                    school=school,
                    user=request.user,
                    description=f"Manual subscription update for '{school.name}' by Super Admin. Plan: {sub.plan.name}, Status: {sub.status}, Expires: {sub.end_date}"
                )

        return Response({'success': True, 'data': SchoolSerializer(school).data})


class SchoolRevenueView(APIView):
    """Get revenue statistics (Super Admin only)."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if request.user.role != 'SUPER_ADMIN':
            raise PermissionDenied('Only Super Admins can access this resource')
        
        from django.db.models import Sum

        total_revenue = SchoolPayment.objects.filter(
            status='success'
        ).aggregate(Sum('amount'))['amount__sum'] or 0
        
        recent_payments = SchoolPayment.objects.filter(
            status='success'
        ).order_by('-date')[:5].values(
            'school__name', 'amount', 'date', 'reference'
        )
        
        return Response({
            'total_revenue': total_revenue,
            'recent_payments': list(recent_payments)
        })


class RecordPaymentView(APIView):
    """Record a manual payment for a school (Super Admin only)."""
    permission_classes = [IsAuthenticated]

    def post(self, request):
        if request.user.role != 'SUPER_ADMIN':
            raise PermissionDenied('Only Super Admins can access this resource')
        
        school_id = request.data.get('school_id')
        amount = request.data.get('amount')
        reference = request.data.get('reference')
        
        # Validate required fields
        if not school_id:
            raise ValidationError({'detail': 'school_id is required'})
        if not amount:
            raise ValidationError({'detail': 'amount is required'})
        if not reference:
            raise ValidationError({'detail': 'reference is required'})
        
        try:
            school = School.objects.get(pk=school_id)
        except School.DoesNotExist:
            raise NotFound('School not found')
        
        # Check for duplicate reference
        if SchoolPayment.objects.filter(reference=reference).exists():
            raise ValidationError({'detail': 'Payment reference already exists'})
        
        with transaction.atomic():
            # Record Payment
            payment = SchoolPayment.objects.create(
                school=school,
                amount=amount,
                reference=reference,
                status='success'
            )
            
            # Also update subscription end date if it was expired/pending
            if hasattr(school, 'subscription'):
                sub = school.subscription
                if sub.status != 'active':
                    sub.status = 'active'
                    sub.start_date = timezone.now()
                    sub.end_date = timezone.now() + timezone.timedelta(days=sub.plan.duration_days)
                    sub.save()

            GlobalActivityLog.objects.create(
                action='PAYMENT_RECORDED',
                school=school,
                user=request.user,
                description=f"Recorded payment of ₦{amount} for school '{school.name}' (Ref: {reference})"
            )
        
        logger.info(f"Payment recorded for '{school.name}': {amount} by {request.user.email}")
        return Response({'success': True})


class PlanManagementView(APIView):
    """Manage subscription plans (Super Admin only)."""
    permission_classes = [IsAuthenticated]

    def check_super_admin(self, request):
        """Verify the user has super admin privileges."""
        if request.user.role != 'SUPER_ADMIN':
            raise PermissionDenied('Only Super Admins can access this resource')

    def post(self, request):
        """Create a new subscription plan."""
        self.check_super_admin(request)
        serializer = SubscriptionPlanSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            logger.info(f"Plan '{serializer.data['name']}' created by {request.user.email}")
            return Response(serializer.data, status=201)
        raise ValidationError(serializer.errors)

    def put(self, request, pk=None):
        """Update an existing subscription plan."""
        self.check_super_admin(request)
        
        if not pk:
            raise ValidationError({'detail': 'Plan ID is required'})
        
        try:
            plan = SubscriptionPlan.objects.get(pk=pk)
        except SubscriptionPlan.DoesNotExist:
            raise NotFound('Plan not found')
        
        serializer = SubscriptionPlanSerializer(plan, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            logger.info(f"Plan '{plan.name}' updated by {request.user.email}")
            return Response(serializer.data)
        raise ValidationError(serializer.errors)
            
    def delete(self, request, pk=None):
        """Delete a subscription plan."""
        self.check_super_admin(request)
        
        if not pk:
            raise ValidationError({'detail': 'Plan ID is required'})
        
        try:
            plan = SubscriptionPlan.objects.get(pk=pk)
            plan_name = plan.name
            plan.delete()
            logger.info(f"Plan '{plan_name}' deleted by {request.user.email}")
            return Response({'success': True})
        except SubscriptionPlan.DoesNotExist:
            raise NotFound('Plan not found')


class PlatformSettingsView(APIView):
    """Manage global platform settings (Super Admin only)."""
    permission_classes = [IsAuthenticated]

    def get_settings(self):
        from .models import PlatformSettings
        settings, _ = PlatformSettings.objects.get_or_create(id=1)
        return settings

    def get(self, request):
        from .serializers import PlatformSettingsSerializer
        settings = self.get_settings()
        serializer = PlatformSettingsSerializer(settings)
        return Response(serializer.data)

    def put(self, request):
        if request.user.role != 'SUPER_ADMIN':
            raise PermissionDenied('Only Super Admins can update platform settings')
        
        from .serializers import PlatformSettingsSerializer
        settings = self.get_settings()
        serializer = PlatformSettingsSerializer(settings, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=400)


class AdminDemoRequestView(APIView):
    """Manage demo requests (Super Admin only)."""
    permission_classes = [IsAuthenticated]

    def check_super_admin(self, request):
        if request.user.role != 'SUPER_ADMIN':
            raise PermissionDenied('Only Super Admins can access this resource')

    def get(self, request):
        """List all demo requests."""
        from .models import DemoRequest
        from .serializers import DemoRequestSerializer
        
        self.check_super_admin(request)
        requests = DemoRequest.objects.all().order_by('-created_at')
        serializer = DemoRequestSerializer(requests, many=True)
        return Response(serializer.data)

    def post(self, request, pk=None):
        """Approve a demo request."""
        from .models import DemoRequest
        from emails.utils import send_template_email
        
        self.check_super_admin(request)
        
        if not pk:
            raise ValidationError({'detail': 'Request ID is required'})
            
        try:
            demo_req = DemoRequest.objects.get(pk=pk)
        except DemoRequest.DoesNotExist:
            raise NotFound('Demo request not found')
            
        if demo_req.status == 'approved':
            return Response({'message': 'Request already approved'}, status=200)
            
        # Approve and Send Email
        demo_req.status = 'approved'
        demo_req.approved_by = request.user
        demo_req.save()
        
        # Send Email
        context = {
            'name': demo_req.name,
            'school_name': demo_req.school_name,
            'login_url': "https://demo.myregistra.net/login",
            'password': "demo_pressure_2025"
        }
        
        email_sent = False
        if send_template_email:
            email_sent = send_template_email('demo-approved', demo_req.email, context)
            
        return Response({
            'success': True,
            'message': 'Request approved and email sent' if email_sent else 'Request approved but email failed',
            'email_sent': email_sent
        })
