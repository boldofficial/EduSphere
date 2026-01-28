from django.urls import path
from .views import MeView, ImpersonateUserView, CreateAccountView

urlpatterns = [
    path('me/', MeView.as_view(), name='user-me'),
    path('impersonate/', ImpersonateUserView.as_view(), name='user-impersonate'),
    path('account-setup/', CreateAccountView.as_view(), name='account-setup'),
]
