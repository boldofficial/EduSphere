from rest_framework.routers import DefaultRouter
from .views import (
    FeeCategoryViewSet, FeeItemViewSet, StudentFeeViewSet,
    PaymentViewSet, ExpenseViewSet, ScholarshipViewSet
)

router = DefaultRouter()
router.register(r'fee-categories', FeeCategoryViewSet)
router.register(r'fee-items', FeeItemViewSet)
router.register(r'scholarships', ScholarshipViewSet)
router.register(r'student-fees', StudentFeeViewSet)
router.register(r'payments', PaymentViewSet)
router.register(r'expenses', ExpenseViewSet)
router.register(r'fees', FeeItemViewSet, basename='fees')

urlpatterns = router.urls
