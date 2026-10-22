"""
Validation and snapshots for a school's structured website content: theme, stats, team, FAQs, social
links. Everything here is plain text rendered by React (never as HTML), so cleaning means trimming,
length limits, structure, and safe URLs.
"""

import re
from urllib.parse import urlparse

THEME_PRESETS = ("classic", "modern", "royal", "fresh", "warm", "bold", "custom")
FONT_KEYS = ("inter", "poppins", "montserrat", "playfair", "merriweather", "nunito", "lora", "raleway")
SOCIAL_KEYS = ("facebook", "instagram", "x", "youtube", "tiktok", "linkedin")
HEX_COLOR = re.compile(r"^#[0-9a-fA-F]{6}$")
PHONE = re.compile(r"^\+?[0-9 ]{7,20}$")

# Fields that make up the public website; a change to any of them is saved as a revision.
WEBSITE_FIELDS = (
    "school_tagline",
    "landing_hero_title",
    "landing_hero_subtitle",
    "landing_hero_image",
    "landing_features",
    "landing_about_text",
    "landing_about_eyebrow",
    "landing_about_title",
    "landing_about_html",
    "landing_about_primary_image",
    "landing_about_secondary_image",
    "landing_about_image_position",
    "landing_primary_color",
    "landing_show_stats",
    "landing_cta_text",
    "landing_core_values",
    "landing_academic_programs",
    "landing_testimonials",
    "landing_stats_config",
    "landing_sections",
    "landing_theme",
    "landing_stats",
    "landing_team",
    "landing_faqs",
    "landing_social",
    "landing_opening_hours",
)


class ContentError(ValueError):
    pass


def _text(value, limit, field):
    text = " ".join(str(value or "").split()) if limit <= 300 else str(value or "").strip()
    if len(text) > limit:
        raise ContentError(f"{field} must be {limit} characters or fewer.")
    return text


def _list(value, limit, field):
    if value in (None, ""):
        return []
    if not isinstance(value, list):
        raise ContentError(f"{field} must be a list.")
    if len(value) > limit:
        raise ContentError(f"Add at most {limit} {field}.")
    return [item for item in value if isinstance(item, dict)]


def clean_theme(value):
    value = value if isinstance(value, dict) else {}
    preset = value.get("preset") or "classic"
    if preset not in THEME_PRESETS:
        raise ContentError("Unknown theme preset.")
    accent = value.get("accent_color") or ""
    if accent and not HEX_COLOR.fullmatch(accent):
        raise ContentError("Accent colour must be a hex colour like #D4AF37.")
    fonts = {}
    for key in ("heading_font", "body_font"):
        font = value.get(key) or ""
        if font and font not in FONT_KEYS:
            raise ContentError("Unknown font.")
        fonts[key] = font
    return {"preset": preset, "accent_color": accent, **fonts}


def clean_stats(value):
    return [
        {"value": _text(item.get("value"), 20, "Stat value"), "label": _text(item.get("label"), 60, "Stat label")}
        for item in _list(value, 6, "stats")
        if item.get("value") or item.get("label")
    ]


def clean_faqs(value):
    return [
        {
            "question": _text(item.get("question"), 200, "Question"),
            "answer": _text(item.get("answer"), 2000, "Answer"),
        }
        for item in _list(value, 30, "questions")
        if item.get("question")
    ]


def clean_team(value):
    """Images are converted separately (base64 to website media) by the serializer."""
    return [
        {
            "name": _text(item.get("name"), 100, "Name"),
            "role": _text(item.get("role"), 100, "Role"),
            "bio": _text(item.get("bio"), 500, "Bio"),
            "image": item.get("image") or "",
        }
        for item in _list(value, 24, "team members")
        if item.get("name")
    ]


def _safe_https(url, field):
    url = str(url or "").strip()
    if not url:
        return ""
    parsed = urlparse(url)
    if parsed.scheme != "https" or not parsed.netloc or len(url) > 300:
        raise ContentError(f"{field} must be a full https:// link.")
    return url


def clean_social(value):
    value = value if isinstance(value, dict) else {}
    clean = {key: _safe_https(value.get(key), key.capitalize()) for key in SOCIAL_KEYS}
    whatsapp = str(value.get("whatsapp") or "").strip()
    if whatsapp and not PHONE.fullmatch(whatsapp):
        raise ContentError("WhatsApp must be a phone number, e.g. +234 801 234 5678.")
    clean["whatsapp"] = whatsapp
    return clean


def snapshot(settings):
    """The website as it is now, for the revision history."""
    data = {field: getattr(settings, field) for field in WEBSITE_FIELDS}
    data["logo"] = settings.school.logo
    return data


def apply_snapshot(settings, data):
    """Restore a saved website snapshot (values were already validated when first saved)."""
    for field in WEBSITE_FIELDS:
        if field in data:
            setattr(settings, field, data[field])
    settings.save()
    if "logo" in data and data["logo"] != settings.school.logo:
        settings.school.logo = data["logo"]
        settings.school.save(update_fields=["logo"])
