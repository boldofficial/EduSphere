"""AI Services for academic tasks."""

import logging
from ..models import AttendanceRecord, ConductEntry
from ..ai_utils import AcademicAI

logger = logging.getLogger(__name__)

class ReportCardAIService:
    """
    Service for student performance analysis and remark generation.
    """

    @staticmethod
    def suggest_remark(report_card):
        """
        Generates an AI-powered remark for a student's report card.
        """
        scores = report_card.scores.all()
        observations = report_card.early_years_observations or []

        attendance_data = {
            "present": AttendanceRecord.objects.filter(
                student=report_card.student,
                school=report_card.school,
                attendance_session__session=report_card.session,
                attendance_session__term=report_card.term,
                status="present",
            ).count(),
            "absent": AttendanceRecord.objects.filter(
                student=report_card.student,
                school=report_card.school,
                attendance_session__session=report_card.session,
                attendance_session__term=report_card.term,
                status="absent",
            ).count(),
        }

        if not scores.exists() and observations:
            status_counts = {"Secure": 0, "Developing": 0, "Emerging": 0}
            for item in observations:
                status = str(item.get("status", "")).strip().title()
                if status in status_counts:
                    status_counts[status] += 1

            strongest = max(status_counts, key=status_counts.get)
            remark = (
                f"{report_card.student.names} is making encouraging early-years progress. "
                f"Current profile: {status_counts['Secure']} secure, "
                f"{status_counts['Developing']} developing, {status_counts['Emerging']} emerging areas. "
                f"Most evidence is in {strongest.lower()} development bands."
            )
            performance_data = {
                "name": report_card.student.names,
                "scores": [],
                "early_years_observations": observations,
                "status_counts": status_counts,
                "conduct": list(
                    ConductEntry.objects.filter(student=report_card.student, school=report_card.school)
                    .order_by("-date")[:20]
                    .values("trait", "score", "remark", "date")
                ),
                "attendance": attendance_data,
            }

            report_card.ai_performance_remark = remark
            report_card.save(update_fields=["ai_performance_remark"])
            return remark, performance_data
        if not scores.exists():
            remark = "No academic data available for this term."
            performance_data = {
                "name": report_card.student.names,
                "scores": [],
                "early_years_observations": observations,
                "conduct": [],
                "attendance": attendance_data,
            }
            report_card.ai_performance_remark = remark
            report_card.save(update_fields=["ai_performance_remark"])
            return remark, performance_data

        # Aggregating performance data for the AI context
        performance_data = {
            "name": report_card.student.names,
            "scores": [{"subject": s.subject.name, "score": s.total} for s in scores],
            "early_years_observations": observations,
            "conduct": list(
                ConductEntry.objects.filter(student=report_card.student, school=report_card.school)
                .order_by("-date")[:20]
                .values("trait", "score", "remark", "date")
            ),
            "attendance": attendance_data,
        }

        try:
            ai = AcademicAI()
            remark = ai.generate_student_remark(performance_data)
        except Exception as e:
            logger.error(f"AI generation failed: {e}")
            remark = None

        if not remark:
            # Fallback heuristic remark
            excellent_count = scores.filter(total__gte=80).count()
            poor_count = scores.filter(total__lt=50).count()

            if excellent_count > (scores.count() / 2):
                remark = f"{report_card.student.names} has shown exceptional performance this term. Keep up the excellent work!"
            elif poor_count > 0:
                remark = f"{report_card.student.names} needs to focus more on certain subjects where performance was below average."
            else:
                remark = f"A good performance overall by {report_card.student.names}. Consistent effort will lead to even better results."

        # Save to the report card
        report_card.ai_performance_remark = remark
        report_card.save(update_fields=["ai_performance_remark"])

        return remark, performance_data
