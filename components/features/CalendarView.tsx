'use client';

import React, { useState, useMemo } from 'react';
import {
    Calendar as CalendarIcon, Plus, Trash2, Edit, ChevronLeft, ChevronRight,
    GraduationCap, Coffee, FileText, Users, MoreHorizontal, Trophy, Music, X,
    List, Grid, Clock
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
    useEvents, useClasses, useSettings,
    useCreateEvent, useUpdateEvent, useDeleteEvent
} from '@/lib/hooks/use-data';

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'];
const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

type ViewMode = 'month' | 'agenda';

export const CalendarView: React.FC = () => {
    // Auth
    const { currentRole, currentUser } = useSchoolStore();
    const { addToast } = useToast();

    // Data Hooks
    const { data: events = [] } = useEvents();
    const { data: classes = [] } = useClasses();
    const { data: settings = Utils.INITIAL_SETTINGS } = useSettings();

    // Mutations
    const { mutate: addEvent } = useCreateEvent();
    const { mutate: updateEvent } = useUpdateEvent();
    const { mutate: deleteEvent } = useDeleteEvent();

    // Role-based access control - Only admin can create/edit/delete events
    const isReadOnlyRole = currentRole !== 'admin';

    const [viewMode, setViewMode] = useState<ViewMode>('month');
    const [currentDate, setCurrentDate] = useState(new Date());
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isViewModalOpen, setIsViewModalOpen] = useState(false);
    const [editingEvent, setEditingEvent] = useState<Types.SchoolEvent | null>(null);
    const [viewingEvent, setViewingEvent] = useState<Types.SchoolEvent | null>(null);
    const [selectedDate, setSelectedDate] = useState<string | null>(null);

    // Form state
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [eventType, setEventType] = useState<Types.SchoolEvent['event_type']>('academic');
    const [targetAudience, setTargetAudience] = useState<Types.SchoolEvent['target_audience']>('all');
    const [selectedClassId, setSelectedClassId] = useState<string>('');

    const resetForm = () => {
        setTitle('');
        setDescription('');
        setStartDate('');
        setEndDate('');
        setEventType('academic');
        setTargetAudience('all');
        setSelectedClassId('');
        setEditingEvent(null);
    };

    // View event details (for all users)
    const handleViewEvent = (event: Types.SchoolEvent) => {
        setViewingEvent(event);
        setIsViewModalOpen(true);
    };

    const handleOpenModal = (event?: Types.SchoolEvent, date?: string) => {
        if (isReadOnlyRole) return; // Prevent modal for read-only users
        if (event) {
            setEditingEvent(event);
            setTitle(event.title);
            setDescription(event.description || '');
            setStartDate(event.start_date);
            setEndDate(event.end_date || '');
            setEventType(event.event_type);
            setTargetAudience(event.target_audience);
            setSelectedClassId(event.class_id || '');
        } else {
            resetForm();
            if (date) setStartDate(date);
        }
        setIsModalOpen(true);
    };

    const handleSave = () => {
        if (!title.trim() || !startDate) {
            addToast('Please fill in required fields', 'warning');
            return;
        }

        const eventData: Types.SchoolEvent = {
            id: editingEvent?.id || Utils.generateId(),
            title: title.trim(),
            description: description.trim() || undefined,
            start_date: startDate,
            end_date: endDate || undefined,
            event_type: eventType,
            target_audience: targetAudience,
            class_id: selectedClassId || undefined,
            session: settings.current_session,
            term: settings.current_term,
            created_by: editingEvent?.created_by || currentUser?.id || undefined,
            created_at: editingEvent?.created_at || Date.now(),
            updated_at: Date.now()
        };

        if (editingEvent) {
            updateEvent({ id: eventData.id, updates: eventData });
            addToast('Event updated', 'success');
        } else {
            addEvent(eventData);
            addToast('Event created', 'success');
        }

        setIsModalOpen(false);
        resetForm();
    };

    const handleDelete = (id: string) => {
        deleteEvent(id);
        addToast('Event deleted', 'info');
    };

    // Get student's class for filtering class-specific events
    const userClassId = useMemo(() => {
        if (currentRole === 'student' && currentUser?.class_id) {
            return currentUser.class_id;
        }
        return null;
    }, [currentRole, currentUser]);

    // Filter events based on role and target audience
    const filteredEvents = useMemo(() => {
        return events.filter(e => {
            // Admins see everything
            if (currentRole === 'admin') return true;

            // Check target audience
            if (e.target_audience === 'all') return true;
            if (e.target_audience === currentRole) return true;
            if (e.target_audience === 'students' && currentRole === 'parent') return true;

            // Check class-specific events
            if (e.class_id && userClassId && e.class_id === userClassId) return true;

            // Teachers can see teacher and student events
            if (currentRole === 'teacher' && (e.target_audience === 'teachers' || e.target_audience === 'students')) return true;

            return false;
        });
    }, [events, currentRole, userClassId]);

    // Calendar calculations
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startDayOfWeek = firstDay.getDay();

    const calendarDays = useMemo(() => {
        const days: { date: Date; isCurrentMonth: boolean }[] = [];

        // Previous month days
        const prevMonthDays = startDayOfWeek;
        const prevMonth = new Date(year, month, 0);
        for (let i = prevMonthDays - 1; i >= 0; i--) {
            days.push({
                date: new Date(year, month - 1, prevMonth.getDate() - i),
                isCurrentMonth: false
            });
        }

        // Current month days
        for (let i = 1; i <= daysInMonth; i++) {
            days.push({
                date: new Date(year, month, i),
                isCurrentMonth: true
            });
        }

        // Next month days to fill the grid
        const remainingDays = 42 - days.length;
        for (let i = 1; i <= remainingDays; i++) {
            days.push({
                date: new Date(year, month + 1, i),
                isCurrentMonth: false
            });
        }

        return days;
    }, [year, month, daysInMonth, startDayOfWeek]);

    const getEventsForDate = (date: Date) => {
        const dateStr = date.toISOString().split('T')[0];
        return filteredEvents.filter(e => {
            if (e.start_date === dateStr) return true;
            if (e.end_date) {
                return dateStr >= e.start_date && dateStr <= e.end_date;
            }
            return false;
        });
    };

    const getEventTypeIcon = (type: Types.SchoolEvent['event_type']) => {
        switch (type) {
            case 'academic': return <GraduationCap className="h-3 w-3" />;
            case 'holiday': return <Coffee className="h-3 w-3" />;
            case 'exam': return <FileText className="h-3 w-3" />;
            case 'meeting': return <Users className="h-3 w-3" />;
            case 'sports': return <Trophy className="h-3 w-3" />;
            case 'cultural': return <Music className="h-3 w-3" />;
            default: return <MoreHorizontal className="h-3 w-3" />;
        }
    };

    const getEventTypeColor = (type: Types.SchoolEvent['event_type']) => {
        switch (type) {
            case 'academic': return 'bg-blue-100 text-blue-700 border-blue-200';
            case 'holiday': return 'bg-green-100 text-green-700 border-green-200';
            case 'exam': return 'bg-red-100 text-red-700 border-red-200';
            case 'meeting': return 'bg-purple-100 text-purple-700 border-purple-200';
            case 'sports': return 'bg-orange-100 text-orange-700 border-orange-200';
            case 'cultural': return 'bg-pink-100 text-pink-700 border-pink-200';
            default: return 'bg-gray-100 text-gray-700 border-gray-200';
        }
    };

    // Upcoming events for agenda view
    const upcomingEvents = useMemo(() => {
        const today = new Date().toISOString().split('T')[0];
        return filteredEvents
            .filter(e => e.start_date >= today)
            .sort((a, b) => a.start_date.localeCompare(b.start_date))
            .slice(0, 20);
    }, [filteredEvents]);

    const isToday = (date: Date) => {
        const today = new Date();
        return date.toDateString() === today.toDateString();
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">School Calendar</h1>
                    <p className="text-sm text-gray-500 mt-1">
                        {settings.current_term} - {settings.current_session}
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    {/* View Toggle */}
                    <div className="flex bg-gray-100 rounded-lg p-1">
                        <button
                            onClick={() => setViewMode('month')}
                            className={`flex items-center gap-1 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${viewMode === 'month' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'
                                }`}
                        >
                            <Grid className="h-4 w-4" />
                            Month
                        </button>
                        <button
                            onClick={() => setViewMode('agenda')}
                            className={`flex items-center gap-1 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${viewMode === 'agenda' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'
                                }`}
                        >
                            <List className="h-4 w-4" />
                            Agenda
                        </button>
                    </div>
                    {!isReadOnlyRole && (
                        <Button onClick={() => handleOpenModal()}>
                            <Plus className="h-4 w-4 mr-2" />
                            New Event
                        </Button>
                    )}
                </div>
            </div>

            {/* Month View */}
            {viewMode === 'month' && (
                <Card className="p-4">
                    {/* Calendar Header */}
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-xl font-bold text-gray-900">
                            {MONTHS[month]} {year}
                        </h2>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setCurrentDate(new Date(year, month - 1))}
                                className="p-2 hover:bg-gray-100 rounded-lg"
                            >
                                <ChevronLeft className="h-5 w-5" />
                            </button>
                            <button
                                onClick={() => setCurrentDate(new Date())}
                                className="px-3 py-1 text-sm font-medium text-brand-600 hover:bg-brand-50 rounded-lg"
                            >
                                Today
                            </button>
                            <button
                                onClick={() => setCurrentDate(new Date(year, month + 1))}
                                className="p-2 hover:bg-gray-100 rounded-lg"
                            >
                                <ChevronRight className="h-5 w-5" />
                            </button>
                        </div>
                    </div>

                    {/* Day Headers */}
                    <div className="grid grid-cols-7 gap-1 mb-2">
                        {DAYS.map(day => (
                            <div key={day} className="text-center text-xs font-medium text-gray-500 py-2">
                                {day}
                            </div>
                        ))}
                    </div>

                    {/* Calendar Grid */}
                    <div className="grid grid-cols-7 gap-1">
                        {calendarDays.map((day, index) => {
                            const dayEvents = getEventsForDate(day.date);
                            const dateStr = day.date.toISOString().split('T')[0];

                            return (
                                <div
                                    key={index}
                                    className={`min-h-[100px] p-1 border rounded-lg transition-colors ${day.isCurrentMonth ? 'bg-white' : 'bg-gray-50'
                                        } ${isToday(day.date) ? 'border-brand-500 border-2' : 'border-gray-200'} 
                                ${!isReadOnlyRole ? 'cursor-pointer hover:bg-gray-50' : ''}`}
                                    onClick={() => !isReadOnlyRole && handleOpenModal(undefined, dateStr)}
                                >
                                    <div className={`text-sm font-medium mb-1 ${day.isCurrentMonth
                                        ? isToday(day.date) ? 'text-brand-600' : 'text-gray-900'
                                        : 'text-gray-400'
                                        }`}>
                                        {day.date.getDate()}
                                    </div>
                                    <div className="space-y-1">
                                        {dayEvents.slice(0, 2).map(event => (
                                            <div
                                                key={event.id}
                                                className={`text-xs px-1 py-0.5 rounded truncate flex items-center gap-1 cursor-pointer hover:opacity-80 ${getEventTypeColor(event.event_type)
                                                    }`}
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    if (isReadOnlyRole) {
                                                        handleViewEvent(event);
                                                    } else {
                                                        handleOpenModal(event);
                                                    }
                                                }}
                                            >
                                                {getEventTypeIcon(event.event_type)}
                                                <span className="truncate">{event.title}</span>
                                            </div>
                                        ))}
                                        {dayEvents.length > 2 && (
                                            <div className="text-xs text-gray-500 px-1">
                                                +{dayEvents.length - 2} more
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </Card>
            )}

            {/* Agenda View */}
            {viewMode === 'agenda' && (
                <Card className="p-6">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-xl font-bold text-gray-900">Upcoming Events</h2>
                        <span className="text-sm text-gray-500">Next 30 days</span>
                    </div>

                    {upcomingEvents.length === 0 ? (
                        <div className="text-center py-12">
                            <CalendarIcon className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                            <p className="text-gray-500">No upcoming events</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {upcomingEvents.map(event => {
                                const eventDate = new Date(event.start_date);
                                const endDate = event.end_date ? new Date(event.end_date) : null;
                                const isMultiDay = endDate && endDate.toDateString() !== eventDate.toDateString();

                                return (
                                    <div
                                        key={event.id}
                                        className="flex items-start gap-4 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                                        onClick={() => isReadOnlyRole ? handleViewEvent(event) : handleOpenModal(event)}
                                    >
                                        {/* Date Badge */}
                                        <div className="flex-shrink-0 w-14 text-center">
                                            <div className="text-xs font-medium text-gray-500 uppercase">
                                                {eventDate.toLocaleDateString('en-US', { weekday: 'short' })}
                                            </div>
                                            <div className="text-2xl font-bold text-gray-900">
                                                {eventDate.getDate()}
                                            </div>
                                            <div className="text-xs text-gray-500">
                                                {eventDate.toLocaleDateString('en-US', { month: 'short' })}
                                            </div>
                                        </div>

                                        {/* Event Details */}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${getEventTypeColor(event.event_type)}`}>
                                                    {getEventTypeIcon(event.event_type)}
                                                    {event.event_type.charAt(0).toUpperCase() + event.event_type.slice(1)}
                                                </span>
                                                {event.target_audience !== 'all' && (
                                                    <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                                                        {event.target_audience === 'teachers' ? 'Teachers' :
                                                            event.target_audience === 'students' ? 'Students' :
                                                                event.target_audience === 'parents' ? 'Parents' :
                                                                    event.target_audience === 'staff' ? 'Staff' : event.target_audience}
                                                    </span>
                                                )}
                                            </div>
                                            <h3 className="font-medium text-gray-900 truncate">{event.title}</h3>
                                            {event.description && (
                                                <p className="text-sm text-gray-500 line-clamp-2 mt-1">{event.description}</p>
                                            )}
                                            {isMultiDay && (
                                                <div className="flex items-center gap-1 mt-2 text-xs text-gray-500">
                                                    <Clock className="h-3 w-3" />
                                                    Until {endDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                                </div>
                                            )}
                                        </div>

                                        {/* Action Arrow */}
                                        <ChevronRight className="h-5 w-5 text-gray-400 flex-shrink-0" />
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </Card>
            )}

            {/* View Event Modal - For read-only users (students/parents) */}
            <Modal
                isOpen={isViewModalOpen}
                onClose={() => { setIsViewModalOpen(false); setViewingEvent(null); }}
                title="Event Details"
            >
                {viewingEvent && (
                    <div className="space-y-4">
                        {/* Event Type Badge */}
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

                        {/* Title */}
                        <h2 className="text-xl font-bold text-gray-900">{viewingEvent.title}</h2>

                        {/* Date(s) */}
                        <div className="flex items-center gap-2 text-gray-600">
                            <CalendarIcon className="h-5 w-5" />
                            <span>
                                {new Date(viewingEvent.start_date).toLocaleDateString('en-US', {
                                    weekday: 'long',
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric'
                                })}
                                {viewingEvent.end_date && viewingEvent.end_date !== viewingEvent.start_date && (
                                    <> — {new Date(viewingEvent.end_date).toLocaleDateString('en-US', {
                                        weekday: 'long',
                                        year: 'numeric',
                                        month: 'long',
                                        day: 'numeric'
                                    })}</>
                                )}
                            </span>
                        </div>

                        {/* Description */}
                        {viewingEvent.description && (
                            <div className="pt-2">
                                <h4 className="text-sm font-medium text-gray-500 mb-2">Description</h4>
                                <p className="text-gray-700 whitespace-pre-wrap">{viewingEvent.description}</p>
                            </div>
                        )}

                        {/* Close Button */}
                        <div className="flex justify-end pt-4">
                            <Button onClick={() => { setIsViewModalOpen(false); setViewingEvent(null); }}>
                                Close
                            </Button>
                        </div>
                    </div>
                )}
            </Modal>

            {/* Event Modal - Only for admin/teacher roles */}
            {!isReadOnlyRole && (
                <Modal
                    isOpen={isModalOpen}
                    onClose={() => { setIsModalOpen(false); resetForm(); }}
                    title={editingEvent ? 'Edit Event' : 'New Event'}
                >
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
                            <Input
                                value={title}
                                onChange={e => setTitle(e.target.value)}
                                placeholder="Event title"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                            <textarea
                                value={description}
                                onChange={e => setDescription(e.target.value)}
                                placeholder="Event details..."
                                className="w-full p-3 border rounded-md focus:ring-2 focus:ring-brand-500 focus:outline-none min-h-[80px]"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Start Date *</label>
                                <Input
                                    type="date"
                                    value={startDate}
                                    onChange={e => setStartDate(e.target.value)}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                                <Input
                                    type="date"
                                    value={endDate}
                                    onChange={e => setEndDate(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <Select
                                label="Event Type"
                                value={eventType}
                                onChange={e => setEventType(e.target.value as Types.SchoolEvent['event_type'])}
                            >
                                <option value="academic">Academic</option>
                                <option value="holiday">Holiday</option>
                                <option value="exam">Examination</option>
                                <option value="meeting">Meeting</option>
                                <option value="sports">Sports</option>
                                <option value="cultural">Cultural</option>
                                <option value="other">Other</option>
                            </Select>

                            <Select
                                label="Target Audience"
                                value={targetAudience}
                                onChange={e => setTargetAudience(e.target.value as Types.SchoolEvent['target_audience'])}
                            >
                                <option value="all">Everyone</option>
                                <option value="teachers">Teachers Only</option>
                                <option value="students">Students Only</option>
                                <option value="parents">Parents Only</option>
                                <option value="staff">Staff Only</option>
                            </Select>
                        </div>

                        {/* Class-specific event selector */}
                        {(targetAudience === 'students' || targetAudience === 'parents') && (
                            <Select
                                label="Specific Class (Optional)"
                                value={selectedClassId}
                                onChange={e => setSelectedClassId(e.target.value)}
                            >
                                <option value="">All {targetAudience === 'students' ? 'Students' : 'Parents'}</option>
                                {classes.map((cls: { id: string; name: string }) => (
                                    <option key={cls.id} value={cls.id}>{cls.name}</option>
                                ))}
                            </Select>
                        )}

                        <div className="flex justify-between pt-4">
                            <div>
                                {editingEvent && (
                                    <Button
                                        variant="danger"
                                        onClick={() => {
                                            handleDelete(editingEvent.id);
                                            setIsModalOpen(false);
                                            resetForm();
                                        }}
                                    >
                                        <Trash2 className="h-4 w-4 mr-2" />
                                        Delete
                                    </Button>
                                )}
                            </div>
                            <div className="flex gap-3">
                                <Button variant="secondary" onClick={() => { setIsModalOpen(false); resetForm(); }}>
                                    Cancel
                                </Button>
                                <Button onClick={handleSave}>
                                    {editingEvent ? 'Update' : 'Create'} Event
                                </Button>
                            </div>
                        </div>
                    </div>
                </Modal>
            )}
        </div>
    );
};

