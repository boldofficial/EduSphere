class DbRouter:
    """
    A router to control all database operations on models in the
    academic, bursary, analytics, and schools applications.
    """

    route_app_labels = {"academic", "bursary", "analytics", "schools", "core"}

    def db_for_read(self, model, **hints):
        """
        Read routing with safe fallback.
        Replica is used only when explicitly enabled; otherwise reads stay on default.
        """
        from django.conf import settings

        use_replica = getattr(settings, "USE_DB_REPLICA", False)
        if model._meta.app_label in self.route_app_labels:
            return "replica" if use_replica else "default"
        return "default"

    def db_for_write(self, model, **hints):
        """
        Attempts to write academic models go to default.
        """
        return "default"

    def allow_relation(self, obj1, obj2, **hints):
        """
        Allow relations if a model in the academic app is involved.
        """
        if (
            obj1._meta.app_label in self.route_app_labels
            or obj2._meta.app_label in self.route_app_labels
        ):
            return True
        return None

    def allow_migrate(self, db, app_label, model_name=None, **hints):
        """
        Make sure the academic app only appears in the 'default'
        database.
        """
        return db == "default"
