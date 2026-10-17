"""Shared checks for user uploads: allowed types, size limits, real image content."""

import io

from django.conf import settings
from rest_framework import serializers

MAX_UPLOAD_BYTES = getattr(settings, "MAX_UPLOAD_BYTES", 10 * 1024 * 1024)
MAX_IMAGE_BYTES = getattr(settings, "MAX_IMAGE_BYTES", 5 * 1024 * 1024)

IMAGE_FORMATS = {"JPEG": "jpg", "PNG": "png", "GIF": "gif", "WEBP": "webp"}
DOCUMENT_EXTENSIONS = {".pdf", ".doc", ".docx", ".xls", ".xlsx", ".csv", ".txt", ".ppt", ".pptx"}
ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".gif", ".webp"} | DOCUMENT_EXTENSIONS


def verify_image(data: bytes) -> str:
    """Return the real extension of image bytes, or raise ValidationError. Never trusts the client's label."""
    if len(data) > MAX_IMAGE_BYTES:
        raise serializers.ValidationError(f"Image is too large (max {MAX_IMAGE_BYTES // (1024 * 1024)} MB).")
    from PIL import Image

    try:
        with Image.open(io.BytesIO(data)) as img:
            fmt = img.format
            img.verify()
    except Exception:
        raise serializers.ValidationError("File is not a valid image.")
    if fmt not in IMAGE_FORMATS:
        raise serializers.ValidationError("Use a JPG, PNG, GIF or WebP image.")
    return IMAGE_FORMATS[fmt]
