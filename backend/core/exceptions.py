from rest_framework.views import exception_handler
from rest_framework.response import Response
from rest_framework import status
import logging

logger = logging.getLogger(__name__)

def custom_exception_handler(exc, context):
    """
    Custom exception handler for Django REST Framework that returns errors
    in a consistent { "error": "message" } or { "errors": [...] } format.
    """
    # Call standard exception handler first to get the default error response
    response = exception_handler(exc, context)

    if response is None:
        # This is an unhandled exception (500 Internal Server Error)
        # Log it for debugging
        logger.exception(f"Unhandled exception in {context['view'].__class__.__name__}: {str(exc)}")
        
        return Response(
            {
                "error": "An unexpected server error occurred. Our engineers have been notified.",
                "detail": str(exc) if hasattr(exc, '__str__') else "No details available"
            },
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

    # Standardize the response format
    if isinstance(response.data, dict):
        if "detail" in response.data:
            # { "detail": "..." } -> { "error": "..." }
            response.data = {"error": response.data["detail"]}
        elif not any(k in response.data for k in ["error", "errors"]):
            # For validation errors like { "field": ["err1", "err2"] }
            # We keep them but can wrap them if desired. 
            # For now, let's keep as is or wrap in 'errors'
            response.data = {"errors": response.data}
    elif isinstance(response.data, list):
        # [ "err1", "err2" ] -> { "errors": [ "err1", "err2" ] }
        response.data = {"errors": response.data}

    return response
