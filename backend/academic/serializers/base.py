"""Base utility functions and fields for academic serializers."""

import logging
from rest_framework import serializers
from core.tenant_utils import get_request_school

logger = logging.getLogger(__name__)


def _school_from_request(serializer):
    request = serializer.context.get("request")
    if not request:
        return None
    try:
        return get_request_school(request, allow_super_admin_tenant=True)
    except Exception:
        return None


class Base64ImageField(serializers.CharField):
    """
    Custom field to handle base64 encoded images.
    Saves to storage and returns the URL.
    """

    def to_internal_value(self, data):
        if data and isinstance(data, str) and data.startswith("data:image"):
            try:
                # Format: "data:image/png;base64,iVBORw0KG..."
                header, imgstr = data.split(";base64,")
                ext = header.split("/")[-1]

                import base64
                import uuid
                from django.core.files.base import ContentFile
                from django.core.files.storage import default_storage

                filename = f"passports/{uuid.uuid4()}.{ext}"
                decoded_file = base64.b64decode(imgstr)

                file_name = default_storage.save(filename, ContentFile(decoded_file))

                # Store ONLY the relative path in DB
                return file_name
            except Exception as e:
                logger.error(f"Base64 Image Upload Failed: {e}")
                return data

        # If it's already a path or full URL, return as is (avoiding re-upload)
        if data and isinstance(data, str) and (data.startswith("http") or "/" in data):
            # Extract path if it contains 'passports' to maintain consistency
            if "passports" in data:
                parts = data.split("?")[0].split("/")
                idx = parts.index("passports")
                return "/".join(parts[idx:])
            return data

        return super().to_internal_value(data)
