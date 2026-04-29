from rest_framework import serializers
from inventory.models import (
    Asset, AssetCategory, AssetAssignment, AssetMaintenance,
    InventoryItem, InventoryTransaction
)


class AssetCategorySerializer(serializers.ModelSerializer):
    assets_count = serializers.SerializerMethodField()
    subcategories = serializers.SerializerMethodField()
    
    class Meta:
        model = AssetCategory
        fields = ["id", "name", "description", "depreciation_rate", "parent", "assets_count", "subcategories"]
    
    def get_assets_count(self, obj):
        return obj.assets.count()
    
    def get_subcategories(self, obj):
        children = obj.subcategories.all()[:5]
        return [{"id": c.id, "name": c.name} for c in children]


class AssetListSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source="category.name", read_only=True)
    assigned_to_name = serializers.CharField(source="assigned_to.name", read_only=True)
    
    class Meta:
        model = Asset
        fields = [
            "id", "name", "description", "asset_code", "serial_number", "barcode",
            "category", "category_name", "status", "location", "assigned_to", "assigned_to_name"
        ]


class AssetDetailSerializer(AssetListSerializer):
    assignments = serializers.SerializerMethodField()
    maintenance_records = serializers.SerializerMethodField()
    
    class Meta(AssetListSerializer.Meta):
        fields = AssetListSerializer.Meta.fields + [
            "purchase_date", "purchase_cost", "supplier", "warranty_expiry",
            "depreciable", "current_value", "image_url", "notes",
            "created_at", "updated_at", "assignments", "maintenance_records"
        ]
    
    def get_assignments(self, obj):
        active = obj.assignments.filter(is_active=True)[:3]
        return [{"assigned_to": a.assigned_to.name, "date": str(a.assigned_date)} for a in active]
    
    def get_maintenance_records(self, obj):
        recent = obj.maintenance_records.all()[:3]
        return [{"issue_type": m.issue_type, "status": m.status, "date": str(m.created_at)} for m in recent]


class AssetAssignmentSerializer(serializers.ModelSerializer):
    asset_name = serializers.CharField(source="asset.name", read_only=True)
    assigned_to_name = serializers.CharField(source="assigned_to.name", read_only=True)
    assigned_by_name = serializers.CharField(source="assigned_by.name", read_only=True)
    
    class Meta:
        model = AssetAssignment
        fields = [
            "id", "asset", "asset_name", "assigned_to", "assigned_to_name",
            "assigned_date", "returned_date", "condition_at_issue", "condition_at_return",
            "is_active", "notes", "assigned_by", "assigned_by_name"
        ]


class AssetMaintenanceSerializer(serializers.ModelSerializer):
    asset_name = serializers.CharField(source="asset.name", read_only=True)
    reported_by_name = serializers.CharField(source="reported_by.name", read_only=True)
    
    class Meta:
        model = AssetMaintenance
        fields = [
            "id", "asset", "asset_name", "issue_type", "description",
            "reported_by", "reported_by_name", "status", "resolved_by",
            "resolution_date", "cost", "notes", "created_at", "updated_at"
        ]


class InventoryItemSerializer(serializers.ModelSerializer):
    needs_reorder = serializers.BooleanField(read_only=True)
    
    class Meta:
        model = InventoryItem
        fields = [
            "id", "name", "description", "category", "quantity_in_stock",
            "reorder_level", "unit", "unit_cost", "supplier", "supplier_contact",
            "storage_location", "needs_reorder", "created_at", "updated_at"
        ]


class InventoryTransactionSerializer(serializers.ModelSerializer):
    item_name = serializers.CharField(source="item.name", read_only=True)
    recorded_by_name = serializers.CharField(source="recorded_by.name", read_only=True)
    
    class Meta:
        model = InventoryTransaction
        fields = [
            "id", "item", "item_name", "quantity", "transaction_type",
            "date", "notes", "recorded_by", "recorded_by_name"
        ]


class AssetCreateUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Asset
        fields = [
            "name", "description", "category", "asset_code", "serial_number", "barcode",
            "purchase_date", "purchase_cost", "supplier", "warranty_expiry",
            "location", "status", "depreciable", "image_url", "notes"
        ]
    
    def create(self, validated_data):
        if not validated_data.get("asset_code"):
            from django.utils import timezone
            import random
            prefix = validated_data.get("category", "").name[:3].upper() if validated_data.get("category") else "AST"
            validated_data["asset_code"] = f"{prefix}-{timezone.now().strftime('%Y%m%d')}-{random.randint(1000, 9999)}"
        
        if validated_data.get("depreciable") and not validated_data.get("current_value"):
            validated_data["current_value"] = validated_data.get("purchase_cost", 0)
        
        return super().create(validated_data)


class AssetAssignmentCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = AssetAssignment
        fields = ["asset", "assigned_to", "condition_at_issue", "notes"]
    
    def validate(self, data):
        asset = data["asset"]
        if asset.status != "available":
            raise serializers.ValidationError(f"Asset is not available (current status: {asset.status})")
        return data
    
    def create(self, validated_data):
        user = self.context["request"].user
        from academic.models import Teacher
        try:
            teacher = Teacher.objects.get(user=user)
            validated_data["assigned_by"] = teacher
        except Teacher.DoesNotExist:
            pass
        
        asset = validated_data["asset"]
        asset.status = "in_use"
        asset.save()
        
        return super().create(validated_data)


class InventoryTransactionCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = InventoryTransaction
        fields = ["item", "quantity", "transaction_type", "notes"]
    
    def validate(self, data):
        item = data["item"]
        qty = data["quantity"]
        
        if data["transaction_type"] in ["usage", "adjustment", "disposal"]:
            if item.quantity_in_stock < qty:
                raise serializers.ValidationError(f"Insufficient stock. Available: {item.quantity_in_stock}")
        
        return data
    
    def create(self, data):
        user = self.context["request"].user
        from academic.models import Teacher
        try:
            teacher = Teacher.objects.get(user=user)
            data["recorded_by"] = teacher
        except Teacher.DoesNotExist:
            pass
        
        item = data["item"]
        if data["transaction_type"] == "purchase":
            item.quantity_in_stock += data["quantity"]
        elif data["transaction_type"] in ["usage", "disposal"]:
            item.quantity_in_stock -= data["quantity"]
        
        item.save()
        return super().create(data)