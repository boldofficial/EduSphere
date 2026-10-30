import re
import requests
from django.conf import settings
from django.core.cache import cache
from django.utils import timezone
from rest_framework.exceptions import ValidationError

from .models import School, SchoolDomain

HOST_RE = re.compile(r"^(?=.{4,253}$)(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$")


def normalize_custom_domain(value):
    raw = (value or "").strip().rstrip(".").lower()
    if not raw:
        return None
    if "://" in raw or "/" in raw or ":" in raw or "@" in raw:
        raise ValidationError({"custom_domain": "Enter only a hostname, for example portal.yourschool.com."})
    try:
        hostname = raw.encode("idna").decode("ascii")
    except UnicodeError as error:
        raise ValidationError({"custom_domain": "Enter a valid domain name."}) from error
    if not HOST_RE.fullmatch(hostname):
        raise ValidationError({"custom_domain": "Enter a valid domain name with at least one dot."})

    root = settings.ROOT_DOMAIN.lower().strip(".")
    if hostname == root or hostname.endswith(f".{root}"):
        raise ValidationError({"custom_domain": "MyRegistra addresses are reserved. Use your school's own domain."})
    return hostname


def setup_payload(school):
    try:
        setup = school.custom_domain_setup
    except SchoolDomain.DoesNotExist:
        return None
    effective_status = setup.status
    if setup.status == "active" and not school.custom_domain_allowed:
        effective_status = "suspended"
    return {
        "hostname": setup.hostname,
        "status": effective_status,
        "hostname_status": setup.hostname_status,
        "certificate_status": setup.certificate_status,
        "cname_target": settings.CUSTOM_DOMAIN_CNAME_TARGET,
        "validation_records": setup.validation_records,
        "failure_reason": setup.failure_reason,
        "last_checked_at": setup.last_checked_at,
        "activated_at": setup.activated_at,
    }


def clear_tenant_cache(*hostnames):
    for hostname in hostnames:
        if hostname:
            cache.delete(f"tenant_domain_lookup:{hostname}")


def request_custom_domain(school, value):
    hostname = normalize_custom_domain(value)
    old_active = school.custom_domain
    try:
        existing = school.custom_domain_setup
    except SchoolDomain.DoesNotExist:
        existing = None

    if hostname is None:
        if existing:
            delete_provider_hostname(existing)
            existing.delete()
        school.custom_domain = None
        school.save(update_fields=["custom_domain", "updated_at"])
        clear_tenant_cache(old_active, getattr(existing, "hostname", None))
        return None

    if School.objects.exclude(pk=school.pk).filter(custom_domain=hostname).exists():
        raise ValidationError({"custom_domain": "This domain is already connected to another school."})
    if SchoolDomain.objects.exclude(school=school).filter(hostname=hostname).exists():
        raise ValidationError({"custom_domain": "This domain is already being configured by another school."})

    if existing and existing.hostname == hostname:
        return existing
    if existing:
        delete_provider_hostname(existing)

    setup, _ = SchoolDomain.objects.update_or_create(
        school=school,
        defaults={
            "hostname": hostname,
            "status": "pending",
            "provider_hostname_id": "",
            "hostname_status": "",
            "certificate_status": "",
            "validation_records": [],
            "failure_reason": "",
            "last_checked_at": None,
            "activated_at": None,
        },
    )
    if old_active != hostname:
        school.custom_domain = None
        school.save(update_fields=["custom_domain", "updated_at"])
    clear_tenant_cache(old_active, hostname)
    return setup


def _cloudflare_configured():
    return bool(settings.CLOUDFLARE_API_TOKEN and settings.CLOUDFLARE_SAAS_ZONE_ID)


def _cloudflare_request(method, path, payload=None):
    response = requests.request(
        method,
        f"https://api.cloudflare.com/client/v4/zones/{settings.CLOUDFLARE_SAAS_ZONE_ID}{path}",
        headers={"Authorization": f"Bearer {settings.CLOUDFLARE_API_TOKEN}", "Content-Type": "application/json"},
        json=payload,
        timeout=15,
    )
    data = response.json()
    if not response.ok or not data.get("success"):
        messages = "; ".join(item.get("message", "Cloudflare request failed") for item in data.get("errors", []))
        raise RuntimeError(messages or f"Cloudflare returned HTTP {response.status_code}")
    return data["result"]


def _validation_records(result):
    records = []
    ownership = result.get("ownership_verification") or {}
    if ownership.get("name") and ownership.get("value"):
        records.append({"type": "TXT", "name": ownership["name"], "value": ownership["value"]})
    for record in (result.get("ssl") or {}).get("validation_records") or []:
        if record.get("txt_name") and record.get("txt_value"):
            records.append({"type": "TXT", "name": record["txt_name"], "value": record["txt_value"]})
    return records


def refresh_custom_domain(setup):
    setup.last_checked_at = timezone.now()
    setup.failure_reason = ""
    try:
        if not _cloudflare_configured():
            setup.status = "failed"
            setup.failure_reason = "Custom-domain provisioning is not configured. Contact MyRegistra support."
            setup.save()
            return setup

        if not setup.provider_hostname_id:
            result = _cloudflare_request(
                "POST",
                "/custom_hostnames",
                {"hostname": setup.hostname, "ssl": {"method": "txt", "type": "dv"}},
            )
            setup.provider_hostname_id = result["id"]
        else:
            result = _cloudflare_request("GET", f"/custom_hostnames/{setup.provider_hostname_id}")

        setup.hostname_status = result.get("status", "")
        setup.certificate_status = (result.get("ssl") or {}).get("status", "")
        setup.validation_records = _validation_records(result)
        if setup.hostname_status == "active" and setup.certificate_status == "active":
            setup.status = "active"
            setup.activated_at = setup.activated_at or timezone.now()
            setup.school.custom_domain = setup.hostname
            setup.school.save(update_fields=["custom_domain", "updated_at"])
            clear_tenant_cache(setup.hostname)
        elif setup.hostname_status in {"blocked", "deleted"} or setup.certificate_status in {"failed", "timed_out"}:
            setup.status = "failed"
            setup.failure_reason = "Cloudflare could not validate this hostname. Check the DNS records and try again."
        else:
            setup.status = "verifying"
        setup.save()
    except (requests.RequestException, RuntimeError, ValueError) as error:
        setup.status = "failed"
        setup.failure_reason = str(error)[:500]
        setup.save()
    return setup


def delete_provider_hostname(setup):
    if not setup.provider_hostname_id or not _cloudflare_configured():
        return
    try:
        _cloudflare_request("DELETE", f"/custom_hostnames/{setup.provider_hostname_id}")
    except (requests.RequestException, RuntimeError, ValueError):
        # Removing the local mapping is the security boundary; remote cleanup can be retried operationally.
        pass
