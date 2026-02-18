'use client';

import React, { useState, useMemo } from 'react';
import { useClasses, useTimetables, useCreateTimetableEntry, useSubjects, useTeachers } from '@/lib/hooks/use-data';
import { useQuery } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';
import * as Types from '@/lib/types';
import { Loader2, Plus, Calendar, User, BookOpen, AlertCircle, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/providers/toast-provider';

// Fetch Periods Hook (Custom)
function usePeriods() {
    return useQuery({
        queryKey: ['periods', 'v2'],
        queryFn: async () => {
            const res = await apiClient.get('/periods/');
            return (res.data.results || res.data) as Types.Period[];
        }
    });
}

export const TimetableBuilder = () => {
    const { data: classes = [] } = useClasses();
    const { data: subjects = [] } = useSubjects();
    const { data: teachers = [] } = useTeachers();
    const { data: periods = [] } = usePeriods();
    const [selectedClassId, setSelectedClassId] = useState<string>('');
    const [isSettingUp, setIsSettingUp] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);
    const { addToast } = useToast();

    // Fetch Timetable for selected class
    const { data: timetables = [], isLoading: isLoadingTimetable } = useTimetables(selectedClassId);

    // Create/Update Logic
    const createEntryMutation = useCreateTimetableEntry();

    const activeTimetable = timetables.length > 0 ? timetables[0] : null;

    // Grid Configuration
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
    const sortedPeriods = useMemo(() =>
        [...periods].sort((a, b) => a.start_time.localeCompare(b.start_time)),
        [periods]);

    // Modal State
    const [editingCell, setEditingCell] = useState<{ day: string, periodId: string } | null>(null);
    const [formSubjectId, setFormSubjectId] = useState('');
    const [formTeacherId, setFormTeacherId] = useState('');

    const handleCellClick = (day: string, periodId: string) => {
        const existing = activeTimetable?.entries.find(e => e.day_of_week === day && e.period === periodId);
        setFormSubjectId(existing?.subject || '');
        setFormTeacherId(existing?.teacher || '');
        setEditingCell({ day, periodId });
    };

    const handleSaveEntry = async () => {
        if (!activeTimetable || !editingCell || !formSubjectId) return;

        // Optimistic / Mutation
        await createEntryMutation.mutateAsync({
            timetable: activeTimetable.id,
            day_of_week: editingCell.day,
            period: editingCell.periodId,
            subject: formSubjectId,
            teacher: formTeacherId || undefined, // Send undefined if empty to nullify? Backend logic might need explicit null
        });

        setEditingCell(null);
    };

    const handleAIGenerate = async () => {
        setIsGenerating(true);
        try {
            const res = await apiClient.post('/timetables/magic-generate/');
            addToast(res.data.message || 'Timetable generated successfully!', 'success');
            window.location.reload();
        } catch (error) {
            console.error('AI Generation Failed:', error);
            addToast('Failed to generate timetable. Please ensure periods and teachers are set up.', 'error');
        } finally {
            setIsGenerating(false);
        }
    };

    if (!selectedClassId) {
        // Show Period Setup if no periods exist
        if (periods.length === 0) {
            const handleSetupDefaults = async () => {
                setIsSettingUp(true);
                try {
                    await apiClient.post('/periods/setup-defaults/');
                    window.location.reload();
                } catch (error) {
                    console.error('Failed to setup default periods:', error);
                    alert('Failed to setup default periods. Please try again.');
                } finally {
                    setIsSettingUp(false);
                }
            };

            return (
                <div className="p-12 text-center bg-white rounded-xl border border-gray-100 shadow-sm flex flex-col items-center">
                    <div className="bg-brand-50 p-4 rounded-full mb-4">
                        <Calendar className="w-8 h-8 text-brand-600" />
                    </div>
                    <h2 className="text-xl font-bold text-gray-900 mb-2">Setup School Timetable</h2>
                    <p className="text-gray-500 mb-6 max-w-md">Before you can create class schedules, you need to define the school's periods (e.g., Period 1, Break, Lunch).</p>
                    <div className="p-4 bg-yellow-50 text-yellow-800 text-sm rounded-lg mb-6 max-w-md">
                        <strong>Note:</strong> We can auto-generate a standard schedule for you. Click the button below to get started. If you need custom periods, please contact support or use the backend admin.
                    </div>
                    <Button onClick={handleSetupDefaults} disabled={isSettingUp}>
                        {isSettingUp ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Setting up...
                            </>
                        ) : (
                            'Setup Default Schedule'
                        )}
                    </Button>
                </div>
            );
        }

        return (
            <div className="p-8 text-center bg-white rounded-xl border border-gray-100 shadow-sm">
                <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <h2 className="text-lg font-bold text-gray-900 mb-2">Select a Class</h2>
                <p className="text-gray-500 mb-6">Choose a class to manage their weekly schedule.</p>
                <select
                    className="p-3 border rounded-lg max-w-xs mx-auto w-full bg-gray-50 font-medium"
                    onChange={(e) => setSelectedClassId(e.target.value)}
                    value={selectedClassId}
                >
                    <option value="">-- Select Class --</option>
                    {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
            </div>
        );
    }

    if (isLoadingTimetable) {
        return <div className="p-12 flex justify-center"><Loader2 className="animate-spin text-brand-600" /></div>;
    }

    // If no timetable exists for class, strictly we should show a "Create Timetable" button.
    // For now, assuming backend auto-creates or we specific UI for it.
    // (MVP: If empty, maybe show "No Active Timetable")
    if (!activeTimetable && timetables.length === 0) {
        return (
            <div className="p-8 bg-yellow-50 rounded-xl border border-yellow-100 text-center">
                <AlertCircle className="w-10 h-10 text-yellow-600 mx-auto mb-3" />
                <h3 className="font-bold text-yellow-800">No Timetable Found</h3>
                <p className="text-yellow-600 mb-4">This class doesn't have an active timetable yet.</p>
                <Button onClick={() => apiClient.post('/timetables/', {
                    title: 'General Timetable',
                    student_class: selectedClassId,
                    is_active: true
                }).then(() => window.location.reload())}>
                    Create Timetable
                </Button>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-gray-200">
                <div>
                    <span className="text-xs font-bold text-gray-500 uppercase">Managing</span>
                    <h2 className="text-xl font-black text-gray-900">{classes.find(c => c.id === selectedClassId)?.name}</h2>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => setSelectedClassId('')}>Change Class</Button>
                    <Button
                        size="sm"
                        onClick={handleAIGenerate}
                        disabled={isGenerating}
                        className="bg-brand-900 hover:bg-black text-white gap-2 border-brand-800"
                    >
                        {isGenerating ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                            <Sparkles className="h-4 w-4 text-brand-300 fill-brand-300" />
                        )}
                        AI Magic Generate
                    </Button>
                    <Button size="sm">Publish</Button>
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-x-auto">
                <table className="w-full min-w-[800px] border-collapse">
                    <thead>
                        <tr>
                            <th className="p-3 border-b border-r bg-gray-50 text-left text-xs font-bold text-gray-500 uppercase w-32 sticky left-0 z-10">
                                Time / Period
                            </th>
                            {days.map(day => (
                                <th key={day} className="p-3 border-b bg-gray-50 text-center text-xs font-bold text-gray-500 uppercase w-[18%]">
                                    {day}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {sortedPeriods.map(period => (
                            <tr key={period.id} className="border-b last:border-0 hover:bg-gray-50/50">
                                <td className="p-3 border-r bg-gray-50/30 sticky left-0 font-medium text-sm">
                                    <div className="font-bold text-gray-900">{period.name}</div>
                                    <div className="text-xs text-gray-500">{period.start_time} - {period.end_time}</div>
                                    {period.category !== 'Regular' && (
                                        <span className="inline-block mt-1 px-2 py-0.5 bg-gray-200 text-gray-600 text-[10px] rounded-full uppercase">
                                            {period.category}
                                        </span>
                                    )}
                                </td>
                                {days.map(day => {
                                    // Find entry
                                    const entry = activeTimetable?.entries.find(e => e.day_of_week === day && e.period === period.id);

                                    // Check formatting or category
                                    if (period.category !== 'Regular') {
                                        return (
                                            <td key={day} className="bg-gray-100 p-2 text-center text-gray-400 text-xs italic">
                                                {period.category}
                                            </td>
                                        );
                                    }

                                    return (
                                        <td
                                            key={day}
                                            onClick={() => handleCellClick(day, period.id)}
                                            className="p-2 border-r last:border-0 cursor-pointer hover:bg-brand-50 transition-colors relative group h-24 align-top"
                                        >
                                            {entry ? (
                                                <div className="h-full flex flex-col justify-between p-1 bg-white border border-brand-100 rounded-lg shadow-sm group-hover:border-brand-300">
                                                    <div className="flex items-start gap-1">
                                                        <BookOpen size={12} className="text-brand-500 mt-0.5 shrink-0" />
                                                        <span className="font-bold text-sm text-gray-900 leading-tight">
                                                            {/* Map ID to Name using subjects list */}
                                                            {subjects.find(s => s.id === entry.subject)?.name || entry.subject_name || 'Subject'}
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center gap-1 mt-1">
                                                        <User size={12} className="text-gray-400 shrink-0" />
                                                        <span className="text-xs text-gray-600 truncate">
                                                            {teachers.find(t => String(t.id) === String(entry.teacher))?.name || entry.teacher_name || 'No Teacher'}
                                                        </span>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="h-full flex items-center justify-center opacity-0 group-hover:opacity-100">
                                                    <div className="bg-brand-100 text-brand-600 p-1.5 rounded-full">
                                                        <Plus size={16} />
                                                    </div>
                                                </div>
                                            )}
                                        </td>
                                    );
                                })}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Editing Modal (Simple Overlay) */}
            {editingCell && (
                <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-md animate-in fade-in zoom-in duration-200">
                        <h3 className="text-lg font-bold mb-4">
                            Edit Schedule: <span className="text-brand-600">{editingCell.day}</span>
                        </h3>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
                                <select
                                    className="w-full p-2.5 border rounded-lg bg-gray-50"
                                    value={formSubjectId}
                                    onChange={(e) => setFormSubjectId(e.target.value)}
                                >
                                    <option value="">-- Select Subject --</option>
                                    {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Teacher</label>
                                <select
                                    className="w-full p-2.5 border rounded-lg bg-gray-50"
                                    value={formTeacherId}
                                    onChange={(e) => setFormTeacherId(e.target.value)}
                                >
                                    <option value="">-- Default (Class/Subject Teacher) --</option>
                                    {teachers.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                                </select>
                            </div>
                        </div>

                        <div className="flex justify-end gap-3 mt-8">
                            <Button variant="ghost" onClick={() => setEditingCell(null)}>Cancel</Button>
                            <Button onClick={handleSaveEntry} disabled={!formSubjectId}>Save Entry</Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
