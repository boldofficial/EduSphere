from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    SubjectViewSet, TeacherViewSet, ClassViewSet, StudentViewSet,
    ReportCardViewSet, SubjectScoreViewSet, AttendanceSessionViewSet, AttendanceRecordViewSet,
    SchoolEventViewSet
)
from . import views

router = DefaultRouter()
router.register(r'subjects', views.SubjectViewSet)
router.register(r'teachers', views.TeacherViewSet)
router.register(r'classes', views.ClassViewSet)
router.register(r'staff', views.TeacherViewSet, basename='staff')
router.register(r'students', views.StudentViewSet)
router.register(r'reports', views.ReportCardViewSet)
router.register(r'scores', views.SubjectScoreViewSet)
router.register(r'attendance-sessions', views.AttendanceSessionViewSet)
router.register(r'attendance-records', views.AttendanceRecordViewSet)
router.register(r'events', views.SchoolEventViewSet)
router.register(r'announcements', views.SchoolEventViewSet, basename='announcements')
router.register(r'newsletters', views.SchoolEventViewSet, basename='newsletters')
router.register(r'lessons', views.LessonViewSet)
router.register(r'conduct-entries', views.ConductEntryViewSet)

urlpatterns = [
    path('', include(router.urls)),
]
