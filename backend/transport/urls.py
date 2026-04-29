from django.urls import path, include
from rest_framework.routers import DefaultRouter

from .views import (
    BusStopViewSet, BusRouteViewSet, TransportAssignmentViewSet,
    TransportFeeViewSet, BusAttendanceViewSet, TransportPaymentViewSet
)

router = DefaultRouter()
router.register(r"stops", BusStopViewSet)
router.register(r"routes", BusRouteViewSet)
router.register(r"assignments", TransportAssignmentViewSet)
router.register(r"fees", TransportFeeViewSet)
router.register(r"attendance", BusAttendanceViewSet)
router.register(r"payments", TransportPaymentViewSet)

urlpatterns = [
    path("", include(router.urls)),
]