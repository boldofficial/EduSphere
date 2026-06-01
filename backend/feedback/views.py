from rest_framework import permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from core.pagination import StandardPagination
from .models import Feedback
from .serializers import FeedbackSerializer


class FeedbackCreateView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = FeedbackSerializer(data=request.data, context={"request": request})
        serializer.is_valid(raise_exception=True)
        user = request.user if request.user.is_authenticated else None
        feedback = serializer.save(
            user=user,
            school=user.school if user else None,
            user_role=user.role if user else "",
        )
        # Send acknowledgment + notification emails synchronously
        from .tasks import send_feedback_emails

        send_feedback_emails(feedback)

        return Response(serializer.data, status=status.HTTP_201_CREATED)


class FeedbackListView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        if request.user.role != "SUPER_ADMIN" and not request.user.is_superuser:
            return Response({"detail": "Forbidden."}, status=status.HTTP_403_FORBIDDEN)

        qs = Feedback.objects.select_related("user", "school").all()

        rating = request.query_params.get("rating")
        school_id = request.query_params.get("school")
        if rating:
            qs = qs.filter(rating=rating)
        if school_id:
            qs = qs.filter(school_id=school_id)

        paginator = StandardPagination()
        page = paginator.paginate_queryset(qs, request)
        serializer = FeedbackSerializer(page, many=True)
        return paginator.get_paginated_response(serializer.data)


class FeedbackStatsView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        if request.user.role != "SUPER_ADMIN" and not request.user.is_superuser:
            return Response({"detail": "Forbidden."}, status=status.HTTP_403_FORBIDDEN)

        from django.db.models import Avg, Count
        stats = Feedback.objects.aggregate(
            total=Count("id"),
            average_rating=Avg("rating"),
        )
        distribution = {
            str(i): Feedback.objects.filter(rating=i).count() for i in range(1, 6)
        }
        return Response({
            "total": stats["total"] or 0,
            "average_rating": round(stats["average_rating"] or 0, 2),
            "distribution": distribution,
        })
