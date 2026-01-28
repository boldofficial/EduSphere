
import { ScoreRow, Settings, Class, Subject, Student, Teacher, Staff, FeeStructure, Payment, Score, Attendance } from './types';

export const calculateGrade = (total: number) => {
  if (total >= 75) return { grade: 'A', comment: 'Excellent' };
  if (total >= 65) return { grade: 'B', comment: 'Very Good' };
  if (total >= 50) return { grade: 'C', comment: 'Good' };
  if (total >= 40) return { grade: 'D', comment: 'Fair' };
  return { grade: 'F', comment: 'Fail' };
};

export const generateId = () => crypto.randomUUID();

export const getCurrentTimestamp = () => Date.now();

export const getTodayString = () => new Date().toISOString().split('T')[0];

// --- STORAGE KEYS ---
export const STORAGE_KEYS = {
  SETTINGS: 'ng_school_settings',
  STUDENTS: 'ng_school_students',
  TEACHERS: 'ng_school_teachers',
  STAFF: 'ng_school_staff',
  CLASSES: 'ng_school_classes',
  FEES: 'ng_school_fees',
  PAYMENTS: 'ng_school_payments',
  EXPENSES: 'ng_school_expenses',
  SCORES: 'ng_school_scores',
  ATTENDANCE: 'ng_school_attendance',
  ADMISSIONS: 'ng_school_admissions'
};

// Generic Load/Save
export const loadFromStorage = <T>(key: string, fallback: T): T => {
  if (typeof window === 'undefined') return fallback;
  try {
    const item = localStorage.getItem(key);
    if (!item) return fallback;
    const parsed = JSON.parse(item);

    // For objects (like Settings), merge with fallback to ensure new keys exist
    if (typeof fallback === 'object' && fallback !== null && !Array.isArray(fallback)) {
      return { ...fallback, ...parsed };
    }

    return parsed;
  } catch (e) {
    console.error(`Error loading ${key}`, e);
    return fallback;
  }
};

export const saveToStorage = (key: string, data: any) => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (e) {
    console.error(`Error saving ${key}`, e);
  }
};

// Debounce utility for performance optimization
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: NodeJS.Timeout | null = null;

  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => {
      func(...args);
    }, wait);
  };
};

export const PRESET_PRESCHOOL_SUBJECTS = [
  'Language',
  'Numeracy',
  'Sensorial',
  'Practical Life',
  'Cultural Studies',
  'Art',
  'Story Telling',
  'C.R.S'
];

export const PRESET_PRIMARY_SUBJECTS = [
  'Mathematics',
  'Phonics/Spellings',
  'Comprehension',
  'Creative Writing',
  'Poetry',
  'Grammar',
  'Library and Information Science',
  'Creative Science',
  'Christian Religious Studies',
  'Information Communication Technology',
  'Home Economics',
  'Social Studies',
  'Creative Art',
  'Verbal Reasoning',
  'Non-Verbal Reasoning',
  'Quantitative Reasoning'
];

export const INITIAL_SETTINGS: Settings = {
  id: 'singleton',
  created_at: Date.now(),
  updated_at: Date.now(),
  school_name: 'SchoolSync Heritage Schools',
  school_address: '21, Agric Road, James Estate, Ajara-Topa, Badagry, Lagos State',
  school_email: 'info@fruitfulvineheritageschools.org.ng',
  school_phone: '0803 483 2855, 0806 475 0268',
  school_tagline: '...reaching the highest height',
  current_session: '2025/2026',
  current_term: 'First Term',

  logo_media: '/fruitful_logo_main.png',
  watermark_media: null,

  director_name: 'Godspower Arthur',
  director_signature: null,
  head_of_school_name: 'Oluwaseun Arthur',
  head_of_school_signature: null,

  subjects_global: PRESET_PRIMARY_SUBJECTS,
  terms: ['First Term', 'Second Term', 'Third Term'],
  show_position: true,
  show_skills: true,
  tiled_watermark: false,
  next_term_begins: '2025-05-04',
  class_teacher_label: 'Class Teacher',
  head_teacher_label: 'Head of School',
  report_font_family: 'inherit',
  report_scale: 100,
  landing_hero_title: 'Welcome to SchoolSync Heritage Schools',
  landing_hero_subtitle: 'Faith-Based Excellence in Education',
  landing_features: 'Faith-Based Education, Modern Facilities, Expert Teachers, Safe Environment, Holistic Development, Academic Excellence',
  landing_hero_image: null,
  landing_about_text: 'We are a faith-based school dedicated to training and raising a total child with godly values and excellent character, who will excel through the grace and the wisdom of God, by blending biblical principles with modern scholarship, educating children to thrive and reach their highest height in life.',
  landing_gallery_images: [],
  landing_primary_color: '#1A3A5C',
  landing_show_stats: true,
  landing_cta_text: 'Start Your Journey',
  landing_core_values: [
    { title: 'CARE', description: 'We nurture every child with love, compassion, and individual attention, ensuring they feel valued and supported in their journey.', icon: 'Heart' },
    { title: 'RESPECT', description: 'We foster an environment of mutual respect, teaching children to honour themselves, others, and their community.', icon: 'Users' },
    { title: 'EXCELLENCE', description: 'We inspire a pursuit of excellence in academics, character, and all endeavours, helping every child reach their highest potential.', icon: 'Award' }
  ],
  landing_academic_programs: [
    { title: "Crèche", image: "/fruitful2.jpg.jpg", age_range: "Ages 0 - 2", description: "A safe and nurturing environment for infants and toddlers to explore and grow." },
    { title: "Pre-School", image: "/fruitful5.jpg.jpg", age_range: "Ages 3 - 5", description: "Play-based learning that builds foundational skills in literacy, numeracy, and social interaction." },
    { title: "Primary School", image: "/fruitful3.jpg.jpg", age_range: "Ages 6 - 11", description: "A robust curriculum developing critical thinking, creativity, and strong moral values." }
  ],
  landing_testimonials: [],
  landing_stats_config: {
    students: true,
    teachers: true,
    classes: true
  },
  promotion_threshold: 50,
  promotion_rules: 'manual',
  role_permissions: {

    super_admin: {
      navigation: ['dashboard', 'students', 'teachers', 'staff', 'classes', 'grading', 'attendance', 'bursary', 'learning', 'announcements', 'calendar', 'analytics', 'id_cards', 'broadsheet', 'admissions', 'newsletter', 'messages', 'conduct', 'cms', 'data', 'settings', 'admin_schools', 'admin_revenue', 'system_health'],
      dashboardWidgets: ['stats', 'finance_chart', 'student_population', 'quick_actions', 'recent_transactions', 'strategic_analytics', 'platform_governance']
    },
    admin: {
      navigation: ['dashboard', 'students', 'teachers', 'staff', 'classes', 'grading', 'attendance', 'bursary', 'learning', 'announcements', 'calendar', 'analytics', 'id_cards', 'broadsheet', 'admissions', 'newsletter', 'messages', 'conduct', 'cms', 'data', 'settings'],
      dashboardWidgets: ['stats', 'finance_chart', 'student_population', 'quick_actions', 'recent_transactions']
    },
    teacher: {
      navigation: ['dashboard', 'grading', 'attendance', 'learning', 'announcements', 'calendar', 'messages', 'conduct'],
      dashboardWidgets: ['stats', 'quick_actions', 'my_classes']
    },
    student: {
      navigation: ['dashboard', 'grading', 'attendance', 'learning', 'announcements', 'bursary', 'calendar', 'id_cards', 'newsletter', 'messages', 'conduct'],
      dashboardWidgets: ['my_scores', 'my_attendance', 'my_fees', 'class_info']
    },
    parent: {
      navigation: ['dashboard', 'grading', 'attendance', 'learning', 'announcements', 'bursary', 'calendar', 'id_cards', 'newsletter', 'messages', 'conduct'],
      dashboardWidgets: ['my_scores', 'my_attendance', 'my_fees', 'class_info']
    },
    staff: {
      navigation: ['dashboard', 'calendar'],
      dashboardWidgets: ['quick_actions', 'my_tasks']
    }
  },
  // Invoice & Payment Settings
  show_bank_details: true,
  bank_name: 'First Bank of Nigeria',
  bank_account_name: 'SchoolSync Heritage Schools',
  bank_account_number: '0123456789',
  bank_sort_code: '',
  invoice_notes: 'Please ensure payment is made before the due date to avoid late fees.',
  invoice_due_days: 14
};

export const getSubjectsForClass = (cls: Class | undefined) => {
  if (!cls) return [];
  if (cls.subjects && cls.subjects.length > 0) return cls.subjects;

  const lowerName = cls.name.toLowerCase();
  if (lowerName.includes('play') || lowerName.includes('reception') || lowerName.includes('nursery') || lowerName.includes('kinder')) {
    return PRESET_PRESCHOOL_SUBJECTS;
  }
  return PRESET_PRIMARY_SUBJECTS;
};

export const PRESET_CLASSES = [
  'Playschool', 'Reception', 'Kindergarten',
  'Year 1', 'Year 2', 'Year 3', 'Year 4', 'Year 5', 'Year 6'
];

export const DOMAINS_AFFECTIVE = [
  'Punctuality', 'Attentiveness', 'Neatness', 'Honesty', 'Self Control', 'Politeness', 'Leadership'
];

export const DOMAINS_PSYCHOMOTOR = [
  'Handwriting', 'Verbal Fluency', 'Sports/Games', 'Handling Tools', 'Drawing/Painting', 'Music/Dance'
];

// Mock Initial Data (Seeds) - EMPTY FOR PRODUCTION
export const SEED_TEACHERS: Teacher[] = [];

export const SEED_STAFF: Staff[] = [];

export const SEED_CLASSES: Class[] = [
  {
    id: 'class-playschool',
    name: 'Playschool',
    class_teacher_id: null,
    subjects: PRESET_PRESCHOOL_SUBJECTS,
    created_at: Date.now(),
    updated_at: Date.now()
  },
  {
    id: 'class-reception',
    name: 'Reception',
    class_teacher_id: null,
    subjects: PRESET_PRESCHOOL_SUBJECTS,
    created_at: Date.now(),
    updated_at: Date.now()
  },
  {
    id: 'class-kindergarten',
    name: 'Kindergarten',
    class_teacher_id: null,
    subjects: PRESET_PRESCHOOL_SUBJECTS,
    created_at: Date.now(),
    updated_at: Date.now()
  },
  {
    id: 'class-year-1',
    name: 'Year 1',
    class_teacher_id: null,
    subjects: PRESET_PRIMARY_SUBJECTS,
    created_at: Date.now(),
    updated_at: Date.now()
  },
  {
    id: 'class-year-2',
    name: 'Year 2',
    class_teacher_id: null,
    subjects: PRESET_PRIMARY_SUBJECTS,
    created_at: Date.now(),
    updated_at: Date.now()
  },
  {
    id: 'class-year-3',
    name: 'Year 3',
    class_teacher_id: null,
    subjects: PRESET_PRIMARY_SUBJECTS,
    created_at: Date.now(),
    updated_at: Date.now()
  },
  {
    id: 'class-year-4',
    name: 'Year 4',
    class_teacher_id: null,
    subjects: PRESET_PRIMARY_SUBJECTS,
    created_at: Date.now(),
    updated_at: Date.now()
  },
  {
    id: 'class-year-5',
    name: 'Year 5',
    class_teacher_id: null,
    subjects: PRESET_PRIMARY_SUBJECTS,
    created_at: Date.now(),
    updated_at: Date.now()
  },
  {
    id: 'class-year-6',
    name: 'Year 6',
    class_teacher_id: null,
    subjects: PRESET_PRIMARY_SUBJECTS,
    created_at: Date.now(),
    updated_at: Date.now()
  }
];

export const SEED_STUDENTS: Student[] = [];

export const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' }).format(amount);
};

export const getStudentBalance = (student: Student, fees: FeeStructure[], payments: Payment[], session: string, term: string) => {
  // Calculate total bill for this session/term
  const classFees = fees.filter(f =>
    f.session === session &&
    f.term === term &&
    (f.class_id === null || String(f.class_id) === String(student.class_id))
  );

  // Filter mandatory vs optional fees
  const applicableFees = classFees.filter(f => {
    if (!f.is_optional) return true; // Mandatory fees always apply
    return (student.assigned_fees || []).includes(f.id); // Optional fees only if assigned
  });

  const rawBill = applicableFees.reduce((acc, f) => acc + (Number(f.amount) || 0), 0);

  // Calculate discounts for this session/term
  const activeDiscounts = (student.discounts || []).filter(d => d.session === session && d.term === term);
  const totalDiscount = activeDiscounts.reduce((acc, d) => acc + (Number(d.amount) || 0), 0);

  const totalBill = Math.max(0, rawBill - totalDiscount); // Ensure bill doesn't go below 0

  // Calculate total paid
  const studentPayments = payments.filter(p =>
    String(p.student_id) === String(student.id) &&
    p.session === session &&
    p.term === term
  );
  const totalPaid = studentPayments.reduce((acc, p) => acc + (Number(p.amount) || 0), 0);

  return { totalBill, totalPaid, balance: totalBill - totalPaid, totalDiscount, applicableFees };
};

export const getStudentPosition = (studentId: string, students: Student[], scores: Score[], session: string, term: string) => {
  const student = students.find(s => s.id === studentId);
  if (!student) return null;

  const classStudents = students.filter(s => String(s.class_id) === String(student.class_id));
  const classScores = classStudents.map(s => {
    const score = scores.find(sc => sc.student_id === s.id && sc.session === session && sc.term === term);
    return {
      student_id: s.id,
      total: score?.rows.reduce((acc, r) => acc + r.total, 0) || 0
    };
  }).sort((a, b) => b.total - a.total);

  const index = classScores.findIndex(s => s.student_id === studentId);
  return index !== -1 ? index + 1 : null;
};

// Helper to ordinalize numbers (1st, 2nd, 3rd)
export const ordinalSuffix = (i: number) => {
  const j = i % 10, k = i % 100;
  if (j === 1 && k !== 11) return i + "st";
  if (j === 2 && k !== 12) return i + "nd";
  if (j === 3 && k !== 13) return i + "rd";
  return i + "th";
};
