"""
Subscription plan catalogue — annual pricing (one academic year = 3 terms).

Used by the `seed_platform` command. Migration 0025 holds a frozen copy of these values, so
change prices here and in the Super Admin plans screen, not in that migration.
"""

FREE_MODULES = [
    "students",
    "teachers",
    "classes",
    "grading",
    "attendance",
    "announcements",
    "calendar",
    "broadsheet",
]
STARTER_MODULES = FREE_MODULES + [
    "staff",
    "bursary",
    "conduct",
    "id_cards",
    "admissions",
    "messages",
    "newsletter",
    "cms",
    "data_import",
]
STANDARD_MODULES = STARTER_MODULES + ["library", "inventory", "transport"]
PREMIUM_MODULES = STANDARD_MODULES + ["learning", "question_bank", "exams", "analytics"]

PLAN_CATALOG = [
    {
        "slug": "free",
        "name": "Free",
        "price": 0,
        "max_students": 30,
        "is_custom_price": False,
        "custom_domain_enabled": False,
        "description": "For very small schools getting started. Subdomain only.",
        "features": [
            "Up to 30 students",
            "Student records & attendance",
            "Report cards & broadsheet",
            "Announcements & calendar",
            "yourschool.myregistra.net subdomain",
        ],
        "allowed_modules": FREE_MODULES,
    },
    {
        "slug": "starter",
        "name": "Starter",
        "price": 150000,
        "max_students": 150,
        "is_custom_price": False,
        "custom_domain_enabled": True,
        "description": "Everything a growing school needs to run day to day.",
        "features": [
            "Up to 150 students",
            "Everything in Free",
            "Fees, payments & expenses",
            "Admissions, ID cards & conduct",
            "School website & messaging",
            "Custom domain",
        ],
        "allowed_modules": STARTER_MODULES,
    },
    {
        "slug": "standard",
        "name": "Standard",
        "price": 320000,
        "max_students": 400,
        "is_custom_price": False,
        "custom_domain_enabled": True,
        "description": "For established schools running more operations.",
        "features": [
            "Up to 400 students",
            "Everything in Starter",
            "Library, inventory & transport",
            "Custom domain",
        ],
        "allowed_modules": STANDARD_MODULES,
    },
    {
        "slug": "premium",
        "name": "Premium",
        "price": 520000,
        "max_students": 800,
        "is_custom_price": False,
        "custom_domain_enabled": True,
        "description": "Digital learning and insights for larger schools.",
        "features": [
            "Up to 800 students",
            "Everything in Standard",
            "CBT exams & question bank",
            "Learning centre (LMS)",
            "School analytics",
            "Custom domain",
        ],
        "allowed_modules": PREMIUM_MODULES,
    },
    {
        "slug": "elite",
        "name": "Elite",
        "price": 825000,
        "max_students": 1500,
        "is_custom_price": False,
        "custom_domain_enabled": True,
        "description": "The full platform for large schools.",
        "features": [
            "Up to 1,500 students",
            "Everything in Premium",
            "Priority support",
            "Custom domain",
        ],
        "allowed_modules": PREMIUM_MODULES,
    },
    {
        "slug": "enterprise",
        "name": "Enterprise",
        "price": 0,
        "max_students": None,
        "is_custom_price": True,
        "custom_domain_enabled": True,
        "description": "Groups of schools and campuses above 1,500 students.",
        "features": [
            "1,500+ students",
            "Everything in Elite",
            "Multi-campus setup",
            "Dedicated onboarding & support",
            "Custom domain",
        ],
        "allowed_modules": PREMIUM_MODULES,
    },
]
