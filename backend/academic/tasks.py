import logging
import os

from celery import shared_task

from django.db import transaction
from django.conf import settings
from django.template.loader import render_to_string

from schools.models import School, SchoolSettings

from .models import Class, ReportCard

logger = logging.getLogger(__name__)


@shared_task(bind=True)
def generate_report_card_pdf(self, report_card_id: int, school_id: int):
    """
    Generate PDF report card server-side.
    Returns presigned URL for download.
    """
    try:
        from weasyprint import HTML

        report_card = ReportCard.objects.select_related("student", "student_class", "school").get(
            id=report_card_id, school_id=school_id
        )

        # Render HTML template
        html_content = render_to_string(
            "academic/report_card.html",
            {
                "report_card": report_card,
                "student": report_card.student,
                "class": report_card.student_class,
                "school": report_card.school,
                "MEDIA_URL": settings.MEDIA_URL,
                "STATIC_URL": settings.STATIC_URL,
            },
        )

        # Generate PDF
        pdf_file = HTML(string=html_content).write_pdf()

        # Save to media
        filename = f"report_cards/{school_id}/rc_{report_card_id}.pdf"
        media_path = os.path.join(settings.MEDIA_ROOT, filename)

        # Ensure directory exists
        os.makedirs(os.path.dirname(media_path), exist_ok=True)

        with open(media_path, "wb") as f:
            f.write(pdf_file)

        # Return URL
        url = f"{settings.MEDIA_URL}{filename}"

        logger.info(f"Generated PDF for report card {report_card_id}: {url}")
        return {"url": url, "filename": filename}

    except Exception as e:
        logger.error(f"PDF generation failed for {report_card_id}: {e}")
        return {"error": str(e)}


@shared_task(bind=True)
def generate_class_report_cards(self, class_id: int, session: str, term: str, school_id: int):
    """
    Batch generate report card PDFs for an entire class.
    Returns list of URLs.
    """
    try:
        from weasyprint import HTML

        reports = ReportCard.objects.filter(
            student_class_id=class_id, session=session, term=term, school_id=school_id
        ).select_related("student", "student_class", "school")

        urls = []
        for report in reports:
            try:
                html_content = render_to_string(
                    "academic/report_card.html",
                    {
                        "report_card": report,
                        "student": report.student,
                        "class": report.student_class,
                        "school": report.school,
                        "MEDIA_URL": settings.MEDIA_URL,
                        "STATIC_URL": settings.STATIC_URL,
                    },
                )

                pdf_file = HTML(string=html_content).write_pdf()
                filename = f"report_cards/{school_id}/rc_{report.id}.pdf"
                media_path = os.path.join(settings.MEDIA_ROOT, filename)

                os.makedirs(os.path.dirname(media_path), exist_ok=True)
                with open(media_path, "wb") as f:
                    f.write(pdf_file)

                urls.append({"report_id": report.id, "url": f"{settings.MEDIA_URL}{filename}"})

            except Exception as e:
                logger.warning(f"Failed to generate PDF for report {report.id}: {e}")

        logger.info(f"Generated {len(urls)} PDFs for class {class_id}")
        return {"generated": len(urls), "urls": urls}

    except Exception as e:
        logger.error(f"Batch PDF generation failed: {e}")
        return {"error": str(e)}


@shared_task(bind=True)
def promote_students_task(self, school_id, session, term):
    """
    Automated promotion task.
    Promotes students who met the threshold to their next class.
    """
    try:
        school = School.objects.get(id=school_id)
        settings = SchoolSettings.objects.get(school=school)
    except (School.DoesNotExist, SchoolSettings.DoesNotExist) as e:
        logger.error(f"Error starting promotion task for school {school_id}: {str(e)}")
        return {"error": "School or settings not found"}

    threshold = settings.promotion_threshold

    # 1. Fetch report cards for the session/term that meet the threshold
    reports = ReportCard.objects.filter(
        school=school, session=session, term=term, average__gte=threshold
    ).select_related("student", "student_class")

    promoted_count = 0
    graduated_count = 0
    errors = []

    with transaction.atomic():
        for report in reports:
            student = report.student
            current_class = report.student_class

            if not current_class:
                continue

            # Graduation check
            if current_class.is_graduation_class:
                student.current_class = None
                # student.status = 'GRADUATED' # Optional: if there's a status field
                student.save(update_fields=["current_class"])
                graduated_count += 1
                continue

            # Promotion check
            next_class = current_class.next_class
            if next_class:
                student.current_class = next_class
                student.save(update_fields=["current_class"])
                promoted_count += 1
            else:
                errors.append(
                    f"Student {student.names} ({student.student_no}) has no next class defined for {current_class.name}"
                )

    result = {
        "status": "completed",
        "promoted": promoted_count,
        "graduated": graduated_count,
        "errors": errors,
        "threshold_used": threshold,
    }

    logger.info(f"Promotion task completed for {school.name}: {result}")
    return result


@shared_task(bind=True)
def generate_school_report_cards(self, school_id, session, term):
    """
    Triggers report card PDF generation for all classes in a school.
    """
    try:
        classes = Class.objects.filter(school_id=school_id)
        for cls in classes:
            generate_class_report_cards.delay(class_id=cls.id, session=session, term=term, school_id=school_id)
        return {"status": "triggered", "classes_count": classes.count()}
    except Exception as e:
        logger.error(f"School report generation failed for {school_id}: {e}")
        return {"error": str(e)}


@shared_task(bind=True, soft_time_limit=900, time_limit=960)
def export_class_report_cards(self, job_id: str, class_id: int, school_id: int, session: str, term: str):
    """Bulk report-card PDF for a class, built by the worker instead of the web request (P8)."""
    from django.core.files.base import ContentFile
    from django.core.files.storage import default_storage

    from core.export_jobs import update_job

    from .utils import ReportCardPDFGenerator

    update_job(job_id, status="running")
    try:
        school = School.objects.get(pk=school_id)
        student_class = Class.objects.get(pk=class_id, school=school)
        buffer = ReportCardPDFGenerator(school).generate_bulk(student_class, session, term)
        path = default_storage.save(f"exports/{school_id}/{job_id}.pdf", ContentFile(buffer.getvalue()))
        update_job(job_id, status="done", path=path)
    except Exception as exc:
        logger.exception("Bulk report card export %s failed", job_id)
        update_job(job_id, status="failed", error="Could not generate the report cards. Please try again.")
        raise exc


@shared_task(bind=True, soft_time_limit=1800, time_limit=1860)
def import_students_csv(self, job_id: int, user_id: int, csv_text: str):
    """Bulk student import (P9). Each row is saved on its own, so one bad row never undoes the others."""
    import csv
    from types import SimpleNamespace

    from django.utils import timezone

    from data_import.models import ImportJob
    from users.models import User

    from .serializers import StudentSerializer

    job = ImportJob.objects.select_related("school").get(pk=job_id)
    user = User.objects.get(pk=user_id)
    school = job.school
    # The serializer resolves the school from the request; give it the importing user's context.
    context = {"request": SimpleNamespace(user=user, tenant=school, query_params={}, data={})}
    class_map = {c.name.lower().strip(): c.pk for c in Class.objects.filter(school=school)}

    job.status = "processing"
    job.save(update_fields=["status"])
    success, errors = 0, []
    try:
        for index, row in enumerate(csv.DictReader(csv_text.splitlines()), start=2):  # row 1 is the header
            class_name = (row.get("class_name") or "").strip()
            data = {
                "student_no": row.get("student_no"),
                "names": row.get("names"),
                "gender": row.get("gender"),
                "dob": row.get("date_of_birth") or None,
                "parent_name": row.get("parent_name"),
                "parent_email": row.get("parent_email"),
                "parent_phone": row.get("parent_phone"),
                "address": row.get("address"),
                "password": row.get("password"),
                "class_id": class_map.get(class_name.lower()),
            }
            # Blank cells mean "not provided", so serializer defaults apply (e.g. no password set yet).
            data = {k: v.strip() if isinstance(v, str) else v for k, v in data.items() if v not in ("", None)}
            try:
                with transaction.atomic():
                    serializer = StudentSerializer(data=data, context=context)
                    if serializer.is_valid():
                        serializer.save(school=school)
                        success += 1
                    else:
                        reason = "; ".join(
                            f"{field}: {', '.join(map(str, msgs))}" for field, msgs in serializer.errors.items()
                        )
                        errors.append({"row": index, "student": row.get("names") or "Unknown", "reason": reason})
            except Exception as exc:
                errors.append({"row": index, "student": row.get("names") or "Unknown", "reason": str(exc)})
            if (success + len(errors)) % 25 == 0:
                ImportJob.objects.filter(pk=job_id).update(
                    processed_rows=success + len(errors), success_rows=success, failed_rows=len(errors)
                )
        job.status = "completed"
    except Exception:
        logger.exception("Student import %s failed", job_id)
        job.status = "failed"
        errors.append({"row": 0, "student": "", "reason": "The import stopped unexpectedly. Rows above were saved."})
    job.processed_rows = success + len(errors)
    job.success_rows = success
    job.failed_rows = len(errors)
    job.errors = errors
    job.completed_at = timezone.now()
    job.save()
