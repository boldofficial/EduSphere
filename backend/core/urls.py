from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import (
    ConversationViewSet,
    FileUploadView,
    NewsletterViewSet,
    NotificationViewSet,
    PublicSettingsView,
    PublicStatsView,
    SchoolAnnouncementViewSet,
    SchoolMessageViewSet,
    SettingsView,
    GlobalActivityLogViewSet,
    HealthCheckView,
)
from .notifications_views import (
    send_sms,
    send_whatsapp,
    send_bulk_sms,
    send_otp,
    verify_otp,
    get_notification_balance,
)

router = DefaultRouter()
router.register(r"conversations", ConversationViewSet, basename="conversation")
router.register(r"messages", SchoolMessageViewSet, basename="message")
router.register(r"notifications", NotificationViewSet, basename="notification")
router.register(r"announcements", SchoolAnnouncementViewSet, basename="announcement")
router.register(r"newsletters", NewsletterViewSet, basename="newsletter")
router.register(r"activity-logs", GlobalActivityLogViewSet, basename="activity-log")

urlpatterns = [
    path("settings/", SettingsView.as_view(), name="settings"),
    path("public-settings/", PublicSettingsView.as_view(), name="public-settings"),
    path("public-stats/", PublicStatsView.as_view(), name="public-stats"),
    path("upload/", FileUploadView.as_view(), name="file-upload"),
    # Termii notifications
    path("notifications/sms/", send_sms, name="send-sms"),
    path("notifications/whatsapp/", send_whatsapp, name="send-whatsapp"),
    path("notifications/bulk-sms/", send_bulk_sms, name="send-bulk-sms"),
    path("notifications/otp/send/", send_otp, name="send-otp"),
    path("notifications/otp/verify/", verify_otp, name="verify-otp"),
    path("notifications/balance/", get_notification_balance, name="notification-balance"),
    path("health/", HealthCheckView.as_view(), name="health-check"),
    path("", include(router.urls)),
]
