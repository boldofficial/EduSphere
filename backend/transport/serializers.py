from rest_framework import serializers
from transport.models import (
    BusRoute, BusStop, TransportAssignment, TransportFee,
    BusAttendance, TransportPayment
)


class BusStopSerializer(serializers.ModelSerializer):
    students_count = serializers.SerializerMethodField()
    
    class Meta:
        model = BusStop
        fields = [
            "id", "name", "address", "latitude", "longitude",
            "arrival_order", "estimated_arrival", "students", "students_count"
        ]
    
    def get_students_count(self, obj):
        return obj.students.count()


class BusRouteSerializer(serializers.ModelSerializer):
    stops = BusStopSerializer(many=True, read_only=True)
    active_students = serializers.SerializerMethodField()
    
    class Meta:
        model = BusRoute
        fields = [
            "id", "name", "description", "start_location", "end_location", "waypoints",
            "departure_time", "estimated_duration", "vehicle_plate", "vehicle_type",
            "capacity", "driver_name", "driver_phone", "is_active", "stops", "active_students"
        ]
    
    def get_active_students(self, obj):
        return obj.assignments.filter(is_active=True).count()


class BusRouteListSerializer(serializers.ModelSerializer):
    active_students = serializers.SerializerMethodField()
    stops_count = serializers.SerializerMethodField()
    
    class Meta:
        model = BusRoute
        fields = [
            "id", "name", "start_location", "end_location", "departure_time",
            "vehicle_plate", "capacity", "driver_name", "driver_phone",
            "is_active", "active_students", "stops_count"
        ]
    
    def get_active_students(self, obj):
        return obj.assignments.filter(is_active=True).count()
    
    def get_stops_count(self, obj):
        return obj.stops.count()


class TransportAssignmentSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(source="student.names", read_only=True)
    route_name = serializers.CharField(source="route.name", read_only=True)
    stop_name = serializers.CharField(source="stop.name", read_only=True)
    
    class Meta:
        model = TransportAssignment
        fields = [
            "id", "student", "student_name", "route", "route_name",
            "stop", "stop_name", "session_type", "start_date", "end_date",
            "is_active", "pickup_time", "drop_time", "created_at"
        ]


class TransportFeeSerializer(serializers.ModelSerializer):
    route_name = serializers.CharField(source="route.name", read_only=True)
    students_count = serializers.SerializerMethodField()
    
    class Meta:
        model = TransportFee
        fields = [
            "id", "route", "route_name", "session", "term", "amount",
            "payment_frequency", "is_active", "students_count"
        ]
    
    def get_students_count(self, obj):
        return obj.route.assignments.filter(
            is_active=True,
            start_date__lte=obj.term  # Simplified; refine as needed
        ).count()


class BusAttendanceSerializer(serializers.ModelSerializer):
    route_name = serializers.CharField(source="route.name", read_only=True)
    recorded_by_name = serializers.CharField(source="recorded_by.name", read_only=True)
    
    class Meta:
        model = BusAttendance
        fields = [
            "id", "route", "route_name", "date",
            "morning_present", "morning_absent",
            "afternoon_present", "afternoon_absent",
            "recorded_by", "recorded_by_name", "notes", "created_at"
        ]


class TransportPaymentSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(source="student.names", read_only=True)
    
    class Meta:
        model = TransportPayment
        fields = [
            "id", "student", "student_name", "assignment", "amount",
            "session", "term", "status", "paid_on", "payment_method", "reference"
        ]


class TransportAssignmentCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = TransportAssignment
        fields = ["student", "route", "stop", "session_type", "start_date", "end_date"]
    
    def validate(self, data):
        route = data["route"]
        if route.assignments.filter(student=data["student"], is_active=True).exists():
            raise serializers.ValidationError("Student already has an active transport assignment")
        
        if route.assignments.filter(is_active=True).count() >= route.capacity:
            raise serializers.ValidationError("Route is at full capacity")
        
        return data