"""
Before a term is closed: what is still missing. Nothing here blocks closing; it shows the admin
what they would be leaving behind (scores not entered, report cards not published, attendance not
taken, fees owed, next term's date not set).
"""

from collections import defaultdict

from django.db.models import Count

from .calendar import next_term, school_days
from .models import AttendanceSession, Class, ReportCard, Student, SubjectScore
from .subject_choices import class_subject_names, compulsory_for, effective_subjects

LIST_LIMIT = 12


def _check(key, title, ok, summary, items=None):
    return {"key": key, "title": title, "status": "ok" if ok else "warn", "summary": summary, "items": items or []}


def _plural(count, word):
    many = word + ("es" if word.endswith(("s", "sh", "ch")) else "s")
    return f"{count} {word if count == 1 else many}"


def checklist(term):
    school, session, name = term.school, term.session, term.name
    classes = list(
        Class.objects.filter(school=school, students__status="active").distinct().prefetch_related("subjects")
    )
    students = list(Student.objects.filter(school=school, status="active", current_class__isnull=False))
    by_class = defaultdict(list)
    for student in students:
        by_class[student.current_class_id].append(student)

    # Scores: every student, every subject they take.
    scored = set(
        SubjectScore.objects.filter(school=school, report_card__session=session, report_card__term=name).values_list(
            "report_card__student_id", "subject__name"
        )
    )
    missing_scores = []
    total_missing = 0
    for cls in classes:
        offered = class_subject_names(cls)
        compulsory = compulsory_for(cls, offered)
        subjects = defaultdict(int)
        for student in by_class.get(cls.pk, []):
            for subject in effective_subjects(student, cls, offered, compulsory):
                if (student.pk, subject) not in scored:
                    subjects[subject] += 1
        if subjects:
            count = sum(subjects.values())
            total_missing += count
            missing_scores.append(
                {
                    "class": cls.name,
                    "missing": count,
                    "detail": ", ".join(f"{s} ({n})" for s, n in sorted(subjects.items(), key=lambda x: -x[1])[:4]),
                }
            )
    missing_scores.sort(key=lambda row: -row["missing"])

    # Report cards: published for each student.
    published = dict(
        ReportCard.objects.filter(school=school, session=session, term=name, is_passed=True)
        .values("student__current_class_id")
        .annotate(n=Count("id"))
        .values_list("student__current_class_id", "n")
    )
    unpublished = [
        {"class": cls.name, "missing": len(by_class[cls.pk]) - published.get(cls.pk, 0), "detail": ""}
        for cls in classes
        if len(by_class[cls.pk]) > published.get(cls.pk, 0)
    ]
    unpublished_total = sum(row["missing"] for row in unpublished)

    # Attendance: days marked per class against the days school opened.
    days = school_days(term)
    marked = dict(
        AttendanceSession.objects.filter(school=school, session=session, term=name)
        .values("student_class_id")
        .annotate(n=Count("date", distinct=True))
        .values_list("student_class_id", "n")
    )
    no_attendance = [
        {
            "class": cls.name,
            "missing": (days - marked.get(cls.pk, 0)) if days else 0,
            "detail": f"{marked.get(cls.pk, 0)} of {days} days" if days else f"{marked.get(cls.pk, 0)} days marked",
        }
        for cls in classes
        if (marked.get(cls.pk, 0) < days if days else not marked.get(cls.pk))
    ]

    # Fees still owed this term.
    from bursary.balances import term_balances

    balances = term_balances(school, session, name, students)
    owing = [b["balance"] for b in balances.values() if b["balance"] > 0]

    following = next_term(term)
    checks = [
        _check(
            "scores",
            "Scores entered",
            not missing_scores,
            (
                "Every student has a score in every subject they take."
                if not missing_scores
                else f"{_plural(total_missing, 'score')} missing in {_plural(len(missing_scores), 'class')}."
            ),
            missing_scores[:LIST_LIMIT],
        ),
        _check(
            "reports",
            "Report cards published",
            not unpublished,
            (
                "Every student's report card is published."
                if not unpublished
                else f"{_plural(unpublished_total, 'report card')} not published yet."
            ),
            unpublished[:LIST_LIMIT],
        ),
        _check(
            "attendance",
            "Attendance taken",
            not no_attendance,
            (
                "Attendance was taken every school day."
                if not no_attendance
                else f"{_plural(len(no_attendance), 'class')} with days not marked."
            ),
            no_attendance[:LIST_LIMIT],
        ),
        _check(
            "fees",
            "Fees collected",
            not owing,
            (
                "No outstanding fees for this term."
                if not owing
                else f"{_plural(len(owing), 'student')} {'owes' if len(owing) == 1 else 'owe'} ₦{sum(owing):,.2f}. "
                "The bursar can carry these into next term."
            ),
        ),
        _check(
            "next_term",
            "Next term dates",
            bool(following and following.start_date),
            (
                f"{following.name} {following.session} begins {following.start_date:%d %B %Y}."
                if following and following.start_date
                else (
                    f"Set when {following.name} {following.session} begins: report cards show it."
                    if following
                    else "Add the next session first."
                )
            ),
        ),
    ]
    if following and following.session != session:
        from .promotion import plan

        pending = plan(school, session)["pending"]
        checks.insert(
            0,
            _check(
                "promotion",
                "Promotions for the new session",
                pending == 0,
                (
                    "Every student has been promoted, repeated or graduated."
                    if pending == 0
                    else f"{_plural(pending, 'student')} not yet promoted, repeated or graduated. "
                    "Do this before the new session starts so everyone begins in the right class."
                ),
            ),
        )
    return {
        "term": {"id": term.id, "session": session, "term": name},
        "next": {"id": following.id, "session": following.session, "term": following.name} if following else None,
        "checks": checks,
        "ready": all(c["status"] == "ok" for c in checks),
    }
