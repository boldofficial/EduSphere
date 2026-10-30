"""External exams (WAEC, NECO, BECE, JAMB…): candidates, subjects, results and the school's figures."""

from django.db import transaction
from rest_framework import permissions, serializers
from rest_framework.decorators import action
from rest_framework.response import Response

from core.pagination import StandardPagination
from core.permissions import ADMIN, EveryoneReadAdminWrite, StaffReadAdminWrite, is_learner, role_of

from ..external_exams import candidate_summary, exam_summary, normal_grade
from ..models import ExternalExam, ExternalExamCandidate, Student
from ..subject_choices import class_subject_names, effective_subjects
from .base import TenantViewSet, scope_to_learner


class ExternalExamSerializer(serializers.ModelSerializer):
    target_class_name = serializers.CharField(source="target_class.name", read_only=True, default="")
    body_label = serializers.CharField(source="get_body_display", read_only=True)
    candidate_count = serializers.IntegerField(read_only=True, default=0)

    class Meta:
        model = ExternalExam
        fields = [
            "id",
            "body",
            "body_label",
            "name",
            "year",
            "target_class",
            "target_class_name",
            "registration_deadline",
            "fee",
            "max_subjects",
            "notes",
            "candidate_count",
            "created_at",
        ]
        read_only_fields = ["created_at"]

    def validate_max_subjects(self, value):
        if not 1 <= value <= 20:
            raise serializers.ValidationError("Between 1 and 20 subjects.")
        return value


class CandidateSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(source="student.names", read_only=True)
    student_no = serializers.CharField(source="student.student_no", read_only=True)
    class_name = serializers.CharField(source="student.current_class.name", read_only=True, default="")
    summary = serializers.SerializerMethodField()

    class Meta:
        model = ExternalExamCandidate
        fields = [
            "id",
            "exam",
            "student",
            "student_name",
            "student_no",
            "class_name",
            "candidate_number",
            "subjects",
            "results",
            "status",
            "summary",
        ]
        read_only_fields = ["exam", "student"]

    def get_summary(self, obj):
        return candidate_summary(obj.exam.body, obj.results or {})

    def to_representation(self, instance):
        data = super().to_representation(instance)
        request = self.context.get("request")
        # Students and parents see results only once the school marks them released.
        if request is not None and is_learner(request.user) and instance.status != "released":
            data["results"] = {}
            data["summary"] = None
        return data

    def validate_subjects(self, value):
        if not isinstance(value, list) or not all(isinstance(s, str) and s.strip() for s in value):
            raise serializers.ValidationError("Send subjects as a list of names.")
        names = list(dict.fromkeys(s.strip() for s in value))
        limit = self.instance.exam.max_subjects if self.instance else 20
        if len(names) > limit:
            raise serializers.ValidationError(f"At most {limit} subjects for this exam.")
        return names

    def validate_results(self, value):
        if not isinstance(value, dict):
            raise serializers.ValidationError("Send results as {subject: grade}.")
        return {str(k).strip(): normal_grade(v) for k, v in value.items() if str(k).strip() and normal_grade(v)}


class ExternalExamViewSet(TenantViewSet):
    """GET/POST /academic/external-exams/; admins manage, staff view."""

    queryset = ExternalExam.objects.select_related("target_class").all()
    serializer_class = ExternalExamSerializer
    pagination_class = StandardPagination
    permission_classes = [permissions.IsAuthenticated, StaffReadAdminWrite]

    def get_queryset(self):
        from django.db.models import Count

        return super().get_queryset().annotate(candidate_count=Count("candidates"))

    def _admin_only(self, request):
        if role_of(request.user) not in ADMIN:
            return Response({"detail": "Only admins can change exam entries."}, status=403)
        return None

    @action(detail=True, methods=["post"])
    def register(self, request, pk=None):
        """
        Enter students as candidates. Body: {"student_ids": [...]} or nothing to enter the whole target
        class. Subjects default to what each student takes (up to the exam's maximum).
        """
        if denied := self._admin_only(request):
            return denied
        exam = self.get_object()
        students = Student.objects.filter(school=exam.school, status="active").select_related("current_class")
        ids = request.data.get("student_ids")
        if ids:
            students = students.filter(pk__in=ids)
        elif exam.target_class_id:
            students = students.filter(current_class_id=exam.target_class_id)
        else:
            return Response({"detail": "Choose students, or set the exam's class first."}, status=400)

        existing = set(exam.candidates.values_list("student_id", flat=True))
        offered = {}
        created = []
        with transaction.atomic():
            for student in students:
                if student.pk in existing:
                    continue
                cls = student.current_class
                subjects = []
                if cls is not None:
                    offered.setdefault(cls.pk, class_subject_names(cls))
                    subjects = effective_subjects(student, cls, offered[cls.pk])[: exam.max_subjects]
                created.append(ExternalExamCandidate(school=exam.school, exam=exam, student=student, subjects=subjects))
            ExternalExamCandidate.objects.bulk_create(created)
        return Response({"registered": len(created), "already_entered": len(existing)})

    @action(detail=True, methods=["post"], url_path="import-results")
    def import_results(self, request, pk=None):
        """
        Results as rows: {"rows": [{"candidate": candidate no. or admission no., "subject", "grade"}]}
        (pasted from the exam body's result sheet). Unknown candidates are reported, not guessed.
        """
        if denied := self._admin_only(request):
            return denied
        exam = self.get_object()
        rows = request.data.get("rows") or []
        if not isinstance(rows, list) or not rows:
            return Response({"detail": "No results to import."}, status=400)
        candidates = list(exam.candidates.select_related("student"))
        lookup = {}
        for c in candidates:
            for key in (c.candidate_number, c.student.student_no):
                if key:
                    lookup[key.strip().upper()] = c
        changed, unknown = {}, []
        for row in rows:
            key = str(row.get("candidate") or "").strip().upper()
            subject = str(row.get("subject") or "").strip()
            grade = normal_grade(row.get("grade"))
            if not key or not subject or not grade:
                continue
            candidate = lookup.get(key)
            if candidate is None:
                unknown.append(key)
                continue
            candidate.results = {**(candidate.results or {}), subject: grade}
            if candidate.status in ("registered", "sat"):
                candidate.status = "released"
            changed[candidate.pk] = candidate
        ExternalExamCandidate.objects.bulk_update(changed.values(), ["results", "status"])
        return Response({"updated": len(changed), "unknown_candidates": sorted(set(unknown))[:50]})

    @action(detail=True, methods=["get"])
    def summary(self, request, pk=None):
        exam = self.get_object()
        return Response(exam_summary(exam, list(exam.candidates.all())))


class ExternalExamCandidateViewSet(TenantViewSet):
    """
    GET /academic/external-exam-candidates/?exam=<id>. Staff see all; students and parents only
    their own entries (and results). Admins edit candidate numbers, subjects, results and status.
    """

    queryset = ExternalExamCandidate.objects.select_related("exam", "student", "student__current_class").all()
    serializer_class = CandidateSerializer
    pagination_class = StandardPagination
    permission_classes = [permissions.IsAuthenticated, EveryoneReadAdminWrite]
    http_method_names = ["get", "patch", "delete", "head", "options"]

    def get_queryset(self):
        qs = scope_to_learner(super().get_queryset(), self.request.user)
        exam = self.request.query_params.get("exam")
        if exam:
            qs = qs.filter(exam_id=exam)
        return qs
