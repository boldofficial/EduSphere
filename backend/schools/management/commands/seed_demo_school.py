import random
import uuid
from datetime import timedelta, date
from django.core.management.base import BaseCommand
from django.utils import timezone
from django.contrib.auth import get_user_model
from schools.models import School, SchoolSettings, SubscriptionPlan, Subscription, MODULES
from academic.models import Subject, Teacher, Class, Student, AttendanceSession, AttendanceRecord, GradingScheme
from bursary.models import FeeCategory, FeeItem, Payment, Expense, PaymentLineItem

User = get_user_model()

class Command(BaseCommand):
    help = 'Seeds the database with Bold Ideas Innovations School demo data (FULL ENTERPRISE VERSION)'

    def handle(self, *args, **options):
        self.stdout.write("Seeding Bold Ideas Innovations School (Enterprise)...")

        # 1. SETUP PLAN & SCHOOL
        all_module_ids = [m['id'] for m in MODULES]
        plan, _ = SubscriptionPlan.objects.get_or_create(
            slug='enterprise-demo',
            defaults={
                'name': 'Enterprise Demo Plan',
                'price': 0,
                'allowed_modules': all_module_ids,
                'description': 'Full access for demo purposes.'
            }
        )

        school, created = School.objects.get_or_create(
            domain='demo',
            defaults={
                'name': 'Bold Ideas Innovations School',
                'address': '123 Innovation Way, Tech City',
                'email': 'admin@boldideas.edu',
                'phone': '+234 800 123 4567',
            }
        )

        # Ensure subscription is active with all modules
        Subscription.objects.update_or_create(
            school=school,
            defaults={
                'plan': plan,
                'status': 'active',
                'start_date': timezone.now() - timedelta(days=30),
                'end_date': timezone.now() + timedelta(days=335),
            }
        )

        settings, _ = SchoolSettings.objects.get_or_create(
            school=school,
            defaults={
                'current_session': '2025/2026',
                'current_term': 'First Term',
                'school_tagline': 'Empowering the next generation of innovators',
                'bank_name': 'Innovation Bank',
                'bank_account_name': 'Bold Ideas Innovations School',
                'bank_account_number': '0123456789',
            }
        )

        # Cleanup existing history to ensure "exact details" on every run
        Payment.objects.filter(school=school).delete()
        Expense.objects.filter(school=school).delete()
        AttendanceSession.objects.filter(school=school).delete()
        Student.objects.filter(school=school).delete()
        Class.objects.filter(school=school).delete()
        Teacher.objects.filter(school=school).delete()
        Subject.objects.filter(school=school).delete()

        # 2. SETUP ACADEMIC STRUCTURE
        # subjects
        subjects_data = ["Mathematics", "English Language", "Physics", "Chemistry", "Biology", "Economics"]
        sub_objs = [Subject.objects.create(school=school, name=s) for s in subjects_data]

        # 3. STAFF
        roles = [
            ('demo_admin', User.Role.SCHOOL_ADMIN, "Dr. Sarah Johnson", "School Principal"),
            ('demo_teacher', User.Role.TEACHER, "Mr. Robert Smith", "Senior Mathematics Teacher"),
        ]
        
        staff_map = {}
        for username, role, full_name, title in roles:
            user, u_created = User.objects.get_or_create(
                username=username,
                defaults={'email': f"{username}@boldideas.edu", 'role': role}
            )
            if u_created: user.set_password('pass1234')
            user.school = school
            user.save()

            if role == User.Role.TEACHER:
                teacher = Teacher.objects.create(
                    school=school, user=user, 
                    name=full_name,
                    staff_type='ACADEMIC'
                )
                staff_map[username] = teacher

        # 4. CLASSES & STUDENTS
        classes_data = ["JSS 1", "JSS 2", "JSS 3", "SSS 1", "SSS 2", "SSS 3"]
        class_objs = []
        for c_name in classes_data:
            cls = Class.objects.create(school=school, name=c_name, class_teacher=staff_map.get('demo_teacher'))
            class_objs.append(cls)

        # Create Demo Student for login
        demo_student_user, _ = User.objects.get_or_create(
            username='demo_student',
            defaults={'email': 'student@boldideas.edu', 'role': User.Role.STUDENT, 'school': school}
        )
        demo_student_user.set_password('pass1234')
        demo_student_user.save()

        Student.objects.create(
            school=school, 
            student_no="ST-DEMO-001", 
            names="Alex Johnson", 
            current_class=class_objs[0], 
            user=demo_student_user, 
            gender='Male',
            dob=date(2012, 5, 15)
        )

        # Create more students
        for i in range(20):
            c = random.choice(class_objs)
            s_u, _ = User.objects.get_or_create(username=f"student_{i}", defaults={'role': User.Role.STUDENT, 'school': school})
            Student.objects.create(
                school=school, 
                student_no=f"ST-{200+i}", 
                names=f"Student Name {i}", 
                current_class=c, 
                user=s_u, 
                gender=random.choice(['Male', 'Female'])
            )

        # 5. ATTENDANCE
        today = timezone.now().date()
        for i in range(5): # Last 5 days
            d = today - timedelta(days=i)
            for cls in class_objs[:2]: # Only for some classes
                session = AttendanceSession.objects.create(
                    school=school, 
                    student_class=cls, 
                    date=d, 
                    session=settings.current_session,
                    term=settings.current_term
                )
                students = Student.objects.filter(current_class=cls)
                for s in students:
                    status = 'present' if random.random() > 0.1 else 'absent'
                    AttendanceRecord.objects.create(
                        school=school, 
                        attendance_session=session, 
                        student=s, 
                        status=status
                    )

        # 6. FINANCIALS
        fee_cat, _ = FeeCategory.objects.get_or_create(school=school, name="Tuition Fees")
        for cls in class_objs:
            FeeItem.objects.create(
                school=school, 
                category=fee_cat, 
                target_class=cls, 
                session=settings.current_session, 
                term=settings.current_term, 
                amount=random.choice([45000, 55000, 65000])
            )

        # 7. EXPENSES
        Expense.objects.create(
            school=school, 
            category="utilities", 
            title="Electricity Bill", 
            amount=12000, 
            date=today,
            recorded_by="demo_admin",
            session=settings.current_session,
            term=settings.current_term
        )
        Expense.objects.create(
            school=school, 
            category="maintenance", 
            title="Generator Service", 
            amount=8500, 
            date=today - timedelta(days=2),
            recorded_by="demo_admin",
            session=settings.current_session,
            term=settings.current_term
        )

        # 8. Success
        self.stdout.write(self.style.SUCCESS("Bold Ideas Innovations School seeded with FULL ENTERPRISE DATA!"))
