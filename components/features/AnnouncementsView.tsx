'use client';

import React, { useState } from 'react';
import {
    Megaphone, Plus, Trash2, Pin, Clock,
    Users, GraduationCap, UserCog, AlertTriangle,
    Edit, Eye
} from 'lucide-react';
import { useSchoolStore } from '@/lib/store';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Modal } from '@/components/ui/modal';
import { useToast } from '@/components/providers/toast-provider';
import * as Utils from '@/lib/utils';
import * as Types from '@/lib/types';
import {
    useStudents, useClasses, useAnnouncements, useSettings,
    useCreateAnnouncement, useUpdateAnnouncement, useDeleteAnnouncement
} from '@/lib/hooks/use-data';

export const AnnouncementsView: React.FC = () => {
    // Auth
    const { currentRole, currentUser } = useSchoolStore();
    const { addToast } = useToast();

    // Data Hooks
    const { data: students = [] } = useStudents();
    const { data: classes = [] } = useClasses();
    const { data: announcements = [] } = useAnnouncements();
    const { data: settings = Utils.INITIAL_SETTINGS } = useSettings();

    // Mutations
    const { mutate: addAnnouncement } = useCreateAnnouncement();
    const { mutate: updateAnnouncement } = useUpdateAnnouncement();
    const { mutate: deleteAnnouncement } = useDeleteAnnouncement();

    // Role-based access control - Only admin can create/edit/delete
    const isReadOnlyRole = currentRole !== 'admin';

    // Get student's class for filtering announcements (for student/parent roles)
    const studentClassId = React.useMemo(() => {
        if (currentRole !== 'student' && currentRole !== 'parent') return null;
        const studentId = currentUser?.student_id || students[0]?.id;
        const student = students.find((s: Types.Student) => s.id === studentId);
        return student?.class_id || null;
    }, [currentRole, currentUser, students]);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingAnnouncement, setEditingAnnouncement] = useState<Types.Announcement | null>(null);
    const [filter, setFilter] = useState<'all' | 'pinned' | 'urgent'>('all');

    // Form state
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [target, setTarget] = useState<Types.Announcement['target']>('all');
    const [selectedClass, setSelectedClass] = useState('');
    const [priority, setPriority] = useState<Types.Announcement['priority']>('normal');
    const [isPinned, setIsPinned] = useState(false);

    const resetForm = () => {
        setTitle('');
        setContent('');
        setTarget('all');
        setSelectedClass('');
        setPriority('normal');
        setIsPinned(false);
        setEditingAnnouncement(null);
    };

    const handleOpenModal = (announcement?: Types.Announcement) => {
        if (announcement) {
            setEditingAnnouncement(announcement);
            setTitle(announcement.title);
            setContent(announcement.content);
            setTarget(announcement.target);
            setSelectedClass(announcement.class_id || '');
            setPriority(announcement.priority);
            setIsPinned(announcement.is_pinned || false);
        } else {
            resetForm();
        }
        setIsModalOpen(true);
    };

    const handleSave = () => {
        if (!title.trim() || !content.trim()) {
            addToast('Please fill in all required fields', 'warning');
            return;
        }

        const announcementData: Types.Announcement = {
            id: editingAnnouncement?.id || Utils.generateId(),
            title: title.trim(),
            content: content.trim(),
            target,
            class_id: target === 'class' ? selectedClass : undefined,
            author_id: currentUser?.id || editingAnnouncement?.author_id || '',
            author_role: currentRole,
            priority,
            is_pinned: isPinned,
            created_at: editingAnnouncement?.created_at || Date.now(),
            updated_at: Date.now()
        };

        if (editingAnnouncement) {
            updateAnnouncement({ id: announcementData.id, updates: announcementData });
            addToast('Announcement updated', 'success');
        } else {
            addAnnouncement(announcementData);
            addToast('Announcement created', 'success');
        }

        setIsModalOpen(false);
        resetForm();
    };

    const handleDelete = (id: string) => {
        deleteAnnouncement(id);
        addToast('Announcement deleted', 'info');
    };

    // Filter and sort announcements
    const filteredAnnouncements = announcements
        .filter(a => {
            // Role-based filtering
            if (currentRole === 'student' || currentRole === 'parent') {
                // Students/parents see: all, parents (for parent role), or student's class
                const isForAll = a.target === 'all';
                const isForParents = currentRole === 'parent' && a.target === 'parents';
                const isForMyClass = a.target === 'class' && a.class_id === studentClassId;
                if (!isForAll && !isForParents && !isForMyClass) return false;
            } else if (currentRole === 'teacher') {
                // Teachers see: all, teachers
                const isForAll = a.target === 'all';
                const isForTeachers = a.target === 'teachers';
                if (!isForAll && !isForTeachers) return false;
            } else if (currentRole === 'staff') {
                // Staff see: all, staff
                const isForAll = a.target === 'all';
                const isForStaff = a.target === 'staff';
                if (!isForAll && !isForStaff) return false;
            }
            // Admin sees all

            // Apply user filter
            if (filter === 'pinned') return a.is_pinned;
            if (filter === 'urgent') return a.priority === 'urgent';
            return true;
        })
        .sort((a, b) => {
            // Pinned first, then by date
            if (a.is_pinned && !b.is_pinned) return -1;
            if (!a.is_pinned && b.is_pinned) return 1;
            return b.created_at - a.created_at;
        });

    const getTargetIcon = (target: Types.Announcement['target']) => {
        switch (target) {
            case 'all': return <Users className="h-4 w-4" />;
            case 'class': return <GraduationCap className="h-4 w-4" />;
            case 'parents': return <Users className="h-4 w-4" />;
            case 'teachers': return <UserCog className="h-4 w-4" />;
            case 'staff': return <UserCog className="h-4 w-4" />;
        }
    };

    const getPriorityStyle = (priority: Types.Announcement['priority']) => {
        switch (priority) {
            case 'urgent': return 'bg-red-100 text-red-700 border-red-200';
            case 'important': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
            default: return 'bg-gray-100 text-gray-700 border-gray-200';
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Announcements</h1>
                    <p className="text-sm text-gray-500 mt-1">
                        {isReadOnlyRole ? 'View important school announcements' : 'Manage school-wide and targeted announcements'}
                    </p>
                </div>
                {!isReadOnlyRole && (
                    <Button onClick={() => handleOpenModal()}>
                        <Plus className="h-4 w-4 mr-2" />
                        New Announcement
                    </Button>
                )}
            </div>

            {/* Stats - Only show for admin roles */}
            {!isReadOnlyRole && (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <Card className="p-4">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 bg-brand-100 rounded-lg flex items-center justify-center">
                                <Megaphone className="h-5 w-5 text-brand-600" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-gray-900">{announcements.length}</p>
                                <p className="text-xs text-gray-500">Total</p>
                            </div>
                        </div>
                    </Card>
                    <Card className="p-4">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                                <Pin className="h-5 w-5 text-yellow-600" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-gray-900">
                                    {announcements.filter(a => a.is_pinned).length}
                                </p>
                                <p className="text-xs text-gray-500">Pinned</p>
                            </div>
                        </div>
                    </Card>
                    <Card className="p-4">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 bg-red-100 rounded-lg flex items-center justify-center">
                                <AlertTriangle className="h-5 w-5 text-red-600" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-gray-900">
                                    {announcements.filter(a => a.priority === 'urgent').length}
                                </p>
                                <p className="text-xs text-gray-500">Urgent</p>
                            </div>
                        </div>
                    </Card>
                    <Card className="p-4">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 bg-green-100 rounded-lg flex items-center justify-center">
                                <Clock className="h-5 w-5 text-green-600" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-gray-900">
                                    {announcements.filter(a => {
                                        const weekAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
                                        return a.created_at > weekAgo;
                                    }).length}
                                </p>
                                <p className="text-xs text-gray-500">This Week</p>
                            </div>
                        </div>
                    </Card>
                </div>
            )}

            {/* Filter Tabs */}
            <div className="flex bg-gray-100 p-1 rounded-lg w-fit">
                <button
                    onClick={() => setFilter('all')}
                    className={`px-4 py-2 text-sm font-medium rounded-md ${filter === 'all' ? 'bg-white shadow text-brand-700' : 'text-gray-600'
                        }`}
                >
                    All
                </button>
                <button
                    onClick={() => setFilter('pinned')}
                    className={`px-4 py-2 text-sm font-medium rounded-md ${filter === 'pinned' ? 'bg-white shadow text-brand-700' : 'text-gray-600'
                        }`}
                >
                    Pinned
                </button>
                <button
                    onClick={() => setFilter('urgent')}
                    className={`px-4 py-2 text-sm font-medium rounded-md ${filter === 'urgent' ? 'bg-white shadow text-brand-700' : 'text-gray-600'
                        }`}
                >
                    Urgent
                </button>
            </div>

            {/* Announcements List */}
            <div className="space-y-4">
                {filteredAnnouncements.length === 0 ? (
                    <Card className="p-12 text-center">
                        <Megaphone className="h-12 w-12 mx-auto text-gray-300 mb-4" />
                        <p className="text-gray-500">No announcements yet</p>
                        <p className="text-sm text-gray-400 mt-1">Create one to get started</p>
                    </Card>
                ) : (
                    filteredAnnouncements.map(announcement => (
                        <Card
                            key={announcement.id}
                            className={`p-4 border-l-4 ${announcement.priority === 'urgent' ? 'border-l-red-500' :
                                announcement.priority === 'important' ? 'border-l-yellow-500' :
                                    'border-l-brand-500'
                                }`}
                        >
                            <div className="flex items-start justify-between gap-4">
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-2">
                                        {announcement.is_pinned && (
                                            <Pin className="h-4 w-4 text-yellow-500" />
                                        )}
                                        <h3 className="font-semibold text-gray-900">
                                            {announcement.title}
                                        </h3>
                                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getPriorityStyle(announcement.priority)
                                            }`}>
                                            {announcement.priority}
                                        </span>
                                    </div>
                                    <p className="text-gray-600 text-sm mb-3">{announcement.content}</p>
                                    <div className="flex items-center gap-4 text-xs text-gray-500">
                                        <span className="flex items-center gap-1">
                                            {getTargetIcon(announcement.target)}
                                            {announcement.target === 'class'
                                                ? classes.find(c => c.id === announcement.class_id)?.name || 'Class'
                                                : announcement.target.charAt(0).toUpperCase() + announcement.target.slice(1)
                                            }
                                        </span>
                                        <span>
                                            {new Date(announcement.created_at).toLocaleDateString()}
                                        </span>
                                        <span className="capitalize">
                                            By {announcement.author_role}
                                        </span>
                                    </div>
                                </div>
                                {!isReadOnlyRole && (
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => handleOpenModal(announcement)}
                                            className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg"
                                        >
                                            <Edit className="h-4 w-4" />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(announcement.id)}
                                            className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </button>
                                    </div>
                                )}
                            </div>
                        </Card>
                    ))
                )}
            </div>

            {/* Create/Edit Modal */}
            <Modal
                isOpen={isModalOpen}
                onClose={() => { setIsModalOpen(false); resetForm(); }}
                title={editingAnnouncement ? 'Edit Announcement' : 'New Announcement'}
            >
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
                        <Input
                            value={title}
                            onChange={e => setTitle(e.target.value)}
                            placeholder="Announcement title"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Content *</label>
                        <textarea
                            value={content}
                            onChange={e => setContent(e.target.value)}
                            placeholder="Write your announcement..."
                            className="w-full p-3 border rounded-md focus:ring-2 focus:ring-brand-500 focus:outline-none min-h-[120px]"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <Select
                            label="Target Audience"
                            value={target}
                            onChange={e => setTarget(e.target.value as Types.Announcement['target'])}
                        >
                            <option value="all">Everyone</option>
                            <option value="class">Specific Class</option>
                            <option value="parents">Parents Only</option>
                            <option value="teachers">Teachers Only</option>
                            <option value="staff">Staff Only</option>
                        </Select>

                        {target === 'class' && (
                            <Select
                                label="Select Class"
                                value={selectedClass}
                                onChange={e => setSelectedClass(e.target.value)}
                            >
                                <option value="">-- Select Class --</option>
                                {classes.map(c => (
                                    <option key={c.id} value={c.id}>{c.name}</option>
                                ))}
                            </Select>
                        )}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <Select
                            label="Priority"
                            value={priority}
                            onChange={e => setPriority(e.target.value as Types.Announcement['priority'])}
                        >
                            <option value="normal">Normal</option>
                            <option value="important">Important</option>
                            <option value="urgent">Urgent</option>
                        </Select>

                        <div className="flex items-center gap-2 pt-6">
                            <input
                                type="checkbox"
                                id="pinned"
                                checked={isPinned}
                                onChange={e => setIsPinned(e.target.checked)}
                                className="h-4 w-4 text-brand-600 rounded border-gray-300"
                            />
                            <label htmlFor="pinned" className="text-sm text-gray-700">
                                Pin this announcement
                            </label>
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-4">
                        <Button variant="secondary" onClick={() => { setIsModalOpen(false); resetForm(); }}>
                            Cancel
                        </Button>
                        <Button onClick={handleSave}>
                            {editingAnnouncement ? 'Update' : 'Create'} Announcement
                        </Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};
