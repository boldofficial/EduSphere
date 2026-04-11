"""File upload view."""

import os
import uuid
from django.core.files.storage import default_storage
from rest_framework.parsers import FormParser, MultiPartParser
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView


class FileUploadView(APIView):
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]

    def post(self, request, format=None):
        file_obj = request.FILES.get("file")
        folder = request.data.get("folder", "uploads")

        if not file_obj:
            return Response({"error": "No file provided"}, status=400)

        # Create unique filename
        ext = os.path.splitext(file_obj.name)[1]
        filename = f"{uuid.uuid4()}{ext}"
        file_path = f"{folder}/{filename}"

        try:
            # Save file using default storage (R2/S3)
            saved_path = default_storage.save(file_path, file_obj)
            file_url = default_storage.url(saved_path)

            return Response({"url": file_url, "path": saved_path, "filename": filename})
        except Exception as e:
            return Response({"error": str(e)}, status=500)
