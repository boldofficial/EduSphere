'use client';

import React, { useState } from 'react';
import { Newspaper, Plus, Download, Trash2, Upload, Calendar, Eye, EyeOff } from 'lucide-react';
import { useSchoolStore } from '@/lib/store';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Modal } from '@/components/ui/modal';
import { useToast } from '@/components/providers/toast-provider';
import * as Utils from '@/lib/utils';
import * as Types from '@/lib/types';
import {
    useNewsletters, useCreateNewsletter, useUpdateNewsletter, useDeleteNewsletter, useSettings
} from '@/lib/hooks/use-data';

export const NewsletterView: React.FC = () => {
    // Auth
    const { currentRole } = useSchoolStore();
    const { addToast } = useToast();

    // Data Hooks
    const { data: newsletters = [] } = useNewsletters();
    const { data: settings = Utils.INITIAL_SETTINGS } = useSettings();

    // Mutations
    const { mutate: addNewsletter } = useCreateNewsletter();
    const { mutate: updateNewsletter } = useUpdateNewsletter();
    const { mutate: deleteNewsletter } = useDeleteNewsletter();

    // Role-based access control
    const isReadOnlyRole = currentRole === 'student' || currentRole === 'parent';

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingNewsletter, setEditingNewsletter] = useState<Types.Newsletter | null>(null);

    // Form state
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [fileData, setFileData] = useState('');
    const [fileName, setFileName] = useState('');

    const resetForm = () => {
        setTitle('');
        setDescription('');
        setFileData('');
        setFileName('');
        setEditingNewsletter(null);
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (file.type !== 'application/pdf') {
                addToast('Please upload a PDF file', 'warning');
                return;
            }
            if (file.size > 10 * 1024 * 1024) { // 10MB limit
                addToast('File size must be under 10MB', 'warning');
                return;
            }
            const reader = new FileReader();
            reader.onload = () => {
                setFileData(reader.result as string);
                setFileName(file.name);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleOpenModal = (newsletter?: Types.Newsletter) => {
        if (newsletter) {
            setEditingNewsletter(newsletter);
            setTitle(newsletter.title);
            setDescription(newsletter.description || '');
            setFileData(newsletter.file_data);
            setFileName(newsletter.file_name);
        } else {
            resetForm();
        }
        setIsModalOpen(true);
    };

    const handleSave = () => {
        if (!title.trim()) {
            addToast('Please enter a title', 'warning');
            return;
        }
        if (!fileData && !editingNewsletter) {
            addToast('Please upload a PDF file', 'warning');
            return;
        }

        const newsletterData: Types.Newsletter = {
            id: editingNewsletter?.id || Utils.generateId(),
            title: title.trim(),
            description: description.trim() || undefined,
            file_data: fileData || editingNewsletter?.file_data || '',
            file_name: fileName || editingNewsletter?.file_name || 'newsletter.pdf',
            session: settings.current_session,
            term: settings.current_term,
            published_by: currentRole,
            is_published: true,
            created_at: editingNewsletter?.created_at || Date.now(),
            updated_at: Date.now()
        };

        if (editingNewsletter) {
            updateNewsletter({ id: newsletterData.id, updates: newsletterData });
            addToast('Newsletter updated', 'success');
        } else {
            addNewsletter(newsletterData);
            addToast('Newsletter uploaded', 'success');
        }

        setIsModalOpen(false);
        resetForm();
    };

    const handleDelete = (id: string) => {
        deleteNewsletter(id);
        addToast('Newsletter deleted', 'info');
    };

    const handleDownload = (newsletter: Types.Newsletter) => {
        const link = document.createElement('a');
        link.href = newsletter.file_data;
        link.download = newsletter.file_name;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const togglePublish = (newsletter: Types.Newsletter) => {
        updateNewsletter({ id: newsletter.id, updates: { is_published: !newsletter.is_published, updated_at: Date.now() } });
        addToast(newsletter.is_published ? 'Newsletter unpublished' : 'Newsletter published', 'info');
    };

    // Filter newsletters for students/parents - only show published ones
    const visibleNewsletters = isReadOnlyRole
        ? newsletters.filter(n => n.is_published)
        : newsletters;

    // Sort by date (newest first)
    const sortedNewsletters = [...visibleNewsletters].sort((a, b) => b.created_at - a.created_at);

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Newsletter</h1>
                    <p className="text-sm text-gray-500 mt-1">
                        {isReadOnlyRole ? 'View and download school newsletters' : 'Manage school newsletters'}
                    </p>
                </div>
                {!isReadOnlyRole && (
                    <Button onClick={() => handleOpenModal()}>
                        <Plus className="h-4 w-4 mr-2" />
                        Upload Newsletter
                    </Button>
                )}
            </div>

            {/* Stats - Only show for admin roles */}
            {!isReadOnlyRole && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card className="p-4">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 bg-brand-100 rounded-lg flex items-center justify-center">
                                <Newspaper className="h-5 w-5 text-brand-600" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-gray-900">{newsletters.length}</p>
                                <p className="text-xs text-gray-500">Total Newsletters</p>
                            </div>
                        </div>
                    </Card>
                    <Card className="p-4">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 bg-green-100 rounded-lg flex items-center justify-center">
                                <Eye className="h-5 w-5 text-green-600" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-gray-900">
                                    {newsletters.filter(n => n.is_published).length}
                                </p>
                                <p className="text-xs text-gray-500">Published</p>
                            </div>
                        </div>
                    </Card>
                    <Card className="p-4">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                                <Calendar className="h-5 w-5 text-yellow-600" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-gray-900">
                                    {newsletters.filter(n =>
                                        n.session === settings.current_session &&
                                        n.term === settings.current_term
                                    ).length}
                                </p>
                                <p className="text-xs text-gray-500">This Term</p>
                            </div>
                        </div>
                    </Card>
                </div>
            )}

            {/* Newsletter List */}
            <div className="space-y-4">
                {sortedNewsletters.length === 0 ? (
                    <Card className="p-12 text-center">
                        <Newspaper className="h-12 w-12 mx-auto text-gray-300 mb-4" />
                        <p className="text-gray-500">No newsletters available</p>
                        {!isReadOnlyRole && (
                            <p className="text-sm text-gray-400 mt-1">Upload your first newsletter to get started</p>
                        )}
                    </Card>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {sortedNewsletters.map(newsletter => (
                            <Card key={newsletter.id} className="p-4 hover:shadow-md transition-shadow">
                                <div className="flex items-start gap-3">
                                    <div className="h-12 w-12 bg-red-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                        <Newspaper className="h-6 w-6 text-red-600" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h3 className="font-semibold text-gray-900 truncate">{newsletter.title}</h3>
                                        {newsletter.description && (
                                            <p className="text-sm text-gray-500 line-clamp-2 mt-1">{newsletter.description}</p>
                                        )}
                                        <div className="flex items-center gap-2 mt-2 text-xs text-gray-400">
                                            <span>{newsletter.term}</span>
                                            <span>•</span>
                                            <span>{newsletter.session}</span>
                                        </div>
                                        {!isReadOnlyRole && (
                                            <div className="flex items-center gap-1 mt-2">
                                                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${newsletter.is_published
                                                    ? 'bg-green-100 text-green-700'
                                                    : 'bg-gray-100 text-gray-600'
                                                    }`}>
                                                    {newsletter.is_published ? 'Published' : 'Draft'}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 mt-4 pt-4 border-t">
                                    <Button
                                        variant="secondary"
                                        className="flex-1"
                                        onClick={() => handleDownload(newsletter)}
                                    >
                                        <Download className="h-4 w-4 mr-2" />
                                        Download
                                    </Button>
                                    {!isReadOnlyRole && (
                                        <>
                                            <button
                                                onClick={() => togglePublish(newsletter)}
                                                className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg"
                                                title={newsletter.is_published ? 'Unpublish' : 'Publish'}
                                            >
                                                {newsletter.is_published ? (
                                                    <EyeOff className="h-4 w-4" />
                                                ) : (
                                                    <Eye className="h-4 w-4" />
                                                )}
                                            </button>
                                            <button
                                                onClick={() => handleDelete(newsletter.id)}
                                                className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </button>
                                        </>
                                    )}
                                </div>
                            </Card>
                        ))}
                    </div>
                )}
            </div>

            {/* Upload Modal */}
            {!isReadOnlyRole && (
                <Modal
                    isOpen={isModalOpen}
                    onClose={() => { setIsModalOpen(false); resetForm(); }}
                    title={editingNewsletter ? 'Edit Newsletter' : 'Upload Newsletter'}
                >
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
                            <Input
                                value={title}
                                onChange={e => setTitle(e.target.value)}
                                placeholder="Newsletter title (e.g., Term 1 Newsletter 2024)"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                            <textarea
                                value={description}
                                onChange={e => setDescription(e.target.value)}
                                placeholder="Brief description of the newsletter..."
                                className="w-full p-3 border rounded-md focus:ring-2 focus:ring-brand-500 focus:outline-none min-h-[80px]"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                PDF File {!editingNewsletter && '*'}
                            </label>
                            <div className="border-2 border-dashed rounded-lg p-6 text-center">
                                {fileData || editingNewsletter?.file_data ? (
                                    <div className="flex items-center justify-center gap-2 text-green-600">
                                        <Newspaper className="h-5 w-5" />
                                        <span className="font-medium">{fileName || editingNewsletter?.file_name}</span>
                                    </div>
                                ) : (
                                    <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                                )}
                                <input
                                    type="file"
                                    accept=".pdf"
                                    onChange={handleFileUpload}
                                    className="hidden"
                                    id="newsletter-upload"
                                />
                                <label
                                    htmlFor="newsletter-upload"
                                    className="mt-2 inline-block px-4 py-2 bg-brand-50 text-brand-600 rounded-lg cursor-pointer hover:bg-brand-100 transition-colors text-sm font-medium"
                                >
                                    {fileData || editingNewsletter?.file_data ? 'Replace PDF' : 'Choose PDF'}
                                </label>
                                <p className="text-xs text-gray-400 mt-2">Max file size: 10MB</p>
                            </div>
                        </div>

                        <div className="flex justify-end gap-3 pt-4">
                            <Button variant="secondary" onClick={() => { setIsModalOpen(false); resetForm(); }}>
                                Cancel
                            </Button>
                            <Button onClick={handleSave}>
                                {editingNewsletter ? 'Update' : 'Upload'} Newsletter
                            </Button>
                        </div>
                    </div>
                </Modal>
            )}
        </div>
    );
};
