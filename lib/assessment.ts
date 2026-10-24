import type { Class } from '@/lib/types';

export type PartKey = 'ca1' | 'ca2' | 'exam';

export interface AssessmentPart {
  key: PartKey;
  label: string;
  max: number;
  enabled: boolean;
}

export interface ClassSection {
  name: string;
  head_title: string;
  head_name: string;
  head_signature: string;
}

export interface ClassAssessment {
  parts: AssessmentPart[];
  show_position: boolean;
  grading: { min: number; grade: string; remark: string }[];
  /** Who signs this class's reports; null when the class has no section. */
  section?: ClassSection | null;
}

/** Matches backend/academic/assessment.py: CA 1 (20) + CA 2 (20) + Exam (60), A–F grades. */
export const DEFAULT_ASSESSMENT: ClassAssessment = {
  parts: [
    { key: 'ca1', label: 'CA 1', max: 20, enabled: true },
    { key: 'ca2', label: 'CA 2', max: 20, enabled: true },
    { key: 'exam', label: 'Exam', max: 60, enabled: true },
  ],
  show_position: true,
  grading: [
    { min: 70, grade: 'A', remark: 'Excellent' },
    { min: 60, grade: 'B', remark: 'Very Good' },
    { min: 50, grade: 'C', remark: 'Good' },
    { min: 45, grade: 'D', remark: 'Fair' },
    { min: 40, grade: 'E', remark: 'Pass' },
    { min: 0, grade: 'F', remark: 'Fail' },
  ],
};

/** The score parts and grading scale for a class, from its section (the server sends them with the class). */
export function classAssessment(cls?: Pick<Class, 'assessment'> | null): ClassAssessment {
  return cls?.assessment?.parts ? cls.assessment : DEFAULT_ASSESSMENT;
}

/** Instant grade preview while typing; the server recalculates and stores the authoritative grade. */
export function gradeFor(total: number, assessment: ClassAssessment) {
  const scale = [...assessment.grading].sort((a, b) => b.min - a.min);
  const hit = scale.find((band) => total >= band.min) ?? scale[scale.length - 1];
  return { grade: hit?.grade ?? '', comment: hit?.remark ?? '' };
}

/** Colour family for a grade, for any scale (A1/B2… or A–F). */
export function gradeTone(grade: string) {
  const letter = (grade || '').charAt(0).toUpperCase();
  if (letter === 'A') return 'bg-green-100 text-green-800 border-green-200';
  if (letter === 'B') return 'bg-cyan-100 text-cyan-800 border-cyan-200';
  if (letter === 'C') return 'bg-blue-100 text-blue-800 border-blue-200';
  if (letter === 'D' || letter === 'E') return 'bg-amber-100 text-amber-800 border-amber-200';
  if (letter === 'F') return 'bg-red-100 text-red-800 border-red-200';
  return 'bg-gray-100 text-gray-600 border-gray-200';
}
