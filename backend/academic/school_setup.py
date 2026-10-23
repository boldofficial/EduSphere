"""
School structure setup: which sections a school runs, and the classes, arms, subjects and promotion
chain that follow from them. `build_plan` previews; `apply_plan` writes it in one transaction.

Rules:
- Existing classes are never renamed, deleted or given different subjects; they are linked to their
  section, and get a promotion target only if they have none.
- Promotion runs through every class in order, across sections in a combined school
  (Nursery 2 → Primary 1, Primary 6 → JSS 1, JSS 3 → SSS 1). The last class is the graduation class.
"""

import re

from django.db import transaction
from rest_framework import serializers

from .curriculum import NAMING_STYLES, SECTION_ORDER, SECTIONS, section_for_class
from .models import Class, SchoolSection, Subject

ARM_PATTERN = re.compile(r"^[A-Za-z0-9][A-Za-z0-9 '\-]{0,19}$")


def _clean_names(values, field, limit, max_len=100):
    if not isinstance(values, list):
        raise serializers.ValidationError({field: "Must be a list."})
    seen, result = set(), []
    for value in values:
        name = " ".join(str(value or "").split())
        if not name:
            continue
        if len(name) > max_len:
            raise serializers.ValidationError({field: f"'{name[:30]}…' is too long."})
        if name.lower() not in seen:
            seen.add(name.lower())
            result.append(name)
    if len(result) > limit:
        raise serializers.ValidationError({field: f"Choose at most {limit}."})
    return result


def validate_payload(data):
    """Normalise the wizard's request; raises ValidationError with a clear message."""
    naming = data.get("naming") or "classic"
    if naming not in NAMING_STYLES:
        raise serializers.ValidationError({"naming": "Choose JSS/SSS or Basic naming."})
    raw_sections = data.get("sections")
    if not isinstance(raw_sections, list) or not raw_sections:
        raise serializers.ValidationError({"sections": "Choose at least one section your school runs."})

    sections = {}
    for raw in raw_sections:
        key = raw.get("key") if isinstance(raw, dict) else None
        if key not in SECTIONS:
            raise serializers.ValidationError({"sections": f"Unknown section '{key}'."})
        catalogue_levels = SECTIONS[key]["levels"][naming]
        levels = _clean_names(raw.get("levels") or catalogue_levels, "levels", 10)
        unknown = [lvl for lvl in levels if lvl not in catalogue_levels]
        if unknown:
            raise serializers.ValidationError({"levels": f"Unknown class level: {', '.join(unknown)}."})
        arms = _clean_names(raw.get("arms") or [], "arms", 10, max_len=20)
        bad = [a for a in arms if not ARM_PATTERN.fullmatch(a)]
        if bad:
            raise serializers.ValidationError({"arms": f"Arm names can use letters and numbers only: {bad[0]}."})
        departments = {}
        if key == "senior":
            for dept in raw.get("departments") or []:
                dkey = dept.get("key") if isinstance(dept, dict) else None
                if dkey not in SECTIONS["senior"]["departments"]:
                    raise serializers.ValidationError({"departments": f"Unknown department '{dkey}'."})
                departments[dkey] = _clean_names(dept.get("subjects") or [], "subjects", 30)
        sections[key] = {
            "levels": [lvl for lvl in catalogue_levels if lvl in levels],  # keep the natural order
            "arms": arms,
            "subjects": _clean_names(raw.get("subjects") or [], "subjects", 40),
            "departments": departments,
            "head_name": " ".join(str(raw.get("head_name") or "").split())[:120],
        }
    ordered = [k for k in SECTION_ORDER if k in sections]
    return naming, [(key, sections[key]) for key in ordered]


def build_plan(school, data):
    """What setup would create, as plain data (also used to apply it)."""
    naming, sections = validate_payload(data)
    existing = {c.name.lower(): c for c in Class.objects.filter(school=school)}
    existing_subjects = {s.name.lower() for s in Subject.objects.filter(school=school)}

    planned, order = [], 0
    for key, cfg in sections:
        definition = SECTIONS[key]
        streams = (
            [
                (dkey, definition["departments"][dkey]["label"], definition["departments"][dkey]["category"], subs)
                for dkey, subs in cfg["departments"].items()
            ]
            if key == "senior" and cfg["departments"]
            else [("", "", definition["category"], [])]
        )
        classes = []
        for level in cfg["levels"]:
            order += 1
            for dept_key, dept_label, category, dept_subjects in streams:
                for arm in cfg["arms"] or [""]:
                    name = " ".join(part for part in (level, dept_label, arm) if part)
                    classes.append(
                        {
                            "name": name,
                            "level": level,
                            "level_order": order,
                            "department": dept_key,
                            "arm": arm,
                            "category": category,
                            "report_mode": definition["report_mode"],
                            "subjects": cfg["subjects"] + [s for s in dept_subjects if s not in cfg["subjects"]],
                            "exists": name.lower() in existing,
                        }
                    )
        planned.append(
            {
                "key": key,
                "label": definition["label"],
                "head_title": definition["head_title"],
                "head_name": cfg["head_name"],
                "classes": classes,
            }
        )

    _link_promotions([c for s in planned for c in s["classes"]])
    # Only new classes get subjects; existing classes keep theirs.
    all_subjects = {s.lower(): s for sec in planned for c in sec["classes"] if not c["exists"] for s in c["subjects"]}
    return {
        "naming": naming,
        "sections": planned,
        "summary": {
            "new_classes": sum(1 for s in planned for c in s["classes"] if not c["exists"]),
            "existing_classes": sum(1 for s in planned for c in s["classes"] if c["exists"]),
            "new_subjects": sorted(v for k, v in all_subjects.items() if k not in existing_subjects),
        },
    }


def _link_promotions(classes):
    """Each class promotes to the next level: same arm (and department) when it exists, else the first one."""
    by_level = {}
    for c in classes:
        by_level.setdefault(c["level_order"], []).append(c)
    orders = sorted(by_level)
    for i, level_order in enumerate(orders):
        nxt = by_level[orders[i + 1]] if i + 1 < len(orders) else None
        for c in by_level[level_order]:
            if not nxt:
                c["next"], c["graduation"] = None, True
                continue
            match = (
                next((n for n in nxt if n["arm"] == c["arm"] and n["department"] == c["department"]), None)
                or next((n for n in nxt if n["arm"] == c["arm"]), None)
                or nxt[0]
            )
            c["next"], c["graduation"] = match["name"], False


@transaction.atomic
def apply_plan(school, data):
    plan = build_plan(school, data)
    subjects = {s.name.lower(): s for s in Subject.objects.filter(school=school)}

    def subject(name):
        if name.lower() not in subjects:
            subjects[name.lower()] = Subject.objects.create(school=school, name=name)
        return subjects[name.lower()]

    classes = {c.name.lower(): c for c in Class.objects.filter(school=school)}
    for position, section_plan in enumerate(plan["sections"]):
        section, _ = SchoolSection.objects.update_or_create(
            school=school,
            key=section_plan["key"],
            defaults={
                "name": section_plan["label"],
                "head_title": section_plan["head_title"],
                "head_name": section_plan["head_name"],
                "position": position,
            },
        )
        for item in section_plan["classes"]:
            cls = classes.get(item["name"].lower())
            if cls is None:
                cls = Class.objects.create(
                    school=school,
                    name=item["name"],
                    category=item["category"],
                    report_mode=item["report_mode"],
                    section=section,
                    arm=item["arm"],
                    department=item["department"],
                    level_order=item["level_order"],
                )
                cls.subjects.set([subject(n) for n in item["subjects"]])
                classes[cls.name.lower()] = cls
            else:  # an existing class keeps its name and subjects; it just joins its section
                cls.section = cls.section or section
                cls.level_order = cls.level_order or item["level_order"]
                cls.arm = cls.arm or item["arm"]
                cls.department = cls.department or item["department"]
                cls.save(update_fields=["section", "level_order", "arm", "department"])

    for item in (c for s in plan["sections"] for c in s["classes"]):
        cls = classes[item["name"].lower()]
        changed = []
        if item["graduation"] and not cls.is_graduation_class and not cls.next_class_id:
            cls.is_graduation_class = True
            changed.append("is_graduation_class")
        if item["next"] and not cls.next_class_id and not cls.is_graduation_class:
            cls.next_class = classes[item["next"].lower()]
            changed.append("next_class")
        if changed:
            cls.save(update_fields=changed)

    _link_unassigned_classes(school)
    return plan


def _link_unassigned_classes(school):
    """Classes the wizard didn't name (custom names) join the section their name or category points to."""
    sections = {s.key: s for s in SchoolSection.objects.filter(school=school)}
    for cls in Class.objects.filter(school=school, section__isnull=True):
        section = sections.get(section_for_class(cls.name, cls.category))
        if section:
            cls.section = section
            cls.save(update_fields=["section"])


def infer_sections(school):
    """For schools that existed before sections: guess what they run from their classes' categories."""
    keys = {
        section_for_class(name, category)
        for name, category in Class.objects.filter(school=school).values_list("name", "category")
    }
    return [k for k in SECTION_ORDER if k in keys]
