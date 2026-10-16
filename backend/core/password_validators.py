import re
from django.core.exceptions import ValidationError
from django.utils.translation import gettext_lazy as _


class PasswordComplexityValidator:
    """
    Validate that password meets complexity requirements.
    - At least 8 characters
    - At least one uppercase letter
    - At least one lowercase letter
    - At least one digit
    - At least one special character
    """

    def __init__(self, min_length=8):
        self.min_length = min_length

    def validate(self, password, user=None):
        errors = []

        if len(password) < self.min_length:
            errors.append(_(f"Password must be at least {self.min_length} characters long."))

        if not re.search(r"[A-Z]", password):
            errors.append(_("Password must contain at least one uppercase letter."))

        if not re.search(r"[a-z]", password):
            errors.append(_("Password must contain at least one lowercase letter."))

        if not re.search(r"\d", password):
            errors.append(_("Password must contain at least one digit."))

        if not re.search(r'[!@#$%^&*(),.?":{}|<>]', password):
            errors.append(_("Password must contain at least one special character."))

        if errors:
            raise ValidationError(errors)

    def get_help_text(self):
        return _(
            f"Your password must contain at least {self.min_length} characters, "
            "including uppercase, lowercase, digit, and special character."
        )


class PasswordHistoryValidator:
    """
    Reject a new password that matches the current one or any of the user's last
    `history_length` passwords.

    validate() remembers the user's current (outgoing) hash; password_changed(), which Django calls
    after the new password is saved, stores that outgoing hash. Storing the outgoing hash (not the
    new one) matters because accounts created with create_user() never trigger password_changed.
    """

    def __init__(self, history_length=5):
        self.history_length = history_length

    def validate(self, password, user=None):
        from django.contrib.auth.hashers import check_password

        if user is None or not getattr(user, "pk", None):
            return  # new account, no history yet

        from core.models import PasswordHistory

        previous = list(
            PasswordHistory.objects.filter(user=user).values_list("password_hash", flat=True)[: self.history_length]
        )
        current = getattr(user, "password", "") or ""
        user._outgoing_password_hash = current
        for stored in [current, *previous]:
            if stored and check_password(password, stored):
                raise ValidationError(
                    _("You cannot reuse any of your last {0} passwords.").format(self.history_length),
                    code="password_reused",
                )

    def password_changed(self, password, user=None):
        outgoing = getattr(user, "_outgoing_password_hash", "") if user is not None else ""
        if not outgoing or not getattr(user, "pk", None) or outgoing == user.password:
            return
        from core.models import PasswordHistory

        PasswordHistory.objects.create(user=user, password_hash=outgoing)
        user._outgoing_password_hash = ""
        stale = PasswordHistory.objects.filter(user=user).values_list("pk", flat=True)[self.history_length :]
        PasswordHistory.objects.filter(pk__in=list(stale)).delete()

    def get_help_text(self):
        return _("You cannot reuse your last {0} passwords.").format(self.history_length)


class CommonPasswordPatternValidator:
    """
    Validate that password is not a common pattern or keyboard sequence.
    """

    def __init__(self):
        self.common_patterns = [
            "password",
            "12345678",
            "qwerty",
            "abc123",
            "monkey",
            "1234567",
            "letmein",
            "trustno1",
            "dragon",
            "baseball",
            "iloveyou",
            "master",
            "sunshine",
            "ashley",
            "bailey",
            "passw0rd",
            "shadow",
            "123123",
            "654321",
            "superman",
            "qazwsx",
            "michael",
            "football",
            "password1",
            "password123",
        ]
        self.sequences = [
            "qwertyuiop",
            "asdfghjkl",
            "zxcvbnm",
            "1234567890",
            "0987654321",
            "qweasdzxc",
            "asdqwezxc",
        ]

    def validate(self, password, user=None):
        password_lower = password.lower()

        if password_lower in self.common_patterns:
            raise ValidationError(_("This password is too common. Please choose a more secure password."))

        for seq in self.sequences:
            if seq in password_lower or seq[::-1] in password_lower:
                raise ValidationError(
                    _("This password contains a keyboard pattern. Please choose a more secure password.")
                )

        if len(set(password_lower)) < 4:
            raise ValidationError(_("This password uses too few unique characters."))

    def get_help_text(self):
        return _("Do not use common passwords or keyboard patterns.")
