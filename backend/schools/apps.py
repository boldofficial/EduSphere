from django.apps import AppConfig


class SchoolsConfig(AppConfig):
    name = 'schools'

    def ready(self):
        try:
            from .models import PlatformModule
            PlatformModule.sync_from_registry()
        except Exception:
            # Avoid breaking migrations or initial setup
            pass
