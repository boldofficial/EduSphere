from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import Avg, Sum, Count

from academic.views.base import TenantViewSet
from academic.models import (
    Commendation, ConductWarning, BehaviorAnalytics, ConductEntry, Student
)
from academic.serializers_conduct import (
    CommendationSerializer, CommendationCreateSerializer,
    ConductWarningSerializer, ConductWarningCreateSerializer,
    BehaviorAnalyticsSerializer, ConductEntrySerializer, ConductEntryCreateSerializer,
    BehaviorSummarySerializer
)


class CommendationViewSet(TenantViewSet):
    queryset = Commendation.objects.all()
    serializer_class = CommendationSerializer
    
    def get_serializer_class(self):
        if self.action in ["create", "update", "partial_update"]:
            return CommendationCreateSerializer
        return CommendationSerializer
    
    def get_queryset(self):
        qs = super().get_queryset()
        student_id = self.request.query_params.get("student")
        category = self.request.query_params.get("category")
        session = self.request.query_params.get("session")
        term = self.request.query_params.get("term")
        
        if student_id:
            qs = qs.filter(student_id=student_id)
        if category:
            qs = qs.filter(category=category)
        if session:
            qs = qs.filter(session=session)
        if term:
            qs = qs.filter(term=term)
        
        return qs.select_related("student", "awarded_by").order_by("-award_date")


class ConductWarningViewSet(TenantViewSet):
    queryset = ConductWarning.objects.all()
    serializer_class = ConductWarningSerializer
    
    def get_serializer_class(self):
        if self.action in ["create", "update", "partial_update"]:
            return ConductWarningCreateSerializer
        return ConductWarningSerializer
    
    def get_queryset(self):
        qs = super().get_queryset()
        student_id = self.request.query_params.get("student")
        severity = self.request.query_params.get("severity")
        status_filter = self.request.query_params.get("status")
        session = self.request.query_params.get("session")
        term = self.request.query_params.get("term")
        
        if student_id:
            qs = qs.filter(student_id=student_id)
        if severity:
            qs = qs.filter(severity=severity)
        if status_filter:
            qs = qs.filter(status=status_filter)
        if session:
            qs = qs.filter(session=session)
        if term:
            qs = qs.filter(term=term)
        
        return qs.select_related("student", "recorded_by").order_by("-incident_date")
    
    @action(detail=True, methods=["post"])
    def notify_parent(self, request, pk=None):
        """Mark parent as notified and add response."""
        warning = self.get_object()
        
        warning.parent_notified = True
        warning.parent_notification_method = request.data.get("method", "")
        warning.parent_response = request.data.get("response", "")
        warning.save()
        
        return Response(ConductWarningSerializer(warning).data)
    
    @action(detail=True, methods=["post"])
    def resolve(self, request, pk=None):
        """Resolve a warning."""
        warning = self.get_object()
        warning.status = "resolved"
        warning.action_taken = request.data.get("action_taken", "")
        warning.save()
        
        return Response(ConductWarningSerializer(warning).data)


class BehaviorAnalyticsViewSet(TenantViewSet):
    queryset = BehaviorAnalytics.objects.all()
    serializer_class = BehaviorAnalyticsSerializer
    
    def get_queryset(self):
        qs = super().get_queryset()
        student_id = self.request.query_params.get("student")
        session = self.request.query_params.get("session")
        term = self.request.query_params.get("term")
        
        if student_id:
            qs = qs.filter(student_id=student_id)
        if session:
            qs = qs.filter(session=session)
        if term:
            qs = qs.filter(term=term)
        
        return qs.select_related("student").order_by("-term")
    
    @action(detail=False, methods=["get"])
    def generate_all(self, request):
        """Generate analytics for all students in a term."""
        session = request.query_params.get("session")
        term = request.query_params.get("term")
        
        if not session or not term:
            return Response({"error": "session and term required"}, status=400)
        
        students = Student.objects.filter(school=request.tenant, status="active")
        
        for student in students:
            self.generate_student_analytics(student, session, term)
        
        return Response({"message": f"Generated analytics for {students.count()} students"})
    
    def generate_student_analytics(self, student, session, term):
        """Generate analytics for a single student."""
        from django.db.models import Avg
        
        # Get conduct entries
        conduct_avg = ConductEntry.objects.filter(
            student=student, session=session, term=term
        ).aggregate(avg=Avg("score"))["avg"] or 0
        
        # Get commendations
        comms = Commendation.objects.filter(student=student, session=session, term=term)
        total_comms = comms.count()
        comm_points = sum(c.points for c in comms)
        
        # Get warnings
        warnings = ConductWarning.objects.filter(student=student, session=session, term=term)
        total_warnings = warnings.count()
        
        # Calculate warning points (weighted by severity)
        warning_points = 0
        for w in warnings:
            if w.severity == "minor":
                warning_points += 1
            elif w.severity == "moderate":
                warning_points += 3
            elif w.severity == "serious":
                warning_points += 5
            else:  # severe
                warning_points += 10
        
        # Determine overall rating
        net_points = comm_points - warning_points
        if net_points >= 10:
            rating = "excellent"
        elif net_points >= 5:
            rating = "good"
        elif net_points >= 0:
            rating = "average"
        elif net_points >= -5:
            rating = "needs_improvement"
        else:
            rating = "poor"
        
        # Get trait scores
        trait_scores = {}
        for entry in ConductEntry.objects.filter(student=student, session=session, term=term):
            trait_scores[entry.trait] = entry.score
        
        # Calculate parent engagement
        parent_meetings = warnings.filter(parent_notification_method="meeting").count()
        parent_complaints = 0  # Could add a field for this
        
        analytics, _ = BehaviorAnalytics.objects.update_or_create(
            student=student,
            session=session,
            term=term,
            defaults={
                "avg_conduct_score": conduct_avg,
                "total_commendations": total_comms,
                "total_warnings": total_warnings,
                "trait_scores": trait_scores,
                "commendation_points": comm_points,
                "warning_points": warning_points,
                "overall_rating": rating,
                "parent_meetings": parent_meetings,
                "parent_complaints": parent_complaints,
            }
        )
        
        return analytics
    
    @action(detail=False, methods=["get"])
    def summary(self, request):
        """Get behavior summary for a student."""
        student_id = request.query_params.get("student")
        session = request.query_params.get("session")
        term = request.query_params.get("term", "")
        
        if not student_id or not session:
            return Response({"error": "student_id and session required"}, status=400)
        
        try:
            student = Student.objects.get(id=student_id)
        except Student.DoesNotExist:
            return Response({"error": "Student not found"}, status=404)
        
        recent_comms = Commendation.objects.filter(
            student=student, session=session
        ).order_by("-award_date")[:5]
        
        recent_warnings = ConductWarning.objects.filter(
            student=student, session=session
        ).order_by("-incident_date")[:5]
        
        # Get or generate current term analytics
        if term:
            analytics = BehaviorAnalytics.objects.filter(
                student=student, session=session, term=term
            ).first()
            if not analytics:
                analytics = self.generate_student_analytics(student, session, term)
        else:
            analytics = BehaviorAnalytics.objects.filter(
                student=student, session=session
            ).order_by("-term").first()
            if not analytics:
                # Generate for latest term
                from core.tenant_utils import get_request_school
                from schools.models import SchoolSettings
                school = request.tenant
                settings = SchoolSettings.objects.filter(school=school).first()
                if settings:
                    analytics = self.generate_student_analytics(student, session, settings.current_term)
        
        data = {
            "student_id": student.id,
            "student_name": student.names,
            "session": session,
            "term": term or analytics.term if analytics else "",
            "total_commendations": analytics.total_commendations if analytics else 0,
            "total_warnings": analytics.total_warnings if analytics else 0,
            "commendation_points": analytics.commendation_points if analytics else 0,
            "warning_points": analytics.warning_points if analytics else 0,
            "avg_conduct_score": analytics.avg_conduct_score if analytics else 0,
            "overall_rating": analytics.overall_rating if analytics else "N/A",
            "recent_commendations": CommendationSerializer(recent_comms, many=True).data,
            "recent_warnings": ConductWarningSerializer(recent_warnings, many=True).data,
        }
        
        return Response(data)


class ConductEntryViewSet(TenantViewSet):
    queryset = ConductEntry.objects.all()
    serializer_class = ConductEntrySerializer
    
    def get_serializer_class(self):
        if self.action in ["create", "update", "partial_update"]:
            return ConductEntryCreateSerializer
        return ConductEntrySerializer
    
    def get_queryset(self):
        qs = super().get_queryset()
        student_id = self.request.query_params.get("student")
        trait = self.request.query_params.get("trait")
        
        if student_id:
            qs = qs.filter(student_id=student_id)
        if trait:
            qs = qs.filter(trait=trait)
        
        return qs.select_related("student", "recorded_by").order_by("-date")