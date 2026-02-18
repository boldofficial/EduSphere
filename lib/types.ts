export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export interface Entity {
  id: string;
  created_at: number;
  updated_at: number;
}

export interface CoreValue {
  title: string;
  description: string;
  icon: string;
}

export interface AcademicProgram {
  title: string;
  age_range: string;
  description: string;
  image: string | null;
}

export interface Testimonial {
  name: string;
  role: string;
  quote: string;
  image: string | null;
}

export interface Settings extends Entity {
  school_name: string;
  school_address: string;
  school_email: string;
  school_phone: string;
  school_tagline: string;
  current_session: string;
  current_term: string;

  logo_media: string | null; // Base64
  watermark_media: string | null; // Base64

  // Signatories
  director_name: string;
  director_signature: string | null; // Base64
  head_of_school_name: string;
  head_of_school_signature: string | null; // Base64

  subjects_global: string[];
  terms: string[];
  show_position: boolean;
  show_skills: boolean;
  tiled_watermark: boolean;
  next_term_begins: string;
  class_teacher_label: string;
  head_teacher_label: string;
  report_font_family: string;
  report_scale: number;

  // Landing Page CMS
  landing_hero_title: string;
  landing_hero_subtitle: string;
  landing_features: string; // JSON string or simple comma-sep
  landing_hero_image: string | null; // Base64 hero background
  landing_about_text: string; // About section content
  landing_gallery_images: string[]; // Gallery images (Base64)
  landing_primary_color: string; // Customizable accent color
  landing_show_stats: boolean; // Show/hide stats section
  landing_cta_text: string; // Call to action button text
  landing_core_values: CoreValue[];
  landing_academic_programs: AcademicProgram[];
  landing_testimonials: Testimonial[];
  landing_stats_config: Record<string, boolean>;

  // Phase 2: Promotion Settings
  promotion_threshold: number; // Minimum average to pass (e.g., 50)
  promotion_rules: 'auto' | 'manual';

  // Invoice & Payment Settings
  show_bank_details: boolean;
  bank_name: string;
  bank_account_name: string;
  bank_account_number: string;
  bank_sort_code: string;
  invoice_notes: string; // Custom notes on invoice
  invoice_due_days: number; // Days until payment is due

  // Role Permissions Configuration
  role_permissions: Record<UserRole, RolePermissions>;
}

// Role-based permissions for navigation and dashboard widgets
export interface RolePermissions {
  navigation: string[];       // List of navigation item IDs allowed for this role
  dashboardWidgets: string[]; // List of dashboard widget IDs to show for this role
}

// Admission Form Submission
export interface Admission extends Entity {
  // Child Information
  child_name: string;
  child_dob: string;
  child_gender: 'Male' | 'Female';
  previous_school?: string;

  // Program Applied For
  program: 'creche' | 'pre-school' | 'primary';
  class_applied: string;

  // Parent/Guardian Information
  parent_name: string;
  parent_email: string;
  parent_phone: string;
  parent_address: string;
  relationship: 'Father' | 'Mother' | 'Guardian';

  // Application Status
  status: 'pending' | 'reviewed' | 'accepted' | 'rejected';
  admin_notes?: string;
  reviewed_at?: number;
  reviewed_by?: string;
}

export interface Class extends Entity {
  name: string;
  class_teacher_id: string | null;
  subjects: string[] | null;
}

export interface Teacher extends Entity {
  user?: number | null; // FK to User
  name: string;
  address: string;
  email: string;
  phone: string;
  passport_url?: string | null; // Base64 image or URL
  staff_type: 'ACADEMIC' | 'NON_ACADEMIC';
  role?: string;
  tasks?: string;
  assigned_modules?: string[];
}

export interface Staff extends Entity {
  user?: number | null; // FK to User
  name: string;
  role: string; // Job Title (e.g. Bursar)
  tasks: string; // Assigned tasks
  assigned_modules?: string[]; // e.g. ['bursary', 'attendance']
  passport_url?: string | null; // Base64 image or URL
  email: string;
  phone: string;
  address: string;
  staff_type: 'ACADEMIC' | 'NON_ACADEMIC';
}

export interface Student extends Entity {
  user?: number | null; // FK to User
  student_no: string;
  names: string;
  gender: 'Male' | 'Female';
  class_id: string;
  dob: string; // ISO date string YYYY-MM-DD
  parent_name: string;
  parent_email?: string; // For password recovery
  parent_phone: string;
  address: string;
  passport_url?: string | null; // Base64 image or URL
  password?: string; // Portal login password (set by admin)
  assigned_fees?: string[]; // IDs of optional fees assigned to this student
  discounts?: StudentDiscount[]; // Applied discounts/scholarships
}

export interface StudentDiscount {
  id: string;
  amount: number;
  reason: string;
  category: 'discount' | 'scholarship';
  session: string;
  term: string;
}

export interface Scholarship extends Entity {
  name: string;
  description: string;
  benefit_type: 'percentage' | 'fixed';
  value: number;
  is_active: boolean;
}

export interface Subject extends Entity {
  name: string;
}

export interface ScoreRow {
  subject: string;
  ca1: number; // e.g. Test/HW (20)
  ca2: number; // e.g. Mid-term (20)
  exam: number; // (60)
  total: number; // 100
  grade: string; // A-F
  comment: string;
}

export interface Score extends Entity {
  student_id: string;
  class_id: string; // Snapshot of class at time of result
  session: string;
  term: string;
  rows: ScoreRow[];
  average: number;
  position?: number;
  total_score?: number;

  // Attendance Snapshot
  attendance_present?: number;
  attendance_total?: number;

  // Enhanced Report Card Fields
  affective: Record<string, number>; // 1-5 Scale
  psychomotor: Record<string, number>; // 1-5 Scale
  teacher_remark?: string;
  head_teacher_remark?: string;
  next_term_begins?: string;
  promoted_to?: string;

  // Report Card Publication Status
  is_passed?: boolean; // Admin must pass/approve report card before student/parent can view
  passed_at?: number; // Timestamp when report card was passed
  passed_by?: string; // Admin user ID who passed the report card

  grading_scheme?: string;
  grading_scheme_details?: GradingScheme;
}

export interface AttendanceRecord {
  student_id: string;
  status: 'present' | 'absent' | 'late';
  remark?: string; // Optional remark for the attendance record
}

export interface Attendance extends Entity {
  date: string; // YYYY-MM-DD
  class_id: string;
  session: string;
  term: string;
  records: AttendanceRecord[];
}

export interface FeeStructure extends Entity {
  name: string;
  amount: number;
  class_id: string | null; // null = All Classes
  session: string;
  term: string;
  is_optional?: boolean;
}

export interface PaymentLineItem {
  purpose: string;
  amount: number;
}

export interface Payment extends Entity {
  student_id: string;
  amount: number; // Total amount (sum of all line items)
  date: string;
  method: 'cash' | 'transfer' | 'pos';
  lineItems: PaymentLineItem[]; // Individual purpose amounts
  remark?: string;
  session: string;
  term: string;
  reference?: string;
  status?: string;
  fee_structure_id?: string;
}

export interface Expense extends Entity {
  title: string;
  amount: number;
  category: 'salary' | 'maintenance' | 'supplies' | 'utilities' | 'other';
  date: string;
  description?: string;
  session: string;
  term: string;
  recorded_by?: string;
}

export interface FinancialStats {
  summary: {
    total_income: number;
    total_expenses: number;
    net_balance: number;
    total_expected: number;
    income_count: number;
    expense_count: number;
  };
  breakdown: {
    methods: Record<string, number>;
    expense_categories: Record<string, number>;
    monthly_trend: { month: string; income: number; expense: number }[];
  };
}

// Phase 2: Subject-Teacher Mapping
export interface SubjectTeacher extends Entity {
  teacher_id: string;
  class_id: string;
  subject: string;
  session: string;
}

// Phase 3: Announcements
export interface Announcement extends Entity {
  title: string;
  content: string;
  target: 'all' | 'class' | 'parents' | 'teachers' | 'staff';
  class_id?: string;
  author_id: string;
  author_role: UserRole;
  priority: 'normal' | 'important' | 'urgent';
  expires_at?: number;
  is_pinned?: boolean;
}

// Phase 3: Messaging
export interface Message extends Entity {
  sender?: number;
  sender_name?: string;
  sender_role?: string;
  recipient: number;
  recipient_name?: string;
  recipient_role?: string;
  subject: string;
  body: string;
  attachment_url?: string;
  is_read: boolean;
  read_at?: string | null;
}

// Phase 3: Calendar Events
export interface SchoolEvent extends Entity {
  title: string;
  description?: string;
  start_date: string;
  end_date?: string;
  event_type: 'academic' | 'holiday' | 'exam' | 'meeting' | 'sports' | 'cultural' | 'other';
  target_audience: 'all' | 'teachers' | 'students' | 'parents' | 'staff';
  class_id?: string; // For class-specific events
  is_recurring?: boolean;
  recurrence_pattern?: 'daily' | 'weekly' | 'monthly' | 'yearly';
  session?: string;
  term?: string;
  created_by?: string; // User ID who created the event
}

// Phase 4: Newsletters
export interface Newsletter extends Entity {
  title: string;
  description?: string;
  file_data: string; // Base64 encoded PDF
  file_name: string;
  session: string;
  term: string;
  published_by: string;
  is_published: boolean;
}

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface ToastNotification {
  id: string;
  message: string;
  type: ToastType;
}

export type ViewState =
  | 'dashboard'
  | 'students'
  | 'teachers'
  | 'staff'
  | 'classes'
  | 'subjects'
  | 'bursary'
  | 'grading'
  | 'broadsheet'
  | 'id_cards'
  | 'attendance'
  | 'settings'
  | 'data'
  | 'roles'
  | 'cms'
  | 'announcements'
  | 'messages'
  | 'calendar'
  | 'analytics'
  | 'learning'
  | 'conduct'
  | 'demo_requests'
  | 'users';

//Optionally add new Viewstates here for better control
// | 'timetables'
// | 'grading_schemes'

// =============================================
// PHASE 5: Timetable & Scheduling
// =============================================
export interface Period extends Entity {
  name: string;
  start_time: string; // HH:MM
  end_time: string; // HH:MM
  category: 'Regular' | 'Break' | 'Assembly';
}

export interface TimetableEntry extends Entity {
  timetable: string; // ID (but serialized nested often uses ID)
  day_of_week: string;
  period: string; // ID
  subject: string; // ID
  teacher: string | null; // ID

  // Expanded Fields from Serializer
  subject_name?: string;
  teacher_name?: string;
  period_start?: string;
}

export interface Timetable extends Entity {
  title: string;
  student_class: string; // ID
  class_name?: string;
  is_active: boolean;
  entries: TimetableEntry[];
}

export interface GradingScheme extends Entity {
  name: string;
  description: string;
  is_default: boolean;
  ranges: GradeRange[];
}

export interface GradeRange extends Entity {
  grade: string;
  min_score: number;
  max_score: number;
  remark: string;
  gpa_point: number;
}

// =============================================
// LEARNING MODULE
// =============================================

export interface Assignment extends Entity {
  title: string;
  description: string;
  student_class: string;
  subject: string;
  due_date: string;
  points: number;
  attachment_url?: string;
  teacher_name?: string;
  subject_name?: string;
}

export interface Submission extends Entity {
  assignment: string;
  student: string;
  student_name?: string;
  submission_text?: string;
  file_url?: string;
  submitted_at: string;
  score?: number;
  teacher_feedback?: string;
  is_graded: boolean;
}

export interface Quiz extends Entity {
  title: string;
  description: string;
  student_class: string;
  subject: string;
  start_time: string;
  end_time: string;
  duration_minutes: number;
  is_published: boolean;
}

export interface Question extends Entity {
  quiz: string;
  text: string;
  question_type: 'mcq' | 'theory';
  points: number;
  options?: QuestionOption[];
}

export interface QuestionOption extends Entity {
  text: string;
  is_correct: boolean;
}

export interface Attempt extends Entity {
  quiz: string;
  student: string;
  start_time: string;
  end_time?: string;
  total_score: number;
  is_completed: boolean;
  answers: StudentAnswer[];
  student_name?: string;
}

export interface StudentAnswer extends Entity {
  attempt: string;
  question: string;
  selected_option?: string;
  text_answer?: string;
  score: number;
  is_graded: boolean;
}


export interface TicketResponse extends Omit<Entity, 'created_at' | 'updated_at'> {
  username: string;
  message: string;
  is_admin_response: boolean;
  created_at: string;
}

export interface SupportTicket extends Omit<Entity, 'created_at' | 'updated_at'> {
  school_id: number;
  school_name: string;
  requester_name: string;
  subject: string;
  category: 'technical' | 'billing' | 'customization' | 'other';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  description: string;
  responses: TicketResponse[];
  created_at: string;
  updated_at: string;
}

// Restoring UserRole at the end
export type UserRole = 'super_admin' | 'admin' | 'teacher' | 'student' | 'parent' | 'staff';
