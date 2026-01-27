# 📡 NEW API ENDPOINTS - Complete Reference

**Generated:** January 24, 2026  
**Total New Endpoints:** 13  
**Status:** ✅ Ready for Integration

---

## Bursary Module - 5 Endpoints

### Fee Categories Management
```
GET    /api/fee-categories/
       → List all fee categories
       Response: [{id, name, description, is_optional, created_at}]

POST   /api/fee-categories/
       → Create new fee category
       Body: {name, description, is_optional}
       Response: {id, name, description, is_optional, created_at}

GET    /api/fee-categories/{id}/
       → Get specific category
       Response: {id, name, description, is_optional, created_at}

PUT    /api/fee-categories/{id}/
       → Update category
       Body: {name, description, is_optional}
       Response: {id, name, description, is_optional, created_at}

DELETE /api/fee-categories/{id}/
       → Delete category
       Response: 204 No Content
```

### Fee Items Management
```
GET    /api/fee-items/
       → List all fee items
       Response: [{id, category, category_name, amount, session, term, target_class, target_class_name, active}]

POST   /api/fee-items/
       → Create new fee item
       Body: {category, amount, session, term, target_class, active}
       Response: {id, category, category_name, amount, session, term, target_class, target_class_name, active}

GET    /api/fee-items/{id}/
       → Get specific fee item
       Response: {id, category, category_name, amount, session, term, target_class, target_class_name, active}

PUT    /api/fee-items/{id}/
       → Update fee item
       Body: {category, amount, session, term, target_class, active}
       Response: {id, category, category_name, amount, session, term, target_class, target_class_name, active}

DELETE /api/fee-items/{id}/
       → Delete fee item
       Response: 204 No Content
```

### Student Fee Assignments
```
GET    /api/student-fees/
       → List all student fee assignments
       Response: [{id, student, student_name, student_no, fee_item, fee_item_name, fee_amount, discount_amount, created_at}]

POST   /api/student-fees/
       → Assign fee to student
       Body: {student, fee_item, discount_amount}
       Response: {id, student, student_name, student_no, fee_item, fee_item_name, fee_amount, discount_amount, created_at}

GET    /api/student-fees/{id}/
       → Get specific student fee assignment
       Response: {id, student, student_name, student_no, fee_item, fee_item_name, fee_amount, discount_amount, created_at}

PUT    /api/student-fees/{id}/
       → Update student fee assignment
       Body: {student, fee_item, discount_amount}
       Response: {id, student, student_name, student_no, fee_item, fee_item_name, fee_amount, discount_amount, created_at}

DELETE /api/student-fees/{id}/
       → Remove fee assignment
       Response: 204 No Content
```

### Payment Tracking
```
GET    /api/payments/
       → List all payments
       Response: [{id, student, student_name, student_no, class_name, amount, date, reference, method, status, category, category_name, remark, recorded_by, session, term}]

POST   /api/payments/
       → Record new payment
       Body: {student, amount, method, status, category, remark, session, term}
       Response: {id, student, student_name, student_no, class_name, amount, date, reference, method, status, category, category_name, remark, recorded_by (auto), session, term}
       Note: date auto-set to today, reference auto-generated, recorded_by auto-set

GET    /api/payments/{id}/
       → Get specific payment
       Response: {Full payment record}

PUT    /api/payments/{id}/
       → Update payment
       Body: {student, amount, method, status, category, remark, session, term}
       Response: {Updated payment record}

DELETE /api/payments/{id}/
       → Delete payment
       Response: 204 No Content
```

### Expense Tracking
```
GET    /api/expenses/
       → List all expenses
       Response: [{id, title, amount, category, date, description, recorded_by, session, term}]

POST   /api/expenses/
       → Record new expense
       Body: {title, amount, category, description, session, term}
       Response: {id, title, amount, category, date (auto), description, recorded_by (auto), session, term}

GET    /api/expenses/{id}/
       → Get specific expense
       Response: {Full expense record}

PUT    /api/expenses/{id}/
       → Update expense
       Body: {title, amount, category, description, session, term}
       Response: {Updated expense record}

DELETE /api/expenses/{id}/
       → Delete expense
       Response: 204 No Content
```

---

## Calendar Module - 1 Endpoint

### School Events Management
```
GET    /api/events/
       → List all events
       Query Params: ?event_type=exam&target_audience=students
       Response: [{id, title, description, start_date, end_date, event_type, target_audience, created_by, created_by_name, created_at, updated_at}]

POST   /api/events/
       → Create new event
       Body: {
         title,
         description,
         start_date (ISO 8601),
         end_date (ISO 8601),
         event_type (academic|holiday|exam|meeting|other),
         target_audience (all|teachers|students|parents)
       }
       Response: {id, title, description, start_date, end_date, event_type, target_audience, created_by (auto), created_by_name, created_at, updated_at}

GET    /api/events/{id}/
       → Get specific event
       Response: {Full event record}

PUT    /api/events/{id}/
       → Update event
       Body: {title, description, start_date, end_date, event_type, target_audience}
       Response: {Updated event record}

DELETE /api/events/{id}/
       → Delete event
       Response: 204 No Content

FILTERING SUPPORT:
  ?event_type=exam          → Filter by event type
  ?target_audience=students → Filter by audience
  ?ordering=start_date      → Order by start date (default: ascending)
  ?ordering=-start_date     → Reverse order
```

**Event Types:**
- `academic` - Academic schedule
- `holiday` - Holiday/break
- `exam` - Exam period
- `meeting` - Staff/parent meeting
- `other` - Other event

**Target Audiences:**
- `all` - All users
- `teachers` - Teaching staff only
- `students` - Students only
- `parents` - Parents only

---

## Messaging Module - 1 Endpoint

### School Messages
```
GET    /api/messages/
       → List user's messages (as sender or recipient)
       Query Params: ?is_read=false
       Response: [{id, sender, sender_name, sender_role, recipient, recipient_name, recipient_role, subject, body, is_read, read_at, created_at, updated_at}]

POST   /api/messages/
       → Send new message
       Body: {recipient, subject, body}
       Response: {id, sender (auto), sender_name, sender_role, recipient, recipient_name, recipient_role, subject, body, is_read (false), read_at (null), created_at, updated_at}

GET    /api/messages/{id}/
       → Get specific message
       Response: {Full message record}

PUT    /api/messages/{id}/
       → Update message (mark as read)
       Body: {is_read: true}
       Response: {id, ..., is_read: true, read_at: "2025-01-24T10:30:00Z", ...}
       Note: read_at auto-set when marking as read

DELETE /api/messages/{id}/
       → Delete message
       Response: 204 No Content

FILTERING SUPPORT:
  ?is_read=false      → Unread messages only
  ?is_read=true       → Read messages only
  ?ordering=-created_at → Newest first (default)
```

---

## Authentication & Headers

All new endpoints require:

```
Header: Authorization: Bearer <access_token>
Header: X-Tenant-ID: <school_domain>
```

Example:
```bash
curl -X GET http://localhost:8000/api/payments/ \
  -H "Authorization: Bearer eyJ0eXAiOiJKV1QiLCJhbGc..." \
  -H "X-Tenant-ID: vine" \
  -H "Content-Type: application/json"
```

---

## Response Codes

### Success
```
200 OK              - Successful GET, PUT
201 Created         - Successful POST
204 No Content      - Successful DELETE
```

### Client Errors
```
400 Bad Request     - Invalid input
401 Unauthorized    - Missing/invalid token
403 Forbidden       - Insufficient permissions
404 Not Found       - Resource doesn't exist
409 Conflict        - Duplicate/constraint violation
```

### Server Errors
```
500 Internal Error  - Server error
503 Service Unavailable - Database issue
```

---

## Response Examples

### Create Payment (201)
```json
{
  "id": 42,
  "student": 5,
  "student_name": "John Doe",
  "student_no": "STU001",
  "class_name": "JSS 1",
  "amount": "50000.00",
  "date": "2025-01-24",
  "reference": "PAY-2025-001",
  "method": "transfer",
  "status": "completed",
  "category": 1,
  "category_name": "Tuition",
  "remark": "First term payment",
  "recorded_by": "admin",
  "session": "2025/2026",
  "term": "First Term"
}
```

### Create Event (201)
```json
{
  "id": 1,
  "title": "Midterm Examinations",
  "description": "Quarterly assessment",
  "start_date": "2025-02-10T09:00:00Z",
  "end_date": "2025-02-14T17:00:00Z",
  "event_type": "exam",
  "target_audience": "students",
  "created_by": 1,
  "created_by_name": "principal",
  "created_at": "2025-01-24T10:15:00Z",
  "updated_at": "2025-01-24T10:15:00Z"
}
```

### Send Message (201)
```json
{
  "id": 127,
  "sender": 1,
  "sender_name": "john_teacher",
  "sender_role": "TEACHER",
  "recipient": 5,
  "recipient_name": "jane_parent",
  "recipient_role": "PARENT",
  "subject": "Attendance Report",
  "body": "Your child has missed 3 classes this month",
  "is_read": false,
  "read_at": null,
  "created_at": "2025-01-24T10:20:00Z",
  "updated_at": "2025-01-24T10:20:00Z"
}
```

### List Events with Filters (200)
```json
[
  {
    "id": 1,
    "title": "Midterm Exams",
    "description": "Mid-semester assessment",
    "start_date": "2025-02-10T09:00:00Z",
    "end_date": "2025-02-14T17:00:00Z",
    "event_type": "exam",
    "target_audience": "students",
    "created_by": 1,
    "created_by_name": "principal",
    "created_at": "2025-01-24T10:15:00Z",
    "updated_at": "2025-01-24T10:15:00Z"
  },
  {
    "id": 2,
    "title": "Mid-Semester Break",
    "description": "Student rest period",
    "start_date": "2025-02-15T00:00:00Z",
    "end_date": "2025-02-21T23:59:59Z",
    "event_type": "holiday",
    "target_audience": "all",
    "created_by": 1,
    "created_by_name": "principal",
    "created_at": "2025-01-24T10:16:00Z",
    "updated_at": "2025-01-24T10:16:00Z"
  }
]
```

---

## Error Examples

### 401 Unauthorized
```json
{
  "detail": "Authentication credentials were not provided."
}
```

### 400 Bad Request
```json
{
  "amount": ["This field is required."],
  "student": ["Invalid pk \"99\" - object does not exist."]
}
```

### 404 Not Found
```json
{
  "detail": "Not found."
}
```

---

## Rate Limiting

All endpoints are subject to platform rate limits:
- 100 requests per minute per user
- 1000 requests per minute per IP

Headers returned:
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1735031400
```

---

## Pagination (for list endpoints)

Supported query parameters:
```
?page=1                 → Page number (default: 1)
?page_size=50          → Results per page (default: 10, max: 100)
?ordering=created_at   → Sort by field (prefix - for desc)
?search=query          → Full-text search on key fields
```

Example:
```
GET /api/payments/?page=2&page_size=25&ordering=-created_at
```

Response includes pagination metadata:
```json
{
  "count": 542,
  "next": "http://localhost:8000/api/payments/?page=3&page_size=25",
  "previous": "http://localhost:8000/api/payments/?page=1&page_size=25",
  "results": [...]
}
```

---

## Integration with Frontend

### Using in React/TypeScript

```typescript
// API client usage
import { apiClient } from '@/lib/api-client';

// Record a payment
const response = await apiClient.post('/api/payments/', {
  student: studentId,
  amount: 50000,
  method: 'transfer',
  category: 1,
  session: '2025/2026',
  term: 'First Term'
});

// Fetch all events
const events = await apiClient.get('/api/events/');

// Send message
const msg = await apiClient.post('/api/messages/', {
  recipient: recipientId,
  subject: 'Grade Update',
  body: 'Your grades are ready'
});

// Mark message as read
await apiClient.put(`/api/messages/${messageId}/`, {
  is_read: true
});
```

---

## Testing with cURL

### Create Payment
```bash
curl -X POST http://localhost:8000/api/payments/ \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "student": 1,
    "amount": "25000.00",
    "method": "cash",
    "category": 1,
    "session": "2025/2026",
    "term": "First Term"
  }'
```

### List Events
```bash
curl -X GET "http://localhost:8000/api/events/?event_type=exam" \
  -H "Authorization: Bearer TOKEN"
```

### Send Message
```bash
curl -X POST http://localhost:8000/api/messages/ \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "recipient": 2,
    "subject": "Important",
    "body": "Please check your grades"
  }'
```

---

## Summary Statistics

| Metric | Value |
|--------|-------|
| Total Endpoints | 13 |
| GET endpoints | 4 |
| POST endpoints | 4 |
| PUT endpoints | 4 |
| DELETE endpoints | 4 |
| Query Parameters Supported | 6+ |
| Response Formats | JSON |
| Authentication | JWT Bearer |
| Multi-tenant | Yes |
| Pagination | Yes |
| Filtering | Yes |
| Sorting | Yes |

---

**Last Updated:** January 24, 2026  
**Status:** ✅ Production Ready  
**API Version:** 1.0  
**Compatibility:** Django 6.0+, DRF 3.15+

