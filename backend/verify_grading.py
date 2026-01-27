import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from academic.models import ReportCard, SubjectScore, Student

def verify_scores():
    student = Student.objects.filter(student_no='002').first()
    if not student:
        print("Student 002 not found")
        return

    print(f"Checking scores for {student.names} ({student.student_no})")
    reports = ReportCard.objects.filter(student=student)
    print(f"Found {reports.count()} report cards")

    for report in reports:
        print(f"Report: Session={report.session}, Term={report.term}, Avg={report.average}")
        scores = SubjectScore.objects.filter(report_card=report)
        print(f"  Found {scores.count()} subject scores")
        for score in scores:
            print(f"    Subject={score.subject.name}: HW={score.ca1}, CAT={score.ca2}, Exam={score.exam}, Total={score.total}")

if __name__ == "__main__":
    verify_scores()
