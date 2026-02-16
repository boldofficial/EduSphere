import csv
import io
from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from django.http import HttpResponse
from .serializers import StudentSerializer
from django.db import transaction

class AcademicDataMigrationViewSet(viewsets.ViewSet):
    """
    ViewSet for handling data migration tasks:
    1. Downloading CSV templates
    2. Bulk importing students
    """
    permission_classes = [permissions.IsAuthenticated]

    @action(detail=False, methods=['get'], url_path='student-template')
    def download_student_template(self, request):
        """
        Generate and download the CSV template for bulk student import.
        """
        response = HttpResponse(content_type='text/csv')
        response['Content-Disposition'] = 'attachment; filename="student_import_template.csv"'

        writer = csv.writer(response)
        # Headers matching StudentSerializer expectations (mostly)
        headers = [
            'student_no', 'names', 'gender', 'date_of_birth', 
            'class_name', 'parent_name', 'parent_email', 
            'parent_phone', 'address', 'password'
        ]
        writer.writerow(headers)
        
        # Add a sample row to guide the user
        writer.writerow([
            'ST2024001', 'John Doe', 'Male', '2010-05-15', 
            'JSS 1', 'Mr. Doe', 'parent@example.com', 
            '08012345678', '123 Main St, Lagos', 'securepass123'
        ])

        return response

    @action(detail=False, methods=['post'], url_path='import-students')
    def import_students(self, request):
        """
        Bulk import students from a CSV file.
        """
        file_obj = request.FILES.get('file')
        if not file_obj:
            return Response({"error": "No file provided."}, status=status.HTTP_400_BAD_REQUEST)

        if not file_obj.name.endswith('.csv'):
            return Response({"error": "File must be a CSV."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            # Read CSV file
            decoded_file = file_obj.read().decode('utf-8-sig').splitlines()
            reader = csv.DictReader(decoded_file)
            
            results = {
                "success_count": 0,
                "error_count": 0,
                "errors": []
            }
            
            from .models import Class
            # Cache classes for faster lookup: { "jss 1": <Class Obj>, "jss1": <Class Obj> }
            # We normalize keys to lowercase for fuzzy matching
            school = request.user.school
            classes = Class.objects.filter(school=school)
            class_map = {c.name.lower().strip(): c for c in classes}

            with transaction.atomic():
                for index, row in enumerate(reader, start=2): # Start at 2 for Excel row number (1-index + header)
                    try:
                        # 1. Resolve Class
                        class_name = row.get('class_name', '').strip()
                        class_obj = class_map.get(class_name.lower())
                        
                        if not class_obj and class_name:
                            # Try simple variations if strict match fails (optional, keep strict for now)
                            pass

                        # 2. Prepare Data for Serializer
                        student_data = {
                            "school": school.id, # Serializer might need this in context or data
                            "student_no": row.get('student_no'),
                            "names": row.get('names'),
                            "gender": row.get('gender'),
                            "dob": row.get('date_of_birth'), # Serializer expects YYYY-MM-DD
                            "parent_name": row.get('parent_name'),
                            "parent_email": row.get('parent_email'),
                            "parent_phone": row.get('parent_phone'),
                            "address": row.get('address'),
                            "password": row.get('password'),
                            # Pass ID if found, otherwise let serializer handle validation error for missing class
                            "class_id": class_obj.id if class_obj else None 
                        }

                        # 3. Validate & Save
                        # We pass 'school' in context for validation if needed
                        serializer = StudentSerializer(data=student_data, context={'request': request})
                        
                        if serializer.is_valid():
                            serializer.save(school=school) # Force school assignment
                            results["success_count"] += 1
                        else:
                            results["error_count"] += 1
                            # Format errors nicely
                            error_msgs = []
                            for field, errors in serializer.errors.items():
                                error_msgs.append(f"{field}: {', '.join(errors)}")
                            results["errors"].append({
                                "row": index,
                                "student": row.get('names', 'Unknown'),
                                "reason": "; ".join(error_msgs)
                            })

                    except Exception as e:
                        results["error_count"] += 1
                        results["errors"].append({
                            "row": index,
                            "student": row.get('names', 'Unknown'),
                            "reason": str(e)
                        })

            return Response(results, status=status.HTTP_200_OK)

        except Exception as e:
            return Response({"error": f"Failed to process file: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @action(detail=False, methods=['get'], url_path='export-students')
    def export_students(self, request):
        """
        Export all students for the current tenant to CSV.
        """
        response = HttpResponse(content_type='text/csv')
        response['Content-Disposition'] = 'attachment; filename="student_data_export.csv"'
        
        writer = csv.writer(response)
        headers = [
            'student_no', 'names', 'gender', 'date_of_birth', 
            'class_name', 'parent_name', 'parent_email', 
            'parent_phone', 'address', 'status'
        ]
        writer.writerow(headers)
        
        from .models import Student
        if request.user.is_authenticated and hasattr(request.user, 'school'):
             students = Student.objects.filter(school=request.user.school).select_related('current_class')
             for s in students:
                writer.writerow([
                    s.student_no,
                    s.names,
                    s.gender,
                    s.dob,
                    s.current_class.name if s.current_class else '',
                    s.parent_name,
                    s.parent_email,
                    s.parent_phone,
                    s.address,
                    s.status
                ])
            
        return response

    @action(detail=False, methods=['get'], url_path='export-students')
    def export_students(self, request):
        """
        Export all students for the current tenant to CSV.
        """
        response = HttpResponse(content_type='text/csv')
        response['Content-Disposition'] = 'attachment; filename="student_data_export.csv"'
        
        writer = csv.writer(response)
        headers = [
            'student_no', 'names', 'gender', 'date_of_birth', 
            'class_name', 'parent_name', 'parent_email', 
            'parent_phone', 'address', 'status'
        ]
        writer.writerow(headers)
        
        from .models import Student
        students = Student.objects.filter(school=request.user.school).select_related('current_class')
        
        for s in students:
            writer.writerow([
                s.student_no,
                s.names,
                s.gender,
                s.dob,
                s.current_class.name if s.current_class else '',
                s.parent_name,
                s.parent_email,
                s.parent_phone,
                s.address,
                s.status
            ])
            
        return response
