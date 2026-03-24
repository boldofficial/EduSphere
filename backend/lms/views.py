from rest_framework import viewsets, permissions, status
from rest_framework.response import Response
from django.contrib.contenttypes.models import ContentType
from .models import DiscussionThread, DiscussionMessage
from .serializers import DiscussionThreadSerializer, DiscussionMessageSerializer

class DiscussionThreadViewSet(viewsets.ModelViewSet):
    queryset = DiscussionThread.objects.all()
    serializer_class = DiscussionThreadSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        # Always filter by school (TenantMiddleware sets request.tenant)
        return super().get_queryset().filter(school=self.request.tenant)

    def create(self, request, *args, **kwargs):
        # Automatically handle thread creation if it doesn't exist for the resource
        content_type_id = request.data.get("content_type")
        object_id = request.data.get("object_id")
        
        thread, created = DiscussionThread.objects.get_or_create(
            school=request.tenant,
            content_type_id=content_type_id,
            object_id=object_id
        )
        
        serializer = self.get_serializer(thread)
        return Response(serializer.data, status=status.HTTP_201_CREATED if created else status.HTTP_200_OK)

class DiscussionMessageViewSet(viewsets.ModelViewSet):
    queryset = DiscussionMessage.objects.all()
    serializer_class = DiscussionMessageSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return super().get_queryset().filter(school=self.request.tenant)

    def perform_create(self, serializer):
        # Automatically set author and school
        serializer.save(author=self.request.user, school=self.request.tenant)

    def update(self, request, *args, **kwargs):
        instance = self.get_object()
        if instance.author != request.user:
            return Response({"detail": "You do not have permission to edit this message."}, 
                            status=status.HTTP_403_FORBIDDEN)
        return super().update(request, *args, **kwargs)

    def partial_update(self, request, *args, **kwargs):
        instance = self.get_object()
        if instance.author != request.user:
            return Response({"detail": "You do not have permission to edit this message."}, 
                            status=status.HTTP_403_FORBIDDEN)
        return super().partial_update(request, *args, **kwargs)

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        # Ensure only author can delete their own message
        if instance.author != request.user:
            return Response({"detail": "You do not have permission to delete this message."}, 
                            status=status.HTTP_403_FORBIDDEN)
        return super().destroy(request, *args, **kwargs)
