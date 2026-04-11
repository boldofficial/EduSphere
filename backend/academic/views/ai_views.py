"""AI-powered views: Insights, Timetable Generation, Predictions, Lesson Plans, Grade Trends."""

import collections
import logging

from django.db import models, transaction
from rest_framework import permissions
from rest_framework.exceptions import PermissionDenied
from rest_framework.response import Response
from rest_framework.views import APIView

from core.tenant_utils import get_request_school

from ..ai_utils import AcademicAI
from ..models import (
    AttendanceRecord,
    AttendanceSession,
    Class,
    ConductEntry,
    Period,
    ReportCard,
    Student,
    SubjectTeacher,
    Teacher,
    Timetable,
    TimetableEntry,
)

logger = logging.getLogger(__name__)


class AIInsightsView(APIView):
    """
    Term-wide insights for admins based on all student data.
    """

    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        if request.user.role not in ("SCHOOL_ADMIN", "SUPER_ADMIN"):
            raise PermissionDenied("Only administrators can access cross-student AI insights.")

        school = get_request_school(request)
        if not school:
            return Response({"error": "No school context found"}, status=400)

        session = request.query_params.get("session")
        term = request.query_params.get("term")

        if not session or not term:
            return Response({"error": "Session and term required"}, status=400)

        # Gather summary data
        total_students = Student.objects.filter(school=school, status="active").count()
        report_cards = ReportCard.objects.filter(school=school, session=session, term=term)

        at_risk_count = report_cards.filter(average__lt=50).count()

        # Simple attendance average
        attendance_records = AttendanceRecord.objects.filter(
            school=school, attendance_session__session=session, attendance_session__term=term
        )
        total_att = attendance_records.count()
        present_att = attendance_records.filter(status__iexact="present").count()
        avg_attendance = (present_att / total_att * 100) if total_att > 0 else 0

        summary_data = {
            "at_risk_count": at_risk_count,
            "average_attendance": round(avg_attendance, 1),
            "top_subjects": ["Mathematics", "English"],  # Placeholder for actual trend analysis
            "trends": {"average_score": report_cards.aggregate(models.Avg("average"))["average__avg"] or 0},
        }

        ai = AcademicAI()
        insights = ai.generate_executive_insights(summary_data)

        return Response(
            {"insights": insights, "summary": summary_data, "term_info": {"session": session, "term": term}}
        )


class AITimetableGenerateView(APIView):
    """
    School-wide AI Timetable Generator.
    """

    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        if request.user.role not in ("SCHOOL_ADMIN", "SUPER_ADMIN"):
            raise PermissionDenied("Only administrators can trigger AI timetable generation.")

        school = get_request_school(request)
        if not school:
            return Response({"error": "No school context found"}, status=400)

        # Gather Data
        classes_qs = Class.objects.filter(school=school)
        teachers_qs = Teacher.objects.filter(school=school, staff_type="ACADEMIC")
        periods_qs = Period.objects.filter(school=school).order_by("start_time")

        school_data = {
            "classes": [],
            "teachers": [],
            "periods": [],
            "days": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
        }

        for c in classes_qs:
            class_subjects = []
            for s in c.subjects.all():
                # Defaulting to 4 periods per week
                # We send the real Subject ID as the identifier to simplify saving
                class_subjects.append({"id": str(s.id), "name": s.name, "periods_per_week": 4})
            school_data["classes"].append({"id": str(c.id), "name": c.name, "subjects": class_subjects})

        for t in teachers_qs:
            # Expertise is inferred from SubjectTeacher if available
            expertise = list(SubjectTeacher.objects.filter(teacher=t).values_list("subject", flat=True).distinct())
            school_data["teachers"].append({"id": str(t.id), "name": t.name, "expertise": expertise})

        for p in periods_qs:
            school_data["periods"].append({"id": str(p.id), "name": p.name, "category": p.category})

        ai = AcademicAI()
        try:
            entries = ai.generate_timetable(school_data)
        except Exception as e:
            logger.error(f"AI Timetable unexpected crash: {str(e)}")
            return Response({"error": f"Internal AI Error: {str(e)}"}, status=500)

        if not entries:
            # Check if it was a parsing error or a model configuration issue
            if ai.model is None:
                return Response(
                    {"error": "AI model not configured. Please check your API keys in Platform Settings."}, status=500
                )
            return Response(
                {
                    "error": "AI failed to generate a valid timetable. This usually happens when teacher expertise is not set up correctly."
                },
                status=500,
            )

        # Prefetch classes and timetables to avoid N+1 queries during saving
        classes_map = {str(c.id): c for c in classes_qs}
        timetables_map = {
            str(t.student_class_id): t for t in Timetable.objects.filter(student_class__in=classes_qs, school=school)
        }

        entries_to_create = []

        with transaction.atomic():
            for entry_data in entries:
                try:
                    class_id = str(entry_data["class_id"])
                    if class_id not in classes_map:
                        continue

                    c = classes_map[class_id]

                    # Get or Create Timetable for class from cache-map
                    if class_id in timetables_map:
                        timetable = timetables_map[class_id]
                    else:
                        timetable, _ = Timetable.objects.get_or_create(
                            student_class=c,
                            school=school,
                            defaults={"title": f"{c.name} Weekly Schedule", "is_active": True},
                        )
                        timetables_map[class_id] = timetable

                    # Delete selective slot
                    TimetableEntry.objects.filter(
                        timetable=timetable, day_of_week=entry_data["day"], period_id=entry_data["period_id"]
                    ).delete()

                    teacher_id = entry_data.get("teacher_id")

                    entries_to_create.append(
                        TimetableEntry(
                            school=school,
                            timetable=timetable,
                            day_of_week=entry_data["day"],
                            period_id=entry_data["period_id"],
                            subject_id=entry_data["subject_id"],
                            teacher_id=teacher_id if teacher_id else None,
                        )
                    )
                except Exception as e:
                    logger.error(f"Error processing AI Timetable Entry: {str(e)}")
                    continue

            # Bulk Create all entries
            if entries_to_create:
                TimetableEntry.objects.bulk_create(entries_to_create)

        return Response({"success": True, "message": "Timetable generated successfully"})


class GradeTrendView(APIView):
    """
    Dedicated API for student and class performance trends.
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        student_id = request.query_params.get("student_id")
        class_id = request.query_params.get("class_id")
        school = get_request_school(request)

        if not school:
            return Response({"error": "No school context found"}, status=400)

        if student_id:
            try:
                student = Student.objects.get(id=student_id, school=school)
                reports = ReportCard.objects.filter(student=student, school=school).order_by("created_at")

                return Response({
                    "student_id": student.id,
                    "student_name": student.names,
                    "trend": student.performance_trend,
                    "history": [
                        {
                            "id": r.id,
                            "session": r.session,
                            "term": r.term,
                            "average": r.average,
                            "trend": r.performance_trend
                        } for r in reports
                    ]
                })
            except Student.DoesNotExist:
                return Response({"error": "Student not found"}, status=404)

        if class_id:
            try:
                student_class = Class.objects.get(id=class_id, school=school)
                students = Student.objects.filter(current_class=student_class, school=school)

                return Response([
                    {
                        "student_id": s.id,
                        "student_name": s.names,
                        "trend": s.performance_trend
                    } for s in students
                ])
            except Class.DoesNotExist:
                return Response({"error": "Class not found"}, status=404)

        return Response({"error": "student_id or class_id required"}, status=400)


class AIPredictiveInsightsView(APIView):
    """
    AI-powered predictive analytics for student performance.
    GET /academic/predictive-insights/?class_id=X&session=Y&term=Z
    """

    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        school = get_request_school(request)
        if not school:
            return Response({"error": "No school context found"}, status=400)

        class_id = request.query_params.get("class_id")
        session = request.query_params.get("session", "")
        term = request.query_params.get("term", "")

        if not class_id:
            return Response({"error": "class_id is required"}, status=400)

        try:
            student_class = Class.objects.get(id=class_id, school=school)
        except Class.DoesNotExist:
            return Response({"error": "Class not found"}, status=404)

        students = Student.objects.filter(school=school, current_class=student_class, status="active")
        student_ids = list(students.values_list("id", flat=True))

        # 1. Bulk fetch current term report card and scores
        current_reports = {
            r.student_id: r
            for r in ReportCard.objects.filter(student_id__in=student_ids, session=session, term=term, school=school)
            .prefetch_related("scores__subject")
            .all()
        }

        # 2. Bulk fetch attendance rate constants and counts
        total_sessions = AttendanceSession.objects.filter(
            student_class=student_class, school=school, session=session, term=term
        ).count()

        attendance_counts = {
            r["student"]: r["count"]
            for r in AttendanceRecord.objects.filter(
                attendance_session__student_class=student_class,
                attendance_session__school=school,
                attendance_session__session=session,
                attendance_session__term=term,
                student_id__in=student_ids,
                status="present",
            )
            .values("student")
            .annotate(count=models.Count("id"))
        }

        # 3. Bulk fetch conduct scores (latest 10 per student)
        conduct_map = collections.defaultdict(list)
        all_conduct = (
            ConductEntry.objects.filter(student_id__in=student_ids, school=school).order_by("-date").all()
        )
        for c in all_conduct:
            if len(conduct_map[c.student_id]) < 10:
                conduct_map[c.student_id].append({"trait": c.trait, "score": c.score})

        # 4. Bulk fetch historical averages (past terms for all students)
        historical_reports = collections.defaultdict(list)
        all_past_reports = (
            ReportCard.objects.filter(student_id__in=student_ids, school=school)
            .exclude(session=session, term=term)
            .order_by("session", "term")
            .values("student_id", "average")
        )
        for r in all_past_reports:
            historical_reports[r["student_id"]].append(r["average"])

        ai = AcademicAI()
        predictions = []

        for student in students:
            # 1. Process current term report card and scores
            report = current_reports.get(student.id)

            scores_data = []
            current_avg = 0
            if report:
                current_avg = report.average
                for score in report.scores.all():
                    scores_data.append(
                        {
                            "subject": score.subject.name,
                            "ca1": score.ca1,
                            "ca2": score.ca2,
                            "exam": score.exam,
                            "total": score.total,
                            "grade": score.grade,
                        }
                    )

            # 2. Process attendance rate
            present_count = attendance_counts.get(student.id, 0)
            attendance_rate = (present_count / total_sessions * 100) if total_sessions > 0 else 100

            # 3. Process conduct scores
            conduct_data = conduct_map.get(student.id, [])

            # 4. Process historical averages
            historical_avgs = historical_reports.get(student.id, [])[:6]

            # 5. Call AI prediction
            student_payload = {
                "name": student.names,
                "class_name": student_class.name,
                "scores": scores_data,
                "average": current_avg,
                "attendance_rate": round(attendance_rate, 1),
                "conduct_scores": conduct_data,
                "historical_averages": historical_avgs,
            }

            prediction = ai.predict_student_performance(student_payload)

            predictions.append(
                {
                    "student_id": student.id,
                    "student_name": student.names,
                    "student_no": student.student_no,
                    "current_average": current_avg,
                    "attendance_rate": round(attendance_rate, 1),
                    "prediction": prediction
                    or {
                        "risk_level": "medium" if current_avg < 50 else "low",
                        "predicted_average": current_avg,
                        "confidence": 0.5,
                        "key_concerns": [],
                        "strengths": [],
                        "recommendations": ["Insufficient data for detailed prediction."],
                    },
                }
            )

        # Summary counts
        high_risk = sum(1 for p in predictions if p["prediction"].get("risk_level") == "high")
        medium_risk = sum(1 for p in predictions if p["prediction"].get("risk_level") == "medium")
        low_risk = sum(1 for p in predictions if p["prediction"].get("risk_level") == "low")

        return Response(
            {
                "class_name": student_class.name,
                "session": session,
                "term": term,
                "summary": {
                    "total_students": len(predictions),
                    "high_risk": high_risk,
                    "medium_risk": medium_risk,
                    "low_risk": low_risk,
                },
                "predictions": predictions,
            }
        )


class AILessonPlanView(APIView):
    """
    AI-powered lesson plan generation.
    POST /academic/ai-lesson-plan/
    Body: { subject, class_name, topic, duration_minutes, objectives?, notes? }
    """

    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        if request.user.role not in ("SCHOOL_ADMIN", "SUPER_ADMIN", "TEACHER"):
            raise PermissionDenied("Only staff members can generate AI lesson plans.")

        subject = request.data.get("subject")
        class_name = request.data.get("class_name")
        topic = request.data.get("topic")
        duration = request.data.get("duration_minutes", 45)

        if not all([subject, class_name, topic]):
            return Response({"error": "subject, class_name, and topic are required."}, status=400)

        ai = AcademicAI()
        plan = ai.generate_lesson_plan(
            {
                "subject": subject,
                "class_name": class_name,
                "topic": topic,
                "duration_minutes": duration,
                "objectives": request.data.get("objectives", ""),
                "notes": request.data.get("notes", ""),
            }
        )

        if plan:
            return Response({"plan": plan, "message": "Lesson plan generated successfully."})
        else:
            return Response({"error": "AI lesson plan generation failed. Check your API key."}, status=500)
