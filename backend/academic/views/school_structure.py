"""School structure: sections, and the setup wizard that creates classes, subjects and promotions."""

from rest_framework.response import Response
from rest_framework.views import APIView

from core.permissions import AdminOnly
from core.tenant_utils import get_request_school

from ..curriculum import catalogue
from ..models import Class, SchoolSection
from ..school_setup import apply_plan, build_plan, infer_sections


def section_assessment_config(section):
    from ..assessment import DEFAULT_ASSESSMENT, PARTS

    saved = section.assessment or {}
    return {key: {**DEFAULT_ASSESSMENT[key], **saved.get(key, {})} for key in PARTS}


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
                "assessment": section_assessment_config(s),
                "grading_scheme": s.grading_scheme_id,
                "show_position": s.show_position,
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


class SchoolSectionView(APIView):
    """PATCH a section: its name, head, assessment parts, grading scheme and whether positions show."""

    permission_classes = [AdminOnly]

    def patch(self, request, pk):
        from rest_framework import serializers as drf_serializers

        from ..assessment import clean_assessment
        from ..models import GradingScheme

        school = get_request_school(request, allow_super_admin_tenant=True)
        section = SchoolSection.objects.filter(school=school, pk=pk).first()
        if not section:
            return Response({"detail": "Section not found."}, status=404)
        data = request.data
        changed = []
        try:
            if "assessment" in data:
                section.assessment = clean_assessment(data["assessment"])
                changed.append("assessment")
        except drf_serializers.ValidationError as error:
            detail = error.detail[0] if isinstance(error.detail, list) else error.detail
            return Response({"detail": str(detail)}, status=400)
        if "grading_scheme" in data:
            scheme_id = data["grading_scheme"]
            if scheme_id in (None, ""):
                section.grading_scheme = None
            else:
                scheme = GradingScheme.objects.filter(school=school, pk=scheme_id).first()
                if not scheme:
                    return Response({"detail": "Grading scheme not found."}, status=400)
                section.grading_scheme = scheme
            changed.append("grading_scheme")
        if "show_position" in data:
            section.show_position = bool(data["show_position"])
            changed.append("show_position")
        for field, limit in (("name", 120), ("head_name", 120), ("head_title", 60)):
            if field in data:
                setattr(section, field, " ".join(str(data[field] or "").split())[:limit])
                changed.append(field)
        if changed:
            section.save(update_fields=changed)
        return Response(
            {
                "id": section.id,
                "name": section.name,
                "head_title": section.head_title,
                "head_name": section.head_name,
                "assessment": section_assessment_config(section),
                "grading_scheme": section.grading_scheme_id,
                "show_position": section.show_position,
            }
        )
