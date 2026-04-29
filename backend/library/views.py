from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import serializers

from academic.views.base import TenantViewSet
from library.models import (
    Book, BookCategory, BorrowRecord, Reservation,
    LibraryMember, LibrarySettings
)
from library.serializers import (
    BookCategorySerializer, BookListSerializer, BookDetailSerializer,
    BorrowRecordSerializer, BorrowRecordDetailSerializer, BorrowRecordCreateSerializer,
    ReservationSerializer, LibraryMemberSerializer, LibrarySettingsSerializer,
    ReturnBookSerializer
)


class BookCategoryViewSet(TenantViewSet):
    queryset = BookCategory.objects.order_by('name').all()
    serializer_class = BookCategorySerializer
    
    def get_queryset(self):
        qs = super().get_queryset()
        parent_id = self.request.query_params.get("parent")
        if parent_id:
            qs = qs.filter(parent_id=parent_id)
        return qs


class BookViewSet(TenantViewSet):
    queryset = Book.objects.order_by('title').all()
    serializer_class = BookListSerializer
    
    def get_serializer_class(self):
        if self.action == "retrieve":
            return BookDetailSerializer
        if self.action in ["create", "update", "partial_update"]:
            return BookListSerializer
        return BookListSerializer
    
    def get_queryset(self):
        qs = super().get_queryset()
        category_id = self.request.query_params.get("category")
        status_filter = self.request.query_params.get("status")
        search = self.request.query_params.get("search")
        
        if category_id:
            qs = qs.filter(category_id=category_id)
        if status_filter:
            qs = qs.filter(status=status_filter)
        if search:
            qs = qs.filter(
                models.Q(title__icontains=search) |
                models.Q(author__icontains=search) |
                models.Q(isbn__icontains=search)
            )
        
        return qs


class BorrowRecordViewSet(TenantViewSet):
    queryset = BorrowRecord.objects.all()
    serializer_class = BorrowRecordSerializer
    
    def get_serializer_class(self):
        if self.action == "create":
            return BorrowRecordCreateSerializer
        if self.action == "retrieve":
            return BorrowRecordDetailSerializer
        return BorrowRecordSerializer
    
    def get_queryset(self):
        qs = super().get_queryset()
        student_id = self.request.query_params.get("student")
        book_id = self.request.query_params.get("book")
        status_filter = self.request.query_params.get("status")
        
        if student_id:
            qs = qs.filter(student_id=student_id)
        if book_id:
            qs = qs.filter(book_id=book_id)
        if status_filter:
            qs = qs.filter(status=status_filter)
        
        return qs.select_related("student", "book", "issued_by")
    
    @action(detail=False, methods=["post"])
    def borrow(self, request):
        """Borrow a book."""
        serializer = BorrowRecordCreateSerializer(data=request.data, context={"request": request})
        serializer.is_valid(raise_exception=True)
        
        book = serializer.validated_data["book"]
        student = serializer.validated_data["student"]
        
        # Create borrow record
        record = serializer.save(
            borrow_date=serializer.validated_data.get("borrow_date", date.today()),
            status="borrowed",
            issued_by=self.get_issued_by_user(request)
        )
        
        # Update book availability
        book.available_copies = max(0, book.available_copies - 1)
        if book.available_copies == 0:
            book.status = "borrowed"
        book.save()
        
        # Create library member if not exists
        if not LibraryMember.objects.filter(student=student).exists():
            LibraryMember.objects.create(
                school=record.school,
                student=student
            )
        
        return Response(BorrowRecordSerializer(record).data, status=status.HTTP_201_CREATED)
    
    @action(detail=False, methods=["post"])
    def return_book(self, request):
        """Return a borrowed book."""
        from datetime import date
        
        serializer = ReturnBookSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        record_id = serializer.validated_data["record_id"]
        condition = serializer.validated_data.get("condition", "Good")
        fine = serializer.validated_data.get("fine_amount", 0)
        
        record = BorrowRecord.objects.get(id=record_id)
        
        if record.status == "returned":
            return Response({"error": "Book already returned"}, status=400)
        
        record.return_date = date.today()
        record.status = "returned"
        
        if fine > 0:
            record.fine_amount = fine
            record.fine_paid = False
        
        record.condition_at_return = condition
        record.save()
        
        # Update book
        book = record.book
        book.available_copies += 1
        if book.status == "borrowed" and book.available_copies > 0:
            book.status = "available"
        book.save()
        
        return Response(BorrowRecordSerializer(record).data)
    
    @action(detail=False, methods=["get"])
    def overdue(self, request):
        """Get overdue books."""
        from django.utils import timezone
        today = timezone.now().date()
        
        qs = self.get_queryset().filter(
            status__in=["borrowed", "overdue"],
            due_date__lt=today
        )
        
        # Mark as overdue
        for r in qs:
            if r.status != "overdue":
                r.status = "overdue"
                r.save()
        
        return Response(BorrowRecordSerializer(qs, many=True).data)
    
    def get_issued_by_user(self, request):
        from academic.models import Teacher
        try:
            return Teacher.objects.get(user=request.user)
        except Teacher.DoesNotExist:
            return None


class ReservationViewSet(TenantViewSet):
    queryset = Reservation.objects.all()
    serializer_class = ReservationSerializer
    
    def get_queryset(self):
        qs = super().get_queryset()
        book_id = self.request.query_params.get("book")
        student_id = self.request.query_params.get("student")
        status_filter = self.request.query_params.get("status")
        
        if book_id:
            qs = qs.filter(book_id=book_id)
        if student_id:
            qs = qs.filter(student_id=student_id)
        if status_filter:
            qs = qs.filter(status=status_filter)
        
        return qs.select_related("book", "student")
    
    @action(detail=True, methods=["post"])
    def fulfill(self, request, pk=None):
        """Fulfill a reservation by creating a borrow record."""
        reservation = self.get_object()
        
        if reservation.status != "pending":
            return Response({"error": "Reservation is not pending"}, status=400)
        
        # Create borrow record
        from datetime import date, timedelta
        from django.utils import timezone
        
        # Get borrow days from settings
        borrow_days = 14
        settings = LibrarySettings.objects.filter(school=reservation.school).first()
        if settings:
            borrow_days = settings.max_borrow_days
        
        BorrowRecord.objects.create(
            school=reservation.school,
            book=reservation.book,
            student=reservation.student,
            borrow_date=date.today(),
            due_date=date.today() + timedelta(days=borrow_days),
            status="borrowed"
        )
        
        reservation.status = "fulfilled"
        reservation.fulfilled_at = timezone.now()
        reservation.save()
        
        # Update book
        book = reservation.book
        book.available_copies = max(0, book.available_copies - 1)
        book.save()
        
        return Response({"status": "fulfilled"})


class LibraryMemberViewSet(TenantViewSet):
    queryset = LibraryMember.objects.all()
    serializer_class = LibraryMemberSerializer
    
    def get_queryset(self):
        qs = super().get_queryset()
        is_active = self.request.query_params.get("is_active")
        
        if is_active is not None:
            qs = qs.filter(is_active=is_active.lower() == "true")
        
        return qs.select_related("student")
    
    def perform_create(self, serializer):
        serializer.save(school=self.request.tenant)


class LibrarySettingsViewSet(TenantViewSet):
    queryset = LibrarySettings.objects.all()
    serializer_class = LibrarySettingsSerializer
    
    def get_queryset(self):
        return super().get_queryset()
    
    def get_object(self):
        obj, _ = LibrarySettings.objects.get_or_create(school=self.request.tenant)
        return obj
    
    def list(self, request, *args, **kwargs):
        return self.retrieve(request, *args, **kwargs)