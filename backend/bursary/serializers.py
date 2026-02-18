from rest_framework import serializers
from .models import (
    FeeCategory, Scholarship, FeeItem, StudentFee, Payment, PaymentLineItem, 
    Expense, AdmissionPackage,
    SalaryAllowance, SalaryDeduction, StaffSalaryStructure, Payroll, PayrollEntry
)
from academic.serializers import StudentSerializer, ClassSerializer, TeacherSerializer
from academic.models import Student, Class, Teacher

class FeeCategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = FeeCategory
        fields = '__all__'
        read_only_fields = ('school',)

class ScholarshipSerializer(serializers.ModelSerializer):
    class Meta:
        model = Scholarship
        fields = '__all__'
        read_only_fields = ('school',)

class FeeItemSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source='category.name', read_only=True)
    target_class_name = serializers.CharField(source='target_class.name', read_only=True)
    
    class Meta:
        model = FeeItem
        fields = '__all__'
        read_only_fields = ('school',)

class StudentFeeSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(source='student.names', read_only=True)
    fee_item_details = FeeItemSerializer(source='fee_item', read_only=True)
    
    class Meta:
        model = StudentFee
        fields = '__all__'
        read_only_fields = ('school',)

class PaymentLineItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = PaymentLineItem
        fields = ['id', 'purpose', 'amount']
        read_only_fields = ('school',)

class PaymentSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(source='student.names', read_only=True)
    student_class = serializers.CharField(source='student.current_class.name', read_only=True)
    category_name = serializers.CharField(source='category.name', read_only=True)
    line_items = PaymentLineItemSerializer(many=True, read_only=True)
    items_input = serializers.JSONField(write_only=True, required=False) # For creating line items

    class Meta:
        model = Payment
        fields = [
            'id', 'student', 'student_name', 'student_class', 'amount', 'date', 
            'reference', 'method', 'status', 'category', 'category_name', 
            'remark', 'recorded_by', 'session', 'term', 'line_items', 'items_input',
            'created_at'
        ]
        read_only_fields = ('school', 'reference')

    def create(self, validated_data):
        items_data = validated_data.pop('items_input', [])
        payment = super().create(validated_data)
        
        # Create line items
        if items_data:
            for item in items_data:
                PaymentLineItem.objects.create(
                    school=payment.school,
                    payment=payment,
                    purpose=item.get('purpose', 'Fee'),
                    amount=item.get('amount', 0)
                )
        return payment

class ExpenseSerializer(serializers.ModelSerializer):
    class Meta:
        model = Expense
        fields = '__all__'
        read_only_fields = ('school',)

class AdmissionPackageSerializer(serializers.ModelSerializer):
    intake_name = serializers.CharField(source='intake.name', read_only=True)
    fees_details = FeeItemSerializer(source='fees', many=True, read_only=True)
    
    class Meta:
        model = AdmissionPackage
        fields = '__all__'
        read_only_fields = ('school',)

# ==========================================
# PAYROLL SERIALIZERS
# ==========================================

class SalaryAllowanceSerializer(serializers.ModelSerializer):
    class Meta:
        model = SalaryAllowance
        fields = '__all__'
        read_only_fields = ('school',)

class SalaryDeductionSerializer(serializers.ModelSerializer):
    class Meta:
        model = SalaryDeduction
        fields = '__all__'
        read_only_fields = ('school',)

class StaffSalaryStructureSerializer(serializers.ModelSerializer):
    staff_name = serializers.CharField(source='staff.name', read_only=True)
    staff_role = serializers.CharField(source='staff.role', read_only=True)
    basic_salary = serializers.DecimalField(source='staff.basic_salary', max_digits=12, decimal_places=2, read_only=True)
    
    class Meta:
        model = StaffSalaryStructure
        fields = [
            'id', 'staff', 'staff_name', 'staff_role', 'basic_salary',
            'structure_data', 'total_allowances', 'total_deductions', 'net_salary_preview'
        ]
        read_only_fields = ('school',)

    def update(self, instance, validated_data):
        instance = super().update(instance, validated_data)
        instance.calculate_totals() # Auto-recalc totals on save
        return instance

class PayrollEntrySerializer(serializers.ModelSerializer):
    staff_name = serializers.CharField(source='staff.name', read_only=True)
    staff_role = serializers.CharField(source='staff.role', read_only=True)
    bank_name = serializers.CharField(source='staff.bank_name', read_only=True)
    account_number = serializers.CharField(source='staff.account_number', read_only=True)
    
    class Meta:
        model = PayrollEntry
        fields = [
            'id', 'payroll', 'staff', 'staff_name', 'staff_role', 
            'bank_name', 'account_number',
            'basic_salary', 'total_allowances', 'total_deductions', 'net_pay',
            'breakdown', 'is_paid'
        ]
        read_only_fields = ('school',)

class PayrollSerializer(serializers.ModelSerializer):
    approver_name = serializers.CharField(source='approved_by.username', read_only=True)
    entries = PayrollEntrySerializer(many=True, read_only=True)
    
    class Meta:
        model = Payroll
        fields = [
            'id', 'month', 'status', 'total_wage_bill', 'total_staff',
            'approved_by', 'approver_name', 'approved_at', 'paid_at',
            'entries', 'created_at', 'updated_at'
        ]
        read_only_fields = ('school', 'approved_by', 'approved_at', 'paid_at')
