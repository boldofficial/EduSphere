import React from 'react';
import { CheckSquare, Square } from 'lucide-react';
import { Card } from '@/components/ui/card';
import * as Types from '@/lib/types';

interface StudentSelectorProps {
    activeStudents: Types.Student[];
    selectedStudents: Set<string>;
    toggleStudent: (id: string) => void;
    selectAll: () => void;
}

export function StudentSelector({
    activeStudents,
    selectedStudents,
    toggleStudent,
    selectAll
}: StudentSelectorProps) {
    return (
        <div className="no-print">
            <Card className="p-4">
                <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold text-gray-700">Select Students</h3>
                    <button onClick={selectAll} className="text-sm text-brand-600 hover:text-brand-700 font-medium">
                        {selectedStudents.size === activeStudents.length ? 'Deselect All' : 'Select All'}
                    </button>
                </div>
                <div className="flex flex-wrap gap-2">
                    {activeStudents.map(s => (
                        <button key={s.id} onClick={() => toggleStudent(s.id)}
                            className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm transition-colors ${selectedStudents.has(s.id)
                                ? 'bg-brand-100 text-brand-700'
                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                            {selectedStudents.has(s.id) ? <CheckSquare className="h-4 w-4" /> : <Square className="h-4 w-4" />}
                            {s.names.split(' ')[0]}
                        </button>
                    ))}
                </div>
                {selectedStudents.size > 0 && (
                    <p className="text-sm text-gray-500 mt-3">{selectedStudents.size} student{selectedStudents.size > 1 ? 's' : ''} selected</p>
                )}
            </Card>
        </div>
    );
}
