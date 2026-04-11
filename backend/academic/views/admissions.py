"""Admission ViewSets."""

import os

from django.db import transaction
from django.utils import timezone
from rest_framework import permissions
from rest_framework.decorators import action
from rest_framework.response import Response

from core.pagination import StandardPagination
from core.tenant_utils import get_request_school

from ..models import Admission, AdmissionIntake, Class
from ..serializers import AdmissionIntakeSerializer, AdmissionSerializer
from .base import TenantViewSet


class AdmissionIntakeViewSet(TenantViewSet):
    queryset = AdmissionIntake.objects.all()
    serializer_class = AdmissionIntakeSerializer
    pagination_class = StandardPagination


class AdmissionViewSet(TenantViewSet):
    queryset = Admission.objects.select_related("intake", "school").all()
    serializer_class = AdmissionSerializer
    pagination_class = StandardPagination

    def get_permissions(self):
        """
        Allow public access for submitting applications (create).
        """
        if self.action == "create":
            return [permissions.AllowAny()]
        return super().get_permissions()

    def get_queryset(self):
        qs = super().get_queryset()
        status = self.request.query_params.get("status")
        intake_id = self.request.query_params.get("intake")
        if status:
            qs = qs.filter(status=status)
        if intake_id:
            qs = qs.filter(intake_id=intake_id)
        return qs

    @action(detail=True, methods=["post"], url_path="convert-to-student")
    def convert_to_student(self, request, pk=None):
        admission = self.get_object()
        student_no = request.data.get("student_no")
        class_id = request.data.get("class_id")
        password = request.data.get("password")
        if not password:
            password = os.environ.get("STUDENT_DEFAULT_PASSWORD")
        if not password:
            return Response({"error": "password is required or STUDENT_DEFAULT_PASSWORD must be configured"}, status=400)

        if not student_no or not class_id:
            return Response({"error": "student_no and class_id are required"}, status=400)

        with transaction.atomic():
            # 1. Update Admission status
            admission.status = "accepted"
            admission.reviewed_at = timezone.now()
            admission.reviewed_by = request.user
            admission.save()

            # 2. Create Student
            from ..models import Student

            try:
                target_class = Class.objects.get(pk=class_id, school=admission.school)
            except Class.DoesNotExist:
                return Response({"error": "Class not found"}, status=404)

            student = Student.objects.create(
                school=admission.school,
                student_no=student_no,
                names=admission.child_name,
                gender=admission.child_gender,
                dob=admission.child_dob,
                current_class=target_class,
                parent_name=admission.parent_name,
                parent_email=admission.parent_email,
                parent_phone=admission.parent_phone,
                address=admission.parent_address,
                status="active",
            )

            # 3. Create User for portal access
            from django.contrib.auth.hashers import make_password

            from users.models import User

            school_suffix = student.school.domain if student.school and student.school.domain else "school"
            username = f"{student.student_no}@{school_suffix}"

            if not User.objects.filter(username=username).exists():
                user = User.objects.create(
                    username=username,
                    email=student.parent_email or f"{username}.com",
                    password=make_password(password),
                    role="STUDENT",
                    school=student.school,
                    is_active=True,
                )
                student.user = user
                student.save()

            # 4. Handle Fees from AdmissionPackage (Fee Bundling)
            if admission.intake:
                try:
                    from bursary.models import AdmissionPackage, StudentFee

                    package = AdmissionPackage.objects.prefetch_related("fees").get(intake=admission.intake)
                    fees_to_create = [
                        StudentFee(student=student, fee_item=fee, school=student.school)
                        for fee in package.fees.all()
                    ]
                    if fees_to_create:
                        StudentFee.objects.bulk_create(fees_to_create, ignore_conflicts=True)
                except (ImportError, AdmissionPackage.DoesNotExist):
                    pass

            return Response(
                {
                    "success": True,
                    "message": "Admission successfully converted to student with automated fee assignment.",
                    "student_id": student.id,
                }
            )
