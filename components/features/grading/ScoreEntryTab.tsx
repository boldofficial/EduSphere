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

const ScoreInput = ({ value, max, onChange, className }: { value: number, max: number, onChange: (val: number) => void, className?: string }) => {
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
            className={`w-16 h-8 text-center border rounded focus:ring-2 focus:ring-brand-500 focus:outline-none ${className}`}
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
    classes, selectedClass, setSelectedClass, selectedSubject, setSelectedSubject,
    classSubjects, activeStudents, getRow, handleScoreChange
}) => {
    const { addToast } = useToast();

    return (
        <Card className="min-h-[400px] lg:min-h-[600px] flex flex-col">
            <div className="flex flex-col sm:flex-row gap-3 lg:gap-4 mb-4 lg:mb-6 p-3 lg:p-4 bg-gray-50 border-b items-end">
                <div className="w-full sm:w-1/3">
                    <Select label="Select Class" value={selectedClass} onChange={e => setSelectedClass(e.target.value)}>
                        {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </Select>
                </div>
                <div className="w-full sm:w-1/3">
                    <Select label="Select Subject" value={selectedSubject} onChange={e => setSelectedSubject(e.target.value)}>
                        {classSubjects.map(s => <option key={s} value={s}>{s}</option>)}
                    </Select>
                </div>
                <div className="w-full sm:w-auto">
                    <Button
                        onClick={() => addToast('All changes are saved automatically as you type!', 'success')}
                        className="w-full sm:w-auto flex items-center gap-2"
                    >
                        <Save className="h-4 w-4" />
                        Save Changes
                    </Button>
                </div>
            </div>
            <div className="overflow-x-auto flex-1 -mx-3 lg:mx-0">
                <table className="w-full text-xs lg:text-sm text-left min-w-[600px]">
                    <thead className="bg-gray-100 text-gray-700 uppercase text-[10px] lg:text-xs font-semibold">
                        <tr>
                            <th className="px-2 lg:px-4 py-2 lg:py-3 sticky left-0 bg-gray-100 min-w-[120px]">Student</th>
                            <th className="px-2 lg:px-4 py-2 lg:py-3 text-center">HW/CW</th>
                            <th className="px-2 lg:px-4 py-2 lg:py-3 text-center">CAT</th>
                            <th className="px-2 lg:px-4 py-2 lg:py-3 text-center">Exam</th>
                            <th className="px-2 lg:px-4 py-2 lg:py-3 text-center">Total</th>
                            <th className="px-2 lg:px-4 py-2 lg:py-3 text-center">Grade</th>
                            <th className="px-2 lg:px-4 py-2 lg:py-3 hidden sm:table-cell">Remark</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                        {activeStudents.map(s => {
                            const row = getRow(s.id);
                            return (
                                <tr key={s.id} className="hover:bg-gray-50">
                                    <td className="px-2 lg:px-4 py-2 font-medium text-gray-900 sticky left-0 bg-white">
                                        <span className="block truncate max-w-[100px] lg:max-w-none">{s.names}</span>
                                        <span className="text-[10px] lg:text-xs text-gray-500 font-normal">{s.student_no}</span>
                                    </td>
                                    <td className="px-2 lg:px-4 py-2 text-center"><ScoreInput value={row.ca1} max={20} onChange={(v) => handleScoreChange(s.id, 'ca1', v)} className="!w-12 lg:!w-16" /></td>
                                    <td className="px-2 lg:px-4 py-2 text-center"><ScoreInput value={row.ca2} max={20} onChange={(v) => handleScoreChange(s.id, 'ca2', v)} className="!w-12 lg:!w-16" /></td>
                                    <td className="px-2 lg:px-4 py-2 text-center"><ScoreInput value={row.exam} max={60} onChange={(v) => handleScoreChange(s.id, 'exam', v)} className="!w-12 lg:!w-16" /></td>
                                    <td className="px-2 lg:px-4 py-2 text-center font-bold"><span className={row.total < 40 ? 'text-red-600' : 'text-gray-900'}>{row.total}</span></td>
                                    <td className="px-2 lg:px-4 py-2 text-center"><span className={`px-1.5 lg:px-2 py-0.5 lg:py-1 rounded text-[10px] lg:text-xs font-bold ${row.grade === 'A' ? 'bg-green-100 text-green-800' : row.grade === 'F' ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'}`}>{row.grade}</span></td>
                                    <td className="px-2 lg:px-4 py-2 text-xs text-gray-500 hidden sm:table-cell">{row.comment}</td>
                                </tr>
                            );
                        })}
                        {activeStudents.length === 0 && <tr><td colSpan={7} className="text-center py-8 text-gray-500">No students in this class.</td></tr>}
                    </tbody>
                </table>
            </div>
        </Card>
    );
};
