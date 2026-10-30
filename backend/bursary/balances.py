"""
Each student's bill, payments and balance for a term: the same sum the bursary screens show
(lib/utils.ts getStudentBalance), done on the server for closing a term and carrying balances forward.

bill = the term's fees for the student's class (optional ones only when assigned)
       - discounts for the term + balances brought into the term - balances carried out of it
paid = completed payments recorded under the term
"""

from collections import defaultdict
from decimal import Decimal

from academic.models import Student

from .models import FeeItem, Payment

ZERO = Decimal("0")


def _money(value):
    try:
        return Decimal(str(value or 0))
    except Exception:
        return ZERO


def transfers_into(student, session, term):
    return sum(
        (
            _money(t.get("amount"))
            for t in (student.balance_transfers or [])
            if t.get("to_session") == session and t.get("to_term") == term
        ),
        ZERO,
    )


def transfers_out_of(student, session, term):
    return sum(
        (
            _money(t.get("amount"))
            for t in (student.balance_transfers or [])
            if t.get("from_session") == session and t.get("from_term") == term
        ),
        ZERO,
    )


def term_balances(school, session, term, students=None):
    """{student_id: {"bill", "paid", "balance"}} for the term (Decimals)."""
    if students is None:
        students = Student.objects.filter(school=school, status="active")
    students = list(students)
    fees = list(FeeItem.objects.filter(school=school, session=session, term=term).select_related("category"))
    paid = defaultdict(lambda: ZERO)
    for row in (
        Payment.objects.filter(school=school, session=session, term=term, student__in=[s.pk for s in students])
        .exclude(status__in=["pending", "failed", "refunded"])
        .values("student_id", "amount")
    ):
        paid[row["student_id"]] += row["amount"]

    result = {}
    for student in students:
        assigned = {str(f) for f in (student.assigned_fees or [])}
        bill = ZERO
        for fee in fees:
            if fee.target_class_id not in (None, student.current_class_id):
                continue
            optional = bool(fee.category and fee.category.is_optional)
            if optional and str(fee.pk) not in assigned:
                continue
            bill += fee.amount
        discount = sum(
            (
                _money(d.get("amount"))
                for d in (student.discounts or [])
                if d.get("session") == session and d.get("term") == term
            ),
            ZERO,
        )
        bill = max(ZERO, bill - discount) + transfers_into(student, session, term)
        bill -= transfers_out_of(student, session, term)
        result[student.pk] = {"bill": bill, "paid": paid[student.pk], "balance": bill - paid[student.pk]}
    return result
