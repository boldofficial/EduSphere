import os
import django
from django.utils import timezone

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from schools.models import DemoRequest

def seed_demo_requests():
    test_requests = [
        {
            'name': 'Dr. Sarah James',
            'email': 'sarah.j@example.com',
            'school_name': 'Greenwood International School',
            'phone': '08012345678',
            'role': 'School Owner / Director',
            'status': 'pending'
        },
        {
            'name': 'Mr. Festus Adebayo',
            'email': 'festus.a@example.com',
            'school_name': 'Valley View Academy',
            'phone': '07098765432',
            'role': 'IT Administrator',
            'status': 'pending'
        },
        {
            'name': 'Mrs. Chidi Okafor',
            'email': 'chidi@demo.com',
            'school_name': 'Heritage Heights',
            'role': 'School Admin / Principal',
            'status': 'approved'
        }
    ]

    for data in test_requests:
        req, created = DemoRequest.objects.get_or_create(
            email=data['email'],
            defaults=data
        )
        if created:
            print(f"Created demo request for {data['name']}")
        else:
            print(f"Demo request for {data['email']} already exists")

if __name__ == '__main__':
    seed_demo_requests()
