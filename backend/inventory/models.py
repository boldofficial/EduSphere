from django.db import models
from academic.models import Teacher, TenantModel


class AssetCategory(TenantModel):
    """Categories for school assets."""
    
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True)
    depreciation_rate = models.FloatField(default=0.0, help_text="Annual depreciation rate in %")
    parent = models.ForeignKey("self", on_delete=models.SET_NULL, null=True, blank=True, related_name="subcategories")
    
    def __str__(self):
        return self.name


class Asset(TenantModel):
    """School assets/inventory items."""
    
    CATEGORY_CHOICES = (
        ("electronics", "Electronics"),
        ("furniture", "Furniture"),
        ("equipment", "Equipment"),
        ("vehicle", "Vehicle"),
        ("stationery", "Stationery"),
        ("sports", "Sports Equipment"),
        ("other", "Other"),
    )
    
    STATUS_CHOICES = (
        ("available", "Available"),
        ("in_use", "In Use"),
        ("maintenance", "Under Maintenance"),
        ("lost", "Lost"),
        ("disposed", "Disposed"),
    )
    
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    category = models.ForeignKey(AssetCategory, on_delete=models.SET_NULL, null=True, blank=True, related_name="assets")
    
    # Identification
    asset_code = models.CharField(max_length=50, unique=True, null=True, blank=True, help_text="Auto-generated if blank")
    serial_number = models.CharField(max_length=100, blank=True)
    barcode = models.CharField(max_length=100, blank=True)
    
    # Purchase info
    purchase_date = models.DateField(null=True, blank=True)
    purchase_cost = models.DecimalField(max_digits=12, decimal_places=2, default=0.00)
    supplier = models.CharField(max_length=255, blank=True)
    warranty_expiry = models.DateField(null=True, blank=True)
    
    # Location
    location = models.CharField(max_length=255, blank=True, help_text="e.g., ICT Room, Staff Room")
    assigned_to = models.ForeignKey(Teacher, on_delete=models.SET_NULL, null=True, blank=True, related_name="assigned_assets")
    
    # Status
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="available")
    
    # Depreciation
    depreciable = models.BooleanField(default=True)
    current_value = models.DecimalField(max_digits=12, decimal_places=2, default=0.00)
    
    # Image
    image_url = models.CharField(max_length=512, blank=True)
    
    # Notes
    notes = models.TextField(blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ["-created_at"]
    
    def __str__(self):
        return f"{self.name} ({self.asset_code})"


class AssetAssignment(TenantModel):
    """Track asset assignment to staff."""
    
    asset = models.ForeignKey(Asset, on_delete=models.CASCADE, related_name="assignments")
    assigned_to = models.ForeignKey(Teacher, on_delete=models.CASCADE, related_name="asset_assignments")
    
    assigned_date = models.DateField(auto_now_add=True)
    returned_date = models.DateField(null=True, blank=True)
    
    condition_at_issue = models.CharField(max_length=100, default="Good")
    condition_at_return = models.CharField(max_length=100, blank=True)
    
    is_active = models.BooleanField(default=True)
    notes = models.TextField(blank=True)
    
    assigned_by = models.ForeignKey(Teacher, on_delete=models.SET_NULL, null=True, blank=True, related_name="assigned_assets_to")
    
    class Meta:
        ordering = ["-assigned_date"]
    
    def __str__(self):
        return f"{self.asset.name} -> {self.assigned_to.name}"


class AssetMaintenance(TenantModel):
    """Track maintenance/repairs."""
    
    asset = models.ForeignKey(Asset, on_delete=models.CASCADE, related_name="maintenance_records")
    
    ISSUE_TYPE_CHOICES = (
        ("repair", "Repair"),
        ("service", "Service"),
        ("upgrade", "Upgrade"),
        ("inspection", "Inspection"),
        ("other", "Other"),
    )
    
    issue_type = models.CharField(max_length=20, choices=ISSUE_TYPE_CHOICES, default="repair")
    description = models.TextField()
    reported_by = models.ForeignKey(Teacher, on_delete=models.SET_NULL, null=True, blank=True, related_name="reported_issues")
    
    # Resolution
    STATUS_CHOICES = (
        ("reported", "Reported"),
        ("in_progress", "In Progress"),
        ("completed", "Completed"),
        ("cancelled", "Cancelled"),
    )
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="reported")
    
    resolved_by = models.CharField(max_length=255, blank=True)
    resolution_date = models.DateField(null=True, blank=True)
    cost = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    
    notes = models.TextField(blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ["-created_at"]
    
    def __str__(self):
        return f"{self.asset.name} - {self.issue_type}"


class InventoryItem(TenantModel):
    """Consumable inventory items (stationery, supplies)."""
    
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    category = models.ForeignKey(AssetCategory, on_delete=models.SET_NULL, null=True, blank=True)
    
    # Stock
    quantity_in_stock = models.IntegerField(default=0)
    reorder_level = models.IntegerField(default=10, help_text="Alert when stock falls below")
    unit = models.CharField(max_length=20, default="pcs", help_text="pcs, ream, box, etc.")
    
    # Cost
    unit_cost = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    
    # Supplier
    supplier = models.CharField(max_length=255, blank=True)
    supplier_contact = models.CharField(max_length=255, blank=True)
    
    # Location
    storage_location = models.CharField(max_length=255, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ["name"]
    
    def __str__(self):
        return f"{self.name} ({self.quantity_in_stock} {self.unit})"
    
    @property
    def needs_reorder(self):
        return self.quantity_in_stock <= self.reorder_level


class InventoryTransaction(TenantModel):
    """Track inventory in/out transactions."""
    
    item = models.ForeignKey(InventoryItem, on_delete=models.CASCADE, related_name="transactions")
    quantity = models.IntegerField()
    
    TRANSACTION_TYPE_CHOICES = (
        ("purchase", "Purchase/Restock"),
        ("usage", "Usage/Issued"),
        ("adjustment", "Stock Adjustment"),
        ("return", "Return"),
        ("disposal", "Disposal"),
    )
    
    transaction_type = models.CharField(max_length=20, choices=TRANSACTION_TYPE_CHOICES)
    date = models.DateField(auto_now_add=True)
    
    notes = models.TextField(blank=True)
    recorded_by = models.ForeignKey(Teacher, on_delete=models.SET_NULL, null=True, blank=True)
    
    class Meta:
        ordering = ["-date"]
    
    def __str__(self):
        return f"{self.transaction_type}: {self.item.name} ({self.quantity})"