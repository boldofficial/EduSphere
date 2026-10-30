"""
Which subjects each student in a class takes.

A class offers subjects (Class.subjects). Some are compulsory for everyone in the class
(Class.compulsory_subjects; empty means all of them, the default for nursery, primary and junior
classes). Senior secondary students add electives, often by department (Science, Arts, Commercial).
Each student's full list is stored in Student.assigned_subjects, which score entry, broadsheets and
report cards already follow; an empty list means "every subject the class offers".
"""

from django.db import transaction

from .curriculum import SECTIONS


def class_subject_names(cls):
    return sorted(cls.subjects.values_list("name", flat=True))


def compulsory_for(cls, offered=None):
    offered = offered if offered is not None else class_subject_names(cls)
    chosen = [s for s in (cls.compulsory_subjects or []) if s in offered]
    return chosen or list(offered)


def department_presets(cls, offered=None):
    """Department subject lists from the curriculum, limited to what this class offers."""
    offered = set(offered if offered is not None else class_subject_names(cls))
    departments = SECTIONS.get("senior", {}).get("departments", {})
    lists = {key: [name for name, _default in dept["subjects"]] for key, dept in departments.items()}
    presets = []
    for key, dept in departments.items():
        names = [name for name in lists[key] if name in offered]
        others = {name for other, subjects in lists.items() if other != key for name in subjects}
        # Offered only through subjects other departments share (e.g. Government): not a real option here.
        if any(name not in others for name in names):
            presets.append({"key": key, "label": dept["label"], "subjects": names})
    return presets


def effective_subjects(student, cls, offered=None, compulsory=None):
    """What a student actually takes: their saved list, or every subject when none was saved."""
    offered = offered if offered is not None else class_subject_names(cls)
    saved = [s for s in (student.assigned_subjects or []) if s in offered]
    if saved:
        return sorted(set(saved) | set(compulsory if compulsory is not None else compulsory_for(cls, offered)))
    return list(offered)


class ChoiceError(ValueError):
    pass


@transaction.atomic
def save_choices(cls, students, compulsory, choices):
    """
    compulsory: subject names every student takes (empty = all offered).
    choices: {student_id: [elective names]} for students whose electives change.
    Returns the number of students updated.
    """
    offered = class_subject_names(cls)
    unknown = sorted({*compulsory, *(s for names in choices.values() for s in names)} - set(offered))
    if unknown:
        raise ChoiceError(f"{', '.join(unknown)} {'is' if len(unknown) == 1 else 'are'} not offered in {cls.name}.")

    cls.compulsory_subjects = sorted(set(compulsory)) if set(compulsory) != set(offered) else []
    cls.save(update_fields=["compulsory_subjects"])
    core = compulsory_for(cls, offered)

    updated = []
    by_id = {str(s.pk): s for s in students}
    for student_id, electives in choices.items():
        student = by_id.get(str(student_id))
        if student is None:
            raise ChoiceError("One of these students is not in this class.")
        full = sorted(set(core) | set(electives))
        # Taking every subject is the default: store it as "all" so new class subjects apply too.
        student.assigned_subjects = [] if set(full) == set(offered) else full
        updated.append(student)
    for student in updated:
        # One save each (a class is a few dozen students) so the audit trail records who changed them.
        student.save(update_fields=["assigned_subjects"])
    return len(updated)
