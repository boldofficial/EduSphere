from django.urls import path
from rest_framework.routers import DefaultRouter

from .views import (
    HRDashboardViewSet,
    PayrollViewSet,
    SalaryAllowanceViewSet,
    SalaryDeductionViewSet,
    StaffSalaryStructureViewSet,
)

router = DefaultRouter()

# HR Dashboard
router.register(r"dashboard", HRDashboardViewSet, basename="hr-dashboard")

# Salary Components
router.register(r"salary-allowances", SalaryAllowanceViewSet)
router.register(r"salary-deductions", SalaryDeductionViewSet)
router.register(r"salary-structures", StaffSalaryStructureViewSet)

# Payroll
router.register(r"payrolls", PayrollViewSet)

urlpatterns = router.urls
