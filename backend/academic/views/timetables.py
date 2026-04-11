"""Timetable and Period ViewSets."""

from django.db import transaction
from rest_framework.decorators import action
from rest_framework.response import Response

from core.pagination import LargePagination, StandardPagination
from core.tenant_utils import get_request_school

from ..models import Period, Timetable, TimetableEntry
from ..serializers import PeriodSerializer, TimetableEntrySerializer, TimetableSerializer
from .base import TenantViewSet


class PeriodViewSet(TenantViewSet):
    queryset = Period.objects.select_related("school").all()
    serializer_class = PeriodSerializer
    pagination_class = StandardPagination

    @action(detail=False, methods=["post"], url_path="setup-defaults")
    def setup_defaults(self, request):
        """
        Creates a standard set of periods for the school.
        """
        school = get_request_school(request)

        if not school:
            return Response({"error": "School context not found"}, status=400)

        if Period.objects.filter(school=school).exists():
            return Response({"message": "Periods already exist for this school"}, status=200)

        # Standard Nigerian School Day (approx)
        default_periods = [
            ("Assembly", "08:00:00", "08:15:00", "Assembly"),
            ("Period 1", "08:15:00", "08:55:00", "Regular"),
            ("Period 2", "08:55:00", "09:35:00", "Regular"),
            ("Period 3", "09:35:00", "10:15:00", "Regular"),
            ("Short Break", "10:15:00", "10:30:00", "Break"),
            ("Period 4", "10:30:00", "11:10:00", "Regular"),
            ("Period 5", "11:10:00", "11:50:00", "Regular"),
            ("Long Break", "11:50:00", "12:30:00", "Break"),
            ("Period 6", "12:30:00", "13:10:00", "Regular"),
            ("Period 7", "13:10:00", "13:50:00", "Regular"),
            ("Period 8", "13:50:00", "14:30:00", "Regular"),
        ]

        created_periods = []
        with transaction.atomic():
            for name, start, end, cat in default_periods:
                p = Period.objects.create(school=school, name=name, start_time=start, end_time=end, category=cat)
                created_periods.append(p.id)

        self.invalidate_cache()
        return Response(
            {"message": f"Successfully created {len(created_periods)} default periods", "period_ids": created_periods},
            status=201,
        )


class TimetableViewSet(TenantViewSet):
    queryset = (
        Timetable.objects.select_related("student_class", "school")
        .prefetch_related("entries__subject", "entries__teacher")
        .all()
    )
    serializer_class = TimetableSerializer
    pagination_class = StandardPagination

    def get_queryset(self):
        qs = super().get_queryset()
        user = self.request.user
        if user.role == "STUDENT" and hasattr(user, "student_profile"):
            qs = qs.filter(student_class=user.student_profile.current_class)
        return qs


class TimetableEntryViewSet(TenantViewSet):
    queryset = TimetableEntry.objects.select_related("timetable", "period", "subject", "teacher", "school").all()
    serializer_class = TimetableEntrySerializer
    pagination_class = LargePagination

    def get_queryset(self):
        qs = super().get_queryset()
        user = self.request.user
        if user.role == "STUDENT" and hasattr(user, "student_profile"):
            qs = qs.filter(timetable__student_class=user.student_profile.current_class)
        return qs
