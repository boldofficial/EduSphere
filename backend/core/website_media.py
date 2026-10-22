"""
Public website media: school logos, hero/about photos, gallery images.

Unlike student photos and signatures (private, served through short-lived signed links), website images are
public by nature. They are stored under ``website/<school_id>/`` with random names and served at a permanent
address (``/site-media/website/...``) that never expires, so a link pasted into a custom section keeps working.
Images are re-encoded on upload: right-rotated, resized, stripped of metadata (including GPS) and compressed.
"""

import io
import re
import uuid

from django.conf import settings
from django.core.files.base import ContentFile
from django.core.files.storage import default_storage
from rest_framework import serializers

WEBSITE_PREFIX = "website/"
WEBSITE_PATH = re.compile(r"^website/\d+/[A-Za-z0-9_-]{1,80}\.(?:webp|png|jpg|jpeg|gif)$")
PUBLIC_ROUTE = "/site-media/"

MAX_SOURCE_BYTES = 15 * 1024 * 1024  # phone photos; they are compressed on upload
MAX_SOURCE_PIXELS = 50_000_000  # refuse decompression bombs
FULL_MAX_SIDE = 1920
THUMB_MAX_SIDE = 640
LOGO_MAX_SIDE = 1024


def is_website_path(path):
    return bool(path) and WEBSITE_PATH.fullmatch(str(path)) is not None


def public_url(path):
    """Permanent address for a website image. Relative by default, so it works on any school domain."""
    base = getattr(settings, "WEBSITE_MEDIA_BASE_URL", "") or ""
    if base:
        return f"{base.rstrip('/')}/{path}"
    return f"{PUBLIC_ROUTE}{path}"


def path_from_url(value):
    """Turn a website image address handed back by the frontend into its stored path, else None."""
    if not value or not isinstance(value, str):
        return None
    value = value.split("?", 1)[0]
    base = getattr(settings, "WEBSITE_MEDIA_BASE_URL", "") or ""
    for marker in filter(None, [PUBLIC_ROUTE, base.rstrip("/") + "/" if base else None]):
        if marker in value:
            candidate = value.split(marker, 1)[1]
            return candidate if is_website_path(candidate) else None
    return value if is_website_path(value) else None


def _open(data):
    from PIL import Image, ImageOps

    if len(data) > MAX_SOURCE_BYTES:
        raise serializers.ValidationError(f"Image is too large (max {MAX_SOURCE_BYTES // (1024 * 1024)} MB).")
    try:
        probe = Image.open(io.BytesIO(data))
        if probe.format not in {"JPEG", "PNG", "GIF", "WEBP", "MPO"}:
            raise serializers.ValidationError("Use a JPG, PNG, GIF or WebP image.")
        if probe.width * probe.height > MAX_SOURCE_PIXELS:
            raise serializers.ValidationError("Image dimensions are too large.")
        probe.verify()
        image = Image.open(io.BytesIO(data))  # verify() leaves the image unusable; reopen
        image.load()
    except serializers.ValidationError:
        raise
    except Exception:
        raise serializers.ValidationError("File is not a valid image.")
    image = ImageOps.exif_transpose(image)  # respect phone orientation, then metadata is dropped on save
    has_alpha = image.mode in ("RGBA", "LA") or (image.mode == "P" and "transparency" in image.info)
    return image.convert("RGBA" if has_alpha else "RGB")


def _encode(image, max_side, fmt="WEBP"):
    copy = image.copy()
    copy.thumbnail((max_side, max_side))
    out = io.BytesIO()
    if fmt == "PNG":
        copy.save(out, "PNG", optimize=True)
    else:
        copy.save(out, "WEBP", quality=82, method=6)
    return out.getvalue(), copy.width, copy.height


def save_website_image(school_id, data, *, logo=False, with_thumbnail=False):
    """
    Optimise and store an uploaded image for a school's website.
    Returns {"path", "thumb_path", "width", "height", "size"}.
    """
    image = _open(data)
    name = uuid.uuid4().hex
    folder = f"{WEBSITE_PREFIX}{int(school_id)}"
    if logo:
        # PNG keeps logos crisp and works as a favicon everywhere.
        content, width, height = _encode(image, LOGO_MAX_SIDE, "PNG")
        path = default_storage.save(f"{folder}/{name}.png", ContentFile(content))
    else:
        content, width, height = _encode(image, FULL_MAX_SIDE)
        path = default_storage.save(f"{folder}/{name}.webp", ContentFile(content))
    result = {"path": path, "thumb_path": "", "width": width, "height": height, "size": len(content)}
    if with_thumbnail:
        thumb, _, _ = _encode(image, THUMB_MAX_SIDE)
        result["thumb_path"] = default_storage.save(f"{folder}/{name}_thumb.webp", ContentFile(thumb))
        result["size"] += len(thumb)
    return result


def delete_website_files(*paths):
    for path in paths:
        if is_website_path(path):
            try:
                default_storage.delete(path)
            except Exception:  # a missing file must not block deleting the record
                pass
