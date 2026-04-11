"""
Academic views — split into domain-focused modules.

All ViewSets and APIViews are re-exported here for backward-compatible imports.
Existing code using `from academic.views import XViewSet` or `from . import views`
will continue to work without modification.
"""

from .base import IsAdminOrReadOnly, TenantViewSet  # noqa: F401
from .students import (  # noqa: F401
    StudentAchievementViewSet,
    StudentHistoryViewSet,
    StudentViewSet,
)
from .classes import ClassViewSet, SubjectTeacherViewSet, SubjectViewSet  # noqa: F401
from .teachers import TeacherViewSet  # noqa: F401
from .reports import (  # noqa: F401
    BroadsheetView,
    ReportCardViewSet,
    SubjectScoreViewSet,
)
from .attendance import AttendanceRecordViewSet, AttendanceSessionViewSet  # noqa: F401
from .timetables import (  # noqa: F401
    PeriodViewSet,
    TimetableEntryViewSet,
    TimetableViewSet,
)
from .admissions import AdmissionIntakeViewSet, AdmissionViewSet  # noqa: F401
from .conduct import ConductEntryViewSet  # noqa: F401
from .events import SchoolEventViewSet  # noqa: F401
from .grading import GradeRangeViewSet, GradingSchemeViewSet  # noqa: F401
from .lessons import LessonViewSet  # noqa: F401
from .ai_views import (  # noqa: F401
    AIInsightsView,
    AILessonPlanView,
    AIPredictiveInsightsView,
    AITimetableGenerateView,
    GradeTrendView,
)
from .search import GlobalSearchView  # noqa: F401
from .migration import AcademicDataMigrationViewSet  # noqa: F401
