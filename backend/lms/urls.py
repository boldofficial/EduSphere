from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import DiscussionThreadViewSet, DiscussionMessageViewSet

router = DefaultRouter()
router.register(r'threads', DiscussionThreadViewSet, basename='discussion-thread')
router.register(r'messages', DiscussionMessageViewSet, basename='discussion-message')

urlpatterns = [
    path('', include(router.urls)),
]
