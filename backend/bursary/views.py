from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.exceptions import PermissionDenied
from .models import FeeCategory, FeeItem, StudentFee, Payment, Expense, Scholarship, AdmissionPackage
from .serializers import (
    FeeCategorySerializer, FeeItemSerializer, StudentFeeSerializer, PaymentSerializer, 
    ExpenseSerializer, ScholarshipSerializer, AdmissionPackageSerializer
)
from academic.models import Student, Class
from core.pagination import StandardPagination, LargePagination
from core.cache_utils import CachingMixin
from django.utils import timezone
from django.db.models import Sum, Q, Count
import uuid


class IsAdminOrBursar(permissions.BasePermission):
    """
    Write operations restricted to SCHOOL_ADMIN, SUPER_ADMIN, TEACHER (bursar), or superusers.
    STUDENT and other roles are read-only.
    """
    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return True
        if not request.user or not request.user.is_authenticated:
            return False
        return request.user.role in ('SCHOOL_ADMIN', 'SUPER_ADMIN', 'TEACHER') or request.user.is_superuser

class TenantViewSet(CachingMixin, viewsets.ModelViewSet):
    """Base ViewSet for multi-tenant models - filters by school"""
    permission_classes = [permissions.IsAuthenticated, IsAdminOrBursar]

    def get_queryset(self):
        user = self.request.user
        if not user.is_authenticated:
            return self.queryset.none()
        
        if user.is_superuser:
            return self.queryset.all()
        
        if hasattr(user, 'school') and user.school:
            return self.queryset.filter(school=user.school)
        
        return self.queryset.none()

    def perform_create(self, serializer):
        save_kwargs = {}
        if hasattr(self.request.user, 'school') and self.request.user.school:
            save_kwargs['school'] = self.request.user.school
        
        serializer.save(**save_kwargs)

    def perform_update(self, serializer):
        instance = serializer.instance
        user = self.request.user
        if not user.is_superuser and hasattr(instance, 'school'):
            user_school = getattr(user, 'school', None)
            if user_school and instance.school != user_school:
                raise PermissionDenied('You cannot modify records belonging to another school.')
        super().perform_update(serializer)

    def perform_destroy(self, instance):
        user = self.request.user
        if not user.is_superuser and hasattr(instance, 'school'):
            user_school = getattr(user, 'school', None)
            if user_school and instance.school != user_school:
                raise PermissionDenied('You cannot delete records belonging to another school.')
        super().perform_destroy(instance)

class ScholarshipViewSet(TenantViewSet):
    queryset = Scholarship.objects.select_related('school').all()
    serializer_class = ScholarshipSerializer
    pagination_class = StandardPagination

class FeeCategoryViewSet(TenantViewSet):
    queryset = FeeCategory.objects.select_related('school').all()
    serializer_class = FeeCategorySerializer
    pagination_class = StandardPagination

class FeeItemViewSet(TenantViewSet):
    queryset = FeeItem.objects.select_related('category', 'target_class', 'school').all()
    serializer_class = FeeItemSerializer
    pagination_class = StandardPagination

class StudentFeeViewSet(TenantViewSet):
    queryset = StudentFee.objects.select_related('student', 'fee_item', 'school').all()
    serializer_class = StudentFeeSerializer
    pagination_class = StandardPagination

    @action(detail=False, methods=['post'], url_path='send-reminders')
    def send_reminders(self, request):
        """
        Send fee reminders to debtors via email.
        Body: { "student_ids": [...], "message": "Custom message text" }
        """
        from emails.tasks import send_email_task
        
        student_ids = request.data.get('student_ids', [])
        message_template = request.data.get('message', 'Friendly reminder of your outstanding balance.')
        
        # Get unpaid fees for the specified students (or all if none specified)
        fees_qs = StudentFee.objects.filter(school=request.user.school).select_related('student', 'fee_item')
        if student_ids:
            fees_qs = fees_qs.filter(student_id__in=student_ids)
        
        # Group by student and send one email per student
        sent_count = 0
        student_fees = {}
        for fee in fees_qs:
            if fee.student_id not in student_fees:
                student_fees[fee.student_id] = {
                    'student': fee.student,
                    'total_balance': 0,
                    'items': []
                }
            student_fees[fee.student_id]['total_balance'] += float(fee.fee_item.amount) - float(fee.amount_paid or 0)
            student_fees[fee.student_id]['items'].append(fee.fee_item.name if hasattr(fee.fee_item, 'name') else str(fee.fee_item))
        
        for student_id, data in student_fees.items():
            student = data['student']
            # Try parent email first, then student user email
            recipient_email = getattr(student, 'parent_email', None) or getattr(student, 'email', None)
            if not recipient_email and hasattr(student, 'user') and student.user:
                recipient_email = student.user.email
            
            if recipient_email and data['total_balance'] > 0:
                try:
                    send_email_task.delay(
                        'fee_reminder',
                        recipient_email,
                        {
                            'student_name': student.names if hasattr(student, 'names') else str(student),
                            'balance': f"{data['total_balance']:,.2f}",
                            'message': message_template,
                            'school_name': request.user.school.name,
                        }
                    )
                    sent_count += 1
                except Exception:
                    pass  # Silently skip failed queues; email task handles logging
        
        return Response({
            "status": "success",
            "message": f"Reminders queued for {sent_count} students/parents.",
            "total_students_processed": len(student_fees),
        })

class PaymentViewSet(TenantViewSet):
    queryset = Payment.objects.select_related('student', 'category', 'school').all()
    serializer_class = PaymentSerializer
    pagination_class = LargePagination

    def get_queryset(self):
        qs = super().get_queryset()
        student_id = self.request.query_params.get('student')
        if student_id:
            qs = qs.filter(student_id=student_id)
        return qs

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
            
        return super().create(request, *args, **kwargs)

    def perform_create(self, serializer):
        # Generate a reference if not provided
        reference = serializer.validated_data.get('reference') or f"PAY-{uuid.uuid4().hex[:8].upper()}"
        
        save_kwargs = {'reference': reference, 'recorded_by': self.request.user.username}
        if hasattr(self.request.user, 'school') and self.request.user.school:
            save_kwargs['school'] = self.request.user.school

        serializer.save(**save_kwargs)

    @action(detail=False, methods=['post'], url_path='verify-online')
    def verify_online(self, request):
        """
        Endpoint for online payment verification (Paystack/Flutterwave simulation)
        """
        reference = request.data.get('reference')
        student_id = request.data.get('student_id')
        amount = request.data.get('amount')

        if not all([reference, student_id, amount]):
            return Response({"error": "Missing required fields"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            student = Student.objects.get(id=student_id, school=request.user.school)
        except Student.DoesNotExist:
            return Response({"error": "Student not found in your school"}, status=status.HTTP_404_NOT_FOUND)

        # Simulation: 100% success for now to ensure persistence is reliable during setup
        is_success = True

        try:
            # Get session/term from request data
            session = request.data.get('session')
            term = request.data.get('term')
            
            # Create the payment record with uniqueness protection
            payment, created = Payment.objects.get_or_create(
                reference=reference,
                defaults={
                    'school': request.user.school,
                    'student': student,
                    'amount': amount,
                    'method': 'online',
                    'status': 'completed',
                    'gateway_reference': f"GTW-{uuid.uuid4().hex[:12].upper()}",
                    'recorded_by': "System (Online)",
                    'session': session or "2025/2026",
                    'term': term or "First Term"
                }
            )
            
            if not created:
                # Reference already exists, return existing or error
                # Usually we return success if it's already completed to be idempotent
                if payment.status == 'completed':
                    return Response(PaymentSerializer(payment).data)
                return Response({"error": "Payment reference already exists"}, status=status.HTTP_400_BAD_REQUEST)

            return Response(PaymentSerializer(payment).data)
        except Exception as e:
            # Log the error for the developer
            print(f"Online Verification Error: {e}")
            return Response({"error": f"Internal error during verification: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class ExpenseViewSet(TenantViewSet):
    queryset = Expense.objects.select_related('school').all()
    serializer_class = ExpenseSerializer
    pagination_class = StandardPagination

    def perform_create(self, serializer):
        # Auto-set recorded_by to current user
        save_kwargs = {'recorded_by': self.request.user.username}
        if hasattr(self.request.user, 'school') and self.request.user.school:
            save_kwargs['school'] = self.request.user.school
            
        serializer.save(**save_kwargs)


class DashboardViewSet(viewsets.ViewSet):
    """
    ViewSet for dashboard-specific statistics and aggregations.
    This offloads heavy client-side calculations to optimized DB queries.
    """
    permission_classes = [permissions.IsAuthenticated]

    @action(detail=False, methods=['get'], url_path='financial-stats')
    def financial_stats(self, request):
        school = request.user.school
        session = request.query_params.get('session')
        term = request.query_params.get('term')

        if not all([session, term]):
            return Response({"error": "Session and term are required"}, status=400)

        # Caching logic
        from django.core.cache import cache
        cache_key = f"api:bursary:dashboard:{school.id}:{session}:{term}"
        cached_data = cache.get(cache_key)
        if cached_data:
            return Response(cached_data)

        # 1. Income & Expenses
        income_data = Payment.objects.filter(
            school=school, session=session, term=term, status='completed'
        ).aggregate(total=Sum('amount'), count=Count('id'))
        
        expense_data = Expense.objects.filter(
            school=school, session=session, term=term
        ).aggregate(total=Sum('amount'), count=Count('id'))

        total_income = income_data['total'] or 0
        total_expenses = expense_data['total'] or 0
        
        # 2. Expected Income (Aggregated calculation)
        # This is an approximation of the client-side logic for high performance
        # Mandatory Class Fees
        mandatory_fees = FeeItem.objects.filter(
            school=school, session=session, term=term, 
            category__is_optional=False
        ).select_related('target_class')
        
        # Count students per class
        class_student_counts = Student.objects.filter(school=school).values('current_class').annotate(count=Count('id'))
        student_count_map = {item['current_class']: item['count'] for item in class_student_counts}
        
        expected_mandatory = 0
        for fee in mandatory_fees:
            if fee.target_class_id is None:
                # Flat fee for all students
                total_students = sum(student_count_map.values())
                expected_mandatory += fee.amount * total_students
            else:
                count = student_count_map.get(fee.target_class_id, 0)
                expected_mandatory += fee.amount * count

        # Optional Fees Assigned (only if not already captured in mandatory)
        # We look at StudentFee which explicitly links students to fees
        expected_optional = StudentFee.objects.filter(
            school=school, fee_item__session=session, fee_item__term=term,
            fee_item__category__is_optional=True
        ).aggregate(total=Sum('fee_item__amount'))['total'] or 0

        # Adjust for discounts (approximated from StudentFee records)
        discounts = StudentFee.objects.filter(
            school=school, fee_item__session=session, fee_item__term=term
        ).aggregate(total=Sum('discount_amount'))['total'] or 0

        total_expected = expected_mandatory + expected_optional - discounts
        
        # 3. Method Breakdown
        payments_by_method = Payment.objects.filter(
            school=school, session=session, term=term, status='completed'
        ).values('method').annotate(total=Sum('amount'))

        # 4. Expense Breakdown
        expenses_by_category = Expense.objects.filter(
            school=school, session=session, term=term
        ).values('category').annotate(total=Sum('amount'))

        # 5. Monthly Trend (Income vs Expense)
        # We group by month (Trunc Month)
        from django.db.models.functions import TruncMonth
        income_trend = Payment.objects.filter(
            school=school, session=session, term=term, status='completed'
        ).annotate(month=TruncMonth('date')).values('month').annotate(total=Sum('amount')).order_by('month')
        
        expense_trend = Expense.objects.filter(
            school=school, session=session, term=term
        ).annotate(month=TruncMonth('date')).values('month').annotate(total=Sum('amount')).order_by('month')

        # Merge trends
        trend_map = {}
        for item in income_trend:
            m = item['month'].strftime('%b')
            trend_map[m] = {"month": m, "income": float(item['total']), "expense": 0}
        
        for item in expense_trend:
            m = item['month'].strftime('%b')
            if m not in trend_map:
                trend_map[m] = {"month": m, "income": 0, "expense": float(item['total'])}
            else:
                trend_map[m]["expense"] = float(item['total'])

        result = {
            "summary": {
                "total_income": total_income,
                "total_expenses": total_expenses,
                "net_balance": total_income - total_expenses,
                "total_expected": float(total_expected),
                "income_count": income_data['count'],
                "expense_count": expense_data['count'],
            },
            "breakdown": {
                "methods": {item['method']: item['total'] for item in payments_by_method},
                "expense_categories": {item['category']: item['total'] for item in expenses_by_category},
                "monthly_trend": list(trend_map.values())
            }
        }
        
        # Store in cache
        cache.set(cache_key, result, 900) # 15 minutes
        

class AdmissionPackageViewSet(TenantViewSet):
    queryset = AdmissionPackage.objects.select_related('intake', 'school').prefetch_related('fees').all()
    serializer_class = AdmissionPackageSerializer
    pagination_class = StandardPagination
