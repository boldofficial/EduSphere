from django.urls import path

from rest_framework.routers import DefaultRouter

from .views import (
    AdmissionPackageViewSet,
    DashboardViewSet,
    ExpenseViewSet,
    FeeCategoryViewSet,
    FeeItemViewSet,
    PaymentViewSet,
    ScholarshipViewSet,
    StudentFeeViewSet,
    DiscountViewSet,
)
from .views_public import PublicInvoiceView

router = DefaultRouter()
router.register(r"fee-categories", FeeCategoryViewSet)
router.register(r"scholarships", ScholarshipViewSet)
router.register(r"fees", FeeItemViewSet, basename="fees")
router.register(r"fee-items", FeeItemViewSet)
router.register(r"student-fees", StudentFeeViewSet)
router.register(r"payments", PaymentViewSet)
router.register(r"expenses", ExpenseViewSet)
router.register(r"admission-packages", AdmissionPackageViewSet)
router.register(r"discounts", DiscountViewSet)

router.register(r"dashboard", DashboardViewSet, basename="bursary-dashboard")

urlpatterns = [
    path("public/invoice/<uuid:payment_hash>/", PublicInvoiceView.as_view(), name="public-invoice"),
] + router.urls
