'use client';

import React from 'react';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Calendar as CalendarIcon, Trash2 } from 'lucide-react';
import * as Types from '@/lib/types';

interface EventModalsProps {
    isViewModalOpen: boolean;
    setIsViewModalOpen: (open: boolean) => void;
    viewingEvent: Types.SchoolEvent | null;
    getEventTypeIcon: (type: Types.SchoolEvent['event_type']) => React.ReactNode;
    getEventTypeColor: (type: Types.SchoolEvent['event_type']) => string;

    isEditModalOpen: boolean;
    setIsEditModalOpen: (open: boolean) => void;
    editingEvent: Types.SchoolEvent | null;
    formState: {
        title: string; setTitle: (v: string) => void;
        description: string; setDescription: (v: string) => void;
        startDate: string; setStartDate: (v: string) => void;
        endDate: string; setEndDate: (v: string) => void;
        eventType: Types.SchoolEvent['event_type']; setEventType: (v: Types.SchoolEvent['event_type']) => void;
        targetAudience: Types.SchoolEvent['target_audience']; setTargetAudience: (v: Types.SchoolEvent['target_audience']) => void;
        selectedClassId: string; setSelectedClassId: (v: string) => void;
    };
    classes: any[];
    onSave: () => void;
    onDelete: (id: string) => void;
    resetForm: () => void;
}

export const EventModals: React.FC<EventModalsProps> = ({
    isViewModalOpen, setIsViewModalOpen, viewingEvent, getEventTypeIcon, getEventTypeColor,
    isEditModalOpen, setIsEditModalOpen, editingEvent, formState, classes,
    onSave, onDelete, resetForm
}) => {
    return (
        <>
            {/* View Event Modal */}
            <Modal
                isOpen={isViewModalOpen}
                onClose={() => setIsViewModalOpen(false)}
                title="Event Details"
            >
                {viewingEvent && (
                    <div className="space-y-4">
                        <div className="flex items-center gap-2">
                            <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${getEventTypeColor(viewingEvent.event_type)}`}>
                                {getEventTypeIcon(viewingEvent.event_type)}
                                {viewingEvent.event_type.charAt(0).toUpperCase() + viewingEvent.event_type.slice(1)}
                            </span>
                            {viewingEvent.target_audience !== 'all' && (
                                <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                                    For {viewingEvent.target_audience}
                                </span>
                            )}
                        </div>
                        <h2 className="text-xl font-bold text-gray-900">{viewingEvent.title}</h2>
                        <div className="flex items-center gap-2 text-gray-600">
                            <CalendarIcon className="h-5 w-5" />
                            <span>
                                {new Date(viewingEvent.start_date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                                {viewingEvent.end_date && viewingEvent.end_date !== viewingEvent.start_date && (
                                    <> — {new Date(viewingEvent.end_date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</>
                                )}
                            </span>
                        </div>
                        {viewingEvent.description && (
                            <div className="pt-2">
                                <h4 className="text-sm font-medium text-gray-500 mb-2">Description</h4>
                                <p className="text-gray-700 whitespace-pre-wrap">{viewingEvent.description}</p>
                            </div>
                        )}
                        <div className="flex justify-end pt-4">
                            <Button onClick={() => setIsViewModalOpen(false)}>Close</Button>
                        </div>
                    </div>
                )}
            </Modal>

            {/* Edit/New Event Modal */}
            <Modal
                isOpen={isEditModalOpen}
                onClose={() => { setIsEditModalOpen(false); resetForm(); }}
                title={editingEvent ? 'Edit Event' : 'New Event'}
            >
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
                        <Input value={formState.title} onChange={e => formState.setTitle(e.target.value)} placeholder="Event title" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                        <textarea
                            value={formState.description}
                            onChange={e => formState.setDescription(e.target.value)}
                            placeholder="Event details..."
                            className="w-full p-3 border rounded-md focus:ring-2 focus:ring-brand-500 focus:outline-none min-h-[80px]"
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Start Date *</label>
                            <Input type="date" value={formState.startDate} onChange={e => formState.setStartDate(e.target.value)} />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                            <Input type="date" value={formState.endDate} onChange={e => formState.setEndDate(e.target.value)} />
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <Select label="Event Type" value={formState.eventType} onChange={e => formState.setEventType(e.target.value as any)}>
                            <option value="academic">Academic</option>
                            <option value="holiday">Holiday</option>
                            <option value="exam">Examination</option>
                            <option value="meeting">Meeting</option>
                            <option value="sports">Sports</option>
                            <option value="cultural">Cultural</option>
                            <option value="other">Other</option>
                        </Select>
                        <Select label="Target Audience" value={formState.targetAudience} onChange={e => formState.setTargetAudience(e.target.value as any)}>
                            <option value="all">Everyone</option>
                            <option value="teachers">Teachers Only</option>
                            <option value="students">Students Only</option>
                            <option value="parents">Parents Only</option>
                            <option value="staff">Staff Only</option>
                        </Select>
                    </div>
                    {(formState.targetAudience === 'students' || formState.targetAudience === 'parents') && (
                        <Select label="Specific Class (Optional)" value={formState.selectedClassId} onChange={e => formState.setSelectedClassId(e.target.value)}>
                            <option value="">All {formState.targetAudience === 'students' ? 'Students' : 'Parents'}</option>
                            {classes.map((cls: any) => (<option key={cls.id} value={cls.id}>{cls.name}</option>))}
                        </Select>
                    )}
                    <div className="flex justify-between pt-4">
                        <div>
                            {editingEvent && (
                                <Button variant="danger" onClick={() => { onDelete(editingEvent.id); setIsEditModalOpen(false); resetForm(); }}>
                                    <Trash2 className="h-4 w-4 mr-2" /> Delete
                                </Button>
                            )}
                        </div>
                        <div className="flex gap-3">
                            <Button variant="secondary" onClick={() => { setIsEditModalOpen(false); resetForm(); }}>Cancel</Button>
                            <Button onClick={onSave}>{editingEvent ? 'Update' : 'Create'} Event</Button>
                        </div>
                    </div>
                </div>
            </Modal>
        </>
    );
};
