"""Global Search View."""

from django.db import models
from rest_framework import permissions
from rest_framework.response import Response
from rest_framework.views import APIView

from core.tenant_utils import get_request_school

from ..models import Class, Student, Teacher


class GlobalSearchView(APIView):
    """
    Search across Students, Staff, and Classes for the current school.
    """

    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        query = request.query_params.get("q", "")
        if len(query) < 2:
            return Response({"students": [], "staff": [], "classes": []})

        school = get_request_school(request)
        if not school:
            return Response({"error": "No school context found"}, status=400)

        # 1. Search Students
        students = Student.objects.filter(
            models.Q(names__icontains=query) | models.Q(student_no__icontains=query), school=school
        )[:10]

        # 2. Search Staff (Teachers)
        staff = Teacher.objects.filter(
            models.Q(name__icontains=query) | models.Q(email__icontains=query), school=school
        )[:10]

        # 3. Search Classes
        classes = Class.objects.filter(name__icontains=query, school=school)[:10]

        return Response(
            {
                "students": [
                    {
                        "id": s.id,
                        "names": s.names,
                        "student_no": s.student_no,
                        "current_class": s.current_class.name if s.current_class else "N/A",
                    }
                    for s in students
                ],
                "staff": [{"id": s.id, "name": s.name, "staff_type": s.staff_type} for s in staff],
                "classes": [{"id": c.id, "name": c.name} for c in classes],
            }
        )
