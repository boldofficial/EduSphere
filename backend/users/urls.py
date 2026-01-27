from django.urls import path
from .views import MeView, ImpersonateUserView

urlpatterns = [
    path('me/', MeView.as_view(), name='user-me'),
    path('impersonate/', ImpersonateUserView.as_view(), name='user-impersonate'),
]
