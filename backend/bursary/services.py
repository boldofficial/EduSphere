from decimal import Decimal
from django.db import transaction
from django.db.models import Q
from academic.models import Student
from core.models import GlobalActivityLog
from .models import FeeDiscount, StudentFee, FeeItem

def resolve_scope(school, scope):
    """
    scope: { "type": "class" | "group" | "student" | "all", "ids": [...] }
    """
    scope_type = scope.get("type")
    ids = scope.get("ids", [])
    
    if scope_type == "student":
        return Student.objects.filter(school=school, id__in=ids, status="active")
    elif scope_type == "class":
        return Student.objects.filter(school=school, current_class_id__in=ids, status="active")
    elif scope_type == "all":
        return Student.objects.filter(school=school, status="active")
    elif scope_type == "group":
        return Student.objects.filter(school=school, groups__id__in=ids, status="active").distinct()
    return Student.objects.none()

def apply_bulk_discount(school, scope, fee_item_id, discount_type, value, reason, applied_by, override=False):
    students = resolve_scope(school, scope)
    count = 0
    
    try:
        fee_item = FeeItem.objects.get(id=fee_item_id, school=school)
    except FeeItem.DoesNotExist:
        return 0

    with transaction.atomic():
        for student in students:
            # Get or create StudentFee for this student and fee item
            student_fee, created = StudentFee.objects.get_or_create(
                school=school,
                student=student,
                fee_item=fee_item
            )
            
            # Check for existing discount if not overriding
            if not override and FeeDiscount.objects.filter(student_fee=student_fee).exists():
                continue
                
            # Calculate discount value
            discount_val = Decimal("0")
            if discount_type == "percent":
                discount_val = (fee_item.amount * Decimal(str(value))) / Decimal("100")
            elif discount_type == "fixed":
                discount_val = Decimal(str(value))
            elif discount_type == "full_waiver":
                discount_val = fee_item.amount
            elif discount_type == "scholarship":
                # Assuming scholarship value is a fixed deduction for now
                discount_val = Decimal(str(value))
            
            # Ensure discount doesn't exceed fee amount
            discount_val = min(discount_val, fee_item.amount)

            # Create or Update FeeDiscount record
            # If override is True, delete previous ones for this specific fee
            if override:
                FeeDiscount.objects.filter(student_fee=student_fee).delete()

            FeeDiscount.objects.create(
                school=school,
                student=student,
                student_fee=student_fee,
                discount_type=discount_type,
                value=discount_val,
                reason=reason,
                applied_by=applied_by
            )
            
            # Sync to StudentFee for balance calculations
            student_fee.discount_amount = discount_val
            student_fee.save()
            count += 1
            
        if count > 0:
            GlobalActivityLog.objects.create(
                action="RECORDS_MUTATED",
                school=school,
                user=applied_by,
                description=f"Applied bulk {discount_type} discount to {count} students",
                metadata={
                    "count": count, 
                    "type": discount_type, 
                    "value": str(value),
                    "fee_item": fee_item.category.name,
                    "reason": reason
                }
            )
            
    return count

def preview_bulk_discount(school, scope, fee_item_id, discount_type, value):
    students = resolve_scope(school, scope)
    
    try:
        fee_item = FeeItem.objects.get(id=fee_item_id, school=school)
    except FeeItem.DoesNotExist:
        return {"count": 0, "total_impact": 0, "students": []}

    total_impact = Decimal("0")
    affected_students = []

    for student in students:
        # Calculate discount value
        discount_val = Decimal("0")
        if discount_type == "percent":
            discount_val = (fee_item.amount * Decimal(str(value))) / Decimal("100")
        elif discount_type == "fixed":
            discount_val = Decimal(str(value))
        elif discount_type == "full_waiver":
            discount_val = fee_item.amount
        elif discount_type == "scholarship":
            discount_val = Decimal(str(value))
        
        discount_val = min(discount_val, fee_item.amount)
        total_impact += discount_val
        affected_students.append({
            "id": student.id,
            "names": student.names,
            "student_no": student.student_no,
            "class": student.current_class.name if student.current_class else "N/A",
            "potential_discount": float(discount_val)
        })

    return {
        "count": len(affected_students),
        "total_impact": float(total_impact),
        "students": affected_students[:100]  # Limit preview list
    }
