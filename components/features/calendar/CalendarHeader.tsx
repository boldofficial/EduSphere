'use client';

import React from 'react';
import { Grid, List, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface CalendarHeaderProps {
    title: string;
    subtitle: string;
    viewMode: 'month' | 'agenda';
    setViewMode: (mode: 'month' | 'agenda') => void;
    isReadOnlyRole: boolean;
    onNewEvent: () => void;
}

export const CalendarHeader: React.FC<CalendarHeaderProps> = ({
    title,
    subtitle,
    viewMode,
    setViewMode,
    isReadOnlyRole,
    onNewEvent
}) => {
    return (
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
                <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
                <p className="text-sm text-gray-500 mt-1">{subtitle}</p>
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
                    <Button onClick={onNewEvent}>
                        <Plus className="h-4 w-4 mr-2" />
                        New Event
                    </Button>
                )}
            </div>
        </div>
    );
};
