from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from django.db import models
import csv
import io
import json

from .models import ImportJob, ImportRow


@api_view(["POST"])
def import_data(request):
    """Generic import endpoint for various data types."""
    import_type = request.data.get("type", "students")
    file_content = request.data.get("file_content")  # Base64 encoded CSV
    
    if not file_content:
        return Response({"error": "file_content required (base64 encoded CSV)"}, status=400)
    
    import base64
    try:
        csv_data = base64.b64decode(file_content).decode("utf-8")
    except Exception:
        return Response({"error": "Invalid base64 encoding"}, status=400)
    
    # Create import job
    job = ImportJob.objects.create(
        school=request.tenant,
        import_type=import_type,
        file_name=f"import_{import_type}.csv",
        created_by=request.user.username,
        status="pending"
    )
    
    # Parse CSV
    reader = csv.DictReader(io.StringIO(csv_data))
    rows = list(reader)
    
    job.total_rows = len(rows)
    job.save()
    
    # Process based on type
    errors = []
    success_count = 0
    
    if import_type == "students":
        success_count, errors = process_student_import(job, rows, request.tenant)
    elif import_type == "scores":
        success_count, errors = process_score_import(job, rows, request.tenant)
    else:
        job.status = "failed"
        job.errors = [{"row": 0, "error": f"Unsupported import type: {import_type}"}]
        job.save()
        return Response({"error": f"Unsupported import type: {import_type}"}, status=400)
    
    job.status = "completed"
    job.success_rows = success_count
    job.failed_rows = len(errors)
    job.errors = errors
    job.save()
    
    return Response({
        "job_id": job.id,
        "total_rows": job.total_rows,
        "success_rows": success_count,
        "failed_rows": len(errors),
        "errors": errors[:10]  # Return first 10 errors
    })


def process_student_import(job, rows, school):
    """Import students from CSV."""
    from academic.models import Student, Class
    
    errors = []
    success = 0
    
    for i, row in enumerate(rows):
        try:
            # Validate required fields
            names = row.get("names", "").strip()
            student_no = row.get("student_no", "").strip()
            gender = row.get("gender", "").strip()
            
            if not names or not student_no:
                errors.append({"row": i + 1, "error": "Missing required fields: names, student_no"})
                continue
            
            if gender not in ["Male", "Female"]:
                errors.append({"row": i + 1, "error": "Invalid gender"})
                continue
            
            # Get class
            class_name = row.get("class", "").strip()
            student_class = None
            if class_name:
                student_class = Class.objects.filter(school=school, name=class_name).first()
            
            # Create student
            student, created = Student.objects.update_or_create(
                school=school,
                student_no=student_no,
                defaults={
                    "names": names,
                    "gender": gender,
                    "current_class": student_class,
                    "parent_name": row.get("parent_name", "").strip(),
                    "parent_email": row.get("parent_email", "").strip(),
                    "parent_phone": row.get("parent_phone", "").strip(),
                    "address": row.get("address", "").strip(),
                }
            )
            
            ImportRow.objects.create(
                school=school,
                job=job,
                row_number=i + 1,
                data=row,
                status="success",
                entity_id=student.id,
                entity_type="Student"
            )
            success += 1
            
        except Exception as e:
            errors.append({"row": i + 1, "error": str(e)})
            ImportRow.objects.create(
                school=school,
                job=job,
                row_number=i + 1,
                data=row,
                status="failed",
                error_message=str(e)
            )
    
    return success, errors


def process_score_import(job, rows, school):
    """Import scores from CSV."""
    from academic.models import Student, Subject, SubjectScore, GradingScheme
    
    errors = []
    success = 0
    
    # Get current session/term from first row
    session = rows[0].get("session", "2025/2026") if rows else "2025/2026"
    term = rows[0].get("term", "First Term") if rows else "First Term"
    
    for i, row in enumerate(rows):
        try:
            student_no = row.get("student_no", "").strip()
            subject_name = row.get("subject", "").strip()
            
            if not student_no or not subject_name:
                errors.append({"row": i + 1, "error": "Missing student_no or subject"})
                continue
            
            student = Student.objects.filter(school=school, student_no=student_no).first()
            if not student:
                errors.append({"row": i + 1, "error": f"Student not found: {student_no}"})
                continue
            
            subject = Subject.objects.filter(school=school, name=subject_name).first()
            if not subject:
                # Create subject if not exists
                subject = Subject.objects.create(school=school, name=subject_name)
            
            # Get scores
            test_score = float(row.get("test_score", 0) or 0)
            exam_score = float(row.get("exam_score", 0) or 0)
            total = test_score + exam_score
            
            # Create/update score
            score, created = SubjectScore.objects.update_or_create(
                school=school,
                student=student,
                subject=subject,
                session=session,
                term=term,
                defaults={
                    "test_score": test_score,
                    "exam_score": exam_score,
                    "total": total,
                }
            )
            
            ImportRow.objects.create(
                school=school,
                job=job,
                row_number=i + 1,
                data=row,
                status="success",
                entity_id=score.id,
                entity_type="SubjectScore"
            )
            success += 1
            
        except Exception as e:
            errors.append({"row": i + 1, "error": str(e)})
            ImportRow.objects.create(
                school=school,
                job=job,
                row_number=i + 1,
                data=row,
                status="failed",
                error_message=str(e)
            )
    
    return success, errors


@api_view(["GET"])
def import_job_detail(request, job_id):
    """Get import job details."""
    try:
        job = ImportJob.objects.get(id=job_id, school=request.tenant)
    except ImportJob.DoesNotExist:
        return Response({"error": "Job not found"}, status=404)
    
    rows = job.rows.all()[:50]
    
    return Response({
        "id": job.id,
        "import_type": job.import_type,
        "file_name": job.file_name,
        "status": job.status,
        "total_rows": job.total_rows,
        "success_rows": job.success_rows,
        "failed_rows": job.failed_rows,
        "errors": job.errors[:20],
        "rows": [{"row_number": r.row_number, "data": r.data, "status": r.status, "error": r.error_message} for r in rows]
    })


@api_view(["GET"])
def import_job_list(request):
    """List import jobs."""
    jobs = ImportJob.objects.filter(school=request.tenant).order_by("-created_at")[:20]
    
    return Response([
        {
            "id": j.id,
            "import_type": j.import_type,
            "file_name": j.file_name,
            "status": j.status,
            "total_rows": j.total_rows,
            "success_rows": j.success_rows,
            "failed_rows": j.failed_rows,
            "created_by": j.created_by,
            "created_at": j.created_at.isoformat()
        } for j in jobs
    ])


urlpatterns = [
    path("import/", import_data, name="import_data"),
    path("jobs/", import_job_list, name="import_job_list"),
    path("jobs/<int:job_id>/", import_job_detail, name="import_job_detail"),
]