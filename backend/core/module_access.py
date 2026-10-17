"""
Plan module enforcement (S9). The menu hides modules a school's plan lacks; this blocks the API too,
so a Free school cannot reach bursary, CBT, library etc. by calling endpoints directly.
"""

from django.core.cache import cache
from django.http import JsonResponse

# Longest prefix wins. Paths not listed (auth, core students/classes/grading, settings…) are always open.
MODULE_PREFIXES = {
    "/api/bursary/": "bursary",
    "/api/hr/": "staff",
    "/api/admissions/": "admissions",
    "/api/library/": "library",
    "/api/inventory/": "inventory",
    "/api/transport/": "transport",
    "/api/data-import/": "data_import",
    "/api/learning/": "learning",
    "/api/learning/question-banks/": "question_bank",
    "/api/learning/bank-questions/": "question_bank",
    "/api/learning/exams/": "exams",
    "/api/learning/exam-papers/": "exams",
    "/api/learning/exam-answers/": "exams",
    "/api/academic/staff/": "staff",
    "/api/academic/conduct-entries/": "conduct",
    "/api/academic/commendations/": "conduct",
    "/api/academic/conduct-warnings/": "conduct",
    "/api/academic/behavior-analytics/": "conduct",
    "/api/academic/broadsheet/": "broadsheet",
    "/api/academic/analytics/": "analytics",
    "/api/academic/predictive-insights/": "analytics",
    "/api/academic/data-migration/": "data_import",
    "/api/core/conversations/": "messages",
    "/api/core/messages/": "messages",
    "/api/core/newsletters/": "newsletter",
}
_ORDERED = sorted(MODULE_PREFIXES.items(), key=lambda kv: -len(kv[0]))
CACHE_SECONDS = 60


def module_for_path(path):
    for prefix, module in _ORDERED:
        if path.startswith(prefix):
            return module
    return None


def school_modules(school):
    """Module ids the school may use: its plan's modules minus any switched off platform-wide. None = no limit."""
    key = f"school-modules:{school.pk}"
    cached = cache.get(key)
    if cached is not None:
        return None if cached == "*" else set(cached)
    from schools.models import PlatformModule, Subscription

    sub = Subscription.objects.filter(school=school).select_related("plan").first()
    if not sub:
        cache.set(key, "*", CACHE_SECONDS)  # same leniency as login for schools without a subscription row
        return None
    disabled = set(PlatformModule.objects.filter(is_active=False).values_list("module_id", flat=True))
    allowed = sorted(set(sub.plan.allowed_modules or []) - disabled)
    cache.set(key, allowed, CACHE_SECONDS)
    return set(allowed)


def clear_school_modules(school_id):
    cache.delete(f"school-modules:{school_id}")


class PlanModuleMiddleware:
    """Runs after TenantMiddleware. Requests without a tenant (platform/super-admin routes) are unaffected."""

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        school = getattr(request, "tenant", None)
        module = module_for_path(request.path) if school else None
        if module:
            allowed = school_modules(school)
            if allowed is not None and module not in allowed:
                return JsonResponse(
                    {
                        "detail": "This feature is not included in your school's plan. Upgrade to use it.",
                        "code": "module_not_in_plan",
                        "module": module,
                    },
                    status=403,
                )
        return self.get_response(request)
