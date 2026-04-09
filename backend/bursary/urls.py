from django.urls import path

from rest_framework.routers import DefaultRouter

from .views import (
    AdmissionPackageViewSet,
    DashboardViewSet,
    ExpenseViewSet,
    FeeCategoryViewSet,
    FeeItemViewSet,
    PaymentViewSet,
    PayrollViewSet,
    SalaryAllowanceViewSet,
    SalaryDeductionViewSet,
    ScholarshipViewSet,
    StaffSalaryStructureViewSet,
    StudentFeeViewSet,
    DiscountViewSet,
)
from .views_webhooks import PaystackWebhookView
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

# Payroll
router.register(r"salary-allowances", SalaryAllowanceViewSet)
router.register(r"salary-deductions", SalaryDeductionViewSet)
router.register(r"salary-structures", StaffSalaryStructureViewSet)
router.register(r"payrolls", PayrollViewSet)

router.register(r"dashboard", DashboardViewSet, basename="bursary-dashboard")

urlpatterns = [
    path("webhooks/paystack/<str:school_domain>/", PaystackWebhookView.as_view(), name="paystack-webhook"),
    path("public/invoice/<uuid:payment_hash>/", PublicInvoiceView.as_view(), name="public-invoice"),
] + router.urls
