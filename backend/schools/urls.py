from django.urls import path
from .views import (
    PublicPlanListView, SchoolManagementView, RegisterSchoolView,
    SchoolRevenueView, RecordPaymentView, PlanManagementView, SystemHealthView,
    StrategicAnalyticsView, PlatformGovernanceView, UserAnnouncementsView,
    GlobalSearchView, MaintenanceModeView, PlatformModulesView, ModuleToggleView
)

urlpatterns = [
    path('health/', SystemHealthView.as_view(), name='system-health'),
    path('analytics/strategic/', StrategicAnalyticsView.as_view(), name='strategic-analytics'),
    path('governance/', PlatformGovernanceView.as_view(), name='platform-governance'),
    path('announcements/', UserAnnouncementsView.as_view(), name='user-announcements'),
    path('modules/', PlatformModulesView.as_view(), name='platform-modules'),
    path('modules/toggle/', ModuleToggleView.as_view(), name='module-toggle'),
    path('search/global/', GlobalSearchView.as_view(), name='global-search'),
    path('maintenance/', MaintenanceModeView.as_view(), name='maintenance-toggle'),
    path('plans/', PublicPlanListView.as_view(), name='public-plans'),
    path('plans/manage/', PlanManagementView.as_view(), name='plan-create'),
    path('plans/manage/<int:pk>/', PlanManagementView.as_view(), name='plan-manage'),
    path('list/', SchoolManagementView.as_view(), name='school-list'),
    path('manage/<int:pk>/', SchoolManagementView.as_view(), name='school-manage'),
    path('revenue/', SchoolRevenueView.as_view(), name='school-revenue'),
    path('payments/record/', RecordPaymentView.as_view(), name='payment-record'),
    path('register/', RegisterSchoolView.as_view(), name='school-register'),
]
