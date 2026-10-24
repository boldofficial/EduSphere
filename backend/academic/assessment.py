"""
How each section assesses pupils: which score parts it uses (label and maximum mark) and how totals
become grades. Scores are stored in three slots (ca1, ca2, exam); a section can rename them, change
their maximums (enabled parts must add up to 100) or switch a part off (e.g. CA 40 + Exam 60).

Grades come from the section's chosen grading scheme, or a built-in Nigerian scale:
WAEC style (A1–F9) for senior secondary, A–F for everything else.
"""

from rest_framework import serializers

PARTS = ("ca1", "ca2", "exam")

DEFAULT_ASSESSMENT = {
    "ca1": {"label": "CA 1", "max": 20, "enabled": True},
    "ca2": {"label": "CA 2", "max": 20, "enabled": True},
    "exam": {"label": "Exam", "max": 60, "enabled": True},
}

# (min score, grade, remark), highest first.
WAEC_SCALE = [
    (75, "A1", "Excellent"),
    (70, "B2", "Very Good"),
    (65, "B3", "Good"),
    (60, "C4", "Credit"),
    (55, "C5", "Credit"),
    (50, "C6", "Credit"),
    (45, "D7", "Pass"),
    (40, "E8", "Pass"),
    (0, "F9", "Fail"),
]
BASIC_SCALE = [
    (70, "A", "Excellent"),
    (60, "B", "Very Good"),
    (50, "C", "Good"),
    (45, "D", "Fair"),
    (40, "E", "Pass"),
    (0, "F", "Fail"),
]


def clean_assessment(value):
    """Validate a section's assessment settings; raises ValidationError with a clear message."""
    if not isinstance(value, dict):
        raise serializers.ValidationError("Assessment settings must be an object.")
    clean, total = {}, 0
    for key in PARTS:
        part = value.get(key) or {}
        if not isinstance(part, dict):
            raise serializers.ValidationError(f"Invalid settings for {key}.")
        label = " ".join(str(part.get("label") or DEFAULT_ASSESSMENT[key]["label"]).split())[:20]
        enabled = bool(part.get("enabled", True))
        try:
            maximum = int(part.get("max", 0)) if enabled else 0
        except (TypeError, ValueError):
            raise serializers.ValidationError(f"{label}: maximum mark must be a whole number.")
        if enabled and not 1 <= maximum <= 100:
            raise serializers.ValidationError(f"{label}: maximum mark must be between 1 and 100.")
        clean[key] = {"label": label, "max": maximum, "enabled": enabled}
        total += maximum
    if not any(p["enabled"] for p in clean.values()):
        return clean  # e.g. early years graded by observation only
    if total != 100:
        raise serializers.ValidationError(f"The score parts must add up to 100 (they add up to {total}).")
    return clean


def section_assessment(student_class):
    """The assessment settings that apply to a class (its section's, or the default)."""
    section = getattr(student_class, "section", None) if student_class else None
    config = (section.assessment if section and section.assessment else None) or DEFAULT_ASSESSMENT
    return {key: {**DEFAULT_ASSESSMENT[key], **config.get(key, {})} for key in PARTS}


def grade_scale(student_class):
    """[(min, grade, remark)] highest first: the section's grading scheme, else the built-in scale."""
    section = getattr(student_class, "section", None) if student_class else None
    scheme = getattr(section, "grading_scheme", None) if section else None
    if scheme is not None:
        ranges = [(r.min_score, r.grade, r.remark) for r in scheme.ranges.all()]
        if ranges:
            return sorted(ranges, key=lambda r: r[0], reverse=True)
    key = getattr(section, "key", "") if section else ""
    if key == "senior" or (student_class and str(student_class.category).startswith("SSS")):
        return WAEC_SCALE
    return BASIC_SCALE


def grade_for(total, scale):
    for minimum, grade, remark in scale:
        if total >= minimum:
            return grade, remark
    return scale[-1][1], scale[-1][2]


def check_scores(row, assessment):
    """Raise if a score is above its part's maximum or entered for a part the section doesn't use."""
    for key in PARTS:
        value = row.get(key)
        if value in (None, ""):
            continue
        try:
            value = float(value)
        except (TypeError, ValueError):
            raise serializers.ValidationError(f"{assessment[key]['label']} must be a number.")
        part = assessment[key]
        if value < 0:
            raise serializers.ValidationError(f"{part['label']} cannot be negative.")
        if not part["enabled"] and value:
            raise serializers.ValidationError(f"This section does not use {part['label']}.")
        if part["enabled"] and value > part["max"]:
            raise serializers.ValidationError(f"{part['label']} cannot be more than {part['max']}.")


def public_config(student_class):
    """What score entry screens and report cards need for a class."""
    assessment = section_assessment(student_class)
    section = getattr(student_class, "section", None)
    return {
        "parts": [{"key": key, **assessment[key]} for key in PARTS if assessment[key]["enabled"]],
        "show_position": section.show_position if section else True,
        # Who signs this class's report cards; empty values fall back to the school's settings.
        "section": (
            {
                "name": section.name,
                "head_title": section.head_title,
                "head_name": section.head_name,
                "head_signature": section.head_signature,
            }
            if section
            else None
        ),
        "grading": [
            {"min": minimum, "grade": grade, "remark": remark} for minimum, grade, remark in grade_scale(student_class)
        ],
    }
