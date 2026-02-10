from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import FileUploadView, SettingsView, PublicStatsView, SchoolMessageViewSet, NotificationViewSet

router = DefaultRouter()
router.register(r'messages', SchoolMessageViewSet, basename='message')
router.register(r'notifications', NotificationViewSet, basename='notification')

urlpatterns = [
    path('settings/', SettingsView.as_view(), name='settings'),
    path('public-stats/', PublicStatsView.as_view(), name='public-stats'),
    path('upload/', FileUploadView.as_view(), name='file-upload'),
    path('', include(router.urls)),
]

