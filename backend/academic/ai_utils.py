import google.generativeai as genai
import os
import logging

logger = logging.getLogger(__name__)

class AcademicAI:
    def __init__(self):
        self.api_key = os.environ.get('GEMINI_API_KEY')
        if self.api_key:
            genai.configure(api_key=self.api_key)
            self.model = genai.GenerativeModel('gemini-1.5-flash')
        else:
            self.model = None

    def generate_student_remark(self, student_data):
        """
        Generates a personalized academic remark for a student.
        student_data: {
            "name": str,
            "scores": List[Dict],
            "conduct": List[Dict],
            "attendance": Dict
        }
        """
        if not self.model:
            return None

        prompt = f"""
        Act as an experienced and empathetic school teacher. 
        Write a professional terminal report remark for a student named {student_data['name']}.
        
        Performance Data:
        - Academic Scores: {student_data['scores']}
        - Behavioral/Conduct Logs: {student_data['conduct']}
        - Attendance: {student_data['attendance']}
        
        Guidelines:
        1. Be encouraging but honest.
        2. Highlight specific strengths if they exist.
        3. Suggest areas for improvement if necessary.
        4. Keep the remark between 2 to 4 sentences.
        5. Tone: Professional, constructive, and supportive.
        
        Provide only the remark text.
        """
        
        try:
            response = self.model.generate_content(prompt)
            return response.text.strip()
        except Exception as e:
            logger.error(f"Gemini Remark Generation Error: {str(e)}")
            return None

    def generate_executive_insights(self, school_summary):
        """
        Generates school-wide insights for administrators.
        school_summary: {
            "top_performers": List,
            "at_risk_count": int,
            "average_attendance": float,
            "subject_trends": Dict
        }
        """
        if not self.model:
            return None

        prompt = f"""
        Act as a data-driven School Administrator. 
        Analyze the following school performance summary and provide 3 key actionable executive insights.
        
        School Data:
        - At-Risk Students: {school_summary['at_risk_count']}
        - Average Term Attendance: {school_summary['average_attendance']}%
        - Top Performing Subjects: {school_summary.get('top_subjects', [])}
        - Subject Trends: {school_summary.get('trends', {})}
        
        Guidelines:
        1. Identify the most critical area for intervention.
        2. Recognize a significant achievement.
        3. Suggest a strategic improvement for the next term.
        4. Format as a bulleted list.
        
        Provide only the insight points.
        """
        
        try:
            response = self.model.generate_content(prompt)
            return response.text.strip()
        except Exception as e:
            logger.error(f"Gemini Executive Insights Error: {str(e)}")
            return None

    def generate_timetable(self, school_data):
        """
        Generates a conflict-free school-wide timetable.
        school_data: {
            "classes": List[Dict],  # {id, name, subjects:[{id, name, periods_per_week}]}
            "teachers": List[Dict], # {id, name, subjects:[id]}
            "periods": List[Dict],  # {id, name, category}
            "days": List[str]
        }
        """
        if not self.model:
            return None

        prompt = f"""
        Act as an expert Academic Scheduler. 
        Generate a weekly school timetable based on the following data:
        
        Classes & Subject Requirements:
        {school_data['classes']}
        
        Teachers & expertise:
        {school_data['teachers']}
        
        Available Periods (Categories: Regular, Break, Assembly):
        {school_data['periods']}
        
        Working Days: {school_data['days']}
        
        CRITICAL RULES:
        1. NO TEACHER CLASHES: A teacher cannot be in two classes at the same time (same day/period).
        2. NO CLASS CLASHES: A class cannot have two subjects at the same time.
        3. SUBJECT LOAD: Respect 'periods_per_week' for each subject in each class.
        4. BREAKS: No subjects during 'Break' or 'Assembly' periods.
        5. OUTPUT FORMAT: Return ONLY a JSON list of entries:
           [
             {{"class_id": "...", "day": "...", "period_id": "...", "subject_id": "...", "teacher_id": "..."}},
             ...
           ]
        
        Ensure every regular period for every class is filled if possible, adhering to teacher availability.
        """
        
        try:
            response = self.model.generate_content(prompt)
            # Remove markdown code blocks if any
            text = response.text.replace('```json', '').replace('```', '').strip()
            import json
            return json.loads(text)
        except Exception as e:
            logger.error(f"Gemini Timetable Generation Error: {str(e)}")
            return None
