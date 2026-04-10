import logging

from rest_framework.throttling import SimpleRateThrottle

logger = logging.getLogger(__name__)


class AuthRateThrottle(SimpleRateThrottle):
    """
    Strict rate limiting for authentication endpoints (login, password reset).
    Limits: 5 attempts per minute per IP
    """
    scope = "auth"
    rate = "5/minute"

    def get_cache_key(self, request, view):
        if request.user.is_authenticated:
            ident = request.user.pk
        else:
            ident = self.get_ident(request)

        return self.cache_format % {
            "scope": self.scope,
            "ident": ident
        }


class LoginFailRateThrottle(SimpleRateThrottle):
    """
    Track failed login attempts to prevent brute force.
    Locks out after 10 failed attempts.
    """
    scope = "login_fail"
    rate = "10/minute"

    def get_cache_key(self, request, view):
        ident = self.get_ident(request)
        return f"throttle_login_fail_{ident}"


class APIRateThrottle(SimpleRateThrottle):
    """
    General API rate limiting.
    Limits: 100 requests per minute per user
    """
    scope = "api"
    rate = "100/minute"

    def get_cache_key(self, request, view):
        if not request.user.is_authenticated:
            ident = self.get_ident(request)
        else:
            ident = request.user.pk

        return self.cache_format % {
            "scope": self.scope,
            "ident": ident
        }


class BurstRateThrottle(SimpleRateThrottle):
    """
    Burst rate limiting for short-term spikes.
    Limits: 20 requests per minute
    """
    scope = "burst"
    rate = "20/minute"

    def get_cache_key(self, request, view):
        if not request.user.is_authenticated:
            ident = self.get_ident(request)
        else:
            ident = request.user.pk

        return self.cache_format % {
            "scope": self.scope,
            "ident": ident
        }


class SustainedRateThrottle(SimpleRateThrottle):
    """
    Sustained rate limiting for prolonged usage.
    Limits: 500 requests per hour
    """
    scope = "sustained"
    rate = "500/hour"

    def get_cache_key(self, request, view):
        if not request.user.is_authenticated:
            ident = self.get_ident(request)
        else:
            ident = request.user.pk

        return self.cache_format % {
            "scope": self.scope,
            "ident": ident
        }
