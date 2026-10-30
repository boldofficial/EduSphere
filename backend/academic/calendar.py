"""
Academic calendar: sessions (2025/2026) and their three terms, with dates.

Scores, fees, attendance and reports keep storing the session and term as text. These records are
where that text comes from: SchoolSettings.current_session/current_term always mirror the active
term, so the names can no longer be mistyped and every record of a term files under the same name.
"""

import re
from datetime import timedelta

from django.db import transaction
from django.utils import timezone

from .models import AcademicSession, AcademicTerm, SchoolEvent

TERM_NAMES = AcademicTerm.TERM_NAMES
SESSION_RE = re.compile(r"^(\d{4})/(\d{4})$")


class CalendarError(ValueError):
    pass


def parse_session(name):
    """'2025/2026' -> 2025. Accepts '2025/26' and '2025-2026' and returns the canonical form too."""
    text = str(name or "").strip().replace("-", "/").replace(" ", "")
    match = re.match(r"^(\d{4})/(\d{2}|\d{4})$", text)
    if not match:
        raise CalendarError("Write the session as two years, e.g. 2025/2026.")
    first = int(match.group(1))
    second = int(match.group(2)) if len(match.group(2)) == 4 else (first // 100) * 100 + int(match.group(2))
    if second != first + 1:
        raise CalendarError("A session runs over two consecutive years, e.g. 2025/2026.")
    return first, f"{first}/{first + 1}"


def _shift_year(value, years=1):
    if value is None:
        return None
    try:
        return value.replace(year=value.year + years)
    except ValueError:  # 29 February
        return value.replace(year=value.year + years, day=28)


def _settings(school):
    from schools.models import SchoolSettings

    return SchoolSettings.objects.get_or_create(school=school)[0]


def _link_session(school, name):
    """The session record for this name, with all three terms (existing term rows are linked)."""
    session, _ = AcademicSession.objects.get_or_create(school=school, name=name)
    existing = {t.name: t for t in AcademicTerm.objects.filter(school=school, session=name)}
    for term_name in TERM_NAMES:
        term = existing.get(term_name) or AcademicTerm(school=school, session=name, name=term_name)
        term.academic_session = session
        term.save()
    return session


def ensure_calendar(school):
    """
    Schools set up before the calendar existed: build sessions from their term rows and settings.
    The term in settings becomes active, earlier terms closed and later ones upcoming. Cheap once
    the school has a session, so it is safe to call on every request.
    """
    if AcademicSession.objects.filter(school=school).exists():
        return
    settings = _settings(school)
    try:
        _first, current_session = parse_session(settings.current_session)
    except CalendarError:
        today = timezone.localdate()
        first = today.year if today.month >= 9 else today.year - 1
        current_session = f"{first}/{first + 1}"
    current = settings.current_term if settings.current_term in TERM_NAMES else TERM_NAMES[0]

    with transaction.atomic():
        names = {current_session}
        for legacy in AcademicTerm.objects.filter(school=school, academic_session__isnull=True):
            try:
                _first, canonical = parse_session(legacy.session)
            except CalendarError:
                continue
            clash = AcademicTerm.objects.filter(school=school, session=canonical, name=legacy.name)
            if canonical != legacy.session and not clash.exists():
                legacy.session = canonical
                legacy.save()
            names.add(canonical)
        position_now = (current_session, TERM_NAMES.index(current) + 1)
        for name in sorted(names):
            for term in _link_session(school, name).terms.all():
                here = (name, term.order)
                term.status = "closed" if here < position_now else "active" if here == position_now else "upcoming"
                if here > position_now and name == current_session and term.order == position_now[1] + 1:
                    term.start_date = term.start_date or settings.next_term_begins
                term.save()
        if settings.current_session != current_session or settings.current_term != current:
            settings.current_session, settings.current_term = current_session, current
            settings.save(update_fields=["current_session", "current_term"])


def active_term(school):
    ensure_calendar(school)
    return AcademicTerm.objects.select_related("academic_session").filter(school=school, status="active").first()


def next_term(term):
    """The term after this one: the next in its session, or the first of the following session."""
    if term is None:
        return None
    later = (
        AcademicTerm.objects.filter(academic_session=term.academic_session, order__gt=term.order)
        .order_by("order")
        .first()
    )
    if later:
        return later
    first, _ = parse_session(term.session)
    return (
        AcademicTerm.objects.select_related("academic_session")
        .filter(school=term.school, session=f"{first + 1}/{first + 2}")
        .order_by("order")
        .first()
    )


def holidays(school, start, end):
    """Dates covered by the school's holiday events between start and end."""
    days = set()
    events = SchoolEvent.objects.filter(school=school, event_type="holiday", start_date__date__lte=end).exclude(
        end_date__date__lt=start
    )
    for event in events:
        first = max(event.start_date.date(), start)
        last = min((event.end_date or event.start_date).date(), end)
        while first <= last:
            days.add(first)
            first += timedelta(days=1)
    return days


def school_days(term, until=None):
    """Weekdays school opens in the term: no weekends, mid-term break or holiday events."""
    if not term.start_date or not term.end_date or term.end_date < term.start_date:
        return None
    end = min(term.end_date, until) if until else term.end_date
    off = holidays(term.school, term.start_date, end)
    count, day = 0, term.start_date
    while day <= end:
        on_break = term.mid_term_start and term.mid_term_end and term.mid_term_start <= day <= term.mid_term_end
        if day.weekday() < 5 and not on_break and day not in off:
            count += 1
        day += timedelta(days=1)
    return count


def term_week(term, today=None):
    """(week, total weeks) while a dated term is running, otherwise None."""
    if not term or not term.start_date or not term.end_date:
        return None
    today = today or timezone.localdate()
    if not term.start_date <= today <= term.end_date:
        return None
    monday = term.start_date - timedelta(days=term.start_date.weekday())
    return (today - monday).days // 7 + 1, (term.end_date - monday).days // 7 + 1


def sync_settings(school):
    """Mirror the active term into SchoolSettings (current session/term, next term begins)."""
    term = AcademicTerm.objects.select_related("academic_session").filter(school=school, status="active").first()
    if term is None:
        return
    settings = _settings(school)
    following = next_term(term)
    settings.current_session = term.session
    settings.current_term = term.name
    settings.next_term_begins = following.start_date if following and following.start_date else None
    settings.save(update_fields=["current_session", "current_term", "next_term_begins"])


def validate_dates(term, values):
    """Check a term's dates (merged with what it has) and that it doesn't overlap its neighbours."""
    merged = {
        field: values.get(field, getattr(term, field))
        for field in ("start_date", "end_date", "mid_term_start", "mid_term_end")
    }
    start, end = merged["start_date"], merged["end_date"]
    if start and end and end <= start:
        raise CalendarError("The term must end after it starts.")
    mid_start, mid_end = merged["mid_term_start"], merged["mid_term_end"]
    if bool(mid_start) != bool(mid_end):
        raise CalendarError("Give both the first and last day of the mid-term break.")
    if mid_start:
        if mid_end < mid_start:
            raise CalendarError("The mid-term break must end after it starts.")
        if (start and mid_start < start) or (end and mid_end > end):
            raise CalendarError("The mid-term break must fall within the term.")
    siblings = AcademicTerm.objects.filter(academic_session=term.academic_session).exclude(pk=term.pk)
    for other in siblings:
        if other.order < term.order and other.end_date and start and start <= other.end_date:
            raise CalendarError(f"{term.name} must start after {other.name} ends ({other.end_date:%d %b %Y}).")
        if other.order > term.order and other.start_date and end and end >= other.start_date:
            raise CalendarError(f"{term.name} must end before {other.name} starts ({other.start_date:%d %b %Y}).")
    return merged


@transaction.atomic
def create_session(school, name=None):
    """
    A new session with three terms. Dates are copied from the latest session one year on, ready to
    adjust. The name defaults to the year after the latest session.
    """
    ensure_calendar(school)
    latest = AcademicSession.objects.filter(school=school).order_by("-name").first()
    if name:
        _first, name = parse_session(name)
    else:
        first, _ = parse_session(latest.name)
        name = f"{first + 1}/{first + 2}"
    if AcademicSession.objects.filter(school=school, name=name).exists():
        raise CalendarError(f"{name} already exists.")

    template = {}
    years = 0
    if latest:
        years = parse_session(name)[0] - parse_session(latest.name)[0]
        template = {t.order: t for t in latest.terms.all()}
    session = AcademicSession.objects.create(
        school=school,
        name=name,
        start_date=_shift_year(latest.start_date, years) if latest else None,
        end_date=_shift_year(latest.end_date, years) if latest else None,
    )
    for order, term_name in enumerate(TERM_NAMES, start=1):
        source = template.get(order)
        AcademicTerm.objects.update_or_create(
            school=school,
            session=name,
            name=term_name,
            defaults={
                "academic_session": session,
                "status": "upcoming",
                **{
                    field: _shift_year(getattr(source, field), years) if source else None
                    for field in ("start_date", "end_date", "mid_term_start", "mid_term_end")
                },
            },
        )
    sync_settings(school)  # "next term begins" may now point into this session
    return session


def session_bounds(session):
    terms = [t for t in session.terms.all() if t.start_date and t.end_date]
    if not terms:
        return session.start_date, session.end_date
    return session.start_date or min(t.start_date for t in terms), session.end_date or max(t.end_date for t in terms)


@transaction.atomic
def start_term(term, user=None):
    """Make this the school's current term. The one it replaces is closed."""
    school = term.school
    if term.status == "active":
        return term
    previous = AcademicTerm.objects.select_for_update().filter(school=school, status="active")
    for old in previous:
        old.status = "closed"
        old.closed_at = timezone.now()
        old.closed_by = user if getattr(user, "is_authenticated", False) else None
        old.save()
    term.status = "active"
    term.save()
    sync_settings(school)
    return term


def is_closed(school, session, term):
    """Whether this session/term (as stored on records) belongs to a closed term."""
    if not session or not term:
        return False
    return AcademicTerm.objects.filter(school=school, session=session, name=term, status="closed").exists()


def describe(term, today=None):
    """Small summary for the top bar and dashboards."""
    if term is None:
        return None
    week = term_week(term, today)
    return {
        "id": term.id,
        "session": term.session,
        "term": term.name,
        "start_date": term.start_date,
        "end_date": term.end_date,
        "week": week[0] if week else None,
        "weeks": week[1] if week else None,
        "school_days": school_days(term),
        "days_left": (term.end_date - (today or timezone.localdate())).days if term.end_date else None,
    }
