from django.apps import AppConfig


class SchoolsConfig(AppConfig):
    name = 'schools'

    def ready(self):
        # Database queries in ready() are discouraged and cause warnings/hangs in production.
        # sync_from_registry() should be called via a management command instead.
        pass
