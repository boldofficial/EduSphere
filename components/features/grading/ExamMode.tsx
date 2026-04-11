'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Clock, AlertTriangle, CheckCircle, Lock, Unlock, FileText, Timer } from 'lucide-react';
import * as Types from '@/lib/types';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/providers/toast-provider';
import { useScores, useUpdateScore, useStudents, useClasses, useSettings } from '@/lib/hooks/use-data';
import * as Utils from '@/lib/utils';

interface ExamModeProps {
    students: Types.Student[];
    classes: Types.Class[];
    session: string;
    term: string;
}

interface ExamConfig {
    title: string;
    subject: string;
    duration: number;
    totalMarks: number;
    passingMarks: number;
    instructions: string;
}

export const ExamMode: React.FC<ExamModeProps> = ({
    students,
    classes,
    session,
    term,
}) => {
    const { addToast } = useToast();
    const { data: scores = [] } = useScores({ include_all_periods: true });
    const { data: settings = Utils.INITIAL_SETTINGS } = useSettings();
    const { mutate: updateScore } = useUpdateScore();

    const [isExamActive, setIsExamActive] = useState(false);
    const [selectedClass, setSelectedClass] = useState(String(classes[0]?.id || ''));
    const [selectedSubject, setSelectedSubject] = useState('');
    const [examConfig, setExamConfig] = useState<ExamConfig>({
        title: '',
        subject: '',
        duration: 60,
        totalMarks: 100,
        passingMarks: 50,
        instructions: 'Answer all questions. Show your work where applicable.',
    });
    const [timeRemaining, setTimeRemaining] = useState(0);
    const [isLocked, setIsLocked] = useState(true);
    const [startTime, setStartTime] = useState<number | null>(null);

    const currentClass = classes.find(c => Utils.sameId(c.id, selectedClass));
    const classSubjects = currentClass?.subjects || [];

    const activeStudents = students.filter(s => Utils.sameId(s.class_id, selectedClass));

    useEffect(() => {
        if (!selectedClass && classes.length > 0) {
            setSelectedClass(String(classes[0].id));
        }
    }, [classes, selectedClass]);

    useEffect(() => {
        if (currentClass?.subjects?.length && !selectedSubject) {
            setSelectedSubject(currentClass.subjects[0]);
        }
    }, [currentClass, selectedSubject]);

    useEffect(() => {
        if (isExamActive && timeRemaining > 0) {
            const timer = setTimeout(() => {
                setTimeRemaining(prev => {
                    if (prev <= 1) {
                        addToast('Time is up! Answers have been locked.', 'warning');
                        setIsLocked(true);
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
            return () => clearTimeout(timer);
        }
    }, [isExamActive, timeRemaining]);

    const handleStartExam = () => {
        if (!selectedSubject) {
            addToast('Please select a subject', 'error');
            return;
        }
        setIsExamActive(true);
        setStartTime(Date.now());
        setTimeRemaining(examConfig.duration * 60);
        setIsLocked(false);
        addToast(`Exam started: ${examConfig.title || selectedSubject}`, 'success');
    };

    const handleEndExam = () => {
        if (!confirm('Are you sure you want to end the exam early?')) return;
        setIsExamActive(false);
        setIsLocked(true);
        addToast('Exam ended', 'info');
    };

    const formatTime = (seconds: number): string => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    const getExamScoreKey = (studentId: string): string => {
        return `${studentId}_${selectedClass}_${selectedSubject}_${session}_${term}_exam`;
    };

    const calculateTotal = (ca1: number, ca2: number, exam: number): number => {
        const totalCA = ca1 + ca2;
        const scaledExam = (exam / 60) * examConfig.totalMarks - (examConfig.totalMarks - 100 + 60);
        return Math.round(totalCA + scaledExam);
    };

    if (!isExamActive) {
        return (
            <Card className="p-6">
                <div className="space-y-6">
                    <div className="flex items-center gap-2">
                        <FileText className="h-5 w-5 text-brand-600" />
                        <h3 className="text-lg font-semibold text-gray-900">Exam Mode</h3>
                        <span className="text-sm text-gray-500">(Terminal Exam Entry)</span>
                    </div>

                    <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                        <div className="flex items-start gap-3">
                            <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5" />
                            <div>
                                <h4 className="font-medium text-amber-800">Exam Mode Instructions</h4>
                                <ul className="text-sm text-amber-700 mt-2 space-y-1">
                                    <li>1. Set exam duration and passing mark</li>
                                    <li>2. Select class and subject</li>
                                    <li>3. Start exam to begin timer</li>
                                    <li>4. Enter exam scores (60 marks)</li>
                                    <li>5. Timer auto-locks when time expires</li>
                                </ul>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Input
                            label="Exam Title"
                            value={examConfig.title}
                            onChange={e => setExamConfig({ ...examConfig, title: e.target.value })}
                            placeholder={`${term} Terminal Examination`}
                        />

                        <Select
                            label="Select Class"
                            value={selectedClass}
                            onChange={e => setSelectedClass(e.target.value)}
                        >
                            {classes.map(c => (
                                <option key={c.id} value={c.id}>{c.name}</option>
                            ))}
                        </Select>

                        <Select
                            label="Select Subject"
                            value={selectedSubject}
                            onChange={e => setSelectedSubject(e.target.value)}
                        >
                            {classSubjects.map(s => (
                                <option key={s} value={s}>{s}</option>
                            ))}
                        </Select>

                        <Input
                            label="Duration (minutes)"
                            type="number"
                            value={examConfig.duration}
                            onChange={e => setExamConfig({ ...examConfig, duration: parseInt(e.target.value) || 60 })}
                        />

                        <Input
                            label="Total Marks"
                            type="number"
                            value={examConfig.totalMarks}
                            onChange={e => setExamConfig({ ...examConfig, totalMarks: parseInt(e.target.value) || 100 })}
                        />

                        <Input
                            label="Passing Marks"
                            type="number"
                            value={examConfig.passingMarks}
                            onChange={e => setExamConfig({ ...examConfig, passingMarks: parseInt(e.target.value) || 50 })}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Instructions for Students
                        </label>
                        <textarea
                            className="w-full p-3 border rounded-lg"
                            rows={3}
                            value={examConfig.instructions}
                            onChange={e => setExamConfig({ ...examConfig, instructions: e.target.value })}
                        />
                    </div>

                    <Button onClick={handleStartExam} className="w-full">
                        <Clock className="h-4 w-4 mr-2" />
                        Start Exam ({examConfig.duration} min)
                    </Button>
                </div>
            </Card>
        );
    }

    return (
        <div className="space-y-4">
            <Card className="p-4 bg-gradient-to-r from-red-50 to-orange-50 border-red-200">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className={`p-3 rounded-full ${timeRemaining < 300 ? 'bg-red-100 animate-pulse' : 'bg-red-50'}`}>
                            <Timer className={`h-6 w-6 ${timeRemaining < 300 ? 'text-red-600' : 'text-red-500'}`} />
                        </div>
                        <div>
                            <h3 className="font-bold text-lg text-gray-900">
                                {examConfig.title || `${selectedSubject} Examination`}
                            </h3>
                            <p className="text-sm text-gray-500">
                                {currentClass?.name} | {session} {term}
                            </p>
                        </div>
                    </div>

                    <div className="text-right">
                        <p className="text-sm text-gray-500">Time Remaining</p>
                        <p className={`text-3xl font-bold font-mono ${timeRemaining < 300 ? 'text-red-600' : 'text-gray-900'}`}>
                            {formatTime(timeRemaining)}
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-4 mt-4 pt-4 border-t">
                    <div className="flex items-center gap-2">
                        {isLocked ? (
                            <Lock className="h-4 w-4 text-red-500" />
                        ) : (
                            <Unlock className="h-4 w-4 text-green-500" />
                        )}
                        <span className={`text-sm font-medium ${isLocked ? 'text-red-600' : 'text-green-600'}`}>
                            {isLocked ? 'Locked' : 'Unlocked'}
                        </span>
                    </div>

                    <Button variant="outline" size="sm" onClick={() => setIsLocked(!isLocked)}>
                        {isLocked ? <Unlock className="h-4 w-4 mr-1" /> : <Lock className="h-4 w-4 mr-1" />}
                        {isLocked ? 'Unlock' : 'Lock'}
                    </Button>

                    <Button variant="destructive" size="sm" onClick={handleEndExam}>
                        End Exam
                    </Button>
                </div>
            </Card>

            {examConfig.instructions && (
                <Card className="p-3 bg-gray-50">
                    <p className="text-sm text-gray-600">{examConfig.instructions}</p>
                </Card>
            )}

            <Card className="overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="bg-gray-100">
                            <tr>
                                <th className="px-3 py-2 text-left sticky left-0 bg-gray-100">Student</th>
                                <th className="px-3 py-2 text-center">Exam (60)</th>
                                <th className="px-3 py-2 text-center">Total (100)</th>
                                <th className="px-3 py-2 text-center">Grade</th>
                                <th className="px-3 py-2 text-center">Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {activeStudents.map(student => {
                                const scoreKey = getExamScoreKey(student.id);
                                const existingScore = scores.find(
                                    s => s.student_id === student.id &&
                                         Utils.sameId(s.class_id, selectedClass) &&
                                         s.session === session &&
                                         s.term === term
                                );
                                const subjectRow = existingScore?.rows?.find(r => r.subject === selectedSubject);
                                const examScore = subjectRow?.exam || 0;
                                const total = subjectRow?.total || 0;
                                const passed = total >= examConfig.passingMarks;

                                return (
                                    <tr key={student.id} className="border-t">
                                        <td className="px-3 py-2 sticky left-0 bg-white">
                                            <p className="font-medium">{student.names}</p>
                                            <p className="text-xs text-gray-500">{student.student_no}</p>
                                        </td>
                                        <td className="px-3 py-2 text-center">
                                            {isLocked ? (
                                                <span className="font-mono">{examScore}</span>
                                            ) : (
                                                <input
                                                    type="number"
                                                    min="0"
                                                    max="60"
                                                    value={examScore}
                                                    onChange={(e) => {
                                                        const examVal = Math.min(60, parseInt(e.target.value) || 0);
                                                        if (existingScore && subjectRow) {
                                                            const updatedRows = existingScore.rows.map(r =>
                                                                r.subject === selectedSubject
                                                                    ? { ...r, exam: examVal, total: r.ca1 + r.ca2 + examVal }
                                                                    : r
                                                            );
                                                            updateScore({
                                                                id: existingScore.id,
                                                                updates: { rows: updatedRows },
                                                            });
                                                        }
                                                    }}
                                                    className="w-16 p-2 text-center border rounded"
                                                />
                                            )}
                                        </td>
                                        <td className="px-3 py-2 text-center">
                                            <span className={`font-bold ${passed ? 'text-green-600' : 'text-red-600'}`}>
                                                {total}
                                            </span>
                                        </td>
                                        <td className="px-3 py-2 text-center">
                                            <span className={`px-2 py-1 rounded text-xs font-bold ${
                                                total >= 75 ? 'bg-emerald-100 text-emerald-700' :
                                                total >= 65 ? 'bg-blue-100 text-blue-700' :
                                                total >= 55 ? 'bg-yellow-100 text-yellow-700' :
                                                total >= 40 ? 'bg-orange-100 text-orange-700' :
                                                'bg-red-100 text-red-700'
                                            }`}>
                                                {total >= 75 ? 'A' : total >= 65 ? 'B' : total >= 55 ? 'C' : total >= 40 ? 'D' : 'F'}
                                            </span>
                                        </td>
                                        <td className="px-3 py-2 text-center">
                                            {passed ? (
                                                <span className="flex items-center gap-1 text-green-600">
                                                    <CheckCircle className="h-4 w-4" /> Pass
                                                </span>
                                            ) : (
                                                <span className="text-red-500">Fail</span>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </Card>
        </div>
    );
};
