from rest_framework import permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from django.utils import timezone

from core.pagination import SmallPagination
from .models import BlogPost, Category, Tag
from .serializers import BlogPostSerializer, BlogPostPublicSerializer, CategorySerializer, TagSerializer


class BlogPostAdminListCreateView(APIView):
    permission_classes = [permissions.IsAdminUser]

    def get(self, request):
        qs = BlogPost.objects.all()
        paginator = SmallPagination()
        page = paginator.paginate_queryset(qs, request)
        serializer = BlogPostSerializer(page, many=True)
        return paginator.get_paginated_response(serializer.data)

    def post(self, request):
        serializer = BlogPostSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class BlogPostAdminDetailView(APIView):
    permission_classes = [permissions.IsAdminUser]

    def get_object(self, pk):
        try:
            return BlogPost.objects.get(pk=pk)
        except BlogPost.DoesNotExist:
            return None

    def get(self, request, pk):
        obj = self.get_object(pk)
        if not obj:
            return Response({"detail": "Not found."}, status=status.HTTP_404_NOT_FOUND)
        return Response(BlogPostSerializer(obj).data)

    def put(self, request, pk):
        obj = self.get_object(pk)
        if not obj:
            return Response({"detail": "Not found."}, status=status.HTTP_404_NOT_FOUND)
        serializer = BlogPostSerializer(obj, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)

    def delete(self, request, pk):
        obj = self.get_object(pk)
        if not obj:
            return Response({"detail": "Not found."}, status=status.HTTP_404_NOT_FOUND)
        obj.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class BlogPostPublishView(APIView):
    """Toggle a blog post between draft and published."""

    permission_classes = [permissions.IsAdminUser]

    def post(self, request, pk):
        try:
            obj = BlogPost.objects.get(pk=pk)
        except BlogPost.DoesNotExist:
            return Response({"detail": "Not found."}, status=status.HTTP_404_NOT_FOUND)

        if obj.status == "published":
            obj.status = "draft"
            obj.published_at = None
        else:
            obj.status = "published"
            obj.published_at = timezone.now()
        obj.save(update_fields=["status", "published_at"])
        return Response(BlogPostSerializer(obj).data)


class BlogPostPublicListView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        qs = BlogPost.objects.filter(status="published")
        category = request.query_params.get("category")
        if category:
            qs = qs.filter(category_id=category)
        tag = request.query_params.get("tag")
        if tag:
            qs = qs.filter(tags__id=tag)
        paginator = SmallPagination()
        page = paginator.paginate_queryset(qs, request)
        serializer = BlogPostPublicSerializer(page, many=True)
        return paginator.get_paginated_response(serializer.data)


class BlogPostPublicDetailView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request, slug):
        try:
            obj = BlogPost.objects.get(slug=slug, status="published")
        except BlogPost.DoesNotExist:
            return Response({"detail": "Not found."}, status=status.HTTP_404_NOT_FOUND)
        return Response(BlogPostPublicSerializer(obj).data)


class CategoryListCreateView(APIView):
    permission_classes = [permissions.IsAdminUser]

    def get(self, request):
        qs = Category.objects.all()
        serializer = CategorySerializer(qs, many=True)
        return Response(serializer.data)

    def post(self, request):
        serializer = CategorySerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class CategoryDetailView(APIView):
    permission_classes = [permissions.IsAdminUser]

    def get(self, request, pk):
        try:
            obj = Category.objects.get(pk=pk)
        except Category.DoesNotExist:
            return Response({"detail": "Not found."}, status=status.HTTP_404_NOT_FOUND)
        return Response(CategorySerializer(obj).data)

    def put(self, request, pk):
        try:
            obj = Category.objects.get(pk=pk)
        except Category.DoesNotExist:
            return Response({"detail": "Not found."}, status=status.HTTP_404_NOT_FOUND)
        serializer = CategorySerializer(obj, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)

    def delete(self, request, pk):
        try:
            obj = Category.objects.get(pk=pk)
        except Category.DoesNotExist:
            return Response({"detail": "Not found."}, status=status.HTTP_404_NOT_FOUND)
        obj.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class TagListCreateView(APIView):
    permission_classes = [permissions.IsAdminUser]

    def get(self, request):
        qs = Tag.objects.all()
        serializer = TagSerializer(qs, many=True)
        return Response(serializer.data)

    def post(self, request):
        serializer = TagSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class TagDetailView(APIView):
    permission_classes = [permissions.IsAdminUser]

    def get_object(self, pk):
        try:
            return Tag.objects.get(pk=pk)
        except Tag.DoesNotExist:
            return None

    def get(self, request, pk):
        obj = self.get_object(pk)
        if not obj:
            return Response({"detail": "Not found."}, status=status.HTTP_404_NOT_FOUND)
        return Response(TagSerializer(obj).data)

    def put(self, request, pk):
        obj = self.get_object(pk)
        if not obj:
            return Response({"detail": "Not found."}, status=status.HTTP_404_NOT_FOUND)
        serializer = TagSerializer(obj, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)

    def delete(self, request, pk):
        obj = self.get_object(pk)
        if not obj:
            return Response({"detail": "Not found."}, status=status.HTTP_404_NOT_FOUND)
        obj.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
