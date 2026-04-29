from django.urls import path
from . import views

urlpatterns = [
    path("import/", views.import_data, name="import_data"),
    path("jobs/", views.import_job_list, name="import_job_list"),
    path("jobs/<int:job_id>/", views.import_job_detail, name="import_job_detail"),
]