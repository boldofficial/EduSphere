"""
Student onboarding: bulk import from Excel/CSV, admission numbers, and sign-in accounts.

Flow: `read_rows` (file → rows) → `build_preview` (validate everything, change nothing) → `commit_import`
(create/update students and their accounts). New accounts get a temporary password and must choose their
own at first sign-in; the temporary passwords are returned once for the school to print as login slips.
"""

import csv
import io
import re
import secrets
from datetime import date, datetime

from django.contrib.auth.hashers import make_password
from django.core.exceptions import ValidationError as DjangoValidationError
from django.core.validators import validate_email
from django.db import transaction

from users.models import User

from .models import Class, Student

MAX_ROWS = 5000
MAX_BYTES = 5 * 1024 * 1024

# Column names schools actually use, mapped to ours (compared lower-case, without punctuation).
HEADER_ALIASES = {
    "student_no": {
        "student_no",
        "studentno",
        "admission_no",
        "admissionno",
        "admission_number",
        "admission number",
        "admission no",
        "adm no",
        "admno",
        "reg no",
        "regno",
        "registration number",
        "student number",
        "student id",
        "studentid",
    },
    "names": {"names", "name", "full name", "fullname", "student name", "student names", "pupil name"},
    "first_name": {"first name", "firstname", "given name"},
    "surname": {"surname", "last name", "lastname", "family name"},
    "middle_name": {"middle name", "middlename", "other name", "other names", "othernames"},
    "gender": {"gender", "sex"},
    "dob": {"dob", "date_of_birth", "date of birth", "birth date", "birthday"},
    "class_name": {"class", "class_name", "class name", "classname", "current class", "arm"},
    "parent_name": {"parent_name", "parent name", "parent", "guardian", "guardian name", "parent/guardian"},
    "parent_email": {"parent_email", "parent email", "guardian email", "email", "parent's email"},
    "parent_phone": {
        "parent_phone",
        "parent phone",
        "phone",
        "phone number",
        "guardian phone",
        "telephone",
        "mobile",
        "parent's phone",
    },
    "address": {"address", "home address", "residential address"},
}

# No 0/O, 1/l/I: temporary passwords are typed from a printed slip.
_PASSWORD_ALPHABET = "abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789"


class ImportFileError(ValueError):
    pass


def temporary_password():
    """Readable and strong enough to pass the password policy (letters, digits, a symbol)."""
    core = "".join(secrets.choice(_PASSWORD_ALPHABET) for _ in range(8))
    return f"{core[:4]}-{core[4:]}{secrets.randbelow(90) + 10}"


def student_username(student):
    domain = student.school.domain if student.school and student.school.domain else "school"
    return f"{student.student_no}@{domain}"


def _norm_header(value):
    return " ".join(re.sub(r"[^a-z0-9/' ]+", " ", str(value or "").strip().lower().replace("_", " ")).split())


# Aliases go through the same normalisation as the file's headings ("student_no" -> "student no").
_HEADER_LOOKUP = {_norm_header(alias): field for field, aliases in HEADER_ALIASES.items() for alias in aliases}


def _cell(value):
    if value is None:
        return ""
    if isinstance(value, (datetime, date)):
        return value
    if isinstance(value, float) and value.is_integer():
        return str(int(value))  # Excel stores admission numbers like 1023 as 1023.0
    return " ".join(str(value).split())


def read_rows(upload):
    """Rows from an uploaded .xlsx or .csv as dicts keyed by our field names. Raises ImportFileError."""
    name = (getattr(upload, "name", "") or "").lower()
    if getattr(upload, "size", 0) > MAX_BYTES:
        raise ImportFileError("The file is larger than 5 MB. Split it into smaller files.")
    data = upload.read()
    if name.endswith(".xlsx"):
        from openpyxl import load_workbook

        try:
            sheet = load_workbook(io.BytesIO(data), read_only=True, data_only=True).worksheets[0]
        except Exception:
            raise ImportFileError("This Excel file could not be read. Save it as .xlsx or CSV and try again.")
        raw = ([_cell(v) for v in row] for row in sheet.iter_rows(values_only=True))
    elif name.endswith(".csv"):
        for encoding in ("utf-8-sig", "cp1252"):
            try:
                text = data.decode(encoding)
                break
            except UnicodeDecodeError:
                continue
        else:
            raise ImportFileError("The CSV file's text encoding is not supported. Save it as UTF-8.")
        raw = ([_cell(v) for v in row] for row in csv.reader(io.StringIO(text)))
    else:
        raise ImportFileError("Upload an Excel (.xlsx) or CSV (.csv) file.")

    header, rows = None, []
    for values in raw:
        if not any(str(v).strip() for v in values if not isinstance(v, (datetime, date))) and not any(
            isinstance(v, (datetime, date)) for v in values
        ):
            continue  # blank line
        if header is None:
            header = [_HEADER_LOOKUP.get(_norm_header(v)) for v in values]
            if "names" not in header and not {"first_name", "surname"} <= set(header):
                raise ImportFileError(
                    "The first row must be column headings, including the student's name "
                    "(e.g. 'Name' or 'First name' and 'Surname')."
                )
            continue
        row = {field: values[i] for i, field in enumerate(header) if field and i < len(values)}
        rows.append(row)
        if len(rows) > MAX_ROWS:
            raise ImportFileError(f"Import at most {MAX_ROWS:,} students at a time.")
    if header is None:
        raise ImportFileError("The file is empty.")
    return rows


def _gender(value):
    v = str(value or "").strip().lower()
    if v in ("m", "male", "boy", "b"):
        return "Male"
    if v in ("f", "female", "girl", "g"):
        return "Female"
    return None


def _date(value):
    if not value:
        return None
    if isinstance(value, datetime):
        return value.date()
    if isinstance(value, date):
        return value
    text = str(value).strip()
    for fmt in ("%Y-%m-%d", "%d/%m/%Y", "%d-%m-%Y", "%d.%m.%Y", "%d/%m/%y", "%Y/%m/%d"):
        try:
            return datetime.strptime(text, fmt).date()
        except ValueError:
            continue
    raise ValueError(f"Date of birth '{text}' is not a date (use DD/MM/YYYY).")


def _class_key(name):
    return re.sub(r"[^a-z0-9]", "", str(name or "").lower())


def build_preview(school, rows, update_existing=True, auto_number=True):
    """Validate every row without saving. Returns {"rows": [...], "summary": {...}}."""
    classes = {_class_key(c.name): c for c in Class.objects.filter(school=school)}
    existing = {
        s.student_no.lower(): s for s in Student.objects.filter(school=school).only("id", "student_no", "names")
    }
    seen, results = set(), []
    for index, row in enumerate(rows, start=2):  # row 1 is the heading row
        errors, warnings = [], []
        names = row.get("names") or " ".join(
            p for p in (row.get("surname"), row.get("first_name"), row.get("middle_name")) if p
        )
        names = " ".join(str(names).split())[:255]
        student_no = str(row.get("student_no") or "").strip()[:50]
        if not names:
            errors.append("Name is missing.")
        gender = _gender(row.get("gender"))
        if not gender:
            errors.append("Gender must be Male or Female (M/F also work).")
        try:
            dob = _date(row.get("dob"))
        except ValueError as error:
            dob, errors = None, errors + [str(error)]
        cls = None
        if row.get("class_name"):
            cls = classes.get(_class_key(row["class_name"]))
            if not cls:
                errors.append(f"Class '{row['class_name']}' doesn't exist. Create it or fix the spelling.")
        else:
            warnings.append("No class given; the student will not be in a class.")
        parent_email = str(row.get("parent_email") or "").strip()
        if parent_email:
            try:
                validate_email(parent_email)
            except DjangoValidationError:
                errors.append(f"Parent email '{parent_email}' is not valid.")
        if student_no:
            if student_no.lower() in seen:
                errors.append(f"Admission number {student_no} appears more than once in the file.")
            seen.add(student_no.lower())
        elif not auto_number:
            errors.append("Admission number is missing.")

        match = existing.get(student_no.lower()) if student_no else None
        if errors:
            action = "error"
        elif match:
            action = "update" if update_existing else "skip"
        else:
            action = "create"
        results.append(
            {
                "row": index,
                "action": action,
                "student_no": student_no or ("(automatic)" if action == "create" else ""),
                "names": names,
                "gender": gender or "",
                "class_name": cls.name if cls else (row.get("class_name") or ""),
                "class_id": cls.id if cls else None,
                "dob": dob.isoformat() if dob else "",
                "parent_name": str(row.get("parent_name") or "")[:255],
                "parent_email": parent_email,
                "parent_phone": str(row.get("parent_phone") or "")[:50],
                "address": str(row.get("address") or ""),
                "errors": errors,
                "warnings": warnings,
            }
        )

    to_create = sum(1 for r in results if r["action"] == "create")
    # Same count as School.has_student_capacity, so the preview matches what the import will allow.
    limit = school.student_limit
    room = None if limit is None else max(0, limit - Student.objects.filter(school=school).count())
    return {
        "rows": results,
        "summary": {
            "total": len(results),
            "create": to_create,
            "update": sum(1 for r in results if r["action"] == "update"),
            "skip": sum(1 for r in results if r["action"] == "skip"),
            "errors": sum(1 for r in results if r["action"] == "error"),
            "plan_room": room,
            "over_limit": room is not None and to_create > room,
        },
    }


def next_admission_numbers(school, prefix, count):
    """`count` unused admission numbers like HKS/2026/0001, continuing after the highest one used."""
    prefix = prefix or ""
    used = set(Student.objects.filter(school=school).values_list("student_no", flat=True))
    highest = 0
    for number in used:
        if number.startswith(prefix):
            tail = number[len(prefix) :]
            if tail.isdigit():
                highest = max(highest, int(tail))
    result, n = [], highest
    while len(result) < count:
        n += 1
        candidate = f"{prefix}{n:04d}"
        if candidate not in used:
            result.append(candidate)
    return result


def ensure_login(student, password=None):
    """Give a student a sign-in account (or a new temporary password). Returns the temporary password."""
    password = password or temporary_password()
    username = student_username(student)
    user = student.user or User.objects.filter(username=username).first()
    if user is None:
        user = User(username=username, email="", role="STUDENT", school=student.school, is_active=True)
    user.password = make_password(password)
    user.must_change_password = True
    user.is_active = True
    user.save()
    if student.user_id != user.id:
        student.user = user
        student.save(update_fields=["user"])
    return password


def commit_import(school, rows, update_existing=True, auto_number=True, number_prefix=""):
    """
    Save a validated import. Rows with errors are skipped. Returns counts, per-row problems, and the
    temporary credentials of new accounts (to print as login slips).
    """
    preview = build_preview(school, rows, update_existing=update_existing, auto_number=auto_number)
    plan = preview["rows"]
    needing_numbers = [r for r in plan if r["action"] == "create" and r["student_no"] == "(automatic)"]
    for r, number in zip(needing_numbers, next_admission_numbers(school, number_prefix, len(needing_numbers))):
        r["student_no"] = number

    created = updated = 0
    problems = [{"row": r["row"], "error": " ".join(r["errors"])} for r in plan if r["action"] == "error"]
    credentials = []
    existing = {s.student_no.lower(): s for s in Student.objects.filter(school=school).select_related("user")}
    for r in plan:
        if r["action"] not in ("create", "update"):
            continue
        fields = {
            "names": r["names"],
            "gender": r["gender"],
            "current_class_id": r["class_id"],
            "dob": r["dob"] or None,
            "parent_name": r["parent_name"],
            "parent_email": r["parent_email"],
            "parent_phone": r["parent_phone"],
            "address": r["address"],
        }
        with transaction.atomic():
            if r["action"] == "create":
                if not school.has_student_capacity():
                    problems.append({"row": r["row"], "error": "Your plan's student limit has been reached."})
                    continue
                student = Student.objects.create(school=school, student_no=r["student_no"], **fields)
                password = ensure_login(student)
                created += 1
                credentials.append(
                    {
                        "student_no": student.student_no,
                        "names": student.names,
                        "class_name": r["class_name"],
                        "password": password,
                    }
                )
            else:
                student = existing[r["student_no"].lower()]
                # Only overwrite with values the file actually provides.
                for field, value in fields.items():
                    if value not in (None, ""):
                        setattr(student, field, value)
                student.save()
                updated += 1
    return {"created": created, "updated": updated, "problems": problems, "credentials": credentials}
