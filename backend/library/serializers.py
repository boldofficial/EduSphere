from rest_framework import serializers
from library.models import (
    Book, BookCategory, BorrowRecord, Reservation,
    LibraryMember, LibrarySettings
)
from academic.serializers import StudentSerializer, TeacherSerializer


class BookCategorySerializer(serializers.ModelSerializer):
    books_count = serializers.SerializerMethodField()
    
    class Meta:
        model = BookCategory
        fields = ["id", "name", "description", "parent", "books_count"]
    
    def get_books_count(self, obj):
        return obj.books.count() if hasattr(obj, 'books') else 0


class BookListSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source="category.name", read_only=True)
    available_copies = serializers.IntegerField(read_only=True)
    
    class Meta:
        model = Book
        fields = [
            "id", "isbn", "title", "author", "publisher", "year_published", "edition",
            "category", "category_name", "shelf_location", "copy_number", "status",
            "total_copies", "available_copies", "description", "cover_image"
        ]


class BookDetailSerializer(BookListSerializer):
    borrow_records = serializers.SerializerMethodField()
    reservations_count = serializers.SerializerMethodField()
    
    class Meta(BookListSerializer.Meta):
        fields = BookListSerializer.Meta.fields + ["borrow_records", "reservations_count", "created_at"]
    
    def get_borrow_records(self, obj):
        recent = obj.borrow_records.filter(status="borrowed")[:3]
        return [{"student": r.student.names, "due_date": str(r.due_date)} for r in recent]
    
    def get_reservations_count(self, obj):
        return obj.reservations.filter(status="pending").count()


class BorrowRecordSerializer(serializers.ModelSerializer):
    book_title = serializers.CharField(source="book.title", read_only=True)
    student_name = serializers.CharField(source="student.names", read_only=True)
    issued_by_name = serializers.CharField(source="issued_by.name", read_only=True)
    
    class Meta:
        model = BorrowRecord
        fields = [
            "id", "book", "book_title", "student", "student_name",
            "borrow_date", "due_date", "return_date", "status",
            "fine_amount", "fine_paid", "notes", "issued_by", "issued_by_name"
        ]


class BorrowRecordDetailSerializer(BorrowRecordSerializer):
    class Meta(BorrowRecordSerializer.Meta):
        fields = BorrowRecordSerializer.Meta.fields + ["created_at"]


class ReservationSerializer(serializers.ModelSerializer):
    book_title = serializers.CharField(source="book.title", read_only=True)
    student_name = serializers.CharField(source="student.names", read_only=True)
    
    class Meta:
        model = Reservation
        fields = [
            "id", "book", "book_title", "student", "student_name",
            "reserved_at", "expired_at", "fulfilled_at", "status"
        ]


class LibraryMemberSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(source="student.names", read_only=True)
    current_borrows = serializers.SerializerMethodField()
    
    class Meta:
        model = LibraryMember
        fields = [
            "id", "student", "student_name", "member_since", "membership_type",
            "max_borrows", "max_renewals", "is_active", "blocked_until", "current_borrows"
        ]
    
    def get_current_borrows(self, obj):
        return BorrowRecord.objects.filter(
            student=obj.student,
            status__in=["borrowed", "overdue"]
        ).count()


class LibrarySettingsSerializer(serializers.ModelSerializer):
    librarian_name = serializers.CharField(source="librarian.name", read_only=True)
    
    class Meta:
        model = LibrarySettings
        fields = [
            "id", "max_borrow_days", "max_borrows_per_student", "allow_renewal",
            "max_renewals", "daily_fine", "late_fine_applies_after_days",
            "opening_time", "closing_time", "working_days", "librarian", "librarian_name"
        ]


class BorrowRecordCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = BorrowRecord
        fields = ["book", "student", "due_date"]
    
    def validate(self, data):
        book = data["book"]
        student = data["student"]
        
        if book.available_copies <= 0:
            raise serializers.ValidationError("No copies available")
        
        # Check if student has reached borrow limit
        member = LibraryMember.objects.filter(student=student).first()
        if member:
            current_borrows = BorrowRecord.objects.filter(
                student=student, status__in=["borrowed", "overdue"]
            ).count()
            if current_borrows >= member.max_borrows:
                raise serializers.ValidationError("Student has reached borrow limit")
        
        return data


# Alias for backward compatibility
BorrowCreateSerializer = BorrowRecordCreateSerializer


class ReturnBookSerializer(serializers.Serializer):
    record_id = serializers.IntegerField()
    condition = serializers.CharField(required=False, default="Good")
    fine_amount = serializers.DecimalField(max_digits=10, decimal_places=2, required=False, default=0)
    
    def validate_record_id(self, value):
        if not BorrowRecord.objects.filter(id=value).exists():
            raise serializers.ValidationError("Borrow record not found")
        return value