from rest_framework import viewsets, permissions, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from django.utils import timezone
from users.models import User
from academic.models import Teacher
from .models import (
    FeeCategory, Scholarship, FeeItem, StudentFee, Payment, PaymentLineItem, 
    Expense, AdmissionPackage,
    SalaryAllowance, SalaryDeduction, StaffSalaryStructure, Payroll, PayrollEntry
)
from .serializers import (
    FeeCategorySerializer, ScholarshipSerializer, FeeItemSerializer, StudentFeeSerializer,
    PaymentSerializer, ExpenseSerializer, AdmissionPackageSerializer,
    SalaryAllowanceSerializer, SalaryDeductionSerializer, 
    StaffSalaryStructureSerializer, PayrollSerializer, PayrollEntrySerializer
)

class TenantViewSet(viewsets.ModelViewSet):
    """Base ViewSet ensuring data isolation by School."""
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        school = getattr(user, 'school', None)
        if hasattr(self.request, 'tenant'):
             school = self.request.tenant
        
        if not school:
            return self.queryset.none()
            
        return self.queryset.filter(school=school)

    def perform_create(self, serializer):
        user = self.request.user
        school = getattr(user, 'school', None) or getattr(self.request, 'tenant', None)
        serializer.save(school=school)

class FeeCategoryViewSet(TenantViewSet):
    queryset = FeeCategory.objects.all()
    serializer_class = FeeCategorySerializer

class ScholarshipViewSet(TenantViewSet):
    queryset = Scholarship.objects.all()
    serializer_class = ScholarshipSerializer

class FeeItemViewSet(TenantViewSet):
    queryset = FeeItem.objects.all()
    serializer_class = FeeItemSerializer

class StudentFeeViewSet(TenantViewSet):
    queryset = StudentFee.objects.all()
    serializer_class = StudentFeeSerializer

    def get_queryset(self):
        qs = super().get_queryset()
        user = self.request.user
        if user.role == 'STUDENT' and hasattr(user, 'student_profile'):
            qs = qs.filter(student=user.student_profile)
        return qs

class PaymentViewSet(TenantViewSet):
    queryset = Payment.objects.all()
    serializer_class = PaymentSerializer

    def get_queryset(self):
        qs = super().get_queryset()
        user = self.request.user
        if user.role == 'STUDENT' and hasattr(user, 'student_profile'):
            qs = qs.filter(student=user.student_profile)
        return qs

class ExpenseViewSet(TenantViewSet):
    queryset = Expense.objects.all()
    serializer_class = ExpenseSerializer

class AdmissionPackageViewSet(TenantViewSet):
    queryset = AdmissionPackage.objects.all()
    serializer_class = AdmissionPackageSerializer

# ==========================================
# PAYROLL VIEWSETS
# ==========================================

class SalaryAllowanceViewSet(TenantViewSet):
    queryset = SalaryAllowance.objects.all()
    serializer_class = SalaryAllowanceSerializer

class SalaryDeductionViewSet(TenantViewSet):
    queryset = SalaryDeduction.objects.all()
    serializer_class = SalaryDeductionSerializer

class StaffSalaryStructureViewSet(TenantViewSet):
    queryset = StaffSalaryStructure.objects.select_related('staff').all()
    serializer_class = StaffSalaryStructureSerializer
    
    @action(detail=False, methods=['get'])
    def by_staff(self, request):
        staff_id = request.query_params.get('staff_id')
        if not staff_id:
            return Response({"error": "Staff ID required"}, status=400)
            
        structure, created = StaffSalaryStructure.objects.get_or_create(
            staff_id=staff_id,
            school=request.user.school
        )
        # Recalculate just in case basic salary changed
        structure.calculate_totals()
        return Response(self.get_serializer(structure).data)

class PayrollViewSet(TenantViewSet):
    queryset = Payroll.objects.prefetch_related('entries', 'entries__staff').all()
    serializer_class = PayrollSerializer
    
    @action(detail=False, methods=['post'])
    def generate(self, request):
        """
        Generate Draft Payroll for a given month.
        Requires: month (YYYY-MM-DD)
        """
        month_str = request.data.get('month')
        if not month_str:
            return Response({"error": "Month is required"}, status=400)
            
        # Parse month to first day
        from datetime import datetime
        try:
            date_obj = datetime.strptime(month_str, '%Y-%m-%d').date()
            month_start = date_obj.replace(day=1)
        except ValueError:
            return Response({"error": "Invalid date format. Use YYYY-MM-DD"}, status=400)
            
        school = request.user.school
        
        # Check if exists
        if Payroll.objects.filter(school=school, month=month_start).exists():
            return Response({"error": f"Payroll for {month_start.strftime('%B %Y')} already exists."}, status=400)
            
        payroll = Payroll.objects.create(
            school=school,
            month=month_start,
            status='draft'
        )
        
        # Fetch active staff
        # Assuming staff_type != 'contract' or similar logic if needed
        active_staff = Teacher.objects.filter(school=school) # Add active check if needed
        
        total_bill = 0
        count = 0
        
        for staff in active_staff:
            # Get or create structure
            structure, _ = StaffSalaryStructure.objects.get_or_create(staff=staff, school=school)
            structure.calculate_totals()
            
            basic = float(staff.basic_salary) if staff.basic_salary else 0
            allowances = float(structure.total_allowances)
            deductions = float(structure.total_deductions)
            net = basic + allowances - deductions
            
            # Create Entry
            PayrollEntry.objects.create(
                school=school,
                payroll=payroll,
                staff=staff,
                basic_salary=basic,
                total_allowances=allowances,
                total_deductions=deductions,
                net_pay=net,
                breakdown=structure.structure_data or {}
            )
            
            total_bill += net
            count += 1
            
        payroll.total_wage_bill = total_bill
        payroll.total_staff = count
        payroll.save()
        
        return Response(self.get_serializer(payroll).data, status=201)

    @action(detail=True, methods=['post'])
    def approve(self, request, pk=None):
        payroll = self.get_object()
        if payroll.status != 'draft':
            return Response({"error": "Only draft payrolls can be approved"}, status=400)
            
        payroll.status = 'approved'
        payroll.approved_by = request.user
        payroll.approved_at = timezone.now()
        payroll.save()
        
        return Response(self.get_serializer(payroll).data)

    @action(detail=True, methods=['post'])
    def mark_paid(self, request, pk=None):
        payroll = self.get_object()
        if payroll.status != 'approved':
            return Response({"error": "Payroll must be approved before payment"}, status=400)
            
        payroll.status = 'paid'
        payroll.paid_at = timezone.now()
        payroll.save()
        
        # Auto-create Expense Check
        create_expense = request.data.get('create_expense', False)
        if create_expense:
            Expense.objects.create(
                school=payroll.school,
                title=f"Staff Payroll - {payroll.month.strftime('%B %Y')}",
                amount=payroll.total_wage_bill,
                category='salary',
                date=timezone.now().date(),
                session=request.user.school.current_session, # Assuming property exists or similar
                term=request.user.school.current_term,
                recorded_by=request.user.username,
                description=f"Automated payroll entry for {payroll.total_staff} staff."
            )
        
        return Response(self.get_serializer(payroll).data)

class DashboardViewSet(viewsets.ViewSet):
    permission_classes = [permissions.IsAuthenticated]

    def list(self, request):
        school = request.user.school
        
        # Simple aggregated stats
        from django.db.models import Sum
        
        expected_fees = StudentFee.objects.filter(school=school).aggregate(Sum('amount'))['amount__sum'] or 0
        total_collected = Payment.objects.filter(school=school).aggregate(Sum('amount'))['amount__sum'] or 0
        total_expenses = Expense.objects.filter(school=school).aggregate(Sum('amount'))['amount__sum'] or 0
        
        # Payroll stats
        total_payroll = Payroll.objects.filter(
            school=school, status='paid'
        ).aggregate(Sum('total_wage_bill'))['total_wage_bill'] or 0
        
        # Outstanding
        outstanding = expected_fees - total_collected
        
        # Recent activity
        recent_payments = Payment.objects.filter(school=school).order_by('-date')[:5]
        recent_expenses = Expense.objects.filter(school=school).order_by('-date')[:5]
        
        data = {
            "expected_revenue": expected_fees,
            "total_collected": total_collected,
            "total_outstanding": outstanding,
            "total_expenses": total_expenses,
            "total_payroll": total_payroll,
            "net_balance": total_collected - total_expenses - total_payroll,
            "recent_payments": PaymentSerializer(recent_payments, many=True).data,
            "recent_expenses": ExpenseSerializer(recent_expenses, many=True).data
        }
        
        return Response(data)
