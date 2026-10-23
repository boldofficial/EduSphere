"""School structure: sections, and the setup wizard that creates classes, subjects and promotions."""

from rest_framework.response import Response
from rest_framework.views import APIView

from core.permissions import AdminOnly
from core.tenant_utils import get_request_school

from ..curriculum import catalogue
from ..models import Class, SchoolSection
from ..school_setup import apply_plan, build_plan, infer_sections


class SchoolStructureView(APIView):
    """GET the school's sections and the catalogue the wizard offers."""

    permission_classes = [AdminOnly]

    def get(self, request):
        school = get_request_school(request, allow_super_admin_tenant=True)
        sections = [
            {
                "id": s.id,
                "key": s.key,
                "name": s.name,
                "head_title": s.head_title,
                "head_name": s.head_name,
                "class_count": s.classes.count(),
            }
            for s in SchoolSection.objects.filter(school=school)
        ]
        return Response(
            {
                "sections": sections,
                # Schools from before sections existed: what we think they run, for the wizard to confirm.
                "suggested_sections": [] if sections else infer_sections(school),
                "class_count": Class.objects.filter(school=school).count(),
                "class_names": list(Class.objects.filter(school=school).values_list("name", flat=True)),
                "unassigned_classes": Class.objects.filter(school=school, section__isnull=True).count(),
                "catalogue": catalogue(),
            }
        )


class SchoolStructurePreviewView(APIView):
    """POST the wizard's choices; returns exactly what would be created, without saving anything."""

    permission_classes = [AdminOnly]

    def post(self, request):
        school = get_request_school(request, allow_super_admin_tenant=True)
        return Response(build_plan(school, request.data))


class SchoolStructureApplyView(APIView):
    """POST the wizard's choices; creates sections, classes, subjects and promotion links."""

    permission_classes = [AdminOnly]

    def post(self, request):
        school = get_request_school(request, allow_super_admin_tenant=True)
        plan = apply_plan(school, request.data)
        return Response({"detail": "School structure saved.", **plan["summary"]}, status=201)
