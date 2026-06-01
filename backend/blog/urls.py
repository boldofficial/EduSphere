from django.urls import path
from .views import (
    BlogPostAdminListCreateView,
    BlogPostAdminDetailView,
    BlogPostPublishView,
    BlogPostPublicListView,
    BlogPostPublicDetailView,
    CategoryListCreateView,
    CategoryDetailView,
    TagListCreateView,
    TagDetailView,
)

urlpatterns = [
    # Public endpoints
    path("", BlogPostPublicListView.as_view(), name="blog-list"),
    # Admin endpoints (must come before catch-all slug pattern)
    path("admin/all/", BlogPostAdminListCreateView.as_view(), name="blog-admin-list"),
    path("admin/<int:pk>/", BlogPostAdminDetailView.as_view(), name="blog-admin-detail"),
    path("admin/<int:pk>/publish/", BlogPostPublishView.as_view(), name="blog-admin-publish"),
    # Category & Tag endpoints (must come before catch-all slug pattern)
    path("categories/", CategoryListCreateView.as_view(), name="category-list"),
    path("categories/<int:pk>/", CategoryDetailView.as_view(), name="category-detail"),
    path("tags/", TagListCreateView.as_view(), name="tag-list"),
    path("tags/<int:pk>/", TagDetailView.as_view(), name="tag-detail"),
    # Catch-all slug pattern for public detail view (must be last)
    path("<slug:slug>/", BlogPostPublicDetailView.as_view(), name="blog-detail"),
]
