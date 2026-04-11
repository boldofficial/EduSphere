# Grading Module Enhancement Implementation Plan

## Overview
Comprehensive implementation plan for all grading module enhancements with prioritized phases.

---

## Phase 1: High Priority (Critical)

### 1.1 Bulk Score Import with Excel/CSV
**Priority**: High | **Estimated Time**: 2-3 days

**Files to Create/Modify**:
- `components/features/grading/BulkScoreImport.tsx` (NEW)
- `components/features/grading/ScoreImportModal.tsx` (NEW)
- `lib/utils.ts` - Add CSV parsing utilities
- `lib/hooks/use-data.ts` - Add `useBulkImportScores` mutation

**Steps**:
1. Create CSV/Excel template with columns: `student_no`, `subject`, `ca1`, `ca2`, `exam`
2. Create upload component with drag-and-drop
3. Parse file and validate data
4. Map student_no to student_id
5. Batch import via API endpoint
6. Show preview before committing
7. Handle duplicates (update vs create option)

**Template Structure**:
```csv
student_no,subject,ca1_score,ca2_score,exam_score
STU001,Mathematics,15,18,45
STU001,English,12,14,38
```

**API Endpoint**:
```
POST /api/scores/bulk-import/
{
  "session": "2024/2025",
  "term": "First",
  "data": [{ "student_id": "...", "subject": "Math", "ca1": 15, "ca2": 18, "exam": 45 }]
}
```

---

### 1.2 Subject Analytics Dashboard
**Priority**: High | **Estimated Time**: 2 days

**Files to Create/Modify**:
- `components/features/grading/SubjectAnalytics.tsx` (NEW)
- `components/features/grading/ClassAnalytics.tsx` (NEW)
- `components/features/grading/AnalyticsCharts.tsx` (NEW)

**Features**:
1. Per-subject class average comparison
2. Subject difficulty index (correlation with overall average)
3. Top performers per subject
4. Grade distribution charts
5. Score spread visualization

**Component Structure**:
```
SubjectAnalytics:
├── SubjectSelector
├── ClassAverageCard
├── DifficultyChart
├── TopPerformersTable
└── GradeDistributionChart
```

---

### 1.3 Exam Mode
**Priority**: High | **Estimated Time**: 2-3 days

**Files to Create/Modify**:
- `components/features/grading/ExamMode.tsx` (NEW)
- `components/features/grading/ExamTimer.tsx` (NEW)
- `components/features/grading/ExamSettings.tsx` (NEW)
- Update `lib/types.ts` - Add Exam types
- Update `ScoreEntryTab.tsx` - Add exam mode toggle

**Features**:
1. Separate exam score entry view
2. Configurable time limits per exam
3. Countdown timer with auto-submit
4. Anti-cheating measures (disable copy/paste)
5. Exam scheduling
6. Grade lock after submission

**Type Definitions**:
```typescript
interface Exam {
  id: string;
  title: string;
  class_id: string;
  subject: string;
  session: string;
  term: string;
  exam_date: string;
  duration_minutes: number;
  total_marks: number;
  passing_marks: number;
  status: 'draft' | 'published' | 'completed';
  created_by: string;
}

interface ExamScore {
  exam_id: string;
  student_id: string;
  score: number;
  percentile: number;
  grade: string;
  submitted_at: string;
  is_late: boolean;
}
```

---

### 1.4 Statistical Analysis
**Priority**: High | **Estimated Time**: 1-2 days

**Files to Create/Modify**:
- `components/features/grading/StatisticsPanel.tsx` (NEW)
- `lib/statistics.ts` (NEW - statistical utility functions)

**Statistics to Implement**:
1. Mean (average)
2. Median
3. Mode
4. Standard Deviation
5. Variance
6. Percentile Rankings (1-100)
7. Quartiles (Q1, Q2, Q3)
8. Skewness indicator
9. Pass rate percentage

**Utility Functions**:
```typescript
// lib/statistics.ts
export function calculateMean(scores: number[]): number;
export function calculateMedian(scores: number[]): number;
export function calculateStdDev(scores: number[]): number;
export function calculatePercentile(score: number, scores: number[]): number;
export function getQuartiles(scores: number[]): { q1: number; q2: number; q3: number };
export function getGradeDistribution(scores: number[], scheme: GradingScheme): GradeCount[];
```

---

### 1.5 Auto-Save for Score Entry
**Priority**: High | **Estimated Time**: 1 day

**Files to Modify**:
- `components/features/grading/ScoreEntryTab.tsx`
- `lib/hooks/use-data.ts`

**Implementation**:
1. Add debounced save on score change (500ms delay)
2. Show "Saving..." indicator
3. Show "Saved" confirmation
4. Queue failed saves for retry
5. Warn on unsaved changes before navigate

```typescript
// Use useDebounceValue from react-use or custom
const debouncedScore = useDebounce(score, 500);

useEffect(() => {
  if (debouncedScore && hasChanges) {
    saveScore(debouncedScore);
  }
}, [debouncedScore]);
```

---

## Phase 2: Medium Priority

### 2.1 Weighted Score Categories
**Priority**: Medium | **Estimated Time**: 2 days

**Files to Create/Modify**:
- `components/features/grading/WeightConfig.tsx` (NEW)
- Update `lib/types.ts` - Add WeightConfig
- Update `ScoreRow` in types
- Update `ScoreEntryTab.tsx` - Apply weights

**Features**:
1. Configure CA1/CA2/Exam weights per subject
2. Default weights (20/20/60)
3. Subject-specific overrides
4. Total calculation preview

**Type**:
```typescript
interface WeightConfig {
  id: string;
  subject: string;
  class_id: string;
  ca1_weight: number;
  ca2_weight: number;
  exam_weight: number;
  session: string;
}
```

---

### 2.2 Course Catalog
**Priority**: Medium | **Estimated Time**: 2-3 days

**Files to Create/Modify**:
- `components/features/grading/CourseCatalog.tsx` (NEW)
- `components/features/grading/SyllabusView.tsx` (NEW)
- Update `lib/types.ts` - Add Course/Syllabus types

**Features**:
1. Define subjects per class
2. Set topics per term/subject
3. Mark topics as covered/not covered
4. Link to lesson plans
5. Progress tracking

**Type**:
```typescript
interface Course {
  id: string;
  class_id: string;
  subject: string;
  sessions: TermSession[];
}

interface TermSession {
  term: string;
  topics: Topic[];
}

interface Topic {
  id: string;
  name: string;
  hours_allocated: number;
  covered: boolean;
  covered_date?: string;
}
```

---

### 2.3 Bulk Print Report Cards
**Priority**: Medium | **Estimated Time**: 1-2 days

**Files to Create/Modify**:
- `components/features/grading/BulkReportPrint.tsx` (NEW)
- `components/features/grading/ReportPrintQueue.tsx` (NEW)

**Features**:
1. Select class/filter students
2. Preview all reports in grid
3. Print all / Print selected
4. Generate PDF bundle
5. Email individual reports (future)

---

### 2.4 Skills Categories Customization
**Priority**: Medium | **Estimated Time**: 1 day

**Files to Modify**:
- `components/features/grading/SkillsTab.tsx` - Add CRUD for skills
- `components/features/grading/SkillCategoryManager.tsx` (NEW)
- Update `lib/types.ts` - Update AffectiveDomain type

**Features**:
1. Add/edit/delete skill categories
2. Reorder skills via drag-drop
3. Set default ratings (1-5 scale)
4. School-wide vs class-specific

---

### 2.5 Fix TypeScript Issues
**Priority**: Medium | **Estimated Time**: 1 day

**Files to Modify**:
- `ScoreEntryTab.tsx:14` - Type ScoreInput props
- `ReportCardTemplate.tsx:83` - Type gradingKey properly
- `GradingSchemeManager.tsx:92` - Type updateRange
- `ScoreRow` in `lib/types.ts`
- `PromotionManager.tsx` - Remove any types

**Approach**:
1. Create `GradeRangeInput` component with proper types
2. Use `ScoreRow` type instead of inline `any`
3. Add inference for grading scheme ranges

---

## Phase 3: Low Priority

### 3.1 Year-over-Year Analytics
**Priority**: Low | **Estimated Time**: 2 days

**Files to Create/Modify**:
- `components/features/grading/YearComparison.tsx` (NEW)
- `components/features/grading/TrendAnalysis.tsx` (NEW)

**Features**:
1. Compare performance across sessions
2. Track class promotion rates
3. Subject trend over years
4. Export comparison reports

---

### 3.2 Custom Report Templates
**Priority**: Low | **Estimated Time**: 2-3 days

**Files to Create/Modify**:
- `components/features/grading/templates/CompactTemplate.tsx`
- `components/features/grading/templates/DetailedTemplate.tsx`
- `components/features/grading/templates/SimpleTemplate.tsx`
- `components/features/grading/ReportTemplateSelector.tsx`

**Templates**:
1. Standard (current - detailed)
2. Compact (minimal info)
3. Parent-friendly (simple language)
4. Formal (administrative)

---

### 3.3 Behavior/Conduct Tracking
**Priority**: Low | **Estimated Time**: 2 days

**Files to Create/Modify**:
- `components/features/conduct/ConductCard.tsx` (NEW - integrate with grading)
- Add conduct scores to report card

**Features**:
1. Add conduct/behavior grade per student
2. Include in report card
3. Conduct history tracking

---

### 3.4 Error Boundaries & Loading States
**Priority**: Medium | **Estimated Time**: 1 day

**Files to Create/Modify**:
- `components/features/grading/GradingErrorBoundary.tsx` (NEW)
- Update each tab with Suspense fallback

---

## Implementation Order

```
Phase 1 (Week 1-2):
├── 1. Bulk Score Import
├── 2. Auto-Save
├── 3. Statistical Analysis
├── 4. Subject Analytics
└── 5. Exam Mode (if time permits)

Phase 2 (Week 2-3):
├── 1. Course Catalog
├── 2. Weighted Categories
├── 3. Bulk Print
├── 4. Skills Customization
└── 5. TypeScript Fixes

Phase 3 (Week 3-4):
├── 1. Year-over-Year
├── 2. Custom Templates
├── 3. Conduct Integration
└── 4. Error Boundaries
```

---

## API Endpoints Required

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/scores/bulk-import/` | POST | Bulk score import |
| `/scores/statistics/` | GET | Get score statistics |
| `/exams/` | GET/POST | Exam CRUD |
| `/exams/{id}/submit/` | POST | Submit exam |
| `/exams/{id}/scores/` | GET | Get exam scores |
| `/subjects/analytics/` | GET | Subject analytics |
| `/courses/` | GET/POST | Course catalog CRUD |
| `/courses/{id}/topics/` | GET/POST | Topics CRUD |
| `/weight-configs/` | GET/POST | Weight configuration |
| `/skills/categories/` | GET/POST | Skills categories |

---

## Testing Strategy

1. **Unit Tests**: Statistical functions, weight calculations
2. **Integration Tests**: API endpoints
3. **E2E Tests**: Import flow, score entry, report generation
4. **Performance Tests**: Large class (100+ students)

---

## Documentation Required

1. Admin guide for score import
2. Teacher guide for exam mode
3. API documentation
4. Video tutorials