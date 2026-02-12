import io
import os
from django.core.files.storage import default_storage
from django.conf import settings as django_settings
from .models import Student, ReportCard, Subject, GradingScheme
from schools.models import SchoolSettings

class BroadsheetPDFGenerator:
    def __init__(self, school, student_class, session, term):
        self.school = school
        self.student_class = student_class
        self.session = session
        self.term = term
        try:
            from reportlab.lib.styles import getSampleStyleSheet
            self.styles = getSampleStyleSheet()
        except ImportError:
            self.styles = None

    def generate(self):
        from reportlab.lib import colors
        from reportlab.lib.pagesizes import A4, landscape
        from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph
        from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
        from reportlab.lib.enums import TA_CENTER
        
        buffer = io.BytesIO()
        doc = SimpleDocTemplate(buffer, pagesize=landscape(A4), rightMargin=30, leftMargin=30, topMargin=30, bottomMargin=30)
        elements = []

        # 1. Header
        header_style = ParagraphStyle(
            'HeaderStyle',
            parent=self.styles['Heading1'],
            alignment=TA_CENTER,
            fontSize=16,
            spaceAfter=10
        )
        elements.append(Paragraph(self.school.name.upper(), header_style))
        
        sub_header_style = ParagraphStyle(
            'SubHeaderStyle',
            parent=self.styles['Normal'],
            alignment=TA_CENTER,
            fontSize=12,
            spaceAfter=20
        )
        sub_text = f"Master Broadsheet Report - {self.student_class.name}<br/>Session: {self.session} | Term: {self.term}"
        elements.append(Paragraph(sub_text, sub_header_style))

        # 2. Data Preparation
        students = Student.objects.filter(school=self.school, current_class=self.student_class).order_by('names')
        # Get subjects assigned to this class
        subjects = list(self.student_class.subjects.all().values_list('name', flat=True))
        
        # Table Header
        header_row = ['Student Name'] + subjects + ['Total', 'Avg', 'Pos']
        data = [header_row]

        # Calculate scores and sort for positions
        sheet_rows = []
        for student in students:
            report = ReportCard.objects.filter(
                student=student, 
                session=self.session, 
                term=self.term
            ).first()
            
            row_scores = []
            total = 0
            for subj_name in subjects:
                score_val = 0
                if report:
                    score_obj = report.scores.filter(subject__name=subj_name).first()
                    score_val = score_obj.total if score_obj else 0
                row_scores.append(score_val)
                total += score_val
            
            avg = total / len(subjects) if subjects else 0
            sheet_rows.append({
                'name': student.names,
                'scores': row_scores,
                'total': total,
                'avg': avg,
                'pos': 0 # Placeholder
            })

        # Sort by average for positions
        sheet_rows.sort(key=lambda x: x['avg'], reverse=True)
        for i, row in enumerate(sheet_rows):
            row['pos'] = i + 1

        # Format rows for ReportLab Table
        for row in sheet_rows:
            formatted_avg = f"{row['avg']:.1f}"
            data.append([row['name']] + row['scores'] + [row['total'], formatted_avg, row['pos']])

        # 3. Create Table
        # Dynamic column widths: first col wide, others narrow
        col_widths = [1.8*inch] + [0.5*inch] * (len(subjects) + 3)
        
        table = Table(data, colWidths=col_widths, repeatRows=1)
        
        # Styling
        style = TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.grey),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('ALIGN', (0, 0), (0, -1), 'LEFT'), # Left align names
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, 0), 10),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
            ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
            ('GRID', (0, 0), (-1, -1), 1, colors.black),
            ('FONTSIZE', (0, 1), (-1, -1), 8),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ])
        
        # Conditional formatting: Color failing grades (e.g. < 40) red
        for row_idx, row_data in enumerate(data[1:], start=1):
            for col_idx, score in enumerate(row_data[1:len(subjects)+1], start=1):
                if isinstance(score, (int, float)) and score < 40:
                    style.add('TEXTCOLOR', (col_idx, row_idx), (col_idx, row_idx), colors.red)
        
        table.setStyle(style)
        elements.append(table)

        # Build PDF
        doc.build(elements)
        buffer.seek(0)
        return buffer

class ReportCardPDFGenerator:
    def __init__(self, school):
        self.school = school
        self.settings = SchoolSettings.objects.filter(school=school).first()

    def _get_styles(self):
        from reportlab.lib.styles import getSampleStyleSheet
        return getSampleStyleSheet()

    def _get_image(self, field, width=None):
        from reportlab.platypus import Image
        from reportlab.lib.units import inch
        
        if width is None:
            width = 1*inch
            
        if not field:
            return None
        try:
            # Handle local vs S3 storage
            if hasattr(field, 'path') and os.path.exists(field.path):
                img_path = field.path
            else:
                # Fallback for S3 or other storages
                img_path = field.url
            return Image(img_path, width=width, preserveAspectRatio=True)
        except Exception:
            return None

    def generate_single(self, report_card):
        from reportlab.platypus import SimpleDocTemplate
        from reportlab.lib.pagesizes import A4
        
        buffer = io.BytesIO()
        doc = SimpleDocTemplate(buffer, pagesize=A4, rightMargin=40, leftMargin=40, topMargin=40, bottomMargin=40)
        elements = self._create_report_content(report_card)
        doc.build(elements)
        buffer.seek(0)
        return buffer

    def generate_bulk(self, student_class, session, term):
        from reportlab.platypus import SimpleDocTemplate, PageBreak
        from reportlab.lib.pagesizes import A4
        
        buffer = io.BytesIO()
        doc = SimpleDocTemplate(buffer, pagesize=A4, rightMargin=40, leftMargin=40, topMargin=40, bottomMargin=40)
        
        reports = ReportCard.objects.filter(
            school=self.school,
            student_class=student_class,
            session=session,
            term=term
        ).select_related('student')

        all_elements = []
        for i, report in enumerate(reports):
            if i > 0:
                all_elements.append(PageBreak())
            all_elements.extend(self._create_report_content(report))
        
        doc.build(all_elements)
        buffer.seek(0)
        return buffer

    def _create_report_content(self, report):
        from reportlab.lib import colors
        from reportlab.platypus import Table, TableStyle, Paragraph, Spacer
        from reportlab.lib.units import inch
        from reportlab.lib.styles import ParagraphStyle
        
        styles = self._get_styles()
        elements = []
        student = report.student
        
        # 1. Header Section
        logo = self._get_image(self.settings.logo_media, width=1.2*inch) if self.settings else None
        
        header_data = []
        school_info = [
            Paragraph(self.school.name.upper(), styles['Heading1']),
            Paragraph(self.settings.school_tagline if self.settings else "", styles['Normal']),
            Paragraph(self.settings.school_address if self.settings else "", styles['Normal']),
        ]
        
        if logo:
            header_data = [[logo, school_info]]
            col_widths = [1.5*inch, 4.5*inch]
        else:
            header_data = [[school_info]]
            col_widths = [6*inch]
            
        header_table = Table(header_data, colWidths=col_widths)
        header_table.setStyle(TableStyle([
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
            ('ALIGN', (0, 0), (0, 0), 'LEFT'),
        ]))
        elements.append(header_table)
        elements.append(Spacer(1, 0.2*inch))
        
        # 2. Student Bio
        bio_data = [
            [Paragraph(f"<b>NAME:</b> {student.names}", styles['Normal']), 
             Paragraph(f"<b>ADM NO:</b> {student.student_no}", styles['Normal'])],
            [Paragraph(f"<b>CLASS:</b> {report.student_class.name if report.student_class else 'N/A'}", styles['Normal']), 
             Paragraph(f"<b>SESSION/TERM:</b> {report.session} {report.term}", styles['Normal'])]
        ]
        bio_table = Table(bio_data, colWidths=[3.5*inch, 2.5*inch])
        bio_table.setStyle(TableStyle([
            ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
            ('PADDING', (0, 0), (-1, -1), 6),
        ]))
        elements.append(bio_table)
        elements.append(Spacer(1, 0.2*inch))

        # 3. Scores Table
        score_header = ['Subject', 'CA1', 'CA2', 'Exam', 'Total', 'Grade', 'Remark']
        score_data = [score_header]
        
        scores = report.scores.all().select_related('subject')
        for s in scores:
            score_data.append([
                s.subject.name, 
                s.ca1, s.ca2, s.exam, 
                s.total, s.grade, s.comment
            ])
            
        score_table = Table(score_data, colWidths=[2*inch, 0.6*inch, 0.6*inch, 0.6*inch, 0.6*inch, 0.6*inch, 1.4*inch])
        score_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#1e293b')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (1, 0), (-1, -1), 'CENTER'),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.black),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, 0), 9),
            ('FONTSIZE', (0, 1), (-1, -1), 8),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 8),
            ('TOPPADDING', (0, 0), (-1, -1), 6),
        ]))
        elements.append(score_table)
        elements.append(Spacer(1, 0.2*inch))

        # 4. Summary & Attendance
        summary_data = [
            [f"TOTAL SCORE: {report.total_score}", f"AVERAGE: {report.average:.1f}%", f"POSITION: {report.position if report.position else 'N/A'}"],
            [f"ATTENDANCE: {report.attendance_present}/{report.attendance_total}", "", f"OUTCOME: {'PASS' if report.average >= (self.settings.promotion_threshold if self.settings else 40) else 'FAIL'}"]
        ]
        summary_table = Table(summary_data, colWidths=[2*inch, 2*inch, 2*inch])
        summary_table.setStyle(TableStyle([
            ('FONTNAME', (0, 0), (-1, -1), 'Helvetica-Bold'),
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
            ('BACKGROUND', (0, 0), (-1, -1), colors.whitesmoke),
        ]))
        elements.append(summary_table)
        elements.append(Spacer(1, 0.3*inch))

        # 5. Remarks & Signatures
        remarks_style = ParagraphStyle('Remarks', parent=styles['Normal'], fontSize=9, italic=True)
        elements.append(Paragraph(f"<b>Class Teacher's Remark:</b> {report.teacher_remark or 'No remark yet.'}", remarks_style))
        elements.append(Spacer(1, 0.1*inch))
        elements.append(Paragraph(f"<b>Head Teacher's Remark:</b> {report.head_teacher_remark or 'No remark yet.'}", remarks_style))
        elements.append(Spacer(1, 0.4*inch))

        # Signatures
        sig_data = []
        head_sig = self._get_image(self.settings.head_of_school_signature, width=0.8*inch) if self.settings else None
        
        sig_cols = [
            [Spacer(1, 0.3*inch), Paragraph("________________", styles['Normal']), Paragraph("Class Teacher", styles['Normal'])],
            [head_sig or Spacer(1, 0.3*inch), Paragraph("________________", styles['Normal']), Paragraph("Head of School (Stamp)", styles['Normal'])]
        ]
        
        sig_table = Table([[sig_cols[0], sig_cols[1]]], colWidths=[3*inch, 3*inch])
        sig_table.setStyle(TableStyle([
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('VALIGN', (0, 0), (-1, -1), 'BOTTOM'),
        ]))
        elements.append(sig_table)
        
        return elements
