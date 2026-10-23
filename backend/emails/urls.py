from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import EmailCampaignViewSet, EmailLogViewSet, EmailStatusView, EmailTemplateViewSet

router = DefaultRouter()
router.register(r"templates", EmailTemplateViewSet)
router.register(r"campaigns", EmailCampaignViewSet)
router.register(r"logs", EmailLogViewSet)

urlpatterns = [
    path("status/", EmailStatusView.as_view(), name="email-status"),
    path("", include(router.urls)),
]
