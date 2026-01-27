import React, { useState } from 'react';
import { Printer, LayoutList } from 'lucide-react';
import * as Types from '@/lib/types';
import * as Utils from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/select';

interface BroadsheetViewProps {
    students: Types.Student[];
    classes: Types.Class[];
    scores: Types.Score[];
    settings: Types.Settings;
}

export const BroadsheetView: React.FC<BroadsheetViewProps> = ({ students, classes, scores, settings }) => {
    const [selectedClass, setSelectedClass] = useState(classes[0]?.id || '');
    const currentClass = classes.find(c => c.id === selectedClass);
    const activeStudents = students.filter(s => s.class_id === selectedClass);
    const subjects = Utils.getSubjectsForClass(currentClass);

    const sheetData = activeStudents.map(s => {
        const studentScore = scores.find(sc => sc.student_id === s.id && sc.session === settings.current_session && sc.term === settings.current_term);
        const subjectScores: Record<string, number> = {};
        let total = 0;
        subjects.forEach(subj => {
            const row = studentScore?.rows.find(r => r.subject === subj);
            const val = row ? row.total : 0;
            subjectScores[subj] = val;
            total += val;
        });
        return { ...s, scores: subjectScores, total, average: subjects.length > 0 ? total / subjects.length : 0 };
    }).sort((a, b) => b.average - a.average);

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center no-print">
                <div><h1 className="text-2xl font-bold text-gray-900">Master Broadsheet</h1><p className="text-gray-500">Class-wide results analysis</p></div>
                <div className="flex gap-4"><Select value={selectedClass} onChange={e => setSelectedClass(e.target.value)}>{classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</Select><Button onClick={() => window.print()}><Printer className="h-4 w-4 mr-2" /> Print Sheet</Button></div>
            </div>
            <div className="overflow-x-auto bg-white border rounded-lg shadow-sm print:shadow-none print:border-none">
                <div className="p-4 border-b bg-gray-50 text-center print:block hidden">
                    <h2 className="text-xl font-bold uppercase">{settings.school_name}</h2>
                    <p>Broadsheet Report • {currentClass?.name} • {settings.current_session} {settings.current_term}</p>
                </div>
                <table className="w-full text-xs text-left border-collapse">
                    <thead>
                        <tr className="bg-gray-100 text-gray-700">
                            <th className="px-2 py-3 border sticky left-0 bg-gray-100 w-48">Student Name</th>
                            {subjects.map(subj => <th key={subj} className="px-2 py-3 border text-center w-16 rotate-45 h-32 align-bottom pb-2">{subj.substring(0, 15)}</th>)}
                            <th className="px-2 py-3 border text-center font-bold bg-gray-200">Total</th>
                            <th className="px-2 py-3 border text-center font-bold bg-gray-200">Avg</th>
                            <th className="px-2 py-3 border text-center font-bold bg-gray-200">Pos</th>
                        </tr>
                    </thead>
                    <tbody>
                        {sheetData.map((s, idx) => (
                            <tr key={s.id} className="hover:bg-gray-50">
                                <td className="px-2 py-2 border font-medium sticky left-0 bg-white">{s.names}</td>
                                {subjects.map(subj => <td key={subj} className={`px-2 py-2 border text-center ${s.scores[subj] < 40 ? 'text-red-600 font-bold' : ''}`}>{s.scores[subj] || '-'}</td>)}
                                <td className="px-2 py-2 border text-center font-bold bg-gray-50">{s.total}</td>
                                <td className="px-2 py-2 border text-center font-bold bg-gray-50">{s.average.toFixed(1)}</td>
                                <td className="px-2 py-2 border text-center font-bold bg-gray-50">{Utils.ordinalSuffix(idx + 1)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};
