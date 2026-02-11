"""
Schools Views — Barrel Re-export

All view classes are organized into domain-specific modules:
- views_public.py: Public-facing views (no auth required)
- views_admin.py: Admin CRUD views for schools, plans, modules, settings
- views_analytics.py: System health, analytics, search, maintenance
- views_governance.py: Activity logs and announcements
"""

# Public views
from .views_public import (
    PublicPlanListView,
    VerifySchoolSlugView,
    RegisterSchoolView,
)

# Admin management views
from .views_admin import (
    PlatformModulesView,
    ModuleToggleView,
    SchoolManagementView,
    SchoolRevenueView,
    RecordPaymentView,
    PlanManagementView,
    PlatformSettingsView,
)

# Analytics & monitoring views
from .views_analytics import (
    SystemHealthView,
    StrategicAnalyticsView,
    GlobalSearchView,
    MaintenanceModeView,
)

# Governance views
from .views_governance import (
    PlatformGovernanceView,
    UserAnnouncementsView,
)

__all__ = [
    'PublicPlanListView', 'VerifySchoolSlugView', 'RegisterSchoolView',
    'PlatformModulesView', 'ModuleToggleView',
    'SchoolManagementView', 'SchoolRevenueView', 'RecordPaymentView',
    'PlanManagementView', 'PlatformSettingsView',
    'SystemHealthView', 'StrategicAnalyticsView',
    'GlobalSearchView', 'MaintenanceModeView',
    'PlatformGovernanceView', 'UserAnnouncementsView',
]
