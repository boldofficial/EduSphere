import logging

from django.conf import settings
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import exception_handler

logger = logging.getLogger(__name__)

SERVER_ERROR = "An unexpected server error occurred. Our engineers have been notified."


def _first_message(data):
    """The first human-readable message in a DRF error payload (dicts/lists nest arbitrarily)."""
    if isinstance(data, dict):
        for value in data.values():
            found = _first_message(value)
            if found:
                return found
        return None
    if isinstance(data, (list, tuple)):
        for value in data:
            found = _first_message(value)
            if found:
                return found
        return None
    return str(data) if data not in (None, "") else None


def custom_exception_handler(exc, context):
    """
    One error shape for every API exception:
        {"detail": "<message>", "error": "<same message>", "errors": {field: [messages]}?}
    `detail` is the standard; `error` is kept so older screens that read it keep working.
    Field errors stay under `errors`. Exception text is only exposed when DEBUG is on.
    """
    response = exception_handler(exc, context)

    if response is None:
        view = context.get("view")
        logger.error(
            "Unhandled exception in %s: %s",
            view.__class__.__name__ if view else "unknown view",
            exc,
            exc_info=(type(exc), exc, exc.__traceback__),
        )
        body = {"detail": SERVER_ERROR, "error": SERVER_ERROR}
        if settings.DEBUG:
            body["debug"] = str(exc)
        return Response(body, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    data = response.data
    if isinstance(data, dict) and "detail" in data:
        body = {**data, "detail": str(data["detail"]), "error": str(data["detail"])}
    elif isinstance(data, dict) and ("error" in data or "errors" in data):
        message = data.get("error") or _first_message(data.get("errors")) or "Request failed."
        body = {**data, "detail": str(message), "error": str(message)}
    else:
        message = _first_message(data) or "Request failed."
        body = {"detail": message, "error": message, "errors": data}
    response.data = body
    return response
