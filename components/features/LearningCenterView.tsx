'use client';

import React, { useState } from 'react';
import { Book, FileText, Plus, Search, ExternalLink, Download, Clock, User as UserIcon } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { useSchoolStore } from '@/lib/store';
import { useLessons, useCreateLesson, useClasses, useSubjects } from '@/lib/hooks/use-data';
import { useToast } from '@/components/providers/toast-provider';
import * as Utils from '@/lib/utils';
import * as Types from '@/lib/types';

export const LearningCenterView: React.FC = () => {
    const { currentUser } = useSchoolStore();
    const { addToast } = useToast();

    // Data
    const { data: lessons = [], isLoading } = useLessons();
    const { data: classes = [] } = useClasses();
    const { data: subjects = [] } = useSubjects();

    // Mutation
    const { mutate: createLesson } = useCreateLesson();

    // State
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedClassFilter, setSelectedClassFilter] = useState('all');
    const [showUploadModal, setShowUploadModal] = useState(false);

    // New Lesson Form State
    const [newLesson, setNewLesson] = useState({
        title: '',
        subject: '',
        student_class: '',
        content: '',
        file_url: ''
    });

    const isTeacher = currentUser?.role === 'teacher';
    const isAdmin = currentUser?.role === 'admin' || currentUser?.role === 'super_admin';
    const canUpload = isTeacher || isAdmin;

    const filteredLessons = lessons.filter((lesson: any) => {
        const matchesSearch = lesson.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            lesson.subject_name?.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesClass = selectedClassFilter === 'all' || lesson.student_class === selectedClassFilter;
        return matchesSearch && matchesClass;
    });

    const handleUpload = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newLesson.title || !newLesson.subject || !newLesson.student_class) {
            addToast('Please fill in all required fields', 'warning');
            return;
        }

        createLesson(newLesson, {
            onSuccess: () => {
                addToast('Lesson uploaded successfully', 'success');
                setShowUploadModal(false);
                setNewLesson({ title: '', subject: '', student_class: '', content: '', file_url: '' });
            },
            onError: () => {
                addToast('Failed to upload lesson', 'error');
            }
        });
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Learning Center</h1>
                    <p className="text-gray-500">Access and manage classroom notes and materials</p>
                </div>
                {canUpload && (
                    <Button onClick={() => setShowUploadModal(true)}>
                        <Plus className="h-4 w-4 mr-2" />
                        Upload Material
                    </Button>
                )}
            </div>

            <Card className="p-4">
                <div className="flex flex-col md:flex-row gap-4">
                    <div className="flex-1 relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search by title or subject..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-brand-500 focus:outline-none"
                        />
                    </div>
                    <div className="w-full md:w-64">
                        <Select
                            value={selectedClassFilter}
                            onChange={(e) => setSelectedClassFilter(e.target.value)}
                        >
                            <option value="all">All Classes</option>
                            {classes.map(c => (
                                <option key={c.id} value={c.id}>{c.name}</option>
                            ))}
                        </Select>
                    </div>
                </div>
            </Card>

            {isLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[1, 2, 3].map(n => <div key={n} className="h-48 bg-gray-100 animate-pulse rounded-xl" />)}
                </div>
            ) : filteredLessons.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredLessons.map((lesson: any) => (
                        <Card key={lesson.id} className="hover:shadow-md transition-shadow group">
                            <div className="p-5">
                                <div className="flex justify-between items-start mb-3">
                                    <div className="bg-brand-50 text-brand-600 p-2 rounded-lg">
                                        <Book className="h-5 w-5" />
                                    </div>
                                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-1 bg-gray-100 text-gray-500 rounded">
                                        {lesson.class_name}
                                    </span>
                                </div>
                                <h3 className="font-bold text-gray-900 line-clamp-1 mb-1">{lesson.title}</h3>
                                <p className="text-xs text-brand-600 font-medium mb-4">{lesson.subject_name}</p>

                                <div className="space-y-2 mb-6">
                                    <div className="flex items-center text-xs text-gray-500">
                                        <UserIcon className="h-3 w-3 mr-2" />
                                        {lesson.teacher_name || 'System'}
                                    </div>
                                    <div className="flex items-center text-xs text-gray-500">
                                        <Clock className="h-3 w-3 mr-2" />
                                        {new Date(lesson.created_at).toLocaleDateString()}
                                    </div>
                                </div>

                                <div className="flex gap-2">
                                    {lesson.file_url ? (
                                        <Button variant="primary" className="flex-1 text-xs" onClick={() => window.open(lesson.file_url)}>
                                            <Download className="h-3 w-3 mr-2" />
                                            Download PDF
                                        </Button>
                                    ) : (
                                        <Button variant="outline" className="flex-1 text-xs pointer-events-none">
                                            Text Only
                                        </Button>
                                    )}
                                    <Button variant="secondary" className="px-3" title="View Details">
                                        <ExternalLink className="h-3 w-3" />
                                    </Button>
                                </div>
                            </div>
                        </Card>
                    ))}
                </div>
            ) : (
                <div className="text-center py-20 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
                    <FileText className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900">No lessons found</h3>
                    <p className="text-gray-500">Try adjusting your search or filters</p>
                </div>
            )}

            {/* Upload Modal */}
            {showUploadModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <Card className="w-full max-w-lg">
                        <div className="p-6">
                            <h2 className="text-xl font-bold mb-6">Upload Learning Material</h2>
                            <form onSubmit={handleUpload} className="space-y-4">
                                <Input
                                    label="Lesson Title"
                                    placeholder="e.g. Introduction to Algebra"
                                    value={newLesson.title}
                                    onChange={e => setNewLesson({ ...newLesson, title: e.target.value })}
                                    required
                                />
                                <div className="grid grid-cols-2 gap-4">
                                    <Select
                                        label="Subject"
                                        value={newLesson.subject}
                                        onChange={e => setNewLesson({ ...newLesson, subject: e.target.value })}
                                        required
                                    >
                                        <option value="">Select Subject</option>
                                        {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                    </Select>
                                    <Select
                                        label="Target Class"
                                        value={newLesson.student_class}
                                        onChange={e => setNewLesson({ ...newLesson, student_class: e.target.value })}
                                        required
                                    >
                                        <option value="">Select Class</option>
                                        {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                    </Select>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-sm font-medium text-gray-700">Material Description (Optional)</label>
                                    <textarea
                                        className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-brand-500 focus:outline-none min-h-[100px]"
                                        value={newLesson.content}
                                        onChange={e => setNewLesson({ ...newLesson, content: e.target.value })}
                                    />
                                </div>
                                <Input
                                    label="File URL (PDF/Doc)"
                                    placeholder="Link to file on GDrive/Dropbox/S3"
                                    value={newLesson.file_url}
                                    onChange={e => setNewLesson({ ...newLesson, file_url: e.target.value })}
                                />

                                <div className="flex gap-3 pt-4">
                                    <Button type="button" variant="secondary" className="flex-1" onClick={() => setShowUploadModal(false)}>Cancel</Button>
                                    <Button type="submit" className="flex-1">Upload Material</Button>
                                </div>
                            </form>
                        </div>
                    </Card>
                </div>
            )}
        </div>
    );
};
