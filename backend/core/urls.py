from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import FileUploadView, SettingsView, PublicStatsView, SchoolMessageViewSet

router = DefaultRouter()
router.register(r'messages', SchoolMessageViewSet, basename='message')

urlpatterns = [
    path('settings/', SettingsView.as_view(), name='settings'),
    path('public-stats/', PublicStatsView.as_view(), name='public-stats'),
    path('upload/', FileUploadView.as_view(), name='file-upload'),
    path('', include(router.urls)),
]
