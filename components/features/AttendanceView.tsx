import React, { useState, useEffect } from 'react';
import { Save, Calendar as CalendarIcon, Lock, AlertCircle } from 'lucide-react';
import * as Types from '@/lib/types';
import * as Utils from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { useToast } from '@/components/providers/toast-provider';

interface AttendanceViewProps {
    students: Types.Student[];
    classes: Types.Class[];
    attendance: Types.Attendance[];
    settings: Types.Settings;
    onSave: (att: Types.Attendance) => void;
}

export const AttendanceView: React.FC<AttendanceViewProps> = ({
    students, classes, attendance, settings, onSave
}) => {
    const [selectedClass, setSelectedClass] = useState(classes[0]?.id || '');
    const [date, setDate] = useState(Utils.getTodayString());
    const { addToast } = useToast();
    const activeStudents = students.filter(s => s.class_id === selectedClass);
    const existingRecord: Types.Attendance | undefined = attendance.find((a: Types.Attendance) => a.class_id === selectedClass && a.date === date);
    const [currentStatuses, setCurrentStatuses] = useState<Record<string, 'present' | 'absent' | 'late'>>({});

    const isTermMismatch = existingRecord && existingRecord.term !== settings.current_term;
    const isLocked = !!existingRecord && !isTermMismatch;

    useEffect(() => {
        const initial: Record<string, 'present' | 'absent' | 'late'> = {};
        activeStudents.forEach(s => {
            const rec = existingRecord?.records.find(r => r.student_id === s.id);
            initial[s.id] = rec ? rec.status : 'present';
        });
        setCurrentStatuses(initial);
    }, [selectedClass, date, existingRecord, activeStudents.length]);

    const handleSave = () => {
        if (isLocked) return; // Prevent overwriting
        const records = activeStudents.map(s => ({ student_id: s.id, status: currentStatuses[s.id] || 'present' }));
        const newEntry: Types.Attendance = {
            id: existingRecord?.id || Utils.generateId(), date, class_id: selectedClass, session: settings.current_session, term: settings.current_term, records, created_at: existingRecord?.created_at || Date.now(), updated_at: Date.now()
        };
        onSave(newEntry);
        addToast('Attendance saved successfully', 'success');
    };

    // Fix term mismatch by updating the existing record to the current term
    const handleFixTerm = () => {
        if (!existingRecord) return;
        const updatedEntry: Types.Attendance = {
            ...existingRecord,
            term: settings.current_term,
            session: settings.current_session, // Ensure session matches too
            updated_at: Date.now()
        };
        onSave(updatedEntry);
        addToast('Attendance moved to current term', 'success');
    };

    const markAll = (status: 'present' | 'absent') => {
        if (isLocked) return;
        const update = { ...currentStatuses };
        activeStudents.forEach(s => update[s.id] = status);
        setCurrentStatuses(update);
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div><h1 className="text-2xl font-bold text-gray-900">Attendance Register</h1><p className="text-gray-500">Daily roll call management</p></div>
                <Button onClick={handleSave} disabled={isLocked} variant={isLocked ? "secondary" : "primary"}>
                    {isLocked ? <Lock className="h-4 w-4 mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                    {isLocked ? 'Register Locked' : 'Save Register'}
                </Button>
            </div>
            <Card>
                <div className="flex gap-4 mb-6 items-end border-b pb-4">
                    <div className="w-64"><Select label="Class" value={selectedClass} onChange={e => setSelectedClass(e.target.value)}>{classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</Select></div>
                    <div className="w-64"><Input label="Date" type="date" value={date} onChange={e => setDate(e.target.value)} /></div>

                    {/* Retroactive Marking Status */}
                    <div className="flex-1 flex flex-col items-end gap-2">
                        {isTermMismatch ? (
                            <div className="flex flex-col items-end gap-1">
                                <div className="flex items-center text-amber-600 bg-amber-50 px-3 py-1 rounded text-sm font-medium">
                                    <AlertCircle className="h-4 w-4 mr-2" />
                                    Term Mismatch: Saved in {existingRecord?.term}
                                </div>
                                <Button size="sm" variant="outline" onClick={handleFixTerm}>
                                    Move to {settings.current_term}
                                </Button>
                            </div>
                        ) : existingRecord ? (
                            <div className="flex items-center text-amber-600 bg-amber-50 px-3 py-1 rounded text-sm font-medium">
                                <Lock className="h-4 w-4 mr-2" />
                                Register Locked (Already Marked)
                            </div>
                        ) : (
                            <div className="flex items-center text-green-600 bg-green-50 px-3 py-1 rounded text-sm font-medium">
                                <AlertCircle className="h-4 w-4 mr-2" />
                                Retroactive Marking Active
                            </div>
                        )}

                        {!existingRecord && (
                            <div className="flex gap-2">
                                <Button size="sm" variant="secondary" onClick={() => markAll('present')}>Mark All Present</Button>
                                <Button size="sm" variant="secondary" onClick={() => markAll('absent')}>Mark All Absent</Button>
                            </div>
                        )}
                    </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {activeStudents.map(s => (
                        <div key={s.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50">
                            <div><div className="font-bold text-gray-900">{s.names}</div><div className="text-xs text-gray-500">{s.student_no}</div></div>
                            <div className="flex bg-gray-100 rounded-md p-1">
                                {(['present', 'late', 'absent'] as const).map(status => (
                                    <button
                                        key={status}
                                        disabled={isLocked}
                                        onClick={() => setCurrentStatuses(prev => ({ ...prev, [s.id]: status }))}
                                        className={`px-3 py-1 text-xs font-medium rounded capitalize transition-colors ${currentStatuses[s.id] === status ? (status === 'present' ? 'bg-green-500 text-white' : status === 'late' ? 'bg-yellow-500 text-white' : 'bg-red-500 text-white') : 'text-gray-500 hover:bg-gray-200'} ${isLocked ? 'opacity-50 cursor-not-allowed' : ''}`}
                                    >
                                        {status}
                                    </button>
                                ))}
                            </div>
                        </div>
                    ))}
                    {activeStudents.length === 0 && <p className="text-gray-500 italic col-span-3 text-center py-8">No students in this class.</p>}
                </div>
            </Card>
        </div>
    );
};
