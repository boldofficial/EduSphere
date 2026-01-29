'use client';

import React from 'react';
import { TimetableBuilder } from '@/components/features/timetable/TimetableBuilder';

export default function TimetablePage() {
    return (
        <div className="p-4 lg:p-8 space-y-6">
            <h1 className="text-3xl font-black text-gray-900 uppercase">Timetable Management</h1>
            <TimetableBuilder />
        </div>
    );
}
