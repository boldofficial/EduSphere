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

    def __init__(self, *args, website=False, logo=False, school_id=None, **kwargs):
        # website=True: a public website image (optimised, permanent address under website/<school>/).
        self.website = website
        self.logo = logo
        self.school_id = school_id
        super().__init__(*args, **kwargs)

    def _website_school_id(self):
        if self.school_id:
            return self.school_id
        school = _school_from_request(self.parent) if self.parent is not None else None
        if not school:
            raise serializers.ValidationError("Could not determine the school for this image.")
        return school.pk

    def to_internal_value(self, data):
        from core.website_media import path_from_url

        website_path = path_from_url(data)
        if website_path:
            return website_path  # an existing website image sent back unchanged

        if self.website and data and isinstance(data, str) and data.startswith("data:image"):
            import base64
            import binascii

            from core.website_media import MAX_SOURCE_BYTES, save_website_image

            try:
                _header, imgstr = data.split(";base64,", 1)
                if len(imgstr) > MAX_SOURCE_BYTES * 4 // 3 + 4:
                    raise serializers.ValidationError("Image is too large (max 15 MB).")
                decoded = base64.b64decode(imgstr, validate=True)
            except (ValueError, binascii.Error):
                raise serializers.ValidationError("Image data is not valid.")
            return save_website_image(self._website_school_id(), decoded, logo=self.logo)["path"]

        if data and isinstance(data, str) and data.startswith("data:image"):
            try:
                # Format: "data:image/png;base64,iVBORw0KG..."
                _header, imgstr = data.split(";base64,", 1)

                import base64
                import binascii
                import uuid
                from django.core.files.base import ContentFile
                from django.core.files.storage import default_storage

                from core.upload_validation import MAX_IMAGE_BYTES, verify_image

                if len(imgstr) > MAX_IMAGE_BYTES * 4 // 3 + 4:
                    raise serializers.ValidationError("Image is too large.")
                decoded_file = base64.b64decode(imgstr, validate=True)
                ext = verify_image(decoded_file)  # the real type, not the client's data: header
                filename = f"passports/{uuid.uuid4()}.{ext}"
                return default_storage.save(filename, ContentFile(decoded_file))
            except serializers.ValidationError:
                raise
            except (ValueError, binascii.Error):
                raise serializers.ValidationError("Image data is not valid.")
            except Exception as e:
                logger.error(f"Base64 Image Upload Failed: {e}")
                raise serializers.ValidationError("Could not save the image. Please try again.")

        # If it's already a path or full URL, return as is (avoiding re-upload)
        if data and isinstance(data, str) and (data.startswith("http") or "/" in data):
            # Extract path if it contains 'passports' to maintain consistency
            if "passports" in data:
                parts = data.split("?")[0].split("/")
                idx = parts.index("passports")
                return "/".join(parts[idx:])
            return data

        return super().to_internal_value(data)
