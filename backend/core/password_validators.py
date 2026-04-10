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
            errors.append(
                _(f"Password must be at least {self.min_length} characters long.")
            )

        if not re.search(r'[A-Z]', password):
            errors.append(_("Password must contain at least one uppercase letter."))

        if not re.search(r'[a-z]', password):
            errors.append(_("Password must contain at least one lowercase letter."))

        if not re.search(r'\d', password):
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
    Validate that password is not in the user's password history.
    Prevents reuse of last N passwords.
    """

    def __init__(self, history_length=5):
        self.history_length = history_length

    def validate(self, password, user=None):
        if not user:
            return

        from django.contrib.auth import get_user_model
        User = get_user_model()

        try:
            from django.contrib.auth.hashers import check_password
            from rest_framework_simplejwt.blacklist.models import BlacklistedToken

            user_tokens = BlacklistedToken.objects.filter(
                token__user=user
            ).select_related('token')

            for token_entry in user_tokens[:self.history_length]:
                if hasattr(token_entry, 'token'):
                    try:
                        from rest_framework_simplejwt.tokens import RefreshToken
                        refresh = RefreshToken(token_entry.token.token)
                        if 'password' in refresh.get('payload', {}):
                            if check_password(password, refresh['password']):
                                raise ValidationError(
                                    _("You cannot reuse any of your last {0} passwords.").format(
                                        self.history_length
                                    )
                                )
                    except Exception:
                        pass
        except ImportError:
            pass

    def get_help_text(self):
        return _("You cannot reuse your last {0} passwords.").format(self.history_length)


class CommonPasswordPatternValidator:
    """
    Validate that password is not a common pattern or keyboard sequence.
    """

    def __init__(self):
        self.common_patterns = [
            'password', '12345678', 'qwerty', 'abc123', 'monkey',
            '1234567', 'letmein', 'trustno1', 'dragon', 'baseball',
            'iloveyou', 'master', 'sunshine', 'ashley', 'bailey',
            'passw0rd', 'shadow', '123123', '654321', 'superman',
            'qazwsx', 'michael', 'football', 'password1', 'password123',
        ]
        self.sequences = [
            'qwertyuiop', 'asdfghjkl', 'zxcvbnm',
            '1234567890', '0987654321',
            'qweasdzxc', 'asdqwezxc',
        ]

    def validate(self, password, user=None):
        password_lower = password.lower()

        if password_lower in self.common_patterns:
            raise ValidationError(
                _("This password is too common. Please choose a more secure password.")
            )

        for seq in self.sequences:
            if seq in password_lower or seq[::-1] in password_lower:
                raise ValidationError(
                    _("This password contains a keyboard pattern. Please choose a more secure password.")
                )

        if len(set(password_lower)) < 4:
            raise ValidationError(
                _("This password uses too few unique characters.")
            )

    def get_help_text(self):
        return _("Do not use common passwords or keyboard patterns.")
