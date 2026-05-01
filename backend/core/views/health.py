from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.db import connection

class HealthCheckView(APIView):
    """
    Simple health check endpoint for Docker and Coolify.
    Ensures the app is running and the database is accessible.
    """
    permission_classes = []

    def get(self, request):
        try:
            # Check database connection
            with connection.cursor() as cursor:
                cursor.execute("SELECT 1")
                row = cursor.fetchone()
                if row is None:
                    return Response({"status": "unhealthy", "db": "error"}, status=status.HTTP_503_SERVICE_UNAVAILABLE)
            
            return Response({"status": "healthy"}, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({"status": "unhealthy", "error": str(e)}, status=status.HTTP_503_SERVICE_UNAVAILABLE)
