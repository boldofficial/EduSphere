"""
Nigerian school structure catalogue: sections, class names (both naming styles) and starter subject lists.

This is starting data for the setup wizard, not a rule: schools untick, rename and add classes and
subjects freely afterwards. Keep it in line with current NERDC/WAEC practice when the curriculum changes.

Naming styles:
- "classic": Nursery, Primary 1–6, JSS 1–3, SSS 1–3
- "basic":   Nursery, Basic 1–6, Basic 7–9, SS 1–3
"""

SECTION_ORDER = ("early_years", "primary", "junior", "senior")
NAMING_STYLES = ("classic", "basic")

SECTIONS = {
    "early_years": {
        "label": "Early Years (Creche & Nursery)",
        "head_title": "Head of Early Years",
        "category": "Nursery",
        "report_mode": "early_years",
        "levels": {
            "classic": ["Creche", "Pre-Nursery", "Nursery 1", "Nursery 2"],
            "basic": ["Creche", "Pre-Nursery", "Nursery 1", "Nursery 2"],
        },
        "default_levels": ["Pre-Nursery", "Nursery 1", "Nursery 2"],
        "subjects": [
            ("Numeracy", True),
            ("Literacy", True),
            ("Phonics", True),
            ("Rhymes & Songs", True),
            ("Creative Arts", True),
            ("Health Habits", True),
            ("Social Habits", True),
            ("Discovery (Basic Science)", True),
            ("Religious Studies", True),
            ("Handwriting", False),
            ("French", False),
            ("Nigerian Language", False),
            ("Social Norms", False),
            ("Health Education", False),
            ("Art and Craft", False),
            ("Christian Religious Studies", False),
        ],
    },
    "primary": {
        "label": "Primary",
        "head_title": "Head Teacher",
        "category": "Primary",
        "report_mode": "numeric",
        "levels": {
            "classic": [f"Primary {n}" for n in range(1, 7)],
            "basic": [f"Basic {n}" for n in range(1, 7)],
        },
        "subjects": [
            ("English Studies", True),
            ("Mathematics", True),
            ("Basic Science", True),
            ("Basic Technology", True),
            ("Physical and Health Education", True),
            ("Computer Studies", True),
            ("Social Studies", True),
            ("Civic Education", True),
            ("Security Education", False),
            ("Christian Religious Studies", True),
            ("Islamic Religious Studies", False),
            ("Cultural and Creative Arts", True),
            ("Agricultural Science", True),
            ("Home Economics", True),
            ("Nigerian Language", True),
            ("French", False),
            ("Verbal Reasoning", True),
            ("Quantitative Reasoning", True),
            ("History", False),
            ("Handwriting", False),
            ("National Values Education", False),
            ("Pre-Vocational Studies", False),
            ("Basic Science and Technology", False),
            ("Information and Communication Technology", False),
            ("Diction", False),
            ("Music", False),
            ("Coding and Robotics", False),
            ("Chess", False),
        ],
    },
    "junior": {
        "label": "Junior Secondary",
        "head_title": "Principal",
        "category": "JSS",
        "report_mode": "numeric",
        "levels": {
            "classic": [f"JSS {n}" for n in range(1, 4)],
            "basic": [f"Basic {n}" for n in range(7, 10)],
        },
        "subjects": [
            ("English Language", True),
            ("Mathematics", True),
            ("Basic Science", True),
            ("Basic Technology", True),
            ("Physical and Health Education", True),
            ("Computer Studies", True),
            ("Social Studies", True),
            ("Civic Education", True),
            ("Security Education", False),
            ("Christian Religious Studies", True),
            ("Islamic Religious Studies", False),
            ("Cultural and Creative Arts", True),
            ("Agricultural Science", True),
            ("Home Economics", True),
            ("Business Studies", True),
            ("History", True),
            ("Nigerian Language", True),
            ("French", False),
        ],
    },
    "senior": {
        "label": "Senior Secondary",
        "head_title": "Principal",
        "category": "SSS_Science",
        "report_mode": "numeric",
        "levels": {
            "classic": [f"SSS {n}" for n in range(1, 4)],
            "basic": [f"SS {n}" for n in range(1, 4)],
        },
        # Every department takes the core; each adds its own electives.
        "subjects": [
            ("English Language", True),
            ("Mathematics", True),
            ("Civic Education", True),
            ("Computer Studies", True),
            ("Economics", True),
            ("Data Processing", False),
            ("Marketing", False),
        ],
        "departments": {
            "science": {
                "label": "Science",
                "category": "SSS_Science",
                "subjects": [
                    ("Physics", True),
                    ("Chemistry", True),
                    ("Biology", True),
                    ("Further Mathematics", True),
                    ("Agricultural Science", True),
                    ("Geography", True),
                    ("Technical Drawing", False),
                ],
            },
            "arts": {
                "label": "Arts",
                "category": "SSS_Art",
                "subjects": [
                    ("Literature in English", True),
                    ("Government", True),
                    ("Christian Religious Studies", True),
                    ("Islamic Religious Studies", False),
                    ("History", True),
                    ("Nigerian Language", True),
                    ("Fine Arts", False),
                    ("French", False),
                ],
            },
            "commercial": {
                "label": "Commercial",
                "category": "SSS_Commerce",
                "subjects": [
                    ("Financial Accounting", True),
                    ("Commerce", True),
                    ("Office Practice", True),
                    ("Government", True),
                    ("Book Keeping", False),
                    ("Insurance", False),
                ],
            },
        },
    },
}

# Which section an existing class most likely belongs to, from its category.
CATEGORY_TO_SECTION = {
    "Nursery": "early_years",
    "Primary": "primary",
    "JSS": "junior",
    "SSS_Science": "senior",
    "SSS_Art": "senior",
    "SSS_Commerce": "senior",
}


def catalogue():
    """The catalogue in a shape the setup wizard can render."""
    result = []
    for key in SECTION_ORDER:
        data = SECTIONS[key]
        result.append(
            {
                "key": key,
                "label": data["label"],
                "head_title": data["head_title"],
                "levels": data["levels"],
                "default_levels": data.get("default_levels") or data["levels"]["classic"],
                "subjects": [{"name": n, "default": d} for n, d in data["subjects"]],
                "departments": [
                    {
                        "key": dk,
                        "label": dv["label"],
                        "subjects": [{"name": n, "default": d} for n, d in dv["subjects"]],
                    }
                    for dk, dv in data.get("departments", {}).items()
                ],
            }
        )
    return result


_NAME_RULES = (
    (
        r"^(creche|cr[eè]che|pre[- ]?nursery|nursery|kg|kindergarten|reception|playgroup|preparatory|prep|pre[- ]?school|toddlers?)(?![a-z])",
        "early_years",
    ),
    (r"^(primary|pry|basic\s*[1-6](?!\d)|grade\s*[1-6](?!\d))", "primary"),
    (r"^(jss|j\.s\.s|junior|basic\s*[7-9](?!\d))", "junior"),
    (r"^(sss|ss\s*\d|s\.s\.s|senior)", "senior"),
)


def section_for_class(name, category=""):
    """Best guess of a class's section: from its name (most reliable), else from its category."""
    import re

    value = " ".join(str(name or "").lower().split())
    for pattern, key in _NAME_RULES:
        if re.match(pattern, value):
            return key
    return CATEGORY_TO_SECTION.get(category)
