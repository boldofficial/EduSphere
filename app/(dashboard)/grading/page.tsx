'use client';
import { useState, useMemo } from 'react';
import { useSchoolStore } from '@/lib/store';
import {
    useStudents, useClasses, useScores, useSettings,
    useCreateScore, useUpdateScore
} from '@/lib/hooks/use-data';
import * as Utils from '@/lib/utils';
import * as Types from '@/lib/types';
import { GradingView } from '@/components/features/GradingView';
import { SubjectTeacherManager } from '@/components/features/grading/SubjectTeacherManager';
import { TermComparisonView } from '@/components/features/grading/TermComparisonView';
import { PromotionManager } from '@/components/features/grading/PromotionManager';
import { StudentScoresView } from '@/components/features/grading/StudentScoresView';

export default function GradingPage() {
    const { currentRole, currentUser } = useSchoolStore();

    // Data Hooks
    const { data: students = [] } = useStudents();
    const { data: classes = [] } = useClasses();
    const { data: scores = [] } = useScores();
    const { data: settings = Utils.INITIAL_SETTINGS } = useSettings();

    // Mutations
    const { mutate: createScore } = useCreateScore();
    const { mutate: updateScore } = useUpdateScore();

    const [activeTab, setActiveTab] = useState<'grading' | 'comparison' | 'promotion' | 'assignments'>('grading');

    // Handle single score update from GradingView
    const handleUpsertScore = (score: Types.Score) => {
        // Check if score exists in our loaded data
        const existing = scores.find(s =>
            s.id === score.id ||
            (s.student_id === score.student_id && s.session === score.session && s.term === score.term)
        );

        if (existing) {
            updateScore({ id: existing.id, updates: score });
        } else {
            createScore(score);
        }
    };


    // Check if student/parent role
    const isStudentOrParent = currentRole === 'student' || currentRole === 'parent';

    // Get student for student/parent role
    const student = useMemo(() => {
        if (!isStudentOrParent) return null;
        const studentId = currentUser?.student_id || students[0]?.id;
        return students.find((s: Types.Student) => s.id === studentId) || students[0];
    }, [isStudentOrParent, currentUser, students]);

    const currentClass = student ? classes.find((c: Types.Class) => c.id === student.class_id) : undefined;

    // Render student-specific view for student/parent roles
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

    return (
        <div className="space-y-6">
            {/* Tab Navigation */}
            <div className="flex bg-gray-100 p-1 rounded-lg w-fit no-print">
                <button
                    onClick={() => setActiveTab('grading')}
                    className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${activeTab === 'grading' ? 'bg-white shadow text-brand-700' : 'text-gray-600 hover:text-gray-900'
                        }`}
                >
                    Score Entry
                </button>
                <button
                    onClick={() => setActiveTab('comparison')}
                    className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${activeTab === 'comparison' ? 'bg-white shadow text-brand-700' : 'text-gray-600 hover:text-gray-900'
                        }`}
                >
                    Term Comparison
                </button>
                <button
                    onClick={() => setActiveTab('promotion')}
                    className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${activeTab === 'promotion' ? 'bg-white shadow text-brand-700' : 'text-gray-600 hover:text-gray-900'
                        }`}
                >
                    Promotions
                </button>
                <button
                    onClick={() => setActiveTab('assignments')}
                    className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${activeTab === 'assignments' ? 'bg-white shadow text-brand-700' : 'text-gray-600 hover:text-gray-900'
                        }`}
                >
                    Subject Teachers
                </button>
            </div>

            {/* Tab Content */}
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

            {activeTab === 'comparison' && (
                <TermComparisonView
                    students={students}
                    classes={classes}
                    scores={scores}
                    settings={settings}
                />
            )}

            {activeTab === 'promotion' && (
                <PromotionManager />
            )}

            {activeTab === 'assignments' && (
                <SubjectTeacherManager />
            )}
        </div>
    );
}

