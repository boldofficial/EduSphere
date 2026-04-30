from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import AdmissionIntakeViewSet, AdmissionViewSet

router = DefaultRouter()
router.register(r"admission-intakes", AdmissionIntakeViewSet, basename="admission-intakes")
router.register(r"admissions", AdmissionViewSet, basename="admissions")

urlpatterns = [
    path("", include(router.urls)),
]
