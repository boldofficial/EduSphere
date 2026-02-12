import logging
from celery import shared_task
from django.db import transaction
from schools.models import School, SchoolSettings
from .models import Student, ReportCard, Class

logger = logging.getLogger(__name__)

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
        school=school,
        session=session,
        term=term,
        average__gte=threshold
    ).select_related('student', 'student_class')

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
                student.save(update_fields=['current_class'])
                graduated_count += 1
                continue

            # Promotion check
            next_class = current_class.next_class
            if next_class:
                student.current_class = next_class
                student.save(update_fields=['current_class'])
                promoted_count += 1
            else:
                errors.append(f"Student {student.names} ({student.student_no}) has no next class defined for {current_class.name}")

    result = {
        "status": "completed",
        "promoted": promoted_count,
        "graduated": graduated_count,
        "errors": errors,
        "threshold_used": threshold
    }
    
    logger.info(f"Promotion task completed for {school.name}: {result}")
    return result
