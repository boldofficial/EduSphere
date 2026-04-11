import * as Types from './types';

export function calculateMean(scores: number[]): number {
  if (scores.length === 0) return 0;
  const sum = scores.reduce((a, b) => a + b, 0);
  return Math.round((sum / scores.length) * 100) / 100;
}

export function calculateMedian(scores: number[]): number {
  if (scores.length === 0) return 0;
  const sorted = [...scores].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 0) {
    return Math.round(((sorted[mid - 1] + sorted[mid]) / 2) * 100) / 100;
  }
  return Math.round(sorted[mid] * 100) / 100;
}

export function calculateMode(scores: number[]): number | null {
  if (scores.length === 0) return null;
  const frequency: Record<number, number> = {};
  let maxFreq = 0;
  let mode = scores[0];
  for (const score of scores) {
    frequency[score] = (frequency[score] || 0) + 1;
    if (frequency[score] > maxFreq) {
      maxFreq = frequency[score];
      mode = score;
    }
  }
  return mode;
}

export function calculateStdDev(scores: number[]): number {
  if (scores.length === 0) return 0;
  const mean = calculateMean(scores);
  const squaredDiffs = scores.map(score => Math.pow(score - mean, 2));
  const variance = squaredDiffs.reduce((a, b) => a + b, 0) / scores.length;
  return Math.round(Math.sqrt(variance) * 100) / 100;
}

export function calculateVariance(scores: number[]): number {
  if (scores.length === 0) return 0;
  const mean = calculateMean(scores);
  const squaredDiffs = scores.map(score => Math.pow(score - mean, 2));
  return Math.round((squaredDiffs.reduce((a, b) => a + b, 0) / scores.length) * 100) / 100;
}

export function calculatePercentile(score: number, scores: number[]): number {
  if (scores.length === 0) return 0;
  const sorted = [...scores].sort((a, b) => a - b);
  const below = sorted.filter(s => s < score).length;
  return Math.round((below / sorted.length) * 100);
}

export function getQuartiles(scores: number[]): { q1: number; q2: number; q3: number } {
  if (scores.length === 0) return { q1: 0, q2: 0, q3: 0 };
  const sorted = [...scores].sort((a, b) => a - b);
  const q2 = calculateMedian(sorted);
  const lowerHalf = sorted.filter(s => s <= q2);
  const upperHalf = sorted.filter(s => s >= q2);
  return {
    q1: calculateMedian(lowerHalf),
    q2,
    q3: calculateMedian(upperHalf),
  };
}

export function getSkewness(scores: number[]): 'left' | 'symmetric' | 'right' {
  if (scores.length === 0) return 'symmetric';
  const mean = calculateMean(scores);
  const median = calculateMedian(scores);
  if (mean > median) return 'left';
  if (mean < median) return 'right';
  return 'symmetric';
}

export function calculatePassRate(scores: number[], passingMark: number = 50): number {
  if (scores.length === 0) return 0;
  const passed = scores.filter(s => s >= passingMark).length;
  return Math.round((passed / scores.length) * 100);
}

export interface GradeCount {
  grade: string;
  count: number;
  percentage: number;
  color: string;
}

export function getGradeDistribution(
  scores: number[],
  scheme: Types.GradingScheme
): GradeCount[] {
  if (!scheme.ranges || scores.length === 0) return [];
  const distribution = scheme.ranges.map(range => {
    const count = scores.filter(
      s => s >= range.min_score && s <= range.max_score
    ).length;
    return {
      grade: range.grade,
      count,
      percentage: Math.round((count / scores.length) * 100),
      color: range.grade === 'A' ? '#10b981' :
             range.grade === 'B' ? '#3b82f6' :
             range.grade === 'C' ? '#f59e0b' :
             range.grade === 'D' ? '#f97316' : '#ef4444',
    };
  });
  return distribution.sort((a, b) => b.count - a.count);
}

export function getSubjectStats(
  scores: Types.Score[],
  subject: string
): {
  mean: number;
  median: number;
  stdDev: number;
  passRate: number;
  topScore: number;
  lowestScore: number;
  subjectScores: number[];
} {
  const subjectScores = scores
    .flatMap(s => s.rows?.find(r => r.subject === subject))
    .map(r => r?.total || 0)
    .filter(s => s > 0);

  if (subjectScores.length === 0) {
    return {
      mean: 0,
      median: 0,
      stdDev: 0,
      passRate: 0,
      topScore: 0,
      lowestScore: 0,
      subjectScores: [],
    };
  }

  return {
    mean: calculateMean(subjectScores),
    median: calculateMedian(subjectScores),
    stdDev: calculateStdDev(subjectScores),
    passRate: calculatePassRate(subjectScores),
    topScore: Math.max(...subjectScores),
    lowestScore: Math.min(...subjectScores),
    subjectScores,
  };
}

export function rankStudents(
  students: Types.Student[],
  scores: Types.Score[],
  session: string,
  term: string
): Array<{
  student: Types.Student;
  average: number;
  position: number;
  percentile: number;
}> {
  return students
    .map(student => {
      const studentScores = scores.filter(
        s => s.student_id === student.id &&
             s.session === session &&
             s.term === term
      );
      const averages = studentScores.map(s => s.average || 0).filter(a => a > 0);
      const average = averages.length > 0
        ? averages.reduce((a, b) => a + b, 0) / averages.length
        : 0;

      return { student, average };
    })
    .sort((a, b) => b.average - a.average)
    .map((item, idx) => ({
      ...item,
      position: idx + 1,
      percentile: calculatePercentile(item.average, item.average ? [item.average] : [0]),
    }));
}

export function getDifficultyIndex(
  subjectScores: number[],
  overallScores: number[]
): number {
  if (subjectScores.length === 0 || overallScores.length === 0) return 0;
  const subjectMean = calculateMean(subjectScores);
  const overallMean = calculateMean(overallScores);
  return Math.round(((overallMean - subjectMean) / overallMean) * 100);
}

export function getTopPerformers(
  scores: Types.Score[],
  subject: string,
  limit: number = 10
): Array<{
  studentId: string;
  studentName?: string;
  total: number;
}> {
  return scores
    .map(score => {
      const row = score.rows?.find(r => r.subject === subject);
      return {
        studentId: score.student_id,
        total: row?.total || 0,
      };
    })
    .filter(s => s.total > 0)
    .sort((a, b) => b.total - a.total)
    .slice(0, limit);
}