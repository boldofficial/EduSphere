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


@shared_task
def monitor_pgbouncer_pools():
    """
    Monitors PgBouncer pool utilization and alerts if above threshold.
    Queries 'SHOW POOLS' on the pgbouncer virtual database.
    """
    import os
    import psycopg2
    from django.conf import settings

    # Use the pgbouncer virtual database for stats
    # We use the same credentials as the main DB but connect to port 6432
    db_url = os.environ.get("DATABASE_URL")
    if not db_url or "pgbouncer" not in db_url:
        return "Skipped: Not using PgBouncer"

    # Rewrite URL for admin console access
    # From: postgres://user:pass@pgbouncer:5432/db
    # To:   postgres://user:pass@pgbouncer:6432/pgbouncer
    admin_url = db_url.replace(":5432/", ":6432/pgbouncer")

    try:
        conn = psycopg2.connect(admin_url)
        conn.autocommit = True
        with conn.cursor() as cursor:
            cursor.execute("SHOW POOLS")
            columns = [desc[0] for desc in cursor.description]
            pools = [dict(zip(columns, row)) for row in cursor.fetchall()]

        conn.close()

        alerts = []
        threshold = 0.75  # 75% utilization

        for pool in pools:
            cl_active = pool.get("cl_active", 0)
            cl_waiting = pool.get("cl_waiting", 0)
            maxwait = pool.get("maxwait", 0)
            
            # Use MAX_CLIENT_CONN from env or default
            max_conn = int(os.environ.get("MAX_CLIENT_CONN", 500))
            utilization = cl_active / max_conn if max_conn > 0 else 0

            if utilization > threshold or cl_waiting > 0:
                alerts.append(
                    f"Pool {pool.get('database')} utilization: {utilization:.1%}. "
                    f"Active: {cl_active}, Waiting: {cl_waiting}, MaxWait: {maxwait}s"
                )

        if alerts:
            message = "CRITICAL: PgBouncer Load Alert!\n" + "\n".join(alerts)
            logger.error(message)
            
            # Fire Termii SMS alert to ops number
            ops_number = os.environ.get("OPS_PHONE_NUMBER")
            if ops_number:
                from core.notification_utils import get_termii_service
                try:
                    termii = get_termii_service()
                    termii.send_sms(to=ops_number, message=message)
                except Exception as sms_err:
                    logger.error(f"Failed to send PgBouncer alert SMS: {sms_err}")
            
            return f"Alerted: {len(alerts)} pools"


        return "Healthy"

    except Exception as e:
        logger.error(f"PgBouncer monitor failed: {e}")
        return f"Error: {e}"
