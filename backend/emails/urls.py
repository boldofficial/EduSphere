from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import EmailCampaignViewSet, EmailLogViewSet, EmailTemplateViewSet

router = DefaultRouter()
router.register(r"templates", EmailTemplateViewSet)
router.register(r"campaigns", EmailCampaignViewSet)
router.register(r"logs", EmailLogViewSet)

urlpatterns = [
    path("", include(router.urls)),
]
