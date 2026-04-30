from django.urls import path

from .views import (
    CreateAccountView,
    DemoLoginView,
    ImpersonateUserView,
    MeView,
    PasswordResetConfirmView,
    PasswordResetRequestView,
)

two_factor_urlpatterns = []
try:
    from .two_factor import (
        TwoFactorSetupView,
        TwoFactorVerifyView,
        TwoFactorLoginView,
        TwoFactorStatusView,
        TwoFactorRegenerateBackupCodesView,
    )

    two_factor_urlpatterns = [
        # Two-Factor Authentication
        path("2fa/setup/", TwoFactorSetupView.as_view(), name="2fa-setup"),
        path("2fa/verify/", TwoFactorVerifyView.as_view(), name="2fa-verify"),
        path("2fa/login/", TwoFactorLoginView.as_view(), name="2fa-login"),
        path("2fa/status/", TwoFactorStatusView.as_view(), name="2fa-status"),
        path("2fa/backup-codes/", TwoFactorRegenerateBackupCodesView.as_view(), name="2fa-backup-codes"),
    ]
except Exception:
    # Keep core auth routes available even if optional 2FA deps are missing at runtime.
    two_factor_urlpatterns = []

urlpatterns = [
    path("me/", MeView.as_view(), name="user-me"),
    path("impersonate/", ImpersonateUserView.as_view(), name="user-impersonate"),
    path("account-setup/", CreateAccountView.as_view(), name="account-setup"),
    path("demo-login/", DemoLoginView.as_view(), name="demo-login"),
    path("password-reset-request/", PasswordResetRequestView.as_view(), name="password-reset-request"),
    path("password-reset-confirm/", PasswordResetConfirmView.as_view(), name="password-reset-confirm"),
] + two_factor_urlpatterns
