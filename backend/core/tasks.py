from celery import shared_task

import logging

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
