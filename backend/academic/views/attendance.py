"""Attendance ViewSets."""

from core.pagination import LargePagination, StandardPagination
from core.tenant_utils import get_request_school
from schools.models import SchoolSettings

from ..models import AttendanceRecord, AttendanceSession
from ..serializers import AttendanceRecordSerializer, AttendanceSessionSerializer
from .base import TenantViewSet


def _is_truthy(value):
    if value is None:
        return False
    return str(value).strip().lower() in {"1", "true", "yes", "on"}


class AttendanceSessionViewSet(TenantViewSet):
    queryset = AttendanceSession.objects.select_related("student_class", "school").all()
    serializer_class = AttendanceSessionSerializer
    pagination_class = StandardPagination

    def get_queryset(self):
        qs = super().get_queryset()
        user = self.request.user

        # Students/parents should only see attendance sessions related to their child/ward.
        if user.role == "STUDENT" and hasattr(user, "student_profile"):
            qs = qs.filter(student_class=user.student_profile.current_class).distinct()
        elif user.role == "PARENT":
            qs = qs.filter(records__student__parent_email=user.email).distinct()

        class_id = self.request.query_params.get("class_id")
        date = self.request.query_params.get("date")
        session = self.request.query_params.get("session")
        term = self.request.query_params.get("term")
        include_all_periods = _is_truthy(self.request.query_params.get("include_all_periods"))

        if not include_all_periods:
            school = get_request_school(self.request)
            if school:
                settings_obj = SchoolSettings.objects.filter(school=school).only("current_session", "current_term").first()
                if settings_obj:
                    session = session or settings_obj.current_session
                    term = term or settings_obj.current_term

        if class_id:
            qs = qs.filter(student_class_id=class_id)
        if date:
            qs = qs.filter(date=date)
        if session:
            qs = qs.filter(session=session)
        if term:
            qs = qs.filter(term=term)
        return qs


class AttendanceRecordViewSet(TenantViewSet):
    queryset = AttendanceRecord.objects.select_related("attendance_session", "student", "school").all()
    serializer_class = AttendanceRecordSerializer
    pagination_class = LargePagination

    def get_queryset(self):
        qs = super().get_queryset()
        user = self.request.user
        session = self.request.query_params.get("session")
        term = self.request.query_params.get("term")
        include_all_periods = _is_truthy(self.request.query_params.get("include_all_periods"))

        if user.role == "STUDENT" and hasattr(user, "student_profile"):
            qs = qs.filter(student=user.student_profile)
        elif user.role == "PARENT":
            qs = qs.filter(student__parent_email=user.email)

        if not include_all_periods:
            school = get_request_school(self.request)
            if school:
                settings_obj = SchoolSettings.objects.filter(school=school).only("current_session", "current_term").first()
                if settings_obj:
                    session = session or settings_obj.current_session
                    term = term or settings_obj.current_term

        if session:
            qs = qs.filter(attendance_session__session=session)
        if term:
            qs = qs.filter(attendance_session__term=term)
        return qs
