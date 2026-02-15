from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    SubjectViewSet, TeacherViewSet, ClassViewSet, StudentViewSet,
    ReportCardViewSet, SubjectScoreViewSet, AttendanceSessionViewSet, AttendanceRecordViewSet,
    SchoolEventViewSet, HeaderEchoView, StudentHistoryViewSet, StudentAchievementViewSet,
    AIInsightsView, AITimetableGenerateView,
    AdmissionIntakeViewSet, AdmissionViewSet, LessonViewSet, ConductEntryViewSet,
    PeriodViewSet, TimetableViewSet, TimetableEntryViewSet, GradingSchemeViewSet,
    GradeRangeViewSet, SubjectTeacherViewSet, BroadsheetView, GlobalSearchView
)
from . import views

router = DefaultRouter()
router.register(r'subjects', views.SubjectViewSet)
router.register(r'teachers', views.TeacherViewSet)
router.register(r'classes', views.ClassViewSet)
router.register(r'staff', views.TeacherViewSet, basename='staff')
router.register(r'students', views.StudentViewSet)
router.register(r'student-history', views.StudentHistoryViewSet, basename='student-history')
router.register(r'student-achievements', views.StudentAchievementViewSet, basename='student-achievements')
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
router.register(r'timetable-entries', TimetableEntryViewSet, basename='timetable-entries')
router.register(r'admission-intakes', AdmissionIntakeViewSet, basename='admission-intakes')
router.register(r'admissions', AdmissionViewSet, basename='admissions')
router.register(r'grading-schemes', views.GradingSchemeViewSet, basename='grading-schemes')
router.register(r'grade-ranges', views.GradeRangeViewSet, basename='grade-ranges')
router.register(r'subject_teachers', views.SubjectTeacherViewSet, basename='subject_teachers')
router.register(r'broadsheet', views.BroadsheetView, basename='broadsheet')

urlpatterns = [
    path('debug-headers/', HeaderEchoView.as_view(), name='debug-headers'),
    path('global-search/', views.GlobalSearchView.as_view(), name='global-search'),
    path('ai-insights/', views.AIInsightsView.as_view(), name='ai-insights'),
    path('timetables/magic-generate/', views.AITimetableGenerateView.as_view(), name='magic-generate'),
    path('', include(router.urls)),
]

