# feat: inventory management — uniforms, books, stationery

## Summary
Full stock tracking for school inventory items with low-stock alerts.

## Branch Name
`feature/inventory-management`

## PR Title
`feat: add inventory management module with low-stock alerts`

---

## What to Build

- Inventory item catalog (name, category, unit, reorder threshold)
- Stock movement tracking (stock-in, stock-out, adjustments)
- Current stock level computed from movements
- Low-stock alert triggered when quantity drops below threshold
- Admin UI: item list, stock movement form, alerts panel

## Models

```python
class InventoryItem(models.Model):
    CATEGORIES = [("uniform", "Uniform"), ("book", "Book"), ("stationery", "Stationery"), ("other", "Other")]
    name = models.CharField(max_length=200)
    category = models.CharField(max_length=20, choices=CATEGORIES)
    unit = models.CharField(max_length=50, default="piece")
    reorder_threshold = models.PositiveIntegerField(default=10)
    is_active = models.BooleanField(default=True)

    @property
    def current_stock(self):
        return self.movements.aggregate(
            total=Sum(
                Case(
                    When(movement_type="in", then=F("quantity")),
                    When(movement_type="out", then=-F("quantity")),
                    default=0
                )
            )
        )["total"] or 0

class StockMovement(models.Model):
    TYPES = [("in", "Stock In"), ("out", "Stock Out"), ("adjustment", "Adjustment")]
    item = models.ForeignKey(InventoryItem, related_name="movements", on_delete=models.CASCADE)
    movement_type = models.CharField(max_length=15, choices=TYPES)
    quantity = models.PositiveIntegerField()
    note = models.TextField(blank=True)
    recorded_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True)
    recorded_at = models.DateTimeField(auto_now_add=True)
```

## Low-Stock Alert Signal

```python
@receiver(post_save, sender=StockMovement)
def check_low_stock(sender, instance, **kwargs):
    item = instance.item
    if item.current_stock <= item.reorder_threshold:
        Notification.objects.create(
            recipient_role="admin",
            title=f"Low stock: {item.name}",
            body=f"Only {item.current_stock} {item.unit}(s) remaining. Reorder threshold is {item.reorder_threshold}.",
            link=f"/inventory/{item.id}/"
        )
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/inventory/items/` | List all items with current stock |
| POST | `/api/inventory/items/` | Create new item |
| POST | `/api/inventory/movements/` | Record stock in/out |
| GET | `/api/inventory/alerts/` | List low-stock alerts |

## Acceptance Criteria
- [ ] Admin can add/edit inventory items with category and reorder threshold
- [ ] Stock-in and stock-out movements update current stock in real time
- [ ] Alert is generated when stock falls at or below reorder threshold
- [ ] Admin can view full movement history per item
- [ ] Items filterable by category
