"""Allow-list sanitizers for school-managed public website content."""

import re
from html import escape
from html.parser import HTMLParser
from urllib.parse import urlparse

ALLOWED_TAGS = {
    "a",
    "abbr",
    "address",
    "article",
    "aside",
    "b",
    "caption",
    "cite",
    "code",
    "dd",
    "dl",
    "dt",
    "footer",
    "h5",
    "h6",
    "header",
    "i",
    "mark",
    "nav",
    "pre",
    "small",
    "sub",
    "sup",
    "table",
    "tbody",
    "td",
    "tfoot",
    "th",
    "thead",
    "time",
    "tr",
    "u",
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
    "td": {"colspan", "rowspan"},
    "th": {"colspan", "rowspan", "scope"},
    "time": {"datetime"},
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
        if property_name == "position" and property_value.lower().startswith(("fixed", "sticky")):
            continue
        if not CSS_PROPERTY.fullmatch(property_name) or not property_value or UNSAFE_INLINE_CSS.search(property_value):
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
    r"@import|expression\s*\(|javascript\s*:|behavior\s*:|-moz-binding|</?style|position\s*:\s*(?:fixed|sticky)",
    re.IGNORECASE,
)


def validate_website_css(value):
    value = (value or "").strip()
    if len(value) > 50_000:
        raise ValueError("Custom CSS must be 50,000 characters or fewer.")
    if "<" in value:
        # CSS never needs "<"; blocking it means section CSS can never close its <style>/<template> early.
        raise ValueError('Custom CSS cannot contain "<". Put HTML in the HTML box.')
    if UNSAFE_CSS.search(value):
        raise ValueError(
            "Custom CSS contains a rule that is not allowed (imports, scripts, or fixed/sticky positioning)."
        )
    return value


BUILTIN_SECTION_KEYS = ("hero", "about", "values", "programs", "gallery", "cta", "contact")
SECTION_ID = re.compile(r"^[a-z0-9-]{1,40}$")
MAX_SECTIONS = 30
MAX_SECTION_HTML = 100_000


def sanitize_landing_sections(value):
    """Validate the ordered section list and clean every section's HTML and CSS before it is stored."""
    if value in (None, ""):
        return []
    if not isinstance(value, list):
        raise ValueError("Sections must be a list.")
    if len(value) > MAX_SECTIONS:
        raise ValueError(f"A page can have at most {MAX_SECTIONS} sections.")
    clean, seen_ids, seen_builtins = [], set(), set()
    for index, item in enumerate(value, start=1):
        if not isinstance(item, dict):
            raise ValueError(f"Section {index} is not valid.")
        key = str(item.get("key") or "")
        if key not in BUILTIN_SECTION_KEYS and key != "custom":
            raise ValueError(f"Section {index} has an unknown type.")
        if key != "custom":
            if key in seen_builtins:
                raise ValueError(f"The {key} section appears twice.")
            seen_builtins.add(key)
        section_id = str(item.get("id") or key)
        if not SECTION_ID.fullmatch(section_id) or section_id in seen_ids:
            raise ValueError(f"Section {index} has an invalid or duplicate id.")
        seen_ids.add(section_id)
        html = str(item.get("html") or "")
        if len(html) > MAX_SECTION_HTML:
            raise ValueError(f"Section {index}: HTML must be {MAX_SECTION_HTML:,} characters or fewer.")
        try:
            css = validate_website_css(str(item.get("css") or ""))
        except ValueError as error:
            raise ValueError(f"Section {index}: {error}") from error
        clean.append(
            {
                "id": section_id,
                "key": key,
                "title": str(item.get("title") or "")[:120],
                "enabled": bool(item.get("enabled", True)),
                # School-made sections are always custom code.
                "use_custom": True if key == "custom" else bool(item.get("use_custom")),
                "html": sanitize_website_html(html),
                "css": css,
            }
        )
    return clean
