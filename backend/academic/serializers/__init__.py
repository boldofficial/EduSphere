"""
Academic serializers package.
Re-exports all serializers for backward compatibility.
"""

from .base import Base64ImageField
from .students import (
    StudentAchievementSerializer,
    StudentHistorySerializer,
    StudentSerializer,
)
from .teachers import TeacherSerializer
from .classes import ClassSerializer, SubjectSerializer, SubjectTeacherSerializer
from .lessons import LessonSerializer
from .reports import ReportCardSerializer, SubjectScoreSerializer
from .attendance import AttendanceRecordSerializer, AttendanceSessionSerializer
from .timetables import (
    PeriodSerializer,
    TimetableEntrySerializer,
    TimetableSerializer,
)

from .conduct import ConductEntrySerializer
from .events import SchoolEventSerializer
from .grading import GradeRangeSerializer, GradingSchemeSerializer

__all__ = [
    "Base64ImageField",
    "StudentSerializer",
    "StudentHistorySerializer",
    "StudentAchievementSerializer",
    "TeacherSerializer",
    "ClassSerializer",
    "SubjectSerializer",
    "SubjectTeacherSerializer",
    "LessonSerializer",
    "ReportCardSerializer",
    "SubjectScoreSerializer",
    "AttendanceRecordSerializer",
    "AttendanceSessionSerializer",
    "PeriodSerializer",
    "TimetableEntrySerializer",
    "TimetableSerializer",

    "ConductEntrySerializer",
    "SchoolEventSerializer",
    "GradeRangeSerializer",
    "GradingSchemeSerializer",
]
