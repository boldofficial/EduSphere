'use client';

import React, { useState, useMemo } from 'react';
import {
    GraduationCap, Coffee, FileText, Users, Trophy, Music, MoreHorizontal
} from 'lucide-react';
import { useSchoolStore } from '@/lib/store';
import { useToast } from '@/components/providers/toast-provider';
import * as Utils from '@/lib/utils';
import * as Types from '@/lib/types';
import {
    useEvents, useClasses, useSettings,
    useCreateEvent, useUpdateEvent, useDeleteEvent
} from '@/lib/hooks/use-data';

// Extracted Components
import { CalendarHeader } from './calendar/CalendarHeader';
import { CalendarMonthView } from './calendar/CalendarMonthView';
import { CalendarAgendaView } from './calendar/CalendarAgendaView';
import { EventModals } from './calendar/EventModals';

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'];
const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export const CalendarView: React.FC = () => {
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

    const isReadOnlyRole = currentRole !== 'admin';

    const [viewMode, setViewMode] = useState<'month' | 'agenda'>('month');
    const [currentDate, setCurrentDate] = useState(new Date());
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isViewModalOpen, setIsViewModalOpen] = useState(false);
    const [editingEvent, setEditingEvent] = useState<Types.SchoolEvent | null>(null);
    const [viewingEvent, setViewingEvent] = useState<Types.SchoolEvent | null>(null);

    // Form state
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [eventType, setEventType] = useState<Types.SchoolEvent['event_type']>('academic');
    const [targetAudience, setTargetAudience] = useState<Types.SchoolEvent['target_audience']>('all');
    const [selectedClassId, setSelectedClassId] = useState<string>('');

    const resetForm = () => {
        setTitle(''); setDescription(''); setStartDate(''); setEndDate('');
        setEventType('academic'); setTargetAudience('all'); setSelectedClassId('');
        setEditingEvent(null);
    };

    const handleViewEvent = (event: Types.SchoolEvent) => {
        setViewingEvent(event);
        setIsViewModalOpen(true);
    };

    const handleOpenModal = (event?: Types.SchoolEvent, date?: string) => {
        if (isReadOnlyRole) return;
        if (event) {
            setEditingEvent(event); setTitle(event.title); setDescription(event.description || '');
            setStartDate(event.start_date); setEndDate(event.end_date || '');
            setEventType(event.event_type); setTargetAudience(event.target_audience);
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
        setIsModalOpen(false); resetForm();
    };

    const handleDelete = (id: string) => {
        deleteEvent(id);
        addToast('Event deleted', 'info');
    };

    const filteredEvents = useMemo(() => {
        const userClassId = (currentRole === 'student' && currentUser?.class_id) ? currentUser.class_id : null;
        return events.filter(e => {
            if (currentRole === 'admin') return true;
            if (e.target_audience === 'all') return true;
            if (e.target_audience === currentRole) return true;
            if (e.target_audience === 'students' && currentRole === 'parent') return true;
            if (e.class_id && userClassId && e.class_id === userClassId) return true;
            if (currentRole === 'teacher' && (e.target_audience === 'teachers' || e.target_audience === 'students')) return true;
            return false;
        });
    }, [events, currentRole, currentUser]);

    // Calendar Grid Logic
    const calendarDays = useMemo(() => {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        const startDayOfWeek = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const days: { date: Date; isCurrentMonth: boolean }[] = [];
        const prevMonth = new Date(year, month, 0);
        for (let i = startDayOfWeek - 1; i >= 0; i--) days.push({ date: new Date(year, month - 1, prevMonth.getDate() - i), isCurrentMonth: false });
        for (let i = 1; i <= daysInMonth; i++) days.push({ date: new Date(year, month, i), isCurrentMonth: true });
        const remainingDays = 42 - days.length;
        for (let i = 1; i <= remainingDays; i++) days.push({ date: new Date(year, month + 1, i), isCurrentMonth: false });
        return days;
    }, [currentDate]);

    const getEventsForDate = (date: Date) => {
        const dateStr = date.toISOString().split('T')[0];
        return filteredEvents.filter(e => e.start_date === dateStr || (e.end_date && dateStr >= e.start_date && dateStr <= e.end_date));
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

    const upcomingEvents = useMemo(() => {
        const today = new Date().toISOString().split('T')[0];
        return filteredEvents.filter(e => e.start_date >= today).sort((a, b) => a.start_date.localeCompare(b.start_date)).slice(0, 20);
    }, [filteredEvents]);

    const isToday = (date: Date) => date.toDateString() === new Date().toDateString();

    return (
        <div className="space-y-6">
            <CalendarHeader
                title="School Calendar"
                subtitle={`${settings.current_term} - ${settings.current_session}`}
                viewMode={viewMode}
                setViewMode={setViewMode}
                isReadOnlyRole={isReadOnlyRole}
                onNewEvent={() => handleOpenModal()}
            />

            {viewMode === 'month' ? (
                <CalendarMonthView
                    year={currentDate.getFullYear()}
                    month={currentDate.getMonth()}
                    monthName={MONTHS[currentDate.getMonth()]}
                    onPrevMonth={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1))}
                    onNextMonth={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1))}
                    onToday={() => setCurrentDate(new Date())}
                    calendarDays={calendarDays}
                    daysHeader={DAYS}
                    isToday={isToday}
                    getEventsForDate={getEventsForDate}
                    getEventTypeIcon={getEventTypeIcon}
                    getEventTypeColor={getEventTypeColor}
                    isReadOnlyRole={isReadOnlyRole}
                    onDateClick={(date) => handleOpenModal(undefined, date)}
                    onEventClick={(event) => isReadOnlyRole ? handleViewEvent(event) : handleOpenModal(event)}
                />
            ) : (
                <CalendarAgendaView
                    upcomingEvents={upcomingEvents}
                    getEventTypeIcon={getEventTypeIcon}
                    getEventTypeColor={getEventTypeColor}
                    onEventClick={(event) => isReadOnlyRole ? handleViewEvent(event) : handleOpenModal(event)}
                />
            )}

            <EventModals
                isViewModalOpen={isViewModalOpen}
                setIsViewModalOpen={setIsViewModalOpen}
                viewingEvent={viewingEvent}
                getEventTypeIcon={getEventTypeIcon}
                getEventTypeColor={getEventTypeColor}
                isEditModalOpen={isModalOpen}
                setIsEditModalOpen={setIsModalOpen}
                editingEvent={editingEvent}
                formState={{
                    title, setTitle, description, setDescription, startDate, setStartDate, endDate, setEndDate,
                    eventType, setEventType, targetAudience, setTargetAudience, selectedClassId, setSelectedClassId
                }}
                classes={classes}
                onSave={handleSave}
                onDelete={handleDelete}
                resetForm={resetForm}
            />
        </div>
    );
};
