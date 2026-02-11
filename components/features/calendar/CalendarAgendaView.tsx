'use client';

import React from 'react';
import { Card } from '@/components/ui/card';
import { Calendar as CalendarIcon, ChevronRight, Clock } from 'lucide-react';
import * as Types from '@/lib/types';

interface CalendarAgendaViewProps {
    upcomingEvents: Types.SchoolEvent[];
    getEventTypeIcon: (type: Types.SchoolEvent['event_type']) => React.ReactNode;
    getEventTypeColor: (type: Types.SchoolEvent['event_type']) => string;
    onEventClick: (event: Types.SchoolEvent) => void;
}

export const CalendarAgendaView: React.FC<CalendarAgendaViewProps> = ({
    upcomingEvents,
    getEventTypeIcon,
    getEventTypeColor,
    onEventClick
}) => {
    return (
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
                                onClick={() => onEventClick(event)}
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
    );
};
