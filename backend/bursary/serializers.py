from rest_framework import serializers
from .models import FeeCategory, FeeItem, StudentFee, Payment, Expense, Scholarship, PaymentLineItem
from academic.models import Student, Class

class FeeCategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = FeeCategory
        fields = ['id', 'name', 'description', 'is_optional', 'created_at']
        read_only_fields = ['created_at']

class ScholarshipSerializer(serializers.ModelSerializer):
    class Meta:
        model = Scholarship
        fields = ['id', 'name', 'description', 'benefit_type', 'value', 'is_active', 'created_at']
        read_only_fields = ['created_at']

class FeeItemSerializer(serializers.ModelSerializer):
    # Support both backend field names and frontend-friendly names
    name = serializers.CharField(source='category.name', read_only=True)
    class_id = serializers.PrimaryKeyRelatedField(
        source='target_class', 
        queryset=Class.objects.all(), 
        required=False, 
        allow_null=True
    )
    is_optional = serializers.BooleanField(source='category.is_optional', read_only=True)
    
    category_name = serializers.CharField(source='category.name', read_only=True)
    target_class_name = serializers.CharField(source='target_class.name', read_only=True)

    class Meta:
        model = FeeItem
        fields = [
            'id', 'category', 'category_name', 'name', 
            'amount', 'session', 'term', 
            'target_class', 'target_class_name', 'class_id',
            'active', 'is_optional'
        ]
        read_only_fields = ['category']

    def to_internal_value(self, data):
        # Map frontend 'class_id' to 'target_class' if it's there as a raw ID
        # Handle potential immutability of QueryDict
        data = data.copy() if hasattr(data, 'copy') else data.copy() if isinstance(data, dict) else data
        
        if 'class_id' in data and 'target_class' not in data:
            data['target_class'] = data['class_id']
            
        return super().to_internal_value(data)

    def create(self, validated_data):
        # We might get 'name' from the raw request data which isn't in validated_data
        # because it's read_only in the field definition above.
        # But for creation, we want to use it to find or create a category.
        
        request = self.context.get('request')
        if not request:
            return super().create(validated_data)
            
        raw_data = request.data
        name = raw_data.get('name')
        if not name:
            raise serializers.ValidationError({"name": "Name is required to create or find the fee category."})
        
        school = validated_data.get('school') or (request.user.school if hasattr(request.user, 'school') else None)
        
        # Find or create category
        category, _ = FeeCategory.objects.get_or_create(
            name=name,
            school=school,
            defaults={'is_optional': raw_data.get('is_optional', False)}
        )
        validated_data['category'] = category
            
        return super().create(validated_data)

class StudentFeeSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(source='student.names', read_only=True)
    student_no = serializers.CharField(source='student.student_no', read_only=True)
    fee_item_name = serializers.CharField(source='fee_item.category.name', read_only=True)
    fee_amount = serializers.DecimalField(source='fee_item.amount', read_only=True, max_digits=10, decimal_places=2)
    scholarship_name = serializers.CharField(source='scholarship.name', read_only=True)

    class Meta:
        model = StudentFee
        fields = ['id', 'student', 'student_name', 'student_no', 'fee_item', 'fee_item_name', 'fee_amount', 'scholarship', 'scholarship_name', 'discount_amount', 'created_at']
        read_only_fields = ['created_at']

class PaymentLineItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = PaymentLineItem
        fields = ['id', 'purpose', 'amount']

class PaymentSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(source='student.names', read_only=True)
    student_no = serializers.CharField(source='student.student_no', read_only=True)
    class_name = serializers.CharField(source='student.current_class.name', read_only=True)
    category_name = serializers.CharField(source='category.name', read_only=True)
    
    # Support frontend names
    student_id = serializers.PrimaryKeyRelatedField(
        source='student',
        queryset=Student.objects.all(),
        required=False,
        # Remove write_only=True so it shows in the response
    )
    lineItems = PaymentLineItemSerializer(many=True, source='line_items', required=False)

    class Meta:
        model = Payment
        fields = [
            'id', 'student_id', 'student_name', 'student_no', 'class_name', 
            'amount', 'date', 'reference', 'method', 'status', 
            'gateway_reference', 'verification_data',
            'category', 'category_name', 'remark', 'recorded_by', 'session', 'term',
            'lineItems'
        ]
        read_only_fields = ['recorded_by', 'reference'] # date is optional from frontend

    def create(self, validated_data):
        # DRF maps 'lineItems' to 'line_items' because of source='line_items'
        # But we check both just in case of any weird behavior
        line_items_data = validated_data.pop('line_items', validated_data.pop('lineItems', []))
        
        payment = super().create(validated_data)
        
        for item_data in line_items_data:
            PaymentLineItem.objects.create(
                payment=payment,
                school=payment.school,
                **item_data
            )
            
        return payment

class ExpenseSerializer(serializers.ModelSerializer):
    class Meta:
        model = Expense
        fields = ['id', 'title', 'amount', 'category', 'date', 'description', 'recorded_by', 'session', 'term']
        read_only_fields = ['recorded_by']
