from rest_framework.routers import DefaultRouter
from .views import (
    FeeCategoryViewSet, FeeItemViewSet, StudentFeeViewSet,
    PaymentViewSet, ExpenseViewSet, ScholarshipViewSet, DashboardViewSet,
    AdmissionPackageViewSet,
    SalaryAllowanceViewSet, SalaryDeductionViewSet,
    StaffSalaryStructureViewSet, PayrollViewSet
)

router = DefaultRouter()
router.register(r'fee-categories', FeeCategoryViewSet)
router.register(r'scholarships', ScholarshipViewSet)
router.register(r'fees', FeeItemViewSet, basename='fees')
router.register(r'fee-items', FeeItemViewSet)
router.register(r'student-fees', StudentFeeViewSet)
router.register(r'payments', PaymentViewSet)
router.register(r'expenses', ExpenseViewSet)
router.register(r'admission-packages', AdmissionPackageViewSet)

# Payroll
router.register(r'salary-allowances', SalaryAllowanceViewSet)
router.register(r'salary-deductions', SalaryDeductionViewSet)
router.register(r'salary-structures', StaffSalaryStructureViewSet)
router.register(r'payrolls', PayrollViewSet)

router.register(r'dashboard', DashboardViewSet, basename='bursary-dashboard')

urlpatterns = router.urls
