from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import FeeCategory, FeeItem, StudentFee, Payment, Expense, Scholarship
from .serializers import (
    FeeCategorySerializer, FeeItemSerializer, StudentFeeSerializer, PaymentSerializer, 
    ExpenseSerializer, ScholarshipSerializer
)
from academic.models import Student, Class
from core.pagination import StandardPagination, LargePagination
from core.cache_utils import CachingMixin
from django.utils import timezone
import uuid

class TenantViewSet(CachingMixin, viewsets.ModelViewSet):
    """Base ViewSet for multi-tenant models - filters by school"""
    permission_classes = [permissions.IsAuthenticated]

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
        Simulate sending reminders to debtors.
        In a real app, this would trigger Email/SMS via a background task.
        """
        student_ids = request.data.get('student_ids', [])
        message_template = request.data.get('message', 'Friendly reminder of your outstanding balance.')
        
        # Logic to "send" would go here
        count = len(student_ids) if student_ids else StudentFee.objects.filter(school=request.user.school).count()
        
        return Response({
            "status": "success",
            "message": f"Reminders queued for {count} students/parents.",
            "template_used": message_template
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
