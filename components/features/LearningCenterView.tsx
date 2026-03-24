'use client';

import React, { useState } from 'react';
import { Book, FileText, Plus, Search, ExternalLink, Download, Clock, User as UserIcon, ArrowLeft } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { useSchoolStore } from '@/lib/store';
import { useLessons, useCreateLesson, useClasses, useSubjects } from '@/lib/hooks/use-data';
import { useToast } from '@/components/providers/toast-provider';
import * as Utils from '@/lib/utils';
import * as Types from '@/lib/types';
import { DiscussionThreadComponent } from './lms/DiscussionThread';

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
    const [selectedLesson, setSelectedLesson] = useState<any | null>(null);

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

    // Lesson ContentType ID is 25
    const LESSON_CONTENT_TYPE_ID = 25;

    const filteredLessons = lessons.filter((lesson: any) => {
        const matchesSearch = 
            lesson.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            lesson.subject_name.toLowerCase().includes(searchQuery.toLowerCase());
        
        const matchesClass = selectedClassFilter === 'all' || String(lesson.student_class) === selectedClassFilter;
        
        return matchesSearch && matchesClass;
    });

    const handleUpload = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await createLesson(newLesson);
            addToast({
                title: 'Success',
                description: 'Learning material uploaded successfully',
                type: 'success'
            });
            setShowUploadModal(false);
            setNewLesson({ title: '', subject: '', student_class: '', content: '', file_url: '' });
        } catch (error) {
            addToast({
                title: 'Error',
                description: 'Failed to upload material',
                type: 'error'
            });
        }
    };

    if (selectedLesson) {
        return (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="sm" onClick={() => setSelectedLesson(null)} className="hover:bg-brand-50 text-brand-700">
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Back to Materials
                    </Button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 space-y-6">
                        <Card className="border-none shadow-sm overflow-hidden">
                            <div className="h-2 bg-brand-500" />
                            <div className="p-8 space-y-6">
                                <div>
                                    <h1 className="text-3xl font-bold text-gray-900 mb-2">{selectedLesson.title}</h1>
                                    <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                                        <div className="flex items-center gap-1.5 bg-gray-100 px-3 py-1 rounded-full">
                                            <Book className="w-4 h-4 text-brand-600" />
                                            {selectedLesson.subject_name}
                                        </div>
                                        <div className="flex items-center gap-1.5 bg-gray-100 px-3 py-1 rounded-full">
                                            <UserIcon className="w-4 h-4 text-blue-500" />
                                            {selectedLesson.teacher_name || 'System'}
                                        </div>
                                    </div>
                                </div>

                                <div className="prose prose-brand max-w-none text-gray-700 leading-relaxed">
                                    <div dangerouslySetInnerHTML={{ __html: selectedLesson.content }} />
                                </div>

                                {selectedLesson.file_url && (
                                    <div className="pt-6 border-t border-gray-100">
                                        <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-400 mb-4">Attached Document</h3>
                                        <a 
                                            href={selectedLesson.file_url} 
                                            target="_blank" 
                                            rel="noopener noreferrer"
                                            className="inline-flex items-center gap-3 p-4 rounded-xl border border-brand-100 bg-brand-50 hover:bg-brand-100 transition-all group"
                                        >
                                            <div className="p-2 rounded-lg bg-white text-brand-600 shadow-sm">
                                                <Download className="w-5 h-5" />
                                            </div>
                                            <div className="text-left">
                                                <p className="text-sm font-bold text-brand-900">Download Lesson Material</p>
                                                <p className="text-xs text-brand-600">Click to view/download PDF</p>
                                            </div>
                                        </a>
                                    </div>
                                )}
                            </div>
                        </Card>

                        {/* Discussion Section */}
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
                            <DiscussionThreadComponent 
                                contentTypeId={LESSON_CONTENT_TYPE_ID} 
                                objectId={Number(selectedLesson.id)} 
                                title={`Discussion: ${selectedLesson.title}`}
                            />
                        </div>
                    </div>

                    <div className="space-y-6">
                        <Card className="border-none shadow-sm bg-brand-900 text-white p-6">
                            <h3 className="font-bold text-lg mb-4">Lesson Summary</h3>
                            <div className="space-y-4 text-brand-100 text-sm">
                                <p>Date: {new Date(selectedLesson.created_at).toLocaleDateString()}</p>
                                <p>Class: {selectedLesson.class_name}</p>
                            </div>
                        </Card>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Learning Center</h1>
                    <p className="text-gray-500">Access and manage classroom notes and materials</p>
                </div>
                {(isAdmin || isTeacher) && (
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
                    {isAdmin && (
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
                    )}
                </div>
            </Card>

            {isLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[1, 2, 3].map(n => <div key={n} className="h-48 bg-gray-100 animate-pulse rounded-xl" />)}
                </div>
            ) : filteredLessons.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredLessons.map((lesson: any) => (
                        <div key={lesson.id} className="cursor-pointer group" onClick={() => setSelectedLesson(lesson)}>
                            <Card className="hover:shadow-md transition-shadow">
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

                                <div className="flex gap-2" onClick={e => e.stopPropagation()}>
                                    {lesson.file_url ? (
                                        <Button variant="primary" className="flex-1 text-xs" onClick={() => window.open(lesson.file_url)}>
                                            <Download className="h-3 w-3 mr-2" />
                                            Download
                                        </Button>
                                    ) : (
                                        <Button variant="outline" className="flex-1 text-xs pointer-events-none">
                                            Text Only
                                        </Button>
                                    )}
                                    <Button variant="secondary" className="px-3" title="View Details" onClick={() => setSelectedLesson(lesson)}>
                                        <ExternalLink className="h-3 w-3" />
                                    </Button>
                                </div>
                            </Card>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="text-center py-20 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
                    <FileText className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900">No lessons found</h3>
                    <p className="text-gray-500">Try adjusting your search or filters</p>
                </div>
            )}

            {/* Upload Modal logic remains same... */}
            {showUploadModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setShowUploadModal(false)}>
                    <div className="w-full max-w-lg" onClick={(e: React.MouseEvent) => e.stopPropagation()}>
                        <Card>
                            <div className="space-y-6">
                                <h2 className="text-xl font-bold text-gray-900">Upload Learning Material</h2>
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
