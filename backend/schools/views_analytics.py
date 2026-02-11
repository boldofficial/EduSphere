"""
Analytics & Monitoring Views

System health, strategic analytics, global search, and maintenance:
- SystemHealthView
- StrategicAnalyticsView
- GlobalSearchView
- MaintenanceModeView
"""

from django.utils import timezone
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.exceptions import PermissionDenied
from .models import School
from core.models import GlobalActivityLog
import logging

logger = logging.getLogger(__name__)


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
        redis_error = None
        try:
            from django.core.cache import cache
            from django.conf import settings
            cache_backend = settings.CACHES.get('default', {}).get('BACKEND', '')
            
            if 'Redis' in cache_backend:
                cache.set('__health_check__', 'ok', timeout=5)
                if cache.get('__health_check__') == 'ok':
                    redis_status = 'connected'
                else:
                    redis_status = 'degraded'
                    redis_error = "Cache set/get mismatch"
            else:
                redis_status = f'not_configured ({cache_backend})'
        except Exception as e:
            logger.warning(f"Health check: Redis disconnected: {e}")
            redis_status = 'disconnected'
            redis_error = str(e)

        # 3. Celery Worker Check
        celery_status = 'offline'
        celery_error = None
        try:
            from config.celery import app as celery_app
            insp = celery_app.control.inspect()
            stats = insp.stats()
            if stats:
                celery_status = 'active'
            else:
                pings = celery_app.control.ping(timeout=0.5)
                if pings:
                    celery_status = 'active'
                else:
                    celery_status = 'offline'
                    celery_error = "No workers responded to ping"
        except Exception as e:
            logger.warning(f"Health check: Celery offline: {e}")
            celery_status = 'offline'
            celery_error = str(e)

        # 4. Database Latency
        import time
        db_start = time.time()
        with connection.cursor() as cursor:
            cursor.execute("SELECT 1")
        db_latency = f"{round((time.time() - db_start) * 1000, 2)}ms"

        return Response({
            'status': 'healthy' if redis_status == 'connected' and celery_status == 'active' else 'partially_degraded',
            'redis_status': redis_status,
            'redis_error': redis_error,
            'celery_status': celery_status,
            'celery_error': celery_error,
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
    """Toggle maintenance mode."""
    permission_classes = [IsAuthenticated]

    def post(self, request):
        if request.user.role != 'SUPER_ADMIN':
            raise PermissionDenied('Only Super Admins can toggle maintenance mode')

        action = request.data.get('action')
        return Response({'success': True, 'mode': action})
