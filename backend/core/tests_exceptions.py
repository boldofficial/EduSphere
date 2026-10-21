from django.test import SimpleTestCase, override_settings
from rest_framework.exceptions import NotAuthenticated, ValidationError

from core.exceptions import SERVER_ERROR, custom_exception_handler


class CustomExceptionHandlerTests(SimpleTestCase):
    def test_standard_exception_keeps_detail_and_legacy_error(self):
        response = custom_exception_handler(NotAuthenticated("Sign in required."), {})

        self.assertEqual(response.status_code, 401)
        self.assertEqual(
            response.data,
            {"detail": "Sign in required.", "error": "Sign in required."},
        )

    def test_validation_exception_preserves_field_errors(self):
        response = custom_exception_handler(
            ValidationError({"email": ["Enter a valid email address."]}),
            {},
        )

        self.assertEqual(response.status_code, 400)
        self.assertEqual(response.data["detail"], "Enter a valid email address.")
        self.assertEqual(response.data["error"], "Enter a valid email address.")
        self.assertEqual(response.data["errors"], {"email": ["Enter a valid email address."]})

    @override_settings(DEBUG=False)
    def test_unhandled_exception_does_not_leak_details(self):
        response = custom_exception_handler(RuntimeError("database password leaked"), {})

        self.assertEqual(response.status_code, 500)
        self.assertEqual(response.data, {"detail": SERVER_ERROR, "error": SERVER_ERROR})
