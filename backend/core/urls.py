from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    FileUploadView, SettingsView, PublicSettingsView, PublicStatsView, SchoolMessageViewSet, 
    ConversationViewSet, NotificationViewSet, SchoolAnnouncementViewSet, NewsletterViewSet
)

router = DefaultRouter()
router.register(r'conversations', ConversationViewSet, basename='conversation')
router.register(r'messages', SchoolMessageViewSet, basename='message')
router.register(r'notifications', NotificationViewSet, basename='notification')
router.register(r'announcements', SchoolAnnouncementViewSet, basename='announcement')
router.register(r'newsletters', NewsletterViewSet, basename='newsletter')

urlpatterns = [
    path('settings/', SettingsView.as_view(), name='settings'),
    path('public-settings/', PublicSettingsView.as_view(), name='public-settings'),
    path('public-stats/', PublicStatsView.as_view(), name='public-stats'),
    path('upload/', FileUploadView.as_view(), name='file-upload'),
    path('', include(router.urls)),
]

