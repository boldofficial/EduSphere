"""Website CMS: ordered sections, per-section custom HTML/CSS, and the safety rules applied on save."""

from django.test import SimpleTestCase, TestCase
from rest_framework.test import APIClient

from core.cms_sanitizer import sanitize_landing_sections, sanitize_website_html, validate_website_css
from schools.models import School, SchoolSettings
from users.models import User


def section(key, **extra):
    return {
        "id": extra.pop("id", key),
        "key": key,
        "enabled": True,
        "use_custom": False,
        "html": "",
        "css": "",
        **extra,
    }


class SectionSanitizerTests(SimpleTestCase):
    def test_custom_html_keeps_inline_styles_and_internal_links(self):
        [about] = sanitize_landing_sections(
            [
                section(
                    "about",
                    use_custom=True,
                    html='<section style="padding: 64px 24px"><a href="/admission" style="color: #fff">Apply</a>'
                    '<a href="#contact">Contact</a></section>',
                )
            ]
        )
        self.assertIn('style="padding: 64px 24px"', about["html"])
        self.assertIn('href="/admission"', about["html"])
        self.assertIn('href="#contact"', about["html"])

    def test_scripts_handlers_and_fixed_positioning_are_removed(self):
        html = (
            '<div style="position: fixed; inset: 0; color: red" onclick="steal()">x</div>'
            '<script>alert(1)</script><a href="javascript:alert(1)">bad</a>'
        )
        clean = sanitize_website_html(html)
        self.assertNotIn("script", clean)
        self.assertNotIn("onclick", clean)
        self.assertNotIn("javascript:", clean)
        self.assertNotIn("position", clean)
        self.assertIn("color: red", clean)

    def test_css_box_rejects_fixed_positioning_and_imports(self):
        self.assertEqual(validate_website_css(".card { padding: 2rem; }"), ".card { padding: 2rem; }")
        for bad in (".x { position: fixed; }", ".x{position:sticky}", "@import url(x.css);", "</template><img src=x>"):
            with self.assertRaises(ValueError):
                validate_website_css(bad)

    def test_tables_and_extra_headings_are_allowed(self):
        clean = sanitize_website_html(
            '<table><tr><th scope="col">Term</th><td colspan="2">Fees</td></tr></table><h5>x</h5>'
        )
        self.assertIn('<th scope="col">', clean)
        self.assertIn('<td colspan="2">', clean)
        self.assertIn("<h5>", clean)

    def test_list_rules(self):
        with self.assertRaises(ValueError):
            sanitize_landing_sections([section("hero"), section("hero", id="hero-2")])  # built-in twice
        with self.assertRaises(ValueError):
            sanitize_landing_sections([section("custom", id="a"), section("custom", id="a")])  # duplicate id
        with self.assertRaises(ValueError):
            sanitize_landing_sections([section("header")])  # header/footer are fixed, not sections
        [custom] = sanitize_landing_sections([section("custom", id="news", use_custom=False)])
        self.assertTrue(custom["use_custom"])  # school-made sections are always custom code


class SectionSaveTests(TestCase):
    def setUp(self):
        self.school = School.objects.create(name="CMS School", domain="cms-school")
        SchoolSettings.objects.get_or_create(school=self.school)
        self.admin = User.objects.create_user(
            username="admin@cms", password="Strong-Pass!2026", role="SCHOOL_ADMIN", school=self.school
        )
        self.client = APIClient()
        self.client.force_authenticate(self.admin)

    def test_sections_save_sanitized_and_come_back_in_order(self):
        sections = [
            section("hero"),
            section(
                "custom",
                id="welcome",
                title="Welcome",
                html='<section style="padding: 40px">Hi<script>x</script></section>',
                css=".a{color:red}",
            ),
            section("about", use_custom=True, html="<p>About us</p>"),
            section("contact"),
        ]
        r = self.client.put(
            "/api/core/settings/", {"landing_sections": sections}, format="json", HTTP_X_TENANT_ID=self.school.domain
        )
        self.assertEqual(r.status_code, 200, r.data)
        saved = self.client.get("/api/core/settings/", HTTP_X_TENANT_ID=self.school.domain).data["landing_sections"]
        self.assertEqual([s["id"] for s in saved], ["hero", "welcome", "about", "contact"])
        self.assertNotIn("script", saved[1]["html"])
        self.assertEqual(saved[1]["css"], ".a{color:red}")

    def test_unsafe_css_is_rejected_with_a_clear_message(self):
        r = self.client.put(
            "/api/core/settings/",
            {"landing_sections": [section("custom", id="x", html="<p>x</p>", css=".x{position:fixed}")]},
            format="json",
            HTTP_X_TENANT_ID=self.school.domain,
        )
        self.assertEqual(r.status_code, 400)
        self.assertIn("fixed", str(r.data))
