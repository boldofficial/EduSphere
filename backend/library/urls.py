from django.urls import path, include
from rest_framework.routers import DefaultRouter

from .views import (
    BookCategoryViewSet, BookViewSet, BorrowRecordViewSet,
    ReservationViewSet, LibraryMemberViewSet, LibrarySettingsViewSet
)

router = DefaultRouter()
router.register(r"categories", BookCategoryViewSet)
router.register(r"books", BookViewSet)
router.register(r"borrow", BorrowRecordViewSet)
router.register(r"reservations", ReservationViewSet)
router.register(r"members", LibraryMemberViewSet)
router.register(r"settings", LibrarySettingsViewSet)

urlpatterns = [
    path("", include(router.urls)),
]