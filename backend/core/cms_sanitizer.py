"""Allow-list sanitizers for school-managed public website content."""

import re
from html import escape
from html.parser import HTMLParser
from urllib.parse import urlparse

ALLOWED_TAGS = {
    "a",
    "blockquote",
    "br",
    "div",
    "em",
    "figcaption",
    "figure",
    "h1",
    "h2",
    "h3",
    "h4",
    "hr",
    "img",
    "li",
    "ol",
    "p",
    "section",
    "span",
    "strong",
    "ul",
}
VOID_TAGS = {"br", "hr", "img"}
GLOBAL_ATTRIBUTES = {"class", "id", "title", "aria-label", "style"}
TAG_ATTRIBUTES = {
    "a": {"href", "target", "rel"},
    "img": {"src", "alt", "width", "height", "loading"},
}
SAFE_URL_SCHEMES = {"", "http", "https", "mailto", "tel"}
CSS_PROPERTY = re.compile(r"^(?:--[a-z0-9_-]+|-?[a-z][a-z0-9-]*)$", re.IGNORECASE)
UNSAFE_INLINE_CSS = re.compile(
    r"expression\s*\(|javascript\s*:|vbscript\s*:|behavior\s*:|-moz-binding|@import|</?style",
    re.IGNORECASE,
)


def _safe_url(value):
    value = value.strip()
    if value.startswith(("/", "#")):
        return value
    return value if urlparse(value).scheme.lower() in SAFE_URL_SCHEMES else ""


def sanitize_inline_style(value):
    """Keep ordinary inline declarations while dropping executable or malformed CSS."""
    clean = []
    for declaration in (value or "").split(";"):
        if ":" not in declaration:
            continue
        property_name, property_value = declaration.split(":", 1)
        property_name = property_name.strip().lower()
        property_value = property_value.strip()
        if (
            not CSS_PROPERTY.fullmatch(property_name)
            or not property_value
            or UNSAFE_INLINE_CSS.search(property_value)
        ):
            continue
        clean.append(f"{property_name}: {property_value}")
    return "; ".join(clean)


class _WebsiteHTMLSanitizer(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.output = []
        self.blocked_depth = 0

    def handle_starttag(self, tag, attrs):
        tag = tag.lower()
        if tag in {"script", "style", "iframe", "object", "embed", "form", "input", "button"}:
            self.blocked_depth += 1
            return
        if self.blocked_depth or tag not in ALLOWED_TAGS:
            return

        allowed = GLOBAL_ATTRIBUTES | TAG_ATTRIBUTES.get(tag, set())
        clean_attrs = []
        for name, value in attrs:
            name = name.lower()
            if name not in allowed or name.startswith("on") or value is None:
                continue
            if name in {"href", "src"}:
                value = _safe_url(value)
                if not value:
                    continue
            if name == "style":
                value = sanitize_inline_style(value)
                if not value:
                    continue
            if tag == "a" and name == "target" and value != "_blank":
                continue
            clean_attrs.append(f'{name}="{escape(value, quote=True)}"')
        if tag == "a" and any(name == "target" and value == "_blank" for name, value in attrs):
            clean_attrs.append('rel="noopener noreferrer"')
        suffix = f" {' '.join(clean_attrs)}" if clean_attrs else ""
        self.output.append(f"<{tag}{suffix}>")

    def handle_startendtag(self, tag, attrs):
        self.handle_starttag(tag, attrs)

    def handle_endtag(self, tag):
        tag = tag.lower()
        if tag in {"script", "style", "iframe", "object", "embed", "form", "input", "button"}:
            self.blocked_depth = max(0, self.blocked_depth - 1)
            return
        if not self.blocked_depth and tag in ALLOWED_TAGS and tag not in VOID_TAGS:
            self.output.append(f"</{tag}>")

    def handle_data(self, data):
        if not self.blocked_depth:
            self.output.append(escape(data))

    def handle_entityref(self, name):
        if not self.blocked_depth:
            self.output.append(f"&{name};")

    def handle_charref(self, name):
        if not self.blocked_depth:
            self.output.append(f"&#{name};")


def sanitize_website_html(value):
    parser = _WebsiteHTMLSanitizer()
    parser.feed(value or "")
    parser.close()
    return "".join(parser.output)


UNSAFE_CSS = re.compile(
    r"@import|expression\s*\(|javascript\s*:|behavior\s*:|-moz-binding|</?style",
    re.IGNORECASE,
)


def validate_website_css(value):
    value = (value or "").strip()
    if len(value) > 50_000:
        raise ValueError("Custom CSS must be 50,000 characters or fewer.")
    if UNSAFE_CSS.search(value):
        raise ValueError("Custom CSS contains an unsafe rule.")
    return value
