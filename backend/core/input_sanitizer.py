"""
Input Sanitization Utilities

Provides functions to sanitize user inputs and prevent common attacks.
"""

import re
import html
from django.core.exceptions import ValidationError


# Maximum lengths for common fields
MAX_LENGTHS = {
    "name": 200,
    "email": 255,
    "phone": 20,
    "text": 5000,
    "description": 1000,
}


# Dangerous patterns to detect
DANGEROUS_PATTERNS = [
    r"<script",
    r"javascript:",
    r"on\w+\s*=",
    r"<iframe",
    r"eval\s*\(",
    r"exec\s*\(",
]


def sanitize_string(
    value: str, max_length: int = None, allow_html: bool = False
) -> str:
    """
    Sanitize a string input.

    Args:
        value: Input string to sanitize
        max_length: Maximum allowed length
        allow_html: Whether to allow HTML tags

    Returns:
        Sanitized string
    """
    if not value:
        return ""

    if not isinstance(value, str):
        value = str(value)

    if not allow_html:
        # Remove HTML tags
        value = re.sub(r"<[^>]+>", "", value)
        # Escape HTML entities
        value = html.escape(value)

    # Check for dangerous patterns
    for pattern in DANGEROUS_PATTERNS:
        if re.search(pattern, value, re.IGNORECASE):
            value = re.sub(pattern, "", value, flags=re.IGNORECASE)

    # Trim to max length
    if max_length and len(value) > max_length:
        value = value[:max_length]

    return value.strip()


def sanitize_email(email: str) -> str:
    """Sanitize an email address"""
    if not email:
        return ""

    email = sanitize_string(email, MAX_LENGTHS["email"])

    # Basic email validation regex
    if not re.match(r"^[\w\.-]+@[\w\.-]+\.\w+$", email):
        raise ValidationError("Invalid email format")

    return email.lower()


def sanitize_phone(phone: str) -> str:
    """Sanitize a phone number"""
    if not phone:
        return ""

    # Remove non-digits
    phone = re.sub(r"\D", "", phone)

    if len(phone) < 10 or len(phone) > 15:
        raise ValidationError("Invalid phone number")

    return phone


def sanitize_name(name: str) -> str:
    """Sanitize a name field"""
    return sanitize_string(name, MAX_LENGTHS["name"])


def sanitize_text(text: str, allow_html: bool = False) -> str:
    """Sanitize a text/description field"""
    return sanitize_string(text, MAX_LENGTHS["text"], allow_html)


def validate_uuid(value: str) -> bool:
    """Validate UUID format"""
    uuid_pattern = r"^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$"
    return bool(re.match(uuid_pattern, str(value), re.IGNORECASE))


def sanitize_model_field(field_name: str, value, field_type: str = "text") -> any:
    """
    Sanitize a model field based on field type.

    Args:
        field_name: Name of the model field
        value: Value to sanitize
        field_type: Type of field ('name', 'email', 'phone', 'text', 'uuid')

    Returns:
        Sanitized value
    """
    if value is None:
        return None

    if field_type == "email":
        return sanitize_email(value)
    elif field_type == "phone":
        return sanitize_phone(value)
    elif field_type == "name":
        return sanitize_name(value)
    elif field_type == "uuid":
        if not validate_uuid(value):
            raise ValidationError(f"Invalid {field_name}")
        return value.lower()
    else:
        return sanitize_text(value)


class InputSanitizerMixin:
    """
    Mixin to add input sanitization to serializers or views.

    Usage:
        class MySerializer(ModelSerializer, InputSanitizerMixin):
            def validate(self, attrs):
                attrs['name'] = self.sanitize(attrs.get('name'), 'name')
                attrs['email'] = self.sanitize(attrs.get('email'), 'email')
                return attrs
    """

    def sanitize(self, value, field_type: str = "text") -> any:
        """Sanitize a value based on field type"""
        return sanitize_model_field("field", value, field_type)

    def sanitize_dict(self, data: dict, fields: dict) -> dict:
        """
        Sanitize multiple fields at once.

        Args:
            data: Dictionary of field values
            fields: Dict mapping field name to field type

        Returns:
            Sanitized dictionary
        """
        sanitized = {}
        for field_name, field_type in fields.items():
            if field_name in data:
                sanitized[field_name] = self.sanitize(data[field_name], field_type)

        return sanitized
