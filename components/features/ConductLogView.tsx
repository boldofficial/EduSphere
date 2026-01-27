'use client';

import React, { useState } from 'react';
import { ShieldCheck, User as UserIcon, Calendar as CalendarIcon, History, Plus, Search, Star, MessageSquare } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { useSchoolStore } from '@/lib/store';
import { useStudents, useConductEntries, useCreateConductEntry, useClasses } from '@/lib/hooks/use-data';
import { useToast } from '@/components/providers/toast-provider';
import * as Utils from '@/lib/utils';
import * as Types from '@/lib/types';

export const ConductLogView: React.FC = () => {
    const { addToast } = useToast();
    const { currentUser } = useSchoolStore();

    // Data
    const { data: students = [] } = useStudents();
    const { data: classes = [] } = useClasses();
    const { data: conductEntries = [] } = useConductEntries();

    // Mutation
    const { mutate: createConductEntry } = useCreateConductEntry();

    // State
    const [selectedClass, setSelectedClass] = useState(classes[0]?.id || '');
    const [selectedStudentId, setSelectedStudentId] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [showLogModal, setShowLogModal] = useState(false);

    // New Log Form State
    const [newLog, setNewLog] = useState({
        student: '',
        trait: 'Punctuality',
        score: 5,
        remark: ''
    });

    const activeStudents = students.filter(s => s.class_id === selectedClass);
    const selectedStudent = students.find(s => s.id === selectedStudentId);
    const studentLogs = conductEntries.filter((entry: any) => entry.student === selectedStudentId);

    const handleAddLog = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newLog.student || !newLog.trait) {
            addToast('Please select a student and trait', 'warning');
            return;
        }

        createConductEntry(newLog, {
            onSuccess: () => {
                addToast('Conduct log added', 'success');
                setShowLogModal(false);
                setNewLog({ ...newLog, remark: '', score: 5 });
            },
            onError: () => {
                addToast('Failed to add log', 'error');
            }
        });
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Conduct & Discipline</h1>
                    <p className="text-gray-500">Track student behavioral traits and disciplinary records</p>
                </div>
                {(currentUser?.role === 'teacher' || currentUser?.role === 'admin') && (
                    <Button onClick={() => setShowLogModal(true)}>
                        <Plus className="h-4 w-4 mr-2" />
                        Log New Entry
                    </Button>
                )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Student Selector */}
                <div className="lg:col-span-1 space-y-4">
                    <Card title="Select Student">
                        <div className="space-y-4">
                            <Select label="Class" value={selectedClass} onChange={e => setSelectedClass(e.target.value)}>
                                {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                            </Select>
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Search student..."
                                    value={searchQuery}
                                    onChange={e => setSearchQuery(e.target.value)}
                                    className="w-full pl-9 pr-3 py-2 text-sm border rounded-md focus:ring-2 focus:ring-brand-500 focus:outline-none"
                                />
                            </div>
                            <div className="space-y-1 max-h-[500px] overflow-y-auto border rounded-md">
                                {activeStudents.filter(s => s.names.toLowerCase().includes(searchQuery.toLowerCase())).map(s => (
                                    <button
                                        key={s.id}
                                        onClick={() => setSelectedStudentId(s.id)}
                                        className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-50 flex items-center justify-between ${selectedStudentId === s.id ? 'bg-brand-50 text-brand-700 font-medium' : 'text-gray-700'}`}
                                    >
                                        <div className="flex items-center">
                                            <div className="h-2 w-2 rounded-full bg-green-500 mr-2" />
                                            {s.names}
                                        </div>
                                        <span className="text-[10px] text-gray-400 font-mono">{s.student_no}</span>
                                    </button>
                                ))}
                                {activeStudents.length === 0 && <p className="p-4 text-center text-xs text-gray-400 italic">No students found</p>}
                            </div>
                        </div>
                    </Card>
                </div>

                {/* Log History */}
                <div className="lg:col-span-2 space-y-6">
                    {selectedStudent ? (
                        <>
                            <Card className="bg-gradient-to-r from-brand-600 to-brand-800 text-white p-6 border-none overflow-hidden relative">
                                <ShieldCheck className="absolute right-[-10px] top-[-10px] h-32 w-32 text-white/10 rotate-12" />
                                <div className="relative z-10 flex items-center gap-4">
                                    <div className="h-16 w-16 rounded-full bg-white/20 flex items-center justify-center border-2 border-white/30">
                                        <UserIcon className="h-8 w-8" />
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-bold">{selectedStudent.names}</h2>
                                        <p className="text-brand-100 text-sm">Conduct Summary for {Utils.INITIAL_SETTINGS.current_session}</p>
                                    </div>
                                </div>
                            </Card>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <Card className="p-4 flex items-center gap-4">
                                    <div className="h-10 w-10 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center font-bold">
                                        {studentLogs.length}
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">Total Entries</p>
                                        <p className="font-bold text-gray-900">Behavioral Record</p>
                                    </div>
                                </Card>
                                <Card className="p-4 flex items-center gap-4">
                                    <div className="h-10 w-10 bg-amber-50 text-amber-600 rounded-lg flex items-center justify-center font-bold">
                                        {(studentLogs.reduce((acc: number, l: any) => acc + l.score, 0) / (studentLogs.length || 1)).toFixed(1)}
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">Average Rating</p>
                                        <p className="font-bold text-gray-900">Conduct Score</p>
                                    </div>
                                </Card>
                            </div>

                            <Card title="Behavioral History">
                                <div className="space-y-4">
                                    {studentLogs.length > 0 ? (
                                        studentLogs.sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime()).map((log: any) => (
                                            <div key={log.id} className="p-4 bg-gray-50 rounded-xl border border-gray-100 hover:border-brand-200 transition-colors">
                                                <div className="flex justify-between items-start mb-2">
                                                    <div>
                                                        <span className="text-xs font-bold text-brand-600 uppercase tracking-wide mr-2">{log.trait}</span>
                                                        <span className="text-xs text-gray-400 flex items-center inline-flex">
                                                            <CalendarIcon className="h-3 w-3 mr-1" />
                                                            {new Date(log.date).toLocaleDateString()}
                                                        </span>
                                                    </div>
                                                    <div className="flex gap-0.5">
                                                        {[1, 2, 3, 4, 5].map(n => (
                                                            <Star key={n} className={`h-3 w-3 ${n <= log.score ? 'text-amber-400 fill-amber-400' : 'text-gray-200'}`} />
                                                        ))}
                                                    </div>
                                                </div>
                                                <p className="text-sm text-gray-700 leading-relaxed mb-3">
                                                    {log.remark || 'No specific remark recorded.'}
                                                </p>
                                                <div className="flex items-center text-[10px] text-gray-400 font-medium">
                                                    <MessageSquare className="h-3 w-3 mr-1.5" />
                                                    Logged by {log.recorded_by_name || 'System Admin'}
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="text-center py-12 text-gray-400">
                                            <History className="h-8 w-8 mx-auto mb-2 opacity-50" />
                                            <p className="text-sm italic">No conduct entries for this student yet.</p>
                                        </div>
                                    )}
                                </div>
                            </Card>
                        </>
                    ) : (
                        <div className="h-[400px] border-2 border-dashed border-gray-200 rounded-2xl flex flex-col items-center justify-center text-gray-400">
                            <UserIcon className="h-10 w-10 mb-4 opacity-50" />
                            <p>Select a student to view their conduct record</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Log Modal */}
            {showLogModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <Card className="w-full max-w-lg">
                        <div className="p-6">
                            <h2 className="text-xl font-bold mb-6">New Conduct Entry</h2>
                            <form onSubmit={handleAddLog} className="space-y-4">
                                <Select
                                    label="Student"
                                    value={newLog.student}
                                    onChange={e => setNewLog({ ...newLog, student: e.target.value })}
                                    required
                                >
                                    <option value="">Select Student</option>
                                    {activeStudents.map(s => <option key={s.id} value={s.id}>{s.names}</option>)}
                                </Select>

                                <div className="grid grid-cols-2 gap-4">
                                    <Select
                                        label="Behavioral Trait"
                                        value={newLog.trait}
                                        onChange={e => setNewLog({ ...newLog, trait: e.target.value })}
                                    >
                                        {Utils.DOMAINS_AFFECTIVE.map(trait => <option key={trait} value={trait}>{trait}</option>)}
                                        <option value="Discipline">Discipline</option>
                                        <option value="Uniform/Neatness">Uniform/Neatness</option>
                                        <option value="Social Relation">Social Relation</option>
                                    </Select>
                                    <Select
                                        label="Rating (1-5)"
                                        value={newLog.score}
                                        onChange={e => setNewLog({ ...newLog, score: parseInt(e.target.value) })}
                                    >
                                        <option value="5">5 - Excellent</option>
                                        <option value="4">4 - Very Good</option>
                                        <option value="3">3 - Good</option>
                                        <option value="2">2 - Fair</option>
                                        <option value="1">1 - Poor</option>
                                    </Select>
                                </div>

                                <div className="space-y-1">
                                    <label className="text-sm font-medium text-gray-700">Detailed Remark</label>
                                    <textarea
                                        className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-brand-500 focus:outline-none min-h-[100px]"
                                        placeholder="Enter details about this observation..."
                                        value={newLog.remark}
                                        onChange={e => setNewLog({ ...newLog, remark: e.target.value })}
                                    />
                                </div>

                                <div className="flex gap-3 pt-4">
                                    <Button type="button" variant="secondary" className="flex-1" onClick={() => setShowLogModal(false)}>Cancel</Button>
                                    <Button type="submit" className="flex-1">Save Entry</Button>
                                </div>
                            </form>
                        </div>
                    </Card>
                </div>
            )}
        </div>
    );
};
