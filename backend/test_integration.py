"""
Integration Tests for New Backend Endpoints

Tests for:
- Bursary Module (Payments, Fees, Expenses)
- Calendar Module (School Events)
- Messaging Module (School Messages)
"""

import pytest
from django.test import TestCase, Client
from django.contrib.auth import get_user_model
from django.utils import timezone
from rest_framework.test import APIClient, APITestCase
from rest_framework import status
from datetime import timedelta

from schools.models import School
from users.models import User
from bursary.models import FeeCategory, FeeItem, Payment, Expense, StudentFee
from academic.models import Student, Class, Teacher, Subject, SchoolEvent
from core.models import SchoolMessage

User = get_user_model()


class BursaryIntegrationTests(APITestCase):
    """Test suite for bursary module endpoints"""
    
    def setUp(self):
        """Set up test data"""
        # Create school
        self.school = School.objects.create(
            name='Test School',
            domain='test-school.local',
            address='123 Main St'
        )
        
        # Create users
        self.admin_user = User.objects.create_user(
            username='admin@test.school',
            email='admin@test.school',
            password='testpass123',
            school=self.school,
            is_staff=True
        )
        
        self.teacher_user = User.objects.create_user(
            username='teacher@test.school',
            email='teacher@test.school',
            password='testpass123',
            school=self.school
        )
        
        self.student_user = User.objects.create_user(
            username='student@test.school',
            email='student@test.school',
            password='testpass123',
            school=self.school
        )
        
        # Create academic structure
        self.class_obj = Class.objects.create(
            name='JSS 1',
            school=self.school
        )
        
        self.student = Student.objects.create(
            user=self.student_user,
            current_class=self.class_obj,
            school=self.school,
            registration_number='STU001'
        )
        
        # Create bursary data
        self.fee_category = FeeCategory.objects.create(
            name='Tuition',
            school=self.school
        )
        
        self.fee_item = FeeItem.objects.create(
            name='JSS 1 Tuition',
            category=self.fee_category,
            amount=50000.00,
            target_class=self.class_obj,
            school=self.school
        )
        
        self.client = APIClient()
    
    def test_fee_category_list(self):
        """Test retrieving fee categories"""
        self.client.force_authenticate(user=self.admin_user)
        response = self.client.get('/api/fee-categories/')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['count'], 1)
        self.assertEqual(response.data['results'][0]['name'], 'Tuition')
    
    def test_create_fee_category(self):
        """Test creating a new fee category"""
        self.client.force_authenticate(user=self.admin_user)
        data = {
            'name': 'Exam Fees',
            'description': 'Examination fees'
        }
        response = self.client.post('/api/fee-categories/', data)
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(FeeCategory.objects.count(), 2)
    
    def test_create_payment_auto_recorded_by(self):
        """Test that recorded_by is auto-populated"""
        self.client.force_authenticate(user=self.admin_user)
        
        # Create student fee first
        student_fee = StudentFee.objects.create(
            student=self.student,
            fee_item=self.fee_item,
            amount_due=50000.00,
            school=self.school
        )
        
        data = {
            'student': self.student.id,
            'amount': 50000.00,
            'payment_method': 'bank_transfer',
            'reference': 'BANK001'
        }
        response = self.client.post('/api/payments/', data)
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        payment = Payment.objects.last()
        self.assertEqual(payment.recorded_by, self.admin_user.username)
    
    def test_fee_pagination(self):
        """Test pagination on fee list"""
        self.client.force_authenticate(user=self.admin_user)
        
        # Create multiple fees
        for i in range(60):
            FeeCategory.objects.create(
                name=f'Category {i}',
                school=self.school
            )
        
        response = self.client.get('/api/fee-categories/')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 50)  # Default page size
        self.assertIsNotNone(response.data['next'])
    
    def test_multi_tenant_isolation(self):
        """Test that users only see their school's data"""
        # Create another school and user
        other_school = School.objects.create(
            name='Other School',
            domain='other-school.local'
        )
        
        other_user = User.objects.create_user(
            username='admin@other.school',
            email='admin@other.school',
            password='testpass123',
            school=other_school,
            is_staff=True
        )
        
        # Admin from first school should see only first school's data
        self.client.force_authenticate(user=self.admin_user)
        response = self.client.get('/api/fee-categories/')
        
        self.assertEqual(response.data['count'], 1)
        
        # Admin from other school should see no data
        self.client.force_authenticate(user=other_user)
        response = self.client.get('/api/fee-categories/')
        
        self.assertEqual(response.data['count'], 0)


class CalendarIntegrationTests(APITestCase):
    """Test suite for calendar module endpoints"""
    
    def setUp(self):
        """Set up test data"""
        self.school = School.objects.create(
            name='Test School',
            domain='test-school.local'
        )
        
        self.user = User.objects.create_user(
            username='teacher@test.school',
            email='teacher@test.school',
            password='testpass123',
            school=self.school
        )
        
        self.client = APIClient()
    
    def test_create_school_event(self):
        """Test creating a school event"""
        self.client.force_authenticate(user=self.user)
        
        data = {
            'title': 'Mid-term Break',
            'description': 'One week break',
            'start_date': timezone.now().date(),
            'end_date': (timezone.now() + timedelta(days=7)).date(),
            'event_type': 'holiday',
            'target_audience': 'all'
        }
        
        response = self.client.post('/api/events/', data)
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['created_by']['username'], self.user.username)
    
    def test_list_events_by_type(self):
        """Test filtering events by type"""
        self.client.force_authenticate(user=self.user)
        
        # Create events
        SchoolEvent.objects.create(
            title='Exam',
            event_type='exam',
            target_audience='students',
            start_date=timezone.now().date(),
            created_by=self.user,
            school=self.school
        )
        
        SchoolEvent.objects.create(
            title='Holiday',
            event_type='holiday',
            target_audience='all',
            start_date=timezone.now().date(),
            created_by=self.user,
            school=self.school
        )
        
        # Filter by exam type
        response = self.client.get('/api/events/?event_type=exam')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['count'], 1)
        self.assertEqual(response.data['results'][0]['event_type'], 'exam')


class MessagingIntegrationTests(APITestCase):
    """Test suite for messaging module endpoints"""
    
    def setUp(self):
        """Set up test data"""
        self.school = School.objects.create(
            name='Test School',
            domain='test-school.local'
        )
        
        self.sender = User.objects.create_user(
            username='sender@test.school',
            email='sender@test.school',
            password='testpass123',
            school=self.school
        )
        
        self.recipient = User.objects.create_user(
            username='recipient@test.school',
            email='recipient@test.school',
            password='testpass123',
            school=self.school
        )
        
        self.client = APIClient()
    
    def test_send_message(self):
        """Test sending a message"""
        self.client.force_authenticate(user=self.sender)
        
        data = {
            'recipient': self.recipient.id,
            'subject': 'Test Message',
            'body': 'This is a test message'
        }
        
        response = self.client.post('/api/messages/', data)
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['sender']['username'], self.sender.username)
        self.assertEqual(response.data['is_read'], False)
    
    def test_recipient_only_sees_own_messages(self):
        """Test that users only see messages sent to them"""
        # Create messages
        SchoolMessage.objects.create(
            sender=self.sender,
            recipient=self.recipient,
            subject='Test',
            body='Message for recipient',
            school=self.school
        )
        
        # Other user sends message to sender
        other_user = User.objects.create_user(
            username='other@test.school',
            email='other@test.school',
            password='testpass123',
            school=self.school
        )
        
        SchoolMessage.objects.create(
            sender=other_user,
            recipient=self.sender,
            subject='Test 2',
            body='Message for sender',
            school=self.school
        )
        
        # Recipient should see 1 message sent to them
        self.client.force_authenticate(user=self.recipient)
        response = self.client.get('/api/messages/')
        
        self.assertEqual(response.data['count'], 1)
        self.assertEqual(response.data['results'][0]['subject'], 'Test')
    
    def test_mark_message_as_read(self):
        """Test marking a message as read"""
        message = SchoolMessage.objects.create(
            sender=self.sender,
            recipient=self.recipient,
            subject='Unread',
            body='Message body',
            school=self.school
        )
        
        self.client.force_authenticate(user=self.recipient)
        response = self.client.put(
            f'/api/messages/{message.id}/',
            {'is_read': True}
        )
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data['is_read'])
        self.assertIsNotNone(response.data['read_at'])
    
    def test_message_pagination(self):
        """Test pagination on messages"""
        self.client.force_authenticate(user=self.sender)
        
        # Create 60 messages
        for i in range(60):
            SchoolMessage.objects.create(
                sender=self.sender,
                recipient=self.recipient,
                subject=f'Message {i}',
                body=f'Body {i}',
                school=self.school
            )
        
        response = self.client.get('/api/messages/')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 50)
        self.assertIsNotNone(response.data['next'])


class PermissionIntegrationTests(APITestCase):
    """Test permission and authorization"""
    
    def setUp(self):
        """Set up test data"""
        self.school = School.objects.create(
            name='Test School',
            domain='test-school.local'
        )
        
        self.user = User.objects.create_user(
            username='user@test.school',
            email='user@test.school',
            password='testpass123',
            school=self.school
        )
        
        self.client = APIClient()
    
    def test_unauthenticated_access_denied(self):
        """Test that unauthenticated users can't access endpoints"""
        response = self.client.get('/api/fee-categories/')
        
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
    
    def test_authenticated_access_allowed(self):
        """Test that authenticated users can access endpoints"""
        self.client.force_authenticate(user=self.user)
        response = self.client.get('/api/fee-categories/')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)


class PerformanceIntegrationTests(APITestCase):
    """Test performance characteristics"""
    
    def setUp(self):
        """Set up test data"""
        self.school = School.objects.create(
            name='Test School',
            domain='test-school.local'
        )
        
        self.user = User.objects.create_user(
            username='user@test.school',
            email='user@test.school',
            password='testpass123',
            school=self.school
        )
        
        self.client = APIClient()
    
    def test_list_endpoint_returns_quickly(self):
        """Test that list endpoints respond within acceptable time"""
        self.client.force_authenticate(user=self.user)
        
        import time
        start = time.time()
        response = self.client.get('/api/fee-categories/')
        duration = time.time() - start
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # Should complete within 500ms
        self.assertLess(duration, 0.5)


if __name__ == '__main__':
    pytest.main([__file__])
