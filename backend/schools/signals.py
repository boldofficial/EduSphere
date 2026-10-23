import logging

from django.db.models.signals import post_save
from django.dispatch import receiver

logger = logging.getLogger(__name__)


@receiver(post_save, sender="schools.Subscription")
def refresh_plan_modules(sender, instance, **kwargs):
    """Plan changes take effect immediately for that school (others refresh within a minute)."""
    from core.module_access import clear_school_modules

    clear_school_modules(instance.school_id)
