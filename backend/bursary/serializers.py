from rest_framework import serializers
from .models import (
    FeeCategory, Scholarship, FeeItem, StudentFee, Payment, PaymentLineItem, 
    Expense, AdmissionPackage,
    SalaryAllowance, SalaryDeduction, StaffSalaryStructure, Payroll, PayrollEntry
)
from academic.serializers import StudentSerializer, ClassSerializer, TeacherSerializer
from academic.models import Student, Class, Teacher, AdmissionIntake
from core.tenant_utils import get_request_school


def _school_from_request(serializer):
    request = serializer.context.get('request')
    if not request:
        return None
    try:
        return get_request_school(request, allow_super_admin_tenant=True)
    except Exception:
        return None

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
    
    # Virtual fields for compatibility with fallback frontend payload
    name = serializers.CharField(write_only=True, required=False)
    class_id = serializers.PrimaryKeyRelatedField(
        queryset=Class.objects.none(), write_only=True, required=False, allow_null=True
    )
    is_optional = serializers.BooleanField(write_only=True, required=False, default=False)

    class Meta:
        model = FeeItem
        fields = [
            'id', 'category', 'category_name', 'amount', 'session', 'term', 
            'target_class', 'target_class_name', 'active', 'school',
            'name', 'class_id', 'is_optional'
        ]
        read_only_fields = ('school',)

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        school = _school_from_request(self)
        if school:
            self.fields['category'].queryset = FeeCategory.objects.filter(school=school)
            self.fields['target_class'].queryset = Class.objects.filter(school=school)
            self.fields['class_id'].queryset = Class.objects.filter(school=school)

    def validate(self, attrs):
        school = attrs.get('school') or _school_from_request(self)
        category = attrs.get('category')
        target_class = attrs.get('target_class') or attrs.get('class_id')

        # Compatibility logic: if name is provided but category is not
        name = attrs.get('name')
        if not category and not name:
            raise serializers.ValidationError({"category": "This field is required if 'name' is not provided."})

        if school and category and category.school != school:
            raise serializers.ValidationError({"category": "Category must belong to your school."})
        if school and target_class and target_class.school != school:
            raise serializers.ValidationError({"target_class": "Class must belong to your school."})
        
        # Map class_id to target_class if provided
        if attrs.get('class_id'):
            attrs['target_class'] = attrs.pop('class_id')
            
        return attrs

    def create(self, validated_data):
        name = validated_data.pop('name', None)
        is_optional = validated_data.pop('is_optional', False)
        school = validated_data.get('school') or _school_from_request(self)

        if name and not validated_data.get('category'):
            category, _ = FeeCategory.objects.get_or_create(
                name=name,
                school=school,
                defaults={'is_optional': is_optional}
            )
            validated_data['category'] = category

        return super().create(validated_data)

class StudentFeeSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(source='student.names', read_only=True)
    fee_item_details = FeeItemSerializer(source='fee_item', read_only=True)
    
    class Meta:
        model = StudentFee
        fields = '__all__'
        read_only_fields = ('school',)

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        school = _school_from_request(self)
        if school:
            self.fields['student'].queryset = Student.objects.filter(school=school)
            self.fields['fee_item'].queryset = FeeItem.objects.filter(school=school)
            self.fields['scholarship'].queryset = Scholarship.objects.filter(school=school)

    def validate(self, attrs):
        school = attrs.get('school') or _school_from_request(self)
        student = attrs.get('student')
        fee_item = attrs.get('fee_item')
        scholarship = attrs.get('scholarship')

        if school and student and student.school != school:
            raise serializers.ValidationError({"student": "Student must belong to your school."})
        if school and fee_item and fee_item.school != school:
            raise serializers.ValidationError({"fee_item": "Fee item must belong to your school."})
        if school and scholarship and scholarship.school != school:
            raise serializers.ValidationError({"scholarship": "Scholarship must belong to your school."})
        return attrs

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

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        school = _school_from_request(self)
        if school:
            self.fields['student'].queryset = Student.objects.filter(school=school)
            self.fields['category'].queryset = FeeCategory.objects.filter(school=school)

    def validate(self, attrs):
        school = attrs.get('school') or _school_from_request(self)
        student = attrs.get('student')
        category = attrs.get('category')

        if school and student and student.school != school:
            raise serializers.ValidationError({"student": "Student must belong to your school."})
        if school and category and category.school != school:
            raise serializers.ValidationError({"category": "Category must belong to your school."})
        return attrs

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

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        school = _school_from_request(self)
        if school:
            self.fields['intake'].queryset = AdmissionIntake.objects.filter(school=school)
            self.fields['fees'].queryset = FeeItem.objects.filter(school=school)

    def validate(self, attrs):
        school = attrs.get('school') or _school_from_request(self)
        intake = attrs.get('intake')
        fees = attrs.get('fees')

        if school and intake and intake.school != school:
            raise serializers.ValidationError({"intake": "Intake must belong to your school."})
        if school and fees:
            invalid_fee = next((fee for fee in fees if fee.school != school), None)
            if invalid_fee:
                raise serializers.ValidationError({"fees": "All fees must belong to your school."})
        return attrs

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

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        school = _school_from_request(self)
        if school:
            self.fields['staff'].queryset = Teacher.objects.filter(school=school)

    def validate(self, attrs):
        school = attrs.get('school') or _school_from_request(self)
        staff = attrs.get('staff')
        if school and staff and staff.school != school:
            raise serializers.ValidationError({"staff": "Staff must belong to your school."})
        return attrs

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
