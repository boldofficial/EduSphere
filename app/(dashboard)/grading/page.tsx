'use client';
import { useState, useMemo } from 'react';
import { useSchoolStore } from '@/lib/store';
import {
    useStudents,
    useClasses,
    useScores,
    useSettings,
    useCreateScore,
    useUpdateScore,
} from '@/lib/hooks/use-data';
import * as Utils from '@/lib/utils';
import * as Types from '@/lib/types';
import { GradingView } from '@/components/features/GradingView';
import { SubjectTeacherManager } from '@/components/features/grading/SubjectTeacherManager';
import { TermComparisonView } from '@/components/features/grading/TermComparisonView';
import { PromotionManager } from '@/components/features/grading/PromotionManager';
import { StudentScoresView } from '@/components/features/grading/StudentScoresView';
import { BulkScoreImport } from '@/components/features/grading/BulkScoreImport';
import { SubjectAnalytics } from '@/components/features/grading/SubjectAnalytics';
import { StatisticsPanel } from '@/components/features/grading/StatisticsPanel';
import { ExamMode } from '@/components/features/grading/ExamMode';
import { BarChart3, Upload, Clock, ClipboardList, GitCompareArrows, ArrowUpCircle, Users2 } from 'lucide-react';

export default function GradingPage() {
    const { currentRole, currentUser } = useSchoolStore();

    const { data: students = [] } = useStudents();
    const { data: classes = [] } = useClasses();
    const { data: scores = [] } = useScores({ include_all_periods: true });
    const { data: settings = Utils.INITIAL_SETTINGS } = useSettings();

    const { mutate: createScore } = useCreateScore();
    const { mutate: updateScore } = useUpdateScore();

    const sanitizeScorePayload = (score: Types.Score): Partial<Types.Score> => {
        const payload: Partial<Types.Score> = { ...score };
        delete payload.created_at;
        delete payload.updated_at;

        if (typeof payload.passed_at === 'number') {
            payload.passed_at = new Date(payload.passed_at).toISOString();
        }

        return payload;
    };

    const [activeTab, setActiveTab] = useState<'grading' | 'comparison' | 'promotion' | 'assignments' | 'import' | 'analytics' | 'exam'>('grading');

    const handleUpsertScore = (score: Types.Score) => {
        const existing = scores.find(
            s => s.id === score.id || (s.student_id === score.student_id && s.session === score.session && s.term === score.term)
        );
        const sanitizedPayload = sanitizeScorePayload(score);

        if (existing) {
            updateScore({ id: existing.id, updates: sanitizedPayload });
        } else {
            createScore(sanitizedPayload as Types.Score);
        }
    };

    const isStudentOrParent = currentRole === 'student' || currentRole === 'parent';

    const student = useMemo(() => {
        if (!isStudentOrParent) return null;
        const studentId = currentUser?.student_id || students[0]?.id;
        return students.find((s: Types.Student) => s.id === studentId) || students[0];
    }, [isStudentOrParent, currentUser, students]);

    const currentClass = student ? classes.find((c: Types.Class) => Utils.sameId(c.id, student.class_id)) : undefined;

    if (isStudentOrParent && student) {
        return (
            <StudentScoresView
                student={student}
                students={students}
                currentClass={currentClass}
                scores={scores}
                settings={settings}
            />
        );
    }

    const pageTabs = [
        { key: 'grading' as const, label: 'Scores', icon: ClipboardList },
        { key: 'import' as const, label: 'Import', icon: Upload },
        { key: 'analytics' as const, label: 'Analytics', icon: BarChart3 },
        { key: 'comparison' as const, label: 'Compare', icon: GitCompareArrows },
        { key: 'exam' as const, label: 'Exam', icon: Clock },
        { key: 'promotion' as const, label: 'Promote', icon: ArrowUpCircle },
        { key: 'assignments' as const, label: 'Teachers', icon: Users2 },
    ];

    return (
        <div className="space-y-6">
            <div className="no-print rounded-3xl border border-brand-100 bg-white p-2 shadow-sm">
                <div className="grid grid-cols-2 gap-2 md:grid-cols-3 xl:grid-cols-7">
                    {pageTabs.map(tab => {
                        const Icon = tab.icon;
                        const isActive = activeTab === tab.key;

                        return (
                            <button
                                key={tab.key}
                                onClick={() => setActiveTab(tab.key)}
                                className={`flex items-center justify-center gap-2 rounded-2xl px-3 py-2.5 text-sm font-medium transition-all ${
                                    isActive
                                        ? 'bg-gradient-to-r from-brand-700 to-brand-600 text-white shadow-sm'
                                        : 'bg-white text-gray-600 hover:bg-brand-50 hover:text-brand-700'
                                }`}
                            >
                                <Icon className="h-4 w-4" />
                                <span>{tab.label}</span>
                            </button>
                        );
                    })}
                </div>
            </div>

            {activeTab === 'grading' && (
                <GradingView
                    students={students}
                    classes={classes}
                    scores={scores}
                    settings={settings}
                    onUpsertScore={handleUpsertScore}
                    currentRole={currentRole}
                />
            )}

            {activeTab === 'import' && (
                <BulkScoreImport
                    students={students}
                    session={settings.current_session}
                    term={settings.current_term}
                    onSuccess={() => {
                        // Refresh scores after import
                    }}
                />
            )}

            {activeTab === 'analytics' && (
                <div className="space-y-6">
                    <SubjectAnalytics
                        scores={scores}
                        students={students}
                        classId={classes[0]?.id || ''}
                        classes={classes}
                        session={settings.current_session}
                        term={settings.current_term}
                    />
                    <StatisticsPanel
                        scores={scores}
                        classId={classes[0]?.id || ''}
                        subject={classes[0]?.subjects?.[0] || ''}
                        session={settings.current_session}
                        term={settings.current_term}
                        studentCount={students.length}
                    />
                </div>
            )}

            {activeTab === 'comparison' && (
                <TermComparisonView
                    students={students}
                    classes={classes}
                    scores={scores}
                    settings={settings}
                />
            )}

            {activeTab === 'exam' && (
                <ExamMode
                    students={students}
                    classes={classes}
                    session={settings.current_session}
                    term={settings.current_term}
                />
            )}

            {activeTab === 'promotion' && <PromotionManager />}

            {activeTab === 'assignments' && <SubjectTeacherManager />}
        </div>
    );
}
