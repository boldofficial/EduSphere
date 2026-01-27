
import os
import django
import uuid
from datetime import date

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from bursary.models import Payment, Expense, FeeCategory, FeeItem
from schools.models import School
from academic.models import Student, Class

def test_persistence():
    print("Starting Bursary Persistence Test...")
    
    # 1. Setup - Get a school and student
    school = School.objects.first()
    if not school:
        print("FAIL: No school found in DB.")
        return
    
    student = Student.objects.filter(school=school).first()
    if not student:
        print("FAIL: No student found in DB.")
        return

    # 2. Test Payment Persistence
    print(f"\nTesting Payment Persistence for Student: {student.names}...")
    ref = f"TEST-PAY-{uuid.uuid4().hex[:8].upper()}"
    payment = Payment.objects.create(
        school=school,
        student=student,
        amount=50000.00,
        reference=ref,
        method='cash',
        status='completed',
        recorded_by='Test Runner',
        session='2025/2026',
        term='First Term'
    )
    
    # Verify Payment
    saved_payment = Payment.objects.get(id=payment.id)
    print(f"Payment Saved OK: ID={saved_payment.id}, Ref={saved_payment.reference}")
    
    # 3. Test Expense Persistence
    print("\nTesting Expense Persistence...")
    expense = Expense.objects.create(
        school=school,
        title="Test Repair",
        amount=15000.00,
        category='maintenance',
        date=date.today(),
        recorded_by='Test Runner',
        session='2025/2026',
        term='First Term'
    )
    
    # Verify Expense
    saved_expense = Expense.objects.get(id=expense.id)
    print(f"Expense Saved OK: ID={saved_expense.id}, Title={saved_expense.title}")
    
    # 4. Cleanup (optional, but good for test repeatability)
    # payment.delete()
    # expense.delete()
    print("\nBURSARY PERSISTENCE VERIFIED: All financial records saved successfully.")

if __name__ == "__main__":
    test_persistence()
