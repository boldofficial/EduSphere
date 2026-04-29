from django.urls import path, include
from rest_framework.routers import DefaultRouter

from .views import (
    AssetCategoryViewSet, AssetViewSet, AssetAssignmentViewSet,
    AssetMaintenanceViewSet, InventoryItemViewSet, InventoryTransactionViewSet
)

router = DefaultRouter()
router.register(r"categories", AssetCategoryViewSet)
router.register(r"assets", AssetViewSet)
router.register(r"assignments", AssetAssignmentViewSet)
router.register(r"maintenance", AssetMaintenanceViewSet)
router.register(r"items", InventoryItemViewSet)
router.register(r"transactions", InventoryTransactionViewSet, basename="inventory-transactions")

urlpatterns = [
    path("", include(router.urls)),
]