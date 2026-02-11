'use client';

import React from 'react';
import { Card } from '@/components/ui/card';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import * as Types from '@/lib/types';

interface CalendarMonthViewProps {
    year: number;
    month: number;
    monthName: string;
    onPrevMonth: () => void;
    onNextMonth: () => void;
    onToday: () => void;
    calendarDays: { date: Date; isCurrentMonth: boolean }[];
    daysHeader: string[];
    isToday: (date: Date) => boolean;
    getEventsForDate: (date: Date) => Types.SchoolEvent[];
    getEventTypeIcon: (type: Types.SchoolEvent['event_type']) => React.ReactNode;
    getEventTypeColor: (type: Types.SchoolEvent['event_type']) => string;
    isReadOnlyRole: boolean;
    onDateClick: (date: string) => void;
    onEventClick: (event: Types.SchoolEvent) => void;
}

export const CalendarMonthView: React.FC<CalendarMonthViewProps> = ({
    year, month, monthName, onPrevMonth, onNextMonth, onToday,
    calendarDays, daysHeader, isToday,
    getEventsForDate, getEventTypeIcon, getEventTypeColor,
    isReadOnlyRole, onDateClick, onEventClick
}) => {
    return (
        <Card className="p-4">
            {/* Calendar Header */}
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900">
                    {monthName} {year}
                </h2>
                <div className="flex items-center gap-2">
                    <button
                        onClick={onPrevMonth}
                        className="p-2 hover:bg-gray-100 rounded-lg"
                    >
                        <ChevronLeft className="h-5 w-5" />
                    </button>
                    <button
                        onClick={onToday}
                        className="px-3 py-1 text-sm font-medium text-brand-600 hover:bg-brand-50 rounded-lg"
                    >
                        Today
                    </button>
                    <button
                        onClick={onNextMonth}
                        className="p-2 hover:bg-gray-100 rounded-lg"
                    >
                        <ChevronRight className="h-5 w-5" />
                    </button>
                </div>
            </div>

            {/* Day Headers */}
            <div className="grid grid-cols-7 gap-1 mb-2">
                {daysHeader.map(day => (
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
                            onClick={() => !isReadOnlyRole && onDateClick(dateStr)}
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
                                            onEventClick(event);
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
    );
};
