"""
End of session: promote, repeat or graduate every student, in one place.

Each class sends its students to its own next class (Class.next_class; set in School structure),
and a graduation class graduates them. The suggestion follows the school's pass mark
(SchoolSettings.promotion_threshold) against the student's average across the session's report
cards; the admin can change any student before applying. Applying records each student's class for
the year (StudentHistory), marks graduates as graduated (alumni) and can copy subject-teacher
assignments into the new session. It is safe to apply twice: students already decided this session
are left alone.
"""

from collections import defaultdict

from django.db import transaction

from .calendar import parse_session
from .models import Class, ReportCard, Student, StudentHistory, SubjectTeacher

DECISIONS = ("promote", "repeat", "graduate")


class PromotionError(ValueError):
    pass


def _threshold(school):
    from schools.models import SchoolSettings

    settings = SchoolSettings.objects.filter(school=school).only("promotion_threshold").first()
    return settings.promotion_threshold if settings else 50


def next_session_name(session):
    first, _ = parse_session(session)
    return f"{first + 1}/{first + 2}"


def decided(school, session):
    """Students already promoted, repeated or graduated for this session."""
    return set(
        StudentHistory.objects.filter(
            school=school, session=session, event_type__in=["promotion", "graduation"]
        ).values_list("student_id", flat=True)
    )


def plan(school, session):
    """Every class with active students: where they go and each student's suggested decision."""
    threshold = _threshold(school)
    done = decided(school, session)
    averages = defaultdict(list)
    for student_id, average in ReportCard.objects.filter(school=school, session=session).values_list(
        "student_id", "average"
    ):
        if average and average > 0:
            averages[student_id].append(average)

    students = defaultdict(list)
    for student in Student.objects.filter(school=school, status="active", current_class__isnull=False).order_by(
        "names"
    ):
        students[student.current_class_id].append(student)

    classes = (
        Class.objects.filter(school=school, pk__in=students.keys())
        .select_related("next_class", "section")
        .order_by("section__position", "level_order", "name")
    )
    result = []
    for cls in classes:
        rows = []
        for student in students[cls.pk]:
            marks = averages.get(student.pk, [])
            average = round(sum(marks) / len(marks), 2) if marks else None
            if cls.is_graduation_class:
                suggestion = "graduate"
            elif not cls.next_class_id:
                suggestion = "repeat"
            else:
                suggestion = "promote" if average is None or average >= threshold else "repeat"
            rows.append(
                {
                    "id": student.pk,
                    "names": student.names,
                    "student_no": student.student_no,
                    "average": average,
                    "terms": len(marks),
                    "suggestion": suggestion,
                    "done": student.pk in done,
                }
            )
        result.append(
            {
                "id": cls.pk,
                "name": cls.name,
                "next_class": {"id": cls.next_class_id, "name": cls.next_class.name} if cls.next_class_id else None,
                "graduates": cls.is_graduation_class,
                "students": rows,
            }
        )
    return {
        "session": session,
        "next_session": next_session_name(session),
        "threshold": threshold,
        "classes": result,
        "pending": sum(1 for c in result for s in c["students"] if not s["done"]),
    }


@transaction.atomic
def apply(school, session, decisions, user=None, copy_subject_teachers=True):
    """
    decisions: {student_id: "promote" | "repeat" | "graduate"}. Returns counts.
    Students decided earlier this session are skipped.
    """
    bad = {d for d in decisions.values() if d not in DECISIONS}
    if bad:
        raise PromotionError("Each student must be promoted, repeated or graduated.")
    done = decided(school, session)
    students = Student.objects.select_for_update().filter(school=school, status="active", pk__in=list(decisions.keys()))
    students = students.select_related("current_class__next_class")
    counts = {"promoted": 0, "repeated": 0, "graduated": 0, "skipped": 0}
    for student in students:
        decision = decisions.get(str(student.pk), decisions.get(student.pk))
        cls = student.current_class
        if student.pk in done or cls is None:
            counts["skipped"] += 1
            continue
        if decision == "promote" and not cls.next_class_id:
            raise PromotionError(f"{cls.name} has no next class. Set it in School structure, or repeat or graduate.")
        history = {"decision": decision, "from_class": cls.name}
        student._user = user
        if decision == "promote":
            student.current_class = cls.next_class
            history["to_class"] = cls.next_class.name
            student.save(update_fields=["current_class"])
            counts["promoted"] += 1
        elif decision == "graduate":
            student.status = "graduated"
            student.current_class = None
            student.save(update_fields=["status", "current_class"])
            counts["graduated"] += 1
        else:
            counts["repeated"] += 1
        StudentHistory.objects.create(
            school=school,
            student=student,
            event_type="graduation" if decision == "graduate" else "promotion",
            session=session,
            student_class=cls,
            remarks={"promote": "Promoted", "repeat": "Repeated the class", "graduate": "Graduated"}[decision],
            metadata={**history, "by": getattr(user, "username", "") if user else ""},
        )

    if copy_subject_teachers:
        counts["subject_teachers_copied"] = copy_assignments(school, session, next_session_name(session))
    return counts


def copy_assignments(school, from_session, to_session):
    """Subject-teacher assignments carry into the new session (each class keeps its teachers)."""
    have = set(
        SubjectTeacher.objects.filter(school=school, session=to_session).values_list(
            "teacher_id", "student_class_id", "subject"
        )
    )
    copies = [
        SubjectTeacher(
            school=school,
            teacher_id=row.teacher_id,
            student_class_id=row.student_class_id,
            subject=row.subject,
            session=to_session,
        )
        for row in SubjectTeacher.objects.filter(school=school, session=from_session)
        if (row.teacher_id, row.student_class_id, row.subject) not in have
    ]
    SubjectTeacher.objects.bulk_create(copies)
    return len(copies)
