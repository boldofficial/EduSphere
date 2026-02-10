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
router.register(r'lessons', views.LessonViewSet)
router.register(r'conduct-entries', views.ConductEntryViewSet)

# Timetable & Grading Module Endpoints
router.register(r'periods', views.PeriodViewSet, basename='periods')
router.register(r'timetables', views.TimetableViewSet, basename='timetables')
router.register(r'timetable-entries', views.TimetableEntryViewSet, basename='timetable-entries')
router.register(r'grading-schemes', views.GradingSchemeViewSet, basename='grading-schemes')
router.register(r'grade-ranges', views.GradeRangeViewSet, basename='grade-ranges')
router.register(r'subject_teachers', views.SubjectTeacherViewSet, basename='subject_teachers')
router.register(r'broadsheet', views.BroadsheetView, basename='broadsheet')

urlpatterns = [
    path('', include(router.urls)),
]

