"""
One student's profile for a session/term, computed server-side. Replaces the students screen
downloading every payment, fee, attendance and report-card record in the school.
"""

from django.db.models import Count, Max, Q, Sum

from bursary.models import Payment
from bursary.views import calculate_expected_revenue
from schools.models import SchoolSettings

from ..models import AttendanceRecord, ConductEntry, ReportCard, SubjectScore

DEFAULT_TERMS = ["First Term", "Second Term", "Third Term"]
RECENT_LIMIT = 10


def _money(value):
    return float(value or 0)


def build_student_profile(student, session=None, term=None):
    school = student.school
    settings = SchoolSettings.objects.filter(school=school).first()
    session = session or getattr(settings, "current_session", "") or ""
    term = term or getattr(settings, "current_term", "") or ""
    raw_terms = (getattr(settings, "terms_list", None) or DEFAULT_TERMS) if settings else DEFAULT_TERMS
    terms = [t.get("name", "") if isinstance(t, dict) else str(t) for t in raw_terms] or DEFAULT_TERMS

    # Sessions this student has any record in, newest first, always including the selected one.
    sessions = set(ReportCard.objects.filter(student=student).values_list("session", flat=True))
    sessions |= set(Payment.objects.filter(student=student).values_list("session", flat=True))
    if settings and settings.current_session:
        sessions.add(settings.current_session)
    sessions.add(session)
    sessions.discard("")

    # ---- Academics -------------------------------------------------------------------------
    report = (
        ReportCard.objects.filter(student=student, session=session, term=term).select_related("student_class").first()
    )
    academics = None
    if report:
        classmates = ReportCard.objects.filter(
            school=school, student_class=report.student_class, session=session, term=term
        )
        position = report.position or (classmates.filter(average__gt=report.average).count() + 1)
        subjects = [
            {
                "subject": s.subject.name,
                "ca1": s.ca1,
                "ca2": s.ca2,
                "exam": s.exam,
                "total": s.total,
                "grade": s.grade,
            }
            for s in SubjectScore.objects.filter(report_card=report).select_related("subject").order_by("-total")
        ]
        academics = {
            "average": round(report.average, 1),
            "total_score": report.total_score,
            "position": position,
            "class_size": classmates.count(),
            "published": report.is_passed,
            "trend": report.performance_trend,
            "teacher_remark": report.teacher_remark,
            "head_teacher_remark": report.head_teacher_remark,
            "subjects": subjects,
        }
    history = [
        {"session": r["session"], "term": r["term"], "average": round(r["average"], 1)}
        for r in ReportCard.objects.filter(student=student).order_by("created_at").values("session", "term", "average")
    ]

    # ---- Attendance ------------------------------------------------------------------------
    records = AttendanceRecord.objects.filter(
        student=student, attendance_session__session=session, attendance_session__term=term
    )
    att = records.aggregate(
        total=Count("id"),
        present=Count("id", filter=Q(status="present")),
        late=Count("id", filter=Q(status="late")),
        absent=Count("id", filter=Q(status="absent")),
        last=Max("attendance_session__date"),
    )
    attendance = {
        **att,
        "rate": round((att["present"] + att["late"]) / att["total"] * 100, 1) if att["total"] else None,
    }

    # ---- Fees ------------------------------------------------------------------------------
    term_payments = Payment.objects.filter(student=student, session=session, term=term)
    bill = calculate_expected_revenue(school, session=session, term=term, student=student)
    paid = term_payments.filter(status="completed").aggregate(total=Sum("amount"))["total"]
    finance = {
        "total_bill": _money(bill),
        "total_paid": _money(paid),
        "balance": _money(bill) - _money(paid),
        "payments": [
            {
                "id": p.id,
                "date": p.date,
                "amount": _money(p.amount),
                "method": p.method,
                "status": p.status,
                "reference": p.reference,
            }
            for p in term_payments.order_by("-date", "-created_at")[:RECENT_LIMIT]
        ],
    }

    # ---- Conduct ---------------------------------------------------------------------------
    conduct = list(
        ConductEntry.objects.filter(student=student)
        .order_by("-date", "-id")
        .values("id", "trait", "score", "remark", "date")[:RECENT_LIMIT]
    )

    # ---- Data quality ----------------------------------------------------------------------
    checks = [
        (not student.dob, "Date of birth is missing."),
        (not student.parent_phone, "Parent phone is missing."),
        (not student.parent_email, "Parent email is missing."),
        (not student.address, "Address is missing."),
        (not student.passport_url, "Passport photo is missing."),
        (not student.current_class_id, "No class assigned."),
        (not student.user_id, "Student portal account has not been created."),
    ]

    return {
        "session": session,
        "term": term,
        "sessions": sorted(sessions, reverse=True),
        "terms": terms,
        "academics": academics,
        "history": history,
        "attendance": attendance,
        "finance": finance,
        "conduct": conduct,
        "warnings": [message for missing, message in checks if missing],
    }
