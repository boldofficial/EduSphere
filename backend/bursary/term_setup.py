"""
New-term setup for the bursar, after the school moves to a new term. Nothing happens on its own:
the bursar previews and confirms each step.

1. Fee structure: copy last term's fee items into this term (amounts can be edited after).
2. Unpaid balances: carry what students still owe from last term into this term's bill. The old
   term's balance is closed at the same time, so the debt is never counted twice.
"""

from django.db import transaction
from django.utils import timezone

from academic.calendar import active_term
from academic.models import AcademicTerm, Student

from .balances import term_balances, transfers_out_of
from .models import FeeItem


class SetupError(ValueError):
    pass


def previous_term(term):
    """The term before this one (same session or the one before)."""
    if term is None:
        return None
    earlier = [
        t
        for t in AcademicTerm.objects.filter(school=term.school).exclude(pk=term.pk)
        if (t.session, t.order) < (term.session, term.order)
    ]
    return max(earlier, key=lambda t: (t.session, t.order), default=None)


def _fee_source(term):
    """The latest earlier term that has fee items (usually the previous one)."""
    terms = AcademicTerm.objects.filter(school=term.school).exclude(pk=term.pk)
    for candidate in sorted(terms, key=lambda t: (t.session, t.order), reverse=True):
        if (candidate.session, candidate.order) >= (term.session, term.order):
            continue
        if FeeItem.objects.filter(school=term.school, session=candidate.session, term=candidate.name).exists():
            return candidate
    return None


def _key(item):
    return (item.category_id, item.target_class_id)


def _fee_row(item):
    return {
        "id": item.id,
        "name": item.category.name if item.category_id else "",
        "class_name": item.target_class.name if item.target_class_id else "All classes",
        "amount": item.amount,
        "optional": bool(item.category_id and item.category.is_optional),
    }


def status(school):
    term = active_term(school)
    if term is None:
        return {"term": None}
    current_items = FeeItem.objects.filter(school=school, session=term.session, term=term.name)
    have = {_key(i) for i in current_items}
    source = _fee_source(term)
    to_copy = []
    if source:
        to_copy = [
            _fee_row(item)
            for item in FeeItem.objects.filter(school=school, session=source.session, term=source.name)
            .select_related("category", "target_class")
            .order_by("target_class__name", "category__name")
            if _key(item) not in have
        ]

    previous = previous_term(term)
    debtors = []
    if previous:
        students = Student.objects.filter(school=school, status="active").select_related("current_class")
        balances = term_balances(school, previous.session, previous.name, students)
        for student in students:
            owed = balances[student.pk]["balance"]
            if owed > 0 and not transfers_out_of(student, previous.session, previous.name):
                debtors.append(
                    {
                        "student_id": student.pk,
                        "names": student.names,
                        "student_no": student.student_no,
                        "class_name": student.current_class.name if student.current_class_id else "",
                        "balance": owed,
                    }
                )
        debtors.sort(key=lambda d: -d["balance"])

    def label(t):
        return {"id": t.id, "session": t.session, "term": t.name} if t else None

    return {
        "term": label(term),
        "fee_items": current_items.count(),
        "fee_source": label(source),
        "fees_to_copy": to_copy,
        "previous": label(previous),
        "debtors": debtors,
        "debt_total": sum((d["balance"] for d in debtors), 0),
    }


@transaction.atomic
def copy_fees(school, item_ids=None):
    """Copy the source term's fee items (all, or the chosen ones) and who takes the optional ones."""
    term = active_term(school)
    source = _fee_source(term) if term else None
    if source is None:
        raise SetupError("There is no earlier term with fees to copy.")
    have = {_key(i) for i in FeeItem.objects.filter(school=school, session=term.session, term=term.name)}
    items = FeeItem.objects.filter(school=school, session=source.session, term=source.name)
    if item_ids:
        items = items.filter(pk__in=item_ids)
    copies = []
    for item in items:
        if _key(item) in have:
            continue
        copies.append(
            (
                item,
                FeeItem(
                    school=school,
                    category_id=item.category_id,
                    amount=item.amount,
                    session=term.session,
                    term=term.name,
                    target_class_id=item.target_class_id,
                    active=item.active,
                ),
            )
        )
        have.add(_key(item))
    FeeItem.objects.bulk_create([new for _old, new in copies])

    # Optional fees (bus, lunch…) are assigned per fee item: students who had last term's item get the copy.
    renamed = {str(old.pk): str(new.pk) for old, new in copies if new.pk}
    if renamed:
        for student in Student.objects.filter(school=school, status="active").exclude(assigned_fees=[]):
            assigned = [str(f) for f in student.assigned_fees or []]
            extra = [renamed[f] for f in assigned if f in renamed and renamed[f] not in assigned]
            if extra:
                student.assigned_fees = assigned + extra
                student.save(update_fields=["assigned_fees"])
    return len(copies)


@transaction.atomic
def carry_forward(school, student_ids, user=None):
    """Move the chosen students' unpaid balances from the previous term into the current one."""
    term = active_term(school)
    previous = previous_term(term)
    if previous is None:
        raise SetupError("There is no earlier term to carry balances from.")
    students = list(
        Student.objects.select_for_update().filter(school=school, status="active", pk__in=student_ids or [])
    )
    balances = term_balances(school, previous.session, previous.name, students)
    moved, total = 0, 0
    for student in students:
        owed = balances[student.pk]["balance"]
        if owed <= 0 or transfers_out_of(student, previous.session, previous.name):
            continue
        student.balance_transfers = [
            *(student.balance_transfers or []),
            {
                "from_session": previous.session,
                "from_term": previous.name,
                "to_session": term.session,
                "to_term": term.name,
                "amount": str(owed),
                "at": timezone.now().isoformat(),
                "by": getattr(user, "username", "") if user else "",
            },
        ]
        student._user = user
        student.save(update_fields=["balance_transfers"])
        moved += 1
        total += owed
    return moved, total
