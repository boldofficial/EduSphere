import logging

from celery import shared_task

logger = logging.getLogger(__name__)


import logging

logger = logging.getLogger(__name__)


@shared_task
def debug_task_log():
    """Simple task to verify celery is working."""
    logger.info("Celery task executed successfully!")
    return "Success"


@shared_task
def cleanup_old_logs():
    """Example periodic task."""
    logger.info("Cleaning up old logs...")
    # Add cleanup logic here
    return "Cleaned"

@shared_task
def cleanup_expired_sessions():
    """
    Cleans up expired Django sessions.
    Runs daily via Celery Beat.
    """
    from django.core.management import call_command
    try:
        call_command('clearsessions')
        logger.info("Successfully cleaned up expired sessions.")
        return True
    except Exception as e:
        logger.error(f"Failed to clean up expired sessions: {e}")
        return False

@shared_task(ignore_result=True)
def log_activity_async(action, school_id, user_id, description, metadata):
    """
    Asynchronously write an audit log entry to prevent blocking API requests.
    """
    from core.models import GlobalActivityLog
    GlobalActivityLog.objects.create(
        action=action,
        school_id=school_id,
        user_id=user_id,
        description=description,
        metadata=metadata,
    )
