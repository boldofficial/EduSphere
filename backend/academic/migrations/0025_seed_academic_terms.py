from django.db import migrations
import datetime

def seed_academic_terms(apps, schema_editor):
    School = apps.get_model('schools', 'School')
    AcademicTerm = apps.get_model('academic', 'AcademicTerm')
    
    for school in School.objects.all():
        # Get current session/term from settings if available
        # Note: Accessing settings JSON field from School model
        settings = getattr(school, 'settings', None)
        if not settings:
            continue
            
        current_session = getattr(settings, 'current_session', '2025/2026')
        current_term = getattr(settings, 'current_term', 'Second Term')
        
        # Avoid duplicates
        if not AcademicTerm.objects.filter(school=school, session=current_session, name=current_term).exists():
            # Estimate dates based on term names
            start_date = datetime.date(2025, 9, 10) # Fallback First Term
            end_date = datetime.date(2025, 12, 15)
            
            if 'Second' in current_term:
                start_date = datetime.date(2026, 1, 5)
                end_date = datetime.date(2026, 4, 10)
            elif 'Third' in current_term:
                start_date = datetime.date(2026, 5, 2)
                end_date = datetime.date(2026, 8, 5)
                
            AcademicTerm.objects.create(
                school=school,
                session=current_session,
                name=current_term,
                start_date=start_date,
                end_date=end_date,
                is_current=True
            )

def reverse_seed(apps, schema_editor):
    pass

class Migration(migrations.Migration):

    dependencies = [
        ('academic', '0024_academicterm'),
        ('schools', '0001_initial'), # School model dependency
    ]

    operations = [
        migrations.RunPython(seed_academic_terms, reverse_seed),
    ]
