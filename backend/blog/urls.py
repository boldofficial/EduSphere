from django.urls import path
from .views import (
    BlogPostAdminListCreateView,
    BlogPostAdminDetailView,
    BlogPostPublishView,
    BlogPostPublicListView,
    BlogPostPublicDetailView,
)

urlpatterns = [
    # Public endpoints
    path("", BlogPostPublicListView.as_view(), name="blog-list"),
    path("<slug:slug>/", BlogPostPublicDetailView.as_view(), name="blog-detail"),
    # Admin endpoints
    path("admin/all/", BlogPostAdminListCreateView.as_view(), name="blog-admin-list"),
    path("admin/<int:pk>/", BlogPostAdminDetailView.as_view(), name="blog-admin-detail"),
    path("admin/<int:pk>/publish/", BlogPostPublishView.as_view(), name="blog-admin-publish"),
]
