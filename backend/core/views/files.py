"""File upload view."""

import os
import re
import uuid

from django.core.files.storage import default_storage
from rest_framework.exceptions import ValidationError
from rest_framework.parsers import FormParser, MultiPartParser
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from core.upload_validation import ALLOWED_EXTENSIONS, DOCUMENT_EXTENSIONS, MAX_UPLOAD_BYTES, verify_image

FOLDER_RE = re.compile(r"^[a-z0-9_-]{1,40}$")


class FileUploadView(APIView):
    """Images and office documents only (no HTML/SVG/scripts), size-limited, stored under the user's school."""

    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]

    def post(self, request, format=None):
        file_obj = request.FILES.get("file")
        if not file_obj:
            return Response({"detail": "No file provided"}, status=400)
        if file_obj.size > MAX_UPLOAD_BYTES:
            return Response({"detail": f"File is too large (max {MAX_UPLOAD_BYTES // (1024 * 1024)} MB)."}, status=400)

        folder = str(request.data.get("folder") or "uploads").strip().lower()
        if not FOLDER_RE.match(folder):
            folder = "uploads"
        ext = os.path.splitext(file_obj.name)[1].lower()
        if ext not in ALLOWED_EXTENSIONS:
            return Response({"detail": "This file type is not allowed."}, status=400)
        if ext not in DOCUMENT_EXTENSIONS:
            try:
                ext = "." + verify_image(file_obj.read())
            except ValidationError as e:
                return Response({"detail": e.detail[0] if isinstance(e.detail, list) else str(e.detail)}, status=400)
            file_obj.seek(0)

        school = getattr(request.user, "school_id", None) or "platform"
        filename = f"{uuid.uuid4()}{ext}"
        try:
            saved_path = default_storage.save(f"{folder}/{school}/{filename}", file_obj)
        except Exception:
            return Response({"detail": "Could not store the file. Please try again."}, status=500)
        return Response({"url": default_storage.url(saved_path), "path": saved_path, "filename": filename})
