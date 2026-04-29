from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db import models
from datetime import date

from academic.views.base import TenantViewSet
from inventory.models import (
    Asset, AssetCategory, AssetAssignment, AssetMaintenance,
    InventoryItem, InventoryTransaction
)
from inventory.serializers import (
    AssetCategorySerializer, AssetListSerializer, AssetDetailSerializer,
    AssetAssignmentSerializer, AssetMaintenanceSerializer,
    InventoryItemSerializer, InventoryTransactionSerializer,
    AssetCreateUpdateSerializer, AssetAssignmentCreateSerializer,
    InventoryTransactionCreateSerializer
)


class AssetCategoryViewSet(TenantViewSet):
    queryset = AssetCategory.objects.order_by('name').all()
    serializer_class = AssetCategorySerializer


class AssetViewSet(TenantViewSet):
    queryset = Asset.objects.order_by('name').all()
    serializer_class = AssetListSerializer
    
    def get_serializer_class(self):
        if self.action == "retrieve":
            return AssetDetailSerializer
        if self.action in ["create", "update", "partial_update"]:
            return AssetCreateUpdateSerializer
        return AssetListSerializer
    
    def get_queryset(self):
        qs = super().get_queryset()
        category_id = self.request.query_params.get("category")
        status_filter = self.request.query_params.get("status")
        search = self.request.query_params.get("search")
        
        if category_id:
            qs = qs.filter(category_id=category_id)
        if status_filter:
            qs = qs.filter(status=status_filter)
        if search:
            qs = qs.filter(
                models.Q(name__icontains=search) |
                models.Q(asset_code__icontains=search) |
                models.Q(serial_number__icontains=search)
            )
        
        return qs
    
    @action(detail=False, methods=["get"])
    def low_stock(self, request):
        """Get assets in low stock or needing maintenance."""
        qs = self.get_queryset().filter(status__in=["maintenance", "lost"])
        return Response(AssetListSerializer(qs, many=True).data)


class AssetAssignmentViewSet(TenantViewSet):
    queryset = AssetAssignment.objects.all()
    serializer_class = AssetAssignmentSerializer
    
    def get_serializer_class(self):
        if self.action == "create":
            return AssetAssignmentCreateSerializer
        return AssetAssignmentSerializer
    
    def get_queryset(self):
        qs = super().get_queryset()
        asset_id = self.request.query_params.get("asset")
        is_active = self.request.query_params.get("is_active")
        
        if asset_id:
            qs = qs.filter(asset_id=asset_id)
        if is_active is not None:
            qs = qs.filter(is_active=is_active.lower() == "true")
        
        return qs.select_related("asset", "assigned_to", "assigned_by")
    
    @action(detail=True, methods=["post"])
    def return_asset(self, request, pk=None):
        """Return an assigned asset."""
        assignment = self.get_object()
        
        if not assignment.is_active:
            return Response({"error": "Asset already returned"}, status=400)
        
        assignment.returned_date = date.today()
        assignment.is_active = False
        
        condition = request.data.get("condition")
        if condition:
            assignment.condition_at_return = condition
        
        assignment.save()
        
        # Update asset status
        asset = assignment.asset
        asset.status = "available"
        asset.assigned_to = None
        asset.save()
        
        return Response(AssetAssignmentSerializer(assignment).data)


class AssetMaintenanceViewSet(TenantViewSet):
    queryset = AssetMaintenance.objects.all()
    serializer_class = AssetMaintenanceSerializer
    
    def get_queryset(self):
        qs = super().get_queryset()
        asset_id = self.request.query_params.get("asset")
        issue_type = self.request.query_params.get("issue_type")
        status_filter = self.request.query_params.get("status")
        
        if asset_id:
            qs = qs.filter(asset_id=asset_id)
        if issue_type:
            qs = qs.filter(issue_type=issue_type)
        if status_filter:
            qs = qs.filter(status=status_filter)
        
        return qs.select_related("asset", "reported_by")
    
    @action(detail=True, methods=["post"])
    def resolve(self, request, pk=None):
        """Mark maintenance as resolved."""
        maintenance = self.get_object()
        
        maintenance.status = "completed"
        maintenance.resolved_by = request.data.get("resolved_by", "")
        maintenance.resolution_date = date.today()
        maintenance.cost = request.data.get("cost", 0)
        maintenance.notes = request.data.get("notes", "")
        maintenance.save()
        
        # Update asset status back to available
        asset = maintenance.asset
        if asset.status == "maintenance":
            asset.status = "available"
            asset.save()
        
        return Response(AssetMaintenanceSerializer(maintenance).data)


class InventoryItemViewSet(TenantViewSet):
    queryset = InventoryItem.objects.all()
    serializer_class = InventoryItemSerializer
    
    def get_queryset(self):
        qs = super().get_queryset()
        category_id = self.request.query_params.get("category")
        needs_reorder = self.request.query_params.get("needs_reorder")
        
        if category_id:
            qs = qs.filter(category_id=category_id)
        if needs_reorder and needs_reorder.lower() == "true":
            qs = [item for item in qs if item.needs_reorder]
        
        return qs
    
    @action(detail=False, methods=["get"])
    def reorder_alerts(self, request):
        """Get items that need reordering."""
        qs = self.get_queryset()
        alerts = [item for item in qs if item.needs_reorder]
        return Response(InventoryItemSerializer(alerts, many=True).data)


class InventoryTransactionViewSet(TenantViewSet):
    queryset = InventoryTransaction.objects.all()
    serializer_class = InventoryTransactionSerializer
    
    def get_serializer_class(self):
        if self.action == "create":
            return InventoryTransactionCreateSerializer
        return InventoryTransactionSerializer
    
    def get_queryset(self):
        from django.db import models
        qs = super().get_queryset()
        item_id = self.request.query_params.get("item")
        transaction_type = self.request.query_params.get("type")
        
        if item_id:
            qs = qs.filter(item_id=item_id)
        if transaction_type:
            qs = qs.filter(transaction_type=transaction_type)
        
        return qs.select_related("item", "recorded_by")