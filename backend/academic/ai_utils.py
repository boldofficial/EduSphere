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

    def evaluate_submission(self, data):
        """
        Evaluates a student's theory answer based on the question and rubric.
        data: {
            "question": str,
            "answer": str,
            "rubric": str (optional),
            "max_points": int
        }
        """
        if not self.model:
            return None

        rubric_section = f"\nGrading Rubric:\n{data['rubric']}" if data.get('rubric') else ""
        
        prompt = f"""
        Act as an objective Academic Grader. 
        Evaluate the following student answer based on the question and optional rubric.
        
        Question: {data['question']}
        Student's Answer: {data['answer']}
        Max Points: {data['max_points']}{rubric_section}
        
        Guidelines:
        1. Be fair and consistent.
        2. Provide a suggested score out of {data['max_points']}.
        3. Provide constructive feedback (1-3 sentences).
        4. Format the output as basic JSON:
           {{
             "score": float,
             "feedback": "string"
           }}
        
        Provide ONLY the JSON object.
        """
        
        try:
            response = self.model.generate_content(prompt)
            text = response.text.replace('```json', '').replace('```', '').strip()
            import json
            return json.loads(text)
        except Exception as e:
            logger.error(f"Gemini Evaluation Error: {str(e)}")
            return None

    def predict_student_performance(self, student_data):
        """
        Predicts student performance and identifies at-risk students.
        student_data: {
            "name": str,
            "class_name": str,
            "scores": List[Dict],  # [{subject, ca1, ca2, exam, total, grade}]
            "average": float,
            "attendance_rate": float,  # percentage
            "conduct_scores": List[Dict],  # [{trait, score}]
            "historical_averages": List[float]  # past term averages
        }
        """
        if not self.model:
            return None

        prompt = f"""
        Act as an Educational Data Analyst specializing in early warning systems.
        Analyze the following student data and predict their academic trajectory.
        
        Student: {student_data['name']}
        Class: {student_data['class_name']}
        Current Scores: {student_data['scores']}
        Current Average: {student_data['average']}
        Attendance Rate: {student_data['attendance_rate']}%
        Conduct/Behavior Scores: {student_data.get('conduct_scores', [])}
        Historical Averages (past terms): {student_data.get('historical_averages', [])}
        
        Provide your analysis as a JSON object with EXACTLY this structure:
        {{
          "risk_level": "high" | "medium" | "low",
          "predicted_average": float,
          "confidence": float (0-1),
          "key_concerns": ["string", ...],
          "strengths": ["string", ...],
          "recommendations": ["string", ...]
        }}
        
        Rules:
        - "high" risk: predicted average below 45 or attendance below 60%
        - "medium" risk: predicted average 45-60 or attendance 60-80%
        - "low" risk: predicted average above 60 and attendance above 80%
        - Keep concerns, strengths, and recommendations to 2-3 items max
        - Be specific and actionable
        
        Return ONLY the JSON object.
        """
        
        try:
            response = self.model.generate_content(prompt)
            text = response.text.replace('```json', '').replace('```', '').strip()
            import json
            return json.loads(text)
        except Exception as e:
            logger.error(f"Gemini Prediction Error: {str(e)}")
            return None

    def generate_lesson_plan(self, plan_data):
        """
        Generates a structured lesson plan.
        plan_data: {
            "subject": str,
            "class_name": str,
            "topic": str,
            "duration_minutes": int,
            "objectives": str (optional),
            "notes": str (optional)
        }
        """
        if not self.model:
            return None

        objectives_section = f"\nLearning Objectives: {plan_data['objectives']}" if plan_data.get('objectives') else ""
        notes_section = f"\nAdditional Notes: {plan_data['notes']}" if plan_data.get('notes') else ""
        
        prompt = f"""
        Act as an experienced Curriculum Specialist and Education Expert.
        Create a detailed, structured lesson plan for the following:
        
        Subject: {plan_data['subject']}
        Class: {plan_data['class_name']}
        Topic: {plan_data['topic']}
        Duration: {plan_data['duration_minutes']} minutes{objectives_section}{notes_section}
        
        Provide your lesson plan as a JSON object with this structure:
        {{
          "title": "string",
          "subject": "string",
          "class_name": "string",
          "duration": "string",
          "objectives": ["string", ...],
          "materials": ["string", ...],
          "sections": [
            {{
              "title": "string",
              "duration": "string",
              "activities": ["string", ...],
              "teacher_notes": "string"
            }}
          ],
          "assessment": ["string", ...],
          "homework": "string",
          "differentiation": {{
            "advanced": "string",
            "struggling": "string"
          }}
        }}
        
        Rules:
        - Include 4-6 sections (Introduction, Main Activity 1, Main Activity 2, Practice, Assessment, Wrap-up)
        - Be specific with activities, not generic
        - Include time allocations for each section
        - Assessment should include 2-3 formative assessment ideas
        - Differentiation should suggest modifications for advanced and struggling learners
        
        Return ONLY the JSON object.
        """
        
        try:
            response = self.model.generate_content(prompt)
            text = response.text.replace('```json', '').replace('```', '').strip()
            import json
            return json.loads(text)
        except Exception as e:
            logger.error(f"Gemini Lesson Plan Error: {str(e)}")
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
