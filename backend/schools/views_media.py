"""Website media library: upload, organise and delete a school's public website images."""

from django.conf import settings
from django.db import transaction
from django.db.models import Max, Sum
from rest_framework import mixins, serializers, status, viewsets
from rest_framework.decorators import action
from rest_framework.parsers import FormParser, JSONParser, MultiPartParser
from rest_framework.response import Response

from core.permissions import AdminOnly
from core.tenant_utils import get_request_school
from core.website_media import delete_website_files, public_url, save_website_image

from .models import WebsiteMedia

MAX_FILES_PER_UPLOAD = 20
FREE_PLAN_QUOTA_MB = 50


def quota_bytes(school):
    """Storage allowance for website images. Free schools get a small allowance; paid plans the configured one."""
    default_mb = getattr(settings, "WEBSITE_MEDIA_QUOTA_MB", 1024)
    sub = getattr(school, "subscription", None)
    plan_slug = getattr(getattr(sub, "plan", None), "slug", "") if sub else ""
    mb = FREE_PLAN_QUOTA_MB if plan_slug == "free" else default_mb
    return mb * 1024 * 1024


def used_bytes(school):
    return WebsiteMedia.objects.filter(school=school).aggregate(total=Sum("size_bytes"))["total"] or 0


def media_payload(item):
    return {
        "id": item.id,
        "url": public_url(item.path),
        "thumb_url": public_url(item.thumb_path or item.path),
        "width": item.width,
        "height": item.height,
        "alt_text": item.alt_text,
        "caption": item.caption,
        "album": item.album,
        "show_in_gallery": item.show_in_gallery,
        "position": item.position,
        "size_bytes": item.size_bytes,
        "created_at": item.created_at,
    }


class WebsiteMediaSerializer(serializers.ModelSerializer):
    class Meta:
        model = WebsiteMedia
        fields = ["alt_text", "caption", "album", "show_in_gallery", "position"]

    def validate_album(self, value):
        return " ".join(value.split())[:80]

    def to_representation(self, instance):
        return media_payload(instance)


class WebsiteMediaViewSet(
    mixins.ListModelMixin, mixins.UpdateModelMixin, mixins.DestroyModelMixin, viewsets.GenericViewSet
):
    """Admins only. Listing returns the whole library (it is bounded by the storage quota)."""

    permission_classes = [AdminOnly]
    serializer_class = WebsiteMediaSerializer
    parser_classes = [JSONParser, MultiPartParser, FormParser]
    pagination_class = None

    def get_school(self):
        return get_request_school(self.request, allow_super_admin_tenant=True)

    def get_queryset(self):
        school = self.get_school()
        return WebsiteMedia.objects.filter(school=school) if school else WebsiteMedia.objects.none()

    def list(self, request, *args, **kwargs):
        school = self.get_school()
        items = [media_payload(m) for m in self.get_queryset()]
        return Response(
            {
                "results": items,
                "usage": {
                    "used_bytes": used_bytes(school) if school else 0,
                    "quota_bytes": quota_bytes(school) if school else 0,
                },
            }
        )

    def create(self, request, *args, **kwargs):
        school = self.get_school()
        if not school:
            return Response({"detail": "School not found."}, status=status.HTTP_404_NOT_FOUND)
        files = request.FILES.getlist("files") or request.FILES.getlist("file")
        if not files:
            return Response({"detail": "Choose at least one image."}, status=status.HTTP_400_BAD_REQUEST)
        if len(files) > MAX_FILES_PER_UPLOAD:
            return Response(
                {"detail": f"Upload at most {MAX_FILES_PER_UPLOAD} images at a time."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        album = " ".join(str(request.data.get("album", "")).split())[:80]
        in_gallery = str(request.data.get("show_in_gallery", "true")).lower() not in ("false", "0", "no")
        remaining = quota_bytes(school) - used_bytes(school)
        position = (WebsiteMedia.objects.filter(school=school).aggregate(m=Max("position"))["m"] or 0) + 1

        created, errors = [], []
        for upload in files:
            name = upload.name[:120]
            try:
                stored = save_website_image(school.pk, upload.read(), with_thumbnail=True)
            except serializers.ValidationError as error:
                detail = error.detail[0] if isinstance(error.detail, list) else error.detail
                errors.append({"file": name, "error": str(detail)})
                continue
            if stored["size"] > remaining:
                delete_website_files(stored["path"], stored["thumb_path"])
                errors.append({"file": name, "error": "Your website storage is full. Delete some images first."})
                continue
            remaining -= stored["size"]
            created.append(
                WebsiteMedia.objects.create(
                    school=school,
                    path=stored["path"],
                    thumb_path=stored["thumb_path"],
                    width=stored["width"],
                    height=stored["height"],
                    size_bytes=stored["size"],
                    alt_text=name.rsplit(".", 1)[0].replace("_", " ").replace("-", " ")[:200],
                    album=album,
                    show_in_gallery=in_gallery,
                    position=position,
                )
            )
            position += 1

        code = status.HTTP_201_CREATED if created else status.HTTP_400_BAD_REQUEST
        body = {"results": [media_payload(m) for m in created], "errors": errors}
        if not created:
            body["detail"] = errors[0]["error"] if errors else "No images were uploaded."
        return Response(body, status=code)

    def perform_destroy(self, instance):
        paths = (instance.path, instance.thumb_path)
        instance.delete()
        transaction.on_commit(lambda: delete_website_files(*paths))

    @action(detail=False, methods=["post"])
    def reorder(self, request):
        """Body: {"ids": [3, 1, 2]} — the new gallery order."""
        ids = request.data.get("ids")
        if not isinstance(ids, list):
            return Response({"detail": "ids must be a list."}, status=status.HTTP_400_BAD_REQUEST)
        items = {m.id: m for m in self.get_queryset().filter(id__in=ids)}
        updates = []
        for index, media_id in enumerate(ids):
            item = items.get(int(media_id)) if str(media_id).isdigit() else None
            if item:
                item.position = index
                updates.append(item)
        WebsiteMedia.objects.bulk_update(updates, ["position"])
        return Response({"updated": len(updates)})
