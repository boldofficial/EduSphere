from django.urls import path
from .views import (
    PublicPlanListView, SchoolManagementView, RegisterSchoolView,
    SchoolRevenueView, RecordPaymentView, PlanManagementView, SystemHealthView,
    StrategicAnalyticsView, PlatformGovernanceView, UserAnnouncementsView,
    GlobalSearchView, MaintenanceModeView, PlatformModulesView, ModuleToggleView,
    VerifySchoolSlugView, PlatformSettingsView, AdminDemoRequestView
)
from .views_public import DemoRequestViewSet

urlpatterns = [
    path('verify-slug/<str:slug>/', VerifySchoolSlugView.as_view(), name='verify-slug'),
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
    path('management/', SchoolManagementView.as_view(), name='school-management'),
    path('management/<int:pk>/', SchoolManagementView.as_view(), name='school-detail'),
    path('platform-settings/', PlatformSettingsView.as_view(), name='platform-settings'),
    path('demo-request/', DemoRequestViewSet.as_view(), name='demo-request'),
    # Super Admin Demo Management
    path('admin/demo-requests/', AdminDemoRequestView.as_view(), name='admin-demo-list'),
    path('admin/demo-requests/<int:pk>/approve/', AdminDemoRequestView.as_view(), name='admin-demo-approve'),
]
