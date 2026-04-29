'use client';

import React, { useState } from 'react';
import { FileText, Plus, Search, Calendar, Clock, Users, CheckCircle, XCircle, AlertCircle, Play, Pause, Eye } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys, fetchAll } from '@/lib/hooks/use-data';
import { useSchoolStore } from '@/lib/store';
import { Modal } from '@/components/ui/modal';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import apiClient from '@/lib/api-client';
import { useToast } from '@/components/providers/toast-provider';

const STATUS_CONFIG = {
    draft: { label: 'Draft', color: 'bg-gray-100 text-gray-700 border-gray-200', icon: FileText },
    scheduled: { label: 'Scheduled', color: 'bg-blue-100 text-blue-700 border-blue-200', icon: Clock },
    active: { label: 'Active', color: 'bg-green-100 text-green-700 border-green-200', icon: Play },
    completed: { label: 'Completed', color: 'bg-purple-100 text-purple-700 border-purple-200', icon: CheckCircle },
    cancelled: { label: 'Cancelled', color: 'bg-red-100 text-red-700 border-red-200', icon: XCircle },
};

export default function ExamsPage() {
    const { currentRole } = useSchoolStore();
    const queryClient = useQueryClient();
    const { addToast } = useToast();
    const [searchTerm, setSearchTerm] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [formData, setFormData] = useState({
        title: '',
        subject: '',
        class_level: '',
        start_date: '',
        start_time: '',
        duration: '',
        pass_mark: '',
        total_marks: '',
        instructions: '',
    });

    const { data: exams = [], isLoading } = useQuery({
        queryKey: queryKeys.exams,
        queryFn: () => fetchAll<any>('learning/exams/'),
    });

    const createExam = useMutation({
        mutationFn: async (data: typeof formData) => {
            const payload = {
                ...data,
                duration: data.duration ? parseInt(data.duration) : null,
                pass_mark: data.pass_mark ? parseInt(data.pass_mark) : null,
                total_marks: data.total_marks ? parseInt(data.total_marks) : null,
            };
            const response = await apiClient.post('learning/exams/', payload);
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.exams });
            setShowModal(false);
            setFormData({ title: '', subject: '', class_level: '', start_date: '', start_time: '', duration: '', pass_mark: '', total_marks: '', instructions: '' });
            addToast('Exam created successfully', 'success');
        },
        onError: () => {
            addToast('Failed to create exam', 'error');
        },
    });

    const filteredExams = exams.filter((exam: any) =>
        exam.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        exam.subject_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        exam.class_level?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const isAdmin = currentRole === 'admin' || currentRole === 'super_admin' || currentRole === 'teacher';

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        createExam.mutate(formData);
    };

    // Stats
    const draftCount = exams.filter((e: any) => e.status === 'draft').length;
    const scheduledCount = exams.filter((e: any) => e.status === 'scheduled').length;
    const activeCount = exams.filter((e: any) => e.status === 'active').length;
    const completedCount = exams.filter((e: any) => e.status === 'completed').length;

    const getStatusConfig = (status: string) => STATUS_CONFIG[status as keyof typeof STATUS_CONFIG] || STATUS_CONFIG.draft;

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Formal Exams</h1>
                    <p className="text-gray-600">Create and manage written examinations</p>
                </div>
                {isAdmin && (
                    <button 
                        onClick={() => setShowModal(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 shadow-md"
                    >
                        <Plus className="h-4 w-4" />
                        Create Exam
                    </button>
                )}
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-gradient-to-br from-slate-500 to-slate-600 p-5 rounded-xl text-white shadow-lg">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-slate-200 text-sm">Total Exams</p>
                            <p className="text-3xl font-bold">{exams.length}</p>
                        </div>
                        <div className="p-3 bg-white/20 rounded-xl"><FileText className="h-6 w-6" /></div>
                    </div>
                </div>
                <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-5 rounded-xl text-white shadow-lg">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-blue-100 text-sm">Scheduled</p>
                            <p className="text-3xl font-bold">{scheduledCount}</p>
                        </div>
                        <div className="p-3 bg-white/20 rounded-xl"><Clock className="h-6 w-6" /></div>
                    </div>
                </div>
                <div className="bg-gradient-to-br from-green-500 to-green-600 p-5 rounded-xl text-white shadow-lg">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-green-100 text-sm">Active</p>
                            <p className="text-3xl font-bold">{activeCount}</p>
                        </div>
                        <div className="p-3 bg-white/20 rounded-xl"><Play className="h-6 w-6" /></div>
                    </div>
                </div>
                <div className="bg-gradient-to-br from-purple-500 to-purple-600 p-5 rounded-xl text-white shadow-lg">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-purple-100 text-sm">Completed</p>
                            <p className="text-3xl font-bold">{completedCount}</p>
                        </div>
                        <div className="p-3 bg-white/20 rounded-xl"><CheckCircle className="h-6 w-6" /></div>
                    </div>
                </div>
            </div>

            {/* Add Exam Modal */}
            <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Create New Exam" size="lg">
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">Exam Title</label>
                        <Input placeholder="e.g., JSS1 Mathematics Mid-Term Exam" required value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-1">Subject</label>
                            <Input placeholder="Subject name" required value={formData.subject} onChange={(e) => setFormData({ ...formData, subject: e.target.value })} />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Class/Level</label>
                            <Input placeholder="e.g., JSS1" required value={formData.class_level} onChange={(e) => setFormData({ ...formData, class_level: e.target.value })} />
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-1">Start Date</label>
                            <Input type="date" required value={formData.start_date} onChange={(e) => setFormData({ ...formData, start_date: e.target.value })} />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Start Time</label>
                            <Input type="time" required value={formData.start_time} onChange={(e) => setFormData({ ...formData, start_time: e.target.value })} />
                        </div>
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-1">Duration (min)</label>
                            <Input type="number" placeholder="60" required value={formData.duration} onChange={(e) => setFormData({ ...formData, duration: e.target.value })} />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Pass Mark (%)</label>
                            <Input type="number" placeholder="50" value={formData.pass_mark} onChange={(e) => setFormData({ ...formData, pass_mark: e.target.value })} />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Total Marks</label>
                            <Input type="number" placeholder="100" value={formData.total_marks} onChange={(e) => setFormData({ ...formData, total_marks: e.target.value })} />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Instructions</label>
                        <textarea className="w-full border rounded-md px-3 py-2" rows={2} placeholder="Instructions for students..." value={formData.instructions} onChange={(e) => setFormData({ ...formData, instructions: e.target.value })} />
                    </div>
                    <div className="flex gap-2 justify-end">
                        <Button type="button" variant="secondary" onClick={() => setShowModal(false)}>Cancel</Button>
                        <Button type="submit" className="bg-brand-600 hover:bg-brand-700" disabled={createExam.isPending}>
                            {createExam.isPending ? 'Creating...' : 'Create Exam'}
                        </Button>
                    </div>
                </form>
            </Modal>

            {/* Search & Filter */}
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                    type="text"
                    placeholder="Search exams by title, subject, or class..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
                />
            </div>

            {/* Exams Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {isLoading ? (
                    <p className="col-span-full text-center py-8 text-gray-500">Loading...</p>
                ) : filteredExams.length === 0 ? (
                    <div className="col-span-full text-center py-12">
                        <FileText className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                        <p className="text-gray-500 text-lg">No exams found</p>
                        <p className="text-gray-400 text-sm">Create your first exam to get started</p>
                    </div>
                ) : (
                    filteredExams.map((exam: any) => {
                        const statusConfig = getStatusConfig(exam.status);
                        const StatusIcon = statusConfig.icon;
                        
                        return (
                            <div key={exam.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-lg transition">
                                <div className="h-2 bg-gradient-to-r from-brand-500 to-brand-600" />
                                <div className="p-5">
                                    <div className="flex items-start justify-between mb-3">
                                        <div className="p-2 bg-brand-50 rounded-lg">
                                            <FileText className="h-5 w-5 text-brand-600" />
                                        </div>
                                        <span className={`px-2 py-1 text-xs font-medium rounded-full border ${statusConfig.color}`}>
                                            <StatusIcon className="h-3 w-3 inline mr-1" />
                                            {statusConfig.label}
                                        </span>
                                    </div>
                                    
                                    <h3 className="font-bold text-lg text-gray-900 mb-1 line-clamp-1">{exam.title}</h3>
                                    <p className="text-sm text-gray-500 mb-3">{exam.subject_name} • {exam.class_level}</p>
                                    
                                    <div className="grid grid-cols-3 gap-2 mb-4 text-center">
                                        <div className="bg-gray-50 rounded-lg p-2">
                                            <Calendar className="h-4 w-4 text-gray-400 mx-auto mb-1" />
                                            <p className="text-xs text-gray-500">Date</p>
                                            <p className="text-xs font-medium">{exam.start_date || '-'}</p>
                                        </div>
                                        <div className="bg-gray-50 rounded-lg p-2">
                                            <Clock className="h-4 w-4 text-gray-400 mx-auto mb-1" />
                                            <p className="text-xs text-gray-500">Duration</p>
                                            <p className="text-xs font-medium">{exam.duration ? `${exam.duration}min` : '-'}</p>
                                        </div>
                                        <div className="bg-gray-50 rounded-lg p-2">
                                            <FileText className="h-4 w-4 text-gray-400 mx-auto mb-1" />
                                            <p className="text-xs text-gray-500">Marks</p>
                                            <p className="text-xs font-medium">{exam.total_marks || '-'}</p>
                                        </div>
                                    </div>
                                    
                                    {exam.instructions && (
                                        <p className="text-sm text-gray-600 mb-3 line-clamp-2 bg-gray-50 p-2 rounded">
                                            {exam.instructions}
                                        </p>
                                    )}
                                    
                                    <div className="flex items-center justify-between pt-3 border-t">
                                        <div className="flex items-center gap-2 text-sm text-gray-500">
                                            <Users className="h-4 w-4" />
                                            <span>{exam.enrolled_students || 0} students</span>
                                        </div>
                                        {isAdmin && (
                                            <button className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-brand-600 bg-brand-50 rounded-lg hover:bg-brand-100 transition">
                                                <Eye className="h-4 w-4" />
                                                View
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
}