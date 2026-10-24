from django.contrib.auth import get_user_model
from django.contrib.auth.backends import ModelBackend

User = get_user_model()


class EmailOrUsernameModelBackend(ModelBackend):
    """
    Sign in with a username (e.g. a student's "ST001@school") or an email address.

    An exact username match always wins. An email is accepted only when exactly one account uses it:
    never guess between accounts (e.g. a parent and a child sharing an address).
    """

    def authenticate(self, request, username=None, password=None, **kwargs):
        if username is None:
            username = kwargs.get(User.USERNAME_FIELD)
        if not username or password is None:
            return None

        user = User.objects.filter(username__iexact=username).first()
        if user is None:
            matches = list(User.objects.filter(email__iexact=username)[:2])
            user = matches[0] if len(matches) == 1 else None
        if user is None:
            User().set_password(password)  # same work as a real check, to avoid timing differences
            return None
        if user.check_password(password) and self.user_can_authenticate(user):
            return user
        return None
