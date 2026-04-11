'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { Printer, RotateCcw, CreditCard } from 'lucide-react';
import { useSchoolStore } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/select';

// Decomposed Components & Types
import { 
    IDCardViewProps, 
    CardTemplate, 
    CardSide, 
    ACCENT_COLORS 
} from './id-cards/id-card-types';
import { 
    PremiumFront, 
    ModernFront, 
    ElegantFront, 
    ClassicFront, 
    MinimalFront, 
    BackCard 
} from './id-cards/CardTemplates';
import { CardDesigner } from './id-cards/CardDesigner';
import { StudentSelector } from './id-cards/StudentSelector';

export const IDCardView: React.FC<IDCardViewProps> = ({ students, teachers = [], classes, settings }) => {
    const { currentRole, currentUser } = useSchoolStore();

    // 1. Role-based constraints
    const restrictedStudentId = useMemo(() => {
        if (currentRole === 'student' || currentRole === 'parent') {
            if (currentUser?.student_id) {
                const found = students.find(s => s.id === currentUser.student_id);
                if (found) return found.id;
            }
            return students[0]?.id || null;
        }
        return null;
    }, [currentRole, currentUser, students]);

    const isReadOnlyRole = currentRole === 'student' || currentRole === 'parent';

    // 2. Local State
    const initialClass = restrictedStudentId
        ? students.find(s => s.id === restrictedStudentId)?.class_id || classes[0]?.id
        : classes[0]?.id;

    const [selectedClass, setSelectedClass] = useState(initialClass || '');
    const [selectedStudents, setSelectedStudents] = useState<Set<string>>(
        restrictedStudentId ? new Set([restrictedStudentId]) : new Set()
    );
    const [template, setTemplate] = useState<CardTemplate>('premium');
    const [showSide, setShowSide] = useState<CardSide>('front');
    const [accentColor, setAccentColor] = useState(ACCENT_COLORS[0]);

    // 3. Derived State
    const activeStudents = students.filter(s => s.class_id === selectedClass);
    const currentClass = classes.find(c => c.id === selectedClass);
    const validityPeriod = settings.current_session;

    useEffect(() => {
        if (restrictedStudentId) {
            const s = students.find(s => s.id === restrictedStudentId);
            if (s) {
                setSelectedClass(s.class_id);
                setSelectedStudents(new Set([s.id]));
            }
        }
    }, [restrictedStudentId, students]);

    const studentsToPrint = useMemo(() => {
        if (selectedStudents.size === 0) return activeStudents;
        return activeStudents.filter(s => selectedStudents.has(s.id));
    }, [activeStudents, selectedStudents]);

    // 4. Handlers
    const toggleStudent = (id: string) => {
        const newSet = new Set(selectedStudents);
        if (newSet.has(id)) newSet.delete(id);
        else newSet.add(id);
        setSelectedStudents(newSet);
    };

    const selectAll = () => {
        if (selectedStudents.size === activeStudents.length) {
            setSelectedStudents(new Set());
        } else {
            setSelectedStudents(new Set(activeStudents.map(s => s.id)));
        }
    };

    const renderFrontCard = (student: any) => {
        const props = { student, settings, accentColor, currentClass, validityPeriod };
        switch (template) {
            case 'premium': return <PremiumFront {...props} />;
            case 'modern': return <ModernFront {...props} />;
            case 'elegant': return <ElegantFront {...props} />;
            case 'classic': return <ClassicFront {...props} />;
            default: return <MinimalFront {...props} />;
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-wrap justify-between items-center gap-4 no-print">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">ID Card Generator</h1>
                    <p className="text-gray-500">Generate professional ID cards with QR codes</p>
                </div>
                <div className="flex flex-wrap gap-3">
                    {!restrictedStudentId && (
                        <Select className="w-40" value={selectedClass} onChange={e => { setSelectedClass(e.target.value); setSelectedStudents(new Set()); }}>
                            {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </Select>
                    )}
                    <Button variant="secondary" onClick={() => setShowSide(showSide === 'front' ? 'back' : showSide === 'back' ? 'both' : 'front')}>
                        <RotateCcw className="h-4 w-4 mr-2" />
                        {showSide === 'front' ? 'Front' : showSide === 'back' ? 'Back' : 'Both'}
                    </Button>
                    <Button onClick={() => window.print()}>
                        <Printer className="h-4 w-4 mr-2" />
                        Print {selectedStudents.size > 0 ? `(${selectedStudents.size})` : 'All'}
                    </Button>
                </div>
            </div>

            {/* Template and Color Options */}
            {!isReadOnlyRole && (
                <CardDesigner 
                    template={template} 
                    setTemplate={setTemplate} 
                    accentColor={accentColor} 
                    setAccentColor={setAccentColor} 
                />
            )}

            {/* Student Selection */}
            {!restrictedStudentId && (
                <StudentSelector 
                    activeStudents={activeStudents} 
                    selectedStudents={selectedStudents} 
                    toggleStudent={toggleStudent} 
                    selectAll={selectAll} 
                />
            )}

            {/* Cards Grid */}
            <div className={`grid gap-6 print:gap-4 ${showSide === 'both'
                ? 'grid-cols-1 md:grid-cols-2 print:grid-cols-1'
                : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 print:grid-cols-1'}`}>
                {studentsToPrint.map(s => (
                    <div key={s.id} className="flex flex-col gap-4 items-center print:items-center print:justify-center print:min-h-0">
                        {(showSide === 'front' || showSide === 'both') && renderFrontCard(s)}
                        {(showSide === 'back' || showSide === 'both') && (
                            <BackCard 
                                student={s} 
                                settings={settings} 
                                accentColor={accentColor} 
                                currentClass={currentClass} 
                                validityPeriod={validityPeriod} 
                                template={template} 
                            />
                        )}
                    </div>
                ))}
                {studentsToPrint.length === 0 && (
                    <div className="col-span-full text-center py-12 text-gray-400 italic no-print">
                        <CreditCard className="h-12 w-12 mx-auto mb-3 opacity-50" />
                        <p>No students found in this class.</p>
                    </div>
                )}
            </div>

            {/* Print Styles */}
            <style jsx global>{`
                @media print {
                    @page {
                        size: A4;
                        margin: 10mm;
                    }
                    body {
                        -webkit-print-color-adjust: exact !important;
                        print-color-adjust: exact !important;
                    }
                    .no-print {
                        display: none !important;
                    }
                    .print\\:grid-cols-1 {
                        display: flex !important;
                        flex-direction: column !important;
                        align-items: center !important;
                        justify-content: flex-start !important;
                        gap: 20px !important;
                    }
                    .print\\:grid-cols-1 > div {
                        page-break-inside: avoid !important;
                        break-inside: avoid !important;
                    }
                }
            `}</style>
        </div>
    );
};
