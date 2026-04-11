/**
 * Score Entry Tab (Broadsheet)
 *
 * Table for entering CA1, CA2, and Exam scores per student per subject.
 */
import React, { useState, useEffect } from 'react';
import { Save } from 'lucide-react';
import * as Types from '@/lib/types';
import { Card } from '@/components/ui/card';
import { Select } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/providers/toast-provider';

const ScoreInput = ({ value, max, onChange, className }: { value: number; max: number; onChange: (val: number) => void; className?: string }) => {
    const [localValue, setLocalValue] = useState(value?.toString() || '');

    useEffect(() => {
        setLocalValue(value?.toString() || '');
    }, [value]);

    const handleBlur = () => {
        let v = parseFloat(localValue);
        if (isNaN(v)) v = 0;
        if (v > max) v = max;
        if (v !== value) {
            onChange(v);
        }
    };

    return (
        <input
            type="number"
            min="0"
            max={max}
            value={localValue}
            onChange={e => setLocalValue(e.target.value)}
            onBlur={handleBlur}
            className={`h-9 w-16 rounded-xl border border-brand-100 bg-white/90 text-center text-sm font-medium text-gray-800 shadow-sm focus:border-brand-300 focus:outline-none focus:ring-2 focus:ring-brand-200 ${className || ''}`}
        />
    );
};

interface ScoreEntryTabProps {
    classes: Types.Class[];
    selectedClass: string;
    setSelectedClass: (id: string) => void;
    selectedSubject: string;
    setSelectedSubject: (subject: string) => void;
    classSubjects: string[];
    activeStudents: Types.Student[];
    getRow: (studentId: string) => { ca1: number; ca2: number; exam: number; total: number; grade: string; comment: string };
    handleScoreChange: (studentId: string, field: 'ca1' | 'ca2' | 'exam', value: number) => void;
}

export const ScoreEntryTab: React.FC<ScoreEntryTabProps> = ({
    classes,
    selectedClass,
    setSelectedClass,
    selectedSubject,
    setSelectedSubject,
    classSubjects,
    activeStudents,
    getRow,
    handleScoreChange,
}) => {
    const { addToast } = useToast();

    return (
        <Card className="min-h-[420px] overflow-hidden rounded-3xl border border-brand-100 bg-white shadow-sm">
            <div className="flex flex-col gap-4 border-b border-brand-100 bg-gradient-to-r from-brand-50 via-white to-accent-50 p-4 lg:flex-row lg:items-end lg:justify-between lg:p-5">
                <div className="grid w-full grid-cols-1 gap-3 md:grid-cols-2 lg:max-w-2xl">
                    <Select label="Class" value={selectedClass} onChange={e => setSelectedClass(e.target.value)}>
                        {classes.map(c => (
                            <option key={c.id} value={c.id}>
                                {c.name}
                            </option>
                        ))}
                    </Select>
                    <Select label="Subject" value={selectedSubject} onChange={e => setSelectedSubject(e.target.value)}>
                        {classSubjects.map(s => (
                            <option key={s} value={s}>
                                {s}
                            </option>
                        ))}
                    </Select>
                </div>
                <Button
                    onClick={() => addToast('All changes are saved automatically as you type.', 'success')}
                    className="flex w-full items-center justify-center gap-2 lg:w-auto"
                >
                    <Save className="h-4 w-4" />
                    Save Status
                </Button>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full min-w-[760px] text-sm">
                    <thead className="bg-brand-900 text-[11px] font-semibold uppercase tracking-[0.14em] text-white">
                        <tr>
                            <th className="sticky left-0 min-w-[180px] bg-brand-900 px-4 py-3 text-left">Student</th>
                            <th className="px-3 py-3 text-center">CA 1</th>
                            <th className="px-3 py-3 text-center">CA 2</th>
                            <th className="px-3 py-3 text-center">Exam</th>
                            <th className="px-3 py-3 text-center">Total</th>
                            <th className="px-3 py-3 text-center">Grade</th>
                            <th className="px-4 py-3 text-left">Remark</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 bg-white">
                        {activeStudents
                            .filter(student => {
                                if (student.assigned_subjects && student.assigned_subjects.length > 0) {
                                    return student.assigned_subjects.includes(selectedSubject);
                                }
                                return true;
                            })
                            .map(student => {
                                const row = getRow(student.id);
                                const totalBg =
                                    row.total >= 70
                                        ? 'bg-emerald-50 text-emerald-700'
                                        : row.total >= 50
                                          ? 'bg-blue-50 text-blue-700'
                                          : row.total >= 40
                                            ? 'bg-amber-50 text-amber-700'
                                            : row.total > 0
                                              ? 'bg-rose-50 text-rose-700'
                                              : 'bg-gray-50 text-gray-400';

                                const gradeBg =
                                    row.grade === 'A'
                                        ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                                        : row.grade === 'B'
                                          ? 'bg-cyan-100 text-cyan-800 border-cyan-200'
                                          : row.grade === 'C'
                                            ? 'bg-blue-100 text-blue-800 border-blue-200'
                                            : row.grade === 'D'
                                              ? 'bg-amber-100 text-amber-800 border-amber-200'
                                              : row.grade === 'F'
                                                ? 'bg-rose-100 text-rose-800 border-rose-200'
                                                : 'bg-gray-100 text-gray-600 border-gray-200';

                                return (
                                    <tr key={student.id} className="transition-colors hover:bg-brand-50/40">
                                        <td className="sticky left-0 bg-white px-4 py-3">
                                            <p className="font-semibold text-gray-900">{student.names}</p>
                                            <p className="text-xs text-gray-500">{student.student_no}</p>
                                        </td>
                                        <td className="px-3 py-3 text-center">
                                            <ScoreInput value={row.ca1} max={20} onChange={v => handleScoreChange(student.id, 'ca1', v)} />
                                        </td>
                                        <td className="px-3 py-3 text-center">
                                            <ScoreInput value={row.ca2} max={20} onChange={v => handleScoreChange(student.id, 'ca2', v)} />
                                        </td>
                                        <td className="px-3 py-3 text-center">
                                            <ScoreInput value={row.exam} max={60} onChange={v => handleScoreChange(student.id, 'exam', v)} />
                                        </td>
                                        <td className="px-3 py-3 text-center">
                                            <span className={`inline-flex min-w-16 justify-center rounded-full px-3 py-1 text-sm font-bold ${totalBg}`}>
                                                {row.total}
                                            </span>
                                        </td>
                                        <td className="px-3 py-3 text-center">
                                            <span className={`inline-flex min-w-12 justify-center rounded-full border px-2.5 py-1 text-xs font-bold ${gradeBg}`}>
                                                {row.grade}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-xs text-gray-500">{row.comment}</td>
                                    </tr>
                                );
                            })}

                        {activeStudents.length === 0 && (
                            <tr>
                                <td colSpan={7} className="px-4 py-10 text-center text-sm text-gray-500">
                                    No students found in this class.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </Card>
    );
};
