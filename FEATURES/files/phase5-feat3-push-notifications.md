# feat: push notifications — announcements and critical alerts

## Summary
Real-time push notifications for announcements, absence alerts, fee reminders, and critical system events.

## Branch Name
`feature/push-notifications`

## PR Title
`feat: add web push notifications for announcements and critical system alerts`

---

## What to Build

- Web Push subscription flow (request permission → store subscription server-side)
- Backend service to send push via Web Push Protocol (VAPID)
- Notification types: announcement, absence alert, fee reminder, sick-bay, low-stock
- Notification preferences (users can opt out per category)

## Frontend — Subscribe

```javascript
// lib/pushSubscription.js
export async function subscribeToPush() {
  const registration = await navigator.serviceWorker.ready;
  const subscription = await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY),
  });
  await fetch("/api/push/subscribe/", {
    method: "POST",
    body: JSON.stringify(subscription),
    headers: { "Content-Type": "application/json" },
  });
  return subscription;
}

function urlBase64ToUint8Array(base64String) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  return Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
}
```

## Service Worker — Push Handler

```javascript
// public/sw.js (or handled by next-pwa)
self.addEventListener("push", (event) => {
  const data = event.data?.json() ?? {};
  event.waitUntil(
    self.registration.showNotification(data.title || "myregistra", {
      body: data.body,
      icon: "/icons/icon-192.png",
      badge: "/icons/badge-72.png",
      tag: data.tag || "general",
      data: { url: data.url || "/dashboard" },
    })
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil(clients.openWindow(event.notification.data.url));
});
```

## Backend — VAPID Push Service

```python
# services/push.py
from pywebpush import webpush, WebPushException
import json, os

VAPID_PRIVATE_KEY = os.environ["VAPID_PRIVATE_KEY"]
VAPID_CLAIMS = {"sub": "mailto:admin@myregistra.net"}

def send_push(subscription_info: dict, title: str, body: str, url: str = "/dashboard", tag: str = "general"):
    try:
        webpush(
            subscription_info=subscription_info,
            data=json.dumps({"title": title, "body": body, "url": url, "tag": tag}),
            vapid_private_key=VAPID_PRIVATE_KEY,
            vapid_claims=VAPID_CLAIMS,
        )
    except WebPushException as e:
        if e.response and e.response.status_code == 410:
            # Subscription expired — remove it
            PushSubscription.objects.filter(endpoint=subscription_info["endpoint"]).delete()
```

## Model

```python
class PushSubscription(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="push_subscriptions")
    endpoint = models.TextField(unique=True)
    p256dh = models.TextField()
    auth = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

class NotificationPreference(models.Model):
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    absence_alerts = models.BooleanField(default=True)
    fee_reminders = models.BooleanField(default=True)
    announcements = models.BooleanField(default=True)
    sickbay_alerts = models.BooleanField(default=True)
    low_stock_alerts = models.BooleanField(default=False)
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/push/subscribe/` | Save push subscription |
| DELETE | `/api/push/unsubscribe/` | Remove subscription |
| GET/PATCH | `/api/push/preferences/` | Get or update notification preferences |
| POST | `/api/push/send/` | Send push to a user or role (admin only) |

## Acceptance Criteria
- [ ] Permission prompt shown on first login (not on every page load)
- [ ] Subscription saved server-side on accept
- [ ] Push delivered within 3 seconds of trigger event
- [ ] Clicking notification navigates to the relevant page
- [ ] Expired subscriptions auto-removed on 410 response
- [ ] Users can manage preferences per notification category
