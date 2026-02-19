import google.generativeai as genai
import os
import logging
import json
import requests

logger = logging.getLogger(__name__)


def _get_ai_config():
    """Read AI provider config from PlatformSettings, with env fallback."""
    try:
        from schools.models import PlatformSettings
        settings = PlatformSettings.objects.filter(id=1).first()
        if settings:
            return {
                'provider': settings.ai_provider or 'gemini',
                'gemini_key': settings.gemini_api_key or os.environ.get('GEMINI_API_KEY', ''),
                'openrouter_key': settings.openrouter_api_key or '',
                'openrouter_model': settings.openrouter_model or 'google/gemini-2.0-flash-001',
            }
    except Exception:
        pass
    # Fallback to env
    return {
        'provider': 'gemini',
        'gemini_key': os.environ.get('GEMINI_API_KEY', ''),
        'openrouter_key': '',
        'openrouter_model': 'google/gemini-2.0-flash-001',
    }


class AcademicAI:
    def __init__(self):
        config = _get_ai_config()
        self.provider = config['provider']
        self.model = None

        if self.provider == 'openrouter' and config['openrouter_key']:
            self.openrouter_key = config['openrouter_key']
            self.openrouter_model = config['openrouter_model']
            self.model = 'openrouter'  # Sentinel to indicate a valid provider is configured
        elif config['gemini_key']:
            genai.configure(api_key=config['gemini_key'])
            self.model = genai.GenerativeModel('gemini-1.5-flash')
            self.provider = 'gemini'
        else:
            self.model = None

    def _generate(self, prompt):
        """Unified generation method — routes to Gemini SDK or OpenRouter HTTP."""
        if self.provider == 'openrouter':
            return self._openrouter_generate(prompt)
        elif self.model and self.provider == 'gemini':
            response = self.model.generate_content(prompt)
            return response.text.strip()
        return None

    def _openrouter_generate(self, prompt):
        """Call OpenRouter API (OpenAI-compatible)."""
        headers = {
            'Authorization': f'Bearer {self.openrouter_key}',
            'Content-Type': 'application/json',
            'HTTP-Referer': 'https://myregistra.net',
            'X-Title': 'EduSphere AI',
        }
        payload = {
            'model': self.openrouter_model,
            'messages': [{'role': 'user', 'content': prompt}],
            'max_tokens': 4096,
        }
        resp = requests.post('https://openrouter.ai/api/v1/chat/completions', headers=headers, json=payload, timeout=60)
        resp.raise_for_status()
        data = resp.json()
        return data['choices'][0]['message']['content'].strip()

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
            return self._generate(prompt)
        except Exception as e:
            logger.error(f"AI Remark Generation Error: {str(e)}")
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
            return self._generate(prompt)
        except Exception as e:
            logger.error(f"AI Executive Insights Error: {str(e)}")
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
            text = self._generate(prompt)
            if not text:
                return None
            text = text.replace('```json', '').replace('```', '').strip()
            return json.loads(text)
        except Exception as e:
            logger.error(f"AI Evaluation Error: {str(e)}")
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
            text = self._generate(prompt)
            if not text:
                return None
            text = text.replace('```json', '').replace('```', '').strip()
            return json.loads(text)
        except Exception as e:
            logger.error(f"AI Prediction Error: {str(e)}")
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
            text = self._generate(prompt)
            if not text:
                return None
            text = text.replace('```json', '').replace('```', '').strip()
            return json.loads(text)
        except Exception as e:
            logger.error(f"AI Lesson Plan Error: {str(e)}")
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
        5. PEDAGOGICAL OPTIMIZATION: Prioritize challenging/core subjects (e.g., Mathematics, English, Sciences) for earlier periods of the day when students are most focused.
        6. REPETITION: Avoid having the same subject twice in a row for the same class unless necessary for double periods.
        7. OUTPUT FORMAT: Return ONLY a JSON list of entries:
           [
             {{"class_id": "...", "day": "...", "period_id": "...", "subject_id": "...", "teacher_id": "..."}},
             ...
           ]
        
        Ensure every regular period for every class is filled if possible, adhering to teacher availability.
        
        NOTE ON TEACHERS: If a teacher has no listed 'expertise', you may treat them as a generalist academic teacher and assign them to any subject, but avoid over-loading them. If expertise is listed, prioritize that.
        """
        
        try:
            text = self._generate(prompt)
            if not text:
                return None
            
            # Robust JSON array extraction
            start = text.find('[')
            end = text.rfind(']')
            if start != -1 and end != -1:
                cleaned_text = text[start:end+1]
            else:
                cleaned_text = text.replace('```json', '').replace('```', '').strip()
            
            try:
                data = json.loads(cleaned_text)
                return data if isinstance(data, list) else None
            except json.JSONDecodeError as je:
                logger.error(f"AI Timetable JSON Parse Error: {str(je)}")
                logger.error(f"Raw AI Response: {text}")
                return None
        except Exception as e:
            logger.error(f"AI Timetable Generation Error: {str(e)}")
            return None

    def generate_quiz_from_content(self, content_text, subject_name, num_questions=5, difficulty='medium'):
        """
        Generates MCQ quiz questions from lesson content.
        Returns a list of question dicts with options.
        """
        if not self.model:
            return None

        prompt = f"""
        You are an expert quiz creator for a school.
        Generate {num_questions} Multiple Choice Questions from the following lesson content.
        Subject: {subject_name}
        Difficulty: {difficulty}

        LESSON CONTENT:
        {content_text[:3000]}

        OUTPUT FORMAT: Return ONLY a JSON list:
        [
          {{
            "text": "Question text here?",
            "options": [
              {{"text": "Option A", "is_correct": true}},
              {{"text": "Option B", "is_correct": false}},
              {{"text": "Option C", "is_correct": false}},
              {{"text": "Option D", "is_correct": false}}
            ],
            "points": 1
          }}
        ]
        Ensure exactly one correct answer per question. Make options plausible.
        """

        try:
            text = self._generate(prompt)
            if not text:
                return None
            text = text.replace('```json', '').replace('```', '').strip()
            return json.loads(text)
        except Exception as e:
            logger.error(f"AI Quiz Generation Error: {str(e)}")
            return None

    def draft_professional_message(self, context, tone='formal', topic='general'):
        """
        Drafts a professional school message/announcement.
        context: { "school_name": str, "recipient_type": str, "topic": str, "key_points": str }
        """
        if not self.model:
            return None

        prompt = f"""
        You are a professional school communications officer.
        Draft a {tone} message for a school.

        School: {context.get('school_name', 'Our School')}
        Recipient: {context.get('recipient_type', 'Parents')}
        Topic: {context.get('topic', topic)}
        Key Points: {context.get('key_points', 'N/A')}

        Write a clear, professional message. Include a greeting and sign-off.
        Return ONLY the message body text (no JSON wrapper).
        """

        try:
            return self._generate(prompt)
        except Exception as e:
            logger.error(f"AI Message Draft Error: {str(e)}")
            return None

    def synthesize_newsletter(self, school_data):
        """
        Generates a newsletter summary from school activity data.
        school_data: { "school_name": str, "period": str, "events": list, "achievements": list, "stats": dict }
        """
        if not self.model:
            return None

        school_name = school_data.get('school_name', 'Our School')
        period = school_data.get('period', 'This Month')
        events = school_data.get('events', [])
        achievements = school_data.get('achievements', [])
        stats = school_data.get('stats', {})

        prompt = f"""
        You are a school newsletter editor.
        Create a professional newsletter summary for:

        School: {school_name}
        Period: {period}
        
        Recent Events: {events}
        Student Achievements: {achievements}
        Key Statistics: {stats}

        Write an engaging 3-4 paragraph newsletter.
        Include sections: Highlights, Academic Update, Upcoming Events.
        Return ONLY the newsletter text (no JSON wrapper).
        """

        try:
            return self._generate(prompt)
        except Exception as e:
            logger.error(f"AI Newsletter Error: {str(e)}")
            raise

