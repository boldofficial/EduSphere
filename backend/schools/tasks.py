import logging
from celery import shared_task
from django.utils import timezone
from .models import Subscription

logger = logging.getLogger(__name__)


@shared_task
def check_subscription_expiry():
    """
    Automated task to check for expired subscriptions and update their status.
    Runs daily via Celery Beat.
    """
    now_date = timezone.now().date()

    # Find all active or pending subscriptions that have passed their end_date
    expired_subs = Subscription.objects.filter(
        end_date__lt=now_date,
    ).exclude(status="expired")

    count = 0
    for sub in expired_subs:
        sub.status = "expired"
        sub.save(update_fields=["status"])

        # Notify the school (its address and its admins)
        from emails.notify import queue_template_email, school_login_url, school_recipients

        queue_template_email(
            "subscription_expired",
            school_recipients(sub.school),
            {"school_name": sub.school.name, "login_url": school_login_url(sub.school)},
        )

        logger.info(f"Subscription {sub.id} for school {sub.school.name} marked as expired.")
        count += 1

    logger.info(f"Processed {count} expired subscriptions.")
    return count


@shared_task
def auto_report_generation():
    """
    Automated task to generate end-of-term reports for all active schools.
    Scheduled to run based on term calendar.
    """
    from schools.models import School, SchoolSettings
    from academic.tasks import generate_school_report_cards

    # Only process schools with active subscriptions
    active_schools = School.objects.filter(subscriptions__status="active").distinct()

    count = 0
    for school in active_schools:
        settings = SchoolSettings.objects.filter(school=school).first()
        if settings:
            generate_school_report_cards.delay(
                school_id=school.id, session=settings.current_session, term=settings.current_term
            )
            count += 1
            logger.info(f"Triggered auto-report generation for {school.name}")

    return f"Triggered reports for {count} schools"
