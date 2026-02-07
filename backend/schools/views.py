from django.db import transaction
from django.contrib.auth import get_user_model
from django.utils import timezone
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.exceptions import PermissionDenied, NotFound, ValidationError
from .models import SubscriptionPlan, School, Subscription, SchoolPayment, PlatformModule
from .serializers import SubscriptionPlanSerializer, SchoolSerializer, RegisterSchoolSerializer
from core.models import GlobalActivityLog, PlatformAnnouncement
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
    permission_classes = [AllowAny]

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


class SystemHealthView(APIView):
    """
    Infrastructure health monitoring and global platform statistics.
    Super Admin only.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if request.user.role != 'SUPER_ADMIN':
            raise PermissionDenied('Only Super Admins can access this resource')

        # 1. Platform Statistics (Cross-Tenant)
        from schools.models import School
        from academic.models import Student, Teacher, Class
        from django.db import connection

        platform_stats = {
            'total_schools': School.objects.count(),
            'total_students': Student.objects.count(),
            'total_teachers': Teacher.objects.count(),
            'total_classes': Class.objects.count(),
        }

        # 2. Redis Connection Check
        redis_status = 'disconnected'
        try:
            from django.core.cache import cache
            from django_redis import get_redis_connection
            # Try to get a genuine redis connection if possible, otherwise check if cache is redis
            # We check if 'default' cache backend is 'django_redis.cache.RedisCache'
            from django.conf import settings
            cache_backend = settings.CACHES.get('default', {}).get('BACKEND', '')
            
            if 'Redis' in cache_backend:
                cache.set('__health_check__', 'ok', timeout=5)
                if cache.get('__health_check__') == 'ok':
                    redis_status = 'connected'
            else:
                redis_status = 'not_configured (using LocMem)'
        except Exception as e:
            logger.warning(f"Health check: Redis disconnected: {e}")
            redis_status = 'disconnected'

        # 3. Celery Worker Check
        celery_status = 'offline'
        try:
            from config.celery import app as celery_app
            insp = celery_app.control.inspect()
            stats = insp.stats()
            if stats:
                celery_status = 'active'
                # Optional: count active workers
                # worker_count = len(stats)
            else:
                # Check if it responds to ping
                pings = celery_app.control.ping(timeout=0.5)
                if pings:
                    celery_status = 'active'
        except Exception as e:
            logger.warning(f"Health check: Celery offline: {e}")
            celery_status = 'offline'

        # 4. Database Latency
        import time
        db_start = time.time()
        with connection.cursor() as cursor:
            cursor.execute("SELECT 1")
        db_latency = f"{round((time.time() - db_start) * 1000, 2)}ms"

        return Response({
            'status': 'healthy' if redis_status != 'disconnected' and celery_status != 'offline' else 'partially_degraded',
            'redis_status': redis_status,
            'celery_status': celery_status,
            'db_latency': db_latency,
            'platform_stats': platform_stats,
            'timestamp': timezone.now()
        })


class StrategicAnalyticsView(APIView):
    """
    Time-series analytics for registrations and revenue.
    Super Admin only.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if request.user.role != 'SUPER_ADMIN':
            raise PermissionDenied('Only Super Admins can access this resource')

        from django.db.models import Count, Sum
        from django.db.models.functions import TruncMonth
        from schools.models import School, SchoolPayment, SubscriptionPlan
        from datetime import timedelta

        # Get last 12 months range
        last_year = timezone.now() - timedelta(days=365)

        # 1. School Registration Trends (Monthly)
        registration_trends = School.objects.filter(
            created_at__gte=last_year
        ).annotate(
            month=TruncMonth('created_at')
        ).values('month').annotate(
            count=Count('id')
        ).order_by('month')

        # 2. Revenue Trends (Monthly)
        revenue_trends = SchoolPayment.objects.filter(
            status='success',
            date__gte=last_year
        ).annotate(
            month=TruncMonth('date')
        ).values('month').annotate(
            amount=Sum('amount')
        ).order_by('month')

        # 3. Plan Distribution
        plan_distribution = SubscriptionPlan.objects.annotate(
            school_count=Count('subscription')
        ).values('name', 'school_count')

        # Format trends for frontend
        def format_trend(query_set, value_field):
            data = []
            for item in query_set:
                data.append({
                    'name': item['month'].strftime('%b %Y'),
                    'value': float(item[value_field]) if item[value_field] else 0
                })
            return data

        return Response({
            'registrations': format_trend(registration_trends, 'count'),
            'revenue': format_trend(revenue_trends, 'amount'),
            'plans': list(plan_distribution)
        })

class PlatformGovernanceView(APIView):
    """
    Platform Activity Logs and Announcements.
    Super Admin only.
    """
    permission_classes = [IsAuthenticated]

    def get_activities(self):
        logs = GlobalActivityLog.objects.select_related('school', 'user').all()[:50]
        return [{
            'id': log.id,
            'action': log.action,
            'school_name': log.school.name if log.school else 'Platform',
            'user_email': log.user.email if log.user else 'System',
            'description': log.description,
            'created_at': log.created_at
        } for log in logs]

    def get_announcements(self):
        announcements = PlatformAnnouncement.objects.all()
        return [{
            'id': ann.id,
            'title': ann.title,
            'message': ann.message,
            'priority': ann.priority,
            'is_active': ann.is_active,
            'created_at': ann.created_at
        } for ann in announcements]

    def get(self, request):
        if request.user.role != 'SUPER_ADMIN':
            raise PermissionDenied('Only Super Admins can access platform governance')

        return Response({
            'activities': self.get_activities(),
            'announcements': self.get_announcements()
        })

    def post(self, request):
        """Create a new announcement."""
        if request.user.role != 'SUPER_ADMIN':
            raise PermissionDenied('Only Super Admins can manage announcements')

        title = request.data.get('title')
        message = request.data.get('message')
        priority = request.data.get('priority', 'low')

        if not title or not message:
            raise ValidationError({'detail': 'Title and message are required'})

        announcement = PlatformAnnouncement.objects.create(
            title=title,
            message=message,
            priority=priority,
            created_by=request.user
        )

        return Response({
            'success': True,
            'id': announcement.id
        })

class GlobalSearchView(APIView):
    """
    Unified search across schools and logs.
    Super Admin only.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if request.user.role != 'SUPER_ADMIN':
            raise PermissionDenied('Only Super Admins can search across the platform')

        query = request.query_params.get('q', '')
        if not query:
            return Response({'schools': [], 'logs': []})

        from django.db.models import Q
        
        schools = School.objects.filter(
            Q(name__icontains=query) | Q(domain__icontains=query) | Q(email__icontains=query)
        )[:10]

        logs = GlobalActivityLog.objects.filter(
            Q(description__icontains=query) | Q(action__icontains=query)
        )[:10]

        return Response({
            'schools': [{
                'id': s.id,
                'name': s.name,
                'domain': s.domain,
                'status': s.subscription.status if hasattr(s, 'subscription') else 'unknown'
            } for s in schools],
            'logs': [{
                'id': l.id,
                'description': l.description,
                'action': l.action,
                'created_at': l.created_at
            } for l in logs]
        })

class MaintenanceModeView(APIView):
    """
    Toggle maintenance mode.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        if request.user.role != 'SUPER_ADMIN':
            raise PermissionDenied('Only Super Admins can toggle maintenance mode')

        # Logic for maintenance mode (could be file-based or cache-based)
        # For simplicity, we'll use a platform-wide setting if it existed,
        # but for this demo, we'll just mock the success.
        action = request.data.get('action')
        return Response({'success': True, 'mode': action})


class UserAnnouncementsView(APIView):
    """
    Active announcements for the current user's role.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        announcements = PlatformAnnouncement.objects.filter(
            is_active=True,
            target_role=request.user.role
        ).order_by('-created_at')

        return Response([{
            'id': ann.id,
            'title': ann.title,
            'message': ann.message,
            'priority': ann.priority,
            'created_at': ann.created_at
        } for ann in announcements])


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
                    status='pending',
                    payment_method=data.get('payment_method', 'paystack'),
                    payment_proof=data.get('payment_proof'),
                    end_date=timezone.now() + timezone.timedelta(days=plan.duration_days)
                )

                # 4. Log the event
                GlobalActivityLog.objects.create(
                    action='SCHOOL_SIGNUP',
                    school=school,
                    user=admin_user,
                    description=f"New school '{school.name}' registered with plan '{plan.name}'"
                )

            logger.info(f"New school registered: '{school.name}' by {data['email']}")
            return Response({'success': True, 'school_id': school.id}, status=201)

        except ValidationError:
            raise
        except Exception as e:
            logger.exception(f"School registration failed: {e}")
            raise ValidationError({'detail': 'Registration failed. Please try again.'})
