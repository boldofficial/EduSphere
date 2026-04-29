from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db import models
from datetime import date

from academic.views.base import TenantViewSet
from transport.models import (
    BusRoute, BusStop, TransportAssignment, TransportFee,
    BusAttendance, TransportPayment
)
from transport.serializers import (
    BusRouteSerializer, BusRouteListSerializer, BusStopSerializer,
    TransportAssignmentSerializer, TransportAssignmentCreateSerializer,
    TransportFeeSerializer, BusAttendanceSerializer, TransportPaymentSerializer
)


class BusStopViewSet(TenantViewSet):
    queryset = BusStop.objects.order_by('name').all()
    serializer_class = BusStopSerializer
    
    def get_queryset(self):
        qs = super().get_queryset()
        route_id = self.request.query_params.get("route")
        if route_id:
            qs = qs.filter(route_id=route_id)
        return qs.order_by("arrival_order")


class BusRouteViewSet(TenantViewSet):
    queryset = BusRoute.objects.order_by('name').all()
    serializer_class = BusRouteListSerializer
    
    def get_serializer_class(self):
        if self.action == "retrieve":
            return BusRouteSerializer
        return BusRouteListSerializer
    
    def get_queryset(self):
        qs = super().get_queryset()
        is_active = self.request.query_params.get("is_active")
        if is_active is not None:
            qs = qs.filter(is_active=is_active.lower() == "true")
        return qs
    
    @action(detail=True, methods=["get"])
    def students(self, request, pk=None):
        """Get all students on this route."""
        route = self.get_object()
        assignments = route.assignments.filter(is_active=True).select_related("student", "stop")
        return Response(TransportAssignmentSerializer(assignments, many=True).data)


class TransportAssignmentViewSet(TenantViewSet):
    queryset = TransportAssignment.objects.all()
    serializer_class = TransportAssignmentSerializer
    
    def get_serializer_class(self):
        if self.action == "create":
            return TransportAssignmentCreateSerializer
        return TransportAssignmentSerializer
    
    def get_queryset(self):
        qs = super().get_queryset()
        route_id = self.request.query_params.get("route")
        student_id = self.request.query_params.get("student")
        is_active = self.request.query_params.get("is_active")
        
        if route_id:
            qs = qs.filter(route_id=route_id)
        if student_id:
            qs = qs.filter(student_id=student_id)
        if is_active is not None:
            qs = qs.filter(is_active=is_active.lower() == "true")
        
        return qs.select_related("student", "route", "stop")
    
    @action(detail=True, methods=["post"])
    def deactivate(self, request, pk=None):
        """Deactivate transport assignment."""
        assignment = self.get_object()
        assignment.is_active = False
        assignment.end_date = date.today()
        assignment.save()
        return Response(TransportAssignmentSerializer(assignment).data)


class TransportFeeViewSet(TenantViewSet):
    queryset = TransportFee.objects.all()
    serializer_class = TransportFeeSerializer
    
    def get_queryset(self):
        qs = super().get_queryset()
        route_id = self.request.query_params.get("route")
        session = self.request.query_params.get("session")
        term = self.request.query_params.get("term")
        
        if route_id:
            qs = qs.filter(route_id=route_id)
        if session:
            qs = qs.filter(session=session)
        if term:
            qs = qs.filter(term=term)
        
        return qs


class BusAttendanceViewSet(TenantViewSet):
    queryset = BusAttendance.objects.all()
    serializer_class = BusAttendanceSerializer
    
    def get_queryset(self):
        qs = super().get_queryset()
        route_id = self.request.query_params.get("route")
        date_param = self.request.query_params.get("date")
        
        if route_id:
            qs = qs.filter(route_id=route_id)
        if date_param:
            qs = qs.filter(date=date_param)
        
        return qs.select_related("route", "recorded_by").order_by("-date")
    
    @action(detail=True, methods=["post"])
    def mark_present(self, request, pk=None):
        """Mark students as present on bus."""
        attendance = self.get_object()
        session_type = request.data.get("session", "morning")  # morning or afternoon
        student_ids = request.data.get("student_ids", [])
        
        if session_type == "morning":
            attendance.morning_present.add(*student_ids)
            # Remove from absent
            for sid in student_ids:
                if sid in attendance.morning_absent:
                    attendance.morning_absent.remove(sid)
        else:
            attendance.afternoon_present.add(*student_ids)
            for sid in student_ids:
                if sid in attendance.afternoon_absent:
                    attendance.afternoon_absent.remove(sid)
        
        attendance.save()
        return Response(BusAttendanceSerializer(attendance).data)
    
    @action(detail=True, methods=["post"])
    def mark_absent(self, request, pk=None):
        """Mark students as absent from bus."""
        attendance = self.get_object()
        session_type = request.data.get("session", "morning")
        student_ids = request.data.get("student_ids", [])
        
        if session_type == "morning":
            attendance.morning_absent = list(set(attendance.morning_absent + student_ids))
            # Remove from present
            attendance.morning_present.remove(*student_ids)
        else:
            attendance.afternoon_absent = list(set(attendance.afternoon_absent + student_ids))
            attendance.afternoon_present.remove(*student_ids)
        
        attendance.save()
        return Response(BusAttendanceSerializer(attendance).data)


class TransportPaymentViewSet(TenantViewSet):
    queryset = TransportPayment.objects.all()
    serializer_class = TransportPaymentSerializer
    
    def get_queryset(self):
        qs = super().get_queryset()
        student_id = self.request.query_params.get("student")
        status_filter = self.request.query_params.get("status")
        
        if student_id:
            qs = qs.filter(student_id=student_id)
        if status_filter:
            qs = qs.filter(status=status_filter)
        
        return qs.select_related("student", "assignment")