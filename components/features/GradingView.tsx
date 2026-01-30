import React, { useState, useEffect, useMemo } from 'react';
import { ChevronRight, Save, Printer, CheckCircle, XCircle, Shield, ShieldCheck, ShieldX, AlertTriangle } from 'lucide-react';
import * as Types from '@/lib/types';
import * as Utils from '@/lib/utils';
import { Card } from '@/components/ui/card';
import { Select } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { ReportCardTemplate } from './grading/ReportCardTemplate';
import { GradingSchemeManager } from './grading/GradingSchemeManager';
import { SubjectTeacherManager } from './grading/SubjectTeacherManager';
import { useSchoolStore } from '@/lib/store';
import { useToast } from '@/components/providers/toast-provider';

const ScoreInput = ({ value, max, onChange, className }: { value: number, max: number, onChange: (val: number) => void, className?: string }) => {
    const [localValue, setLocalValue] = useState(value?.toString() || '');

    useEffect(() => {
        setLocalValue(value?.toString() || '');
    }, [value]);

    const handleBlur = () => {
        let v = parseFloat(localValue);
        if (isNaN(v)) v = 0;
        if (v > max) v = max;
        if (v !== value) {
            onChange(v);
        }
    };

    return (
        <input
            type="number"
            min="0"
            max={max}
            value={localValue}
            onChange={e => setLocalValue(e.target.value)}
            onBlur={handleBlur}
            className={`w-16 h-8 text-center border rounded focus:ring-2 focus:ring-brand-500 focus:outline-none ${className}`}
        />
    );
};

interface GradingViewProps {
    students: Types.Student[];
    classes: Types.Class[];
    scores: Types.Score[];
    settings: Types.Settings;
    onUpsertScore: (score: Types.Score) => void;
    currentRole?: string;
}

export const GradingView: React.FC<GradingViewProps> = ({
    students, classes, scores, settings, onUpsertScore, currentRole = 'admin'
}) => {
    const { currentUser } = useSchoolStore();
    const { addToast } = useToast();

    const [selectedClass, setSelectedClass] = useState(classes[0]?.id || '');
    const currentClass = classes.find(c => c.id === selectedClass);
    const classSubjects = Utils.getSubjectsForClass(currentClass);

    const [selectedSubject, setSelectedSubject] = useState(classSubjects[0] || '');
    const [activeTab, setActiveTab] = useState<'broadsheet' | 'report' | 'skills' | 'publish' | 'schemes' | 'assignments'>('broadsheet');
    const [reportStudentId, setReportStudentId] = useState('');

    const activeStudents = students.filter(s => s.class_id === selectedClass);

    // Ensure selectedClass is set when classes load
    useEffect(() => {
        if (classes.length > 0 && !selectedClass) {
            setSelectedClass(classes[0].id);
        }
    }, [classes, selectedClass]);



    useEffect(() => {
        if (classSubjects.length > 0 && !classSubjects.includes(selectedSubject)) {
            setSelectedSubject(classSubjects[0]);
        }
    }, [selectedClass, classSubjects, selectedSubject]);

    // Use a debounced upsert to avoid too many API calls
    const debouncedUpsert = useMemo(
        () => Utils.debounce((score: Types.Score) => onUpsertScore(score), 1000),
        [onUpsertScore]
    );

    const handleScoreChange = (studentId: string, field: 'ca1' | 'ca2' | 'exam', value: number) => {
        let score = scores.find(s => s.student_id === studentId && s.session === settings.current_session && s.term === settings.current_term);

        let newScore = score ? JSON.parse(JSON.stringify(score)) : {
            id: Utils.generateId(),
            student_id: studentId,
            class_id: selectedClass,
            session: settings.current_session,
            term: settings.current_term,
            rows: [],
            average: 0,
            created_at: Date.now(),
            updated_at: Date.now(),
            affective: {},
            psychomotor: {}
        };

        let rowIndex = newScore.rows.findIndex((r: any) => r.subject === selectedSubject);
        if (rowIndex === -1) {
            newScore.rows.push({ subject: selectedSubject, ca1: 0, ca2: 0, exam: 0, total: 0, grade: 'F', comment: '' });
            rowIndex = newScore.rows.length - 1;
        }
        const row = newScore.rows[rowIndex];
        (row as any)[field] = value;
        row.total = row.ca1 + row.ca2 + row.exam;
        const { grade, comment } = Utils.calculateGrade(row.total);
        row.grade = grade;
        row.comment = comment;
        const totalScore = newScore.rows.reduce((acc: number, r: any) => acc + r.total, 0);
        newScore.average = totalScore / newScore.rows.length;
        newScore.total_score = totalScore;
        debouncedUpsert(newScore);
    };

    const handleTraitChange = (studentId: string, category: 'affective' | 'psychomotor', trait: string, value: number) => {
        let score = scores.find(s => s.student_id === studentId && s.session === settings.current_session && s.term === settings.current_term);

        let newScore = score ? { ...score, [category]: { ...score[category] } } : {
            id: Utils.generateId(),
            student_id: studentId,
            class_id: selectedClass,
            session: settings.current_session,
            term: settings.current_term,
            rows: [],
            average: 0,
            created_at: Date.now(),
            updated_at: Date.now(),
            affective: {},
            psychomotor: {}
        };

        if (!newScore[category]) newScore[category] = {};
        newScore[category][trait] = value;
        debouncedUpsert(newScore);
    };

    const handleScoreFieldChange = (studentId: string, field: keyof Types.Score, value: any) => {
        let score = scores.find(s => s.student_id === studentId && s.session === settings.current_session && s.term === settings.current_term);

        let newScore = score ? { ...score } : {
            id: Utils.generateId(),
            student_id: studentId,
            class_id: selectedClass,
            session: settings.current_session,
            term: settings.current_term,
            rows: [],
            average: 0,
            created_at: Date.now(),
            updated_at: Date.now(),
            affective: {},
            psychomotor: {}
        };

        if (newScore[field] !== value) {
            (newScore as any)[field] = value;
            debouncedUpsert(newScore);
        }
    };

    const getRow = (studentId: string) => {
        const score = scores.find(s => s.student_id === studentId && s.session === settings.current_session && s.term === settings.current_term);
        return score?.rows.find(r => r.subject === selectedSubject) || { ca1: 0, ca2: 0, exam: 0, total: 0, grade: '-', comment: '-' };
    };

    // Compute preview score for single student view using useMemo for reliable synchronous updates
    const previewScore = useMemo(() => {
        if (!reportStudentId || reportStudentId === 'all') return null;

        const score = scores.find(s =>
            s.student_id === reportStudentId &&
            s.session === settings.current_session &&
            s.term === settings.current_term
        );

        if (score) {
            return score;
        }

        // Return default empty score for students without scores
        return {
            id: 'temp',
            student_id: reportStudentId,
            class_id: selectedClass,
            session: settings.current_session,
            term: settings.current_term,
            rows: [],
            average: 0,
            created_at: Date.now(),
            updated_at: Date.now(),
            affective: {},
            psychomotor: {},
        } as Types.Score;
    }, [reportStudentId, scores, settings.current_session, settings.current_term, selectedClass, students]);

    // Compute selected student for report card preview
    const selectedStudent = useMemo(() => {
        if (!reportStudentId || reportStudentId === 'all') return null;
        return students.find(s => s.id === reportStudentId) || null;
    }, [reportStudentId, students]);

    const handlePrint = () => {
        const reportCard = document.getElementById('report-card');
        if (!reportCard) {
            alert('Report card not found');
            return;
        }

        // Open a new window for printing
        const printWindow = window.open('', '_blank', 'width=900,height=700');
        if (!printWindow) {
            alert('Please allow pop-ups to print');
            return;
        }

        // Clone the content
        const content = reportCard.cloneNode(true) as HTMLElement;

        // Get all stylesheets from the current page
        const allStyles = Array.from(document.styleSheets)
            .map(sheet => {
                try {
                    return Array.from(sheet.cssRules)
                        .map(rule => rule.cssText)
                        .join('\n');
                } catch {
                    // External stylesheets may throw CORS errors
                    return '';
                }
            })
            .join('\n');

        // Write the print document with all styles
        printWindow.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>Report Card - ${settings.school_name}</title>
                <link rel="preconnect" href="https://fonts.googleapis.com">
                <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
                <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap" rel="stylesheet">
                <style>
                    ${allStyles}
                    
                    /* Additional print-specific overrides */
                    @page { 
                        size: A4;
                        margin: 10mm;
                    }
                    
                    body { 
                        font-family: 'Inter', sans-serif;
                        background: white !important;
                        padding: 0 !important;
                        margin: 0 !important;
                        -webkit-print-color-adjust: exact !important;
                        print-color-adjust: exact !important;
                    }
                    
                    /* Ensure watermark shows */
                    .absolute { position: absolute !important; }
                    .inset-0 { top: 0 !important; right: 0 !important; bottom: 0 !important; left: 0 !important; }
                    .pointer-events-none { pointer-events: none !important; }
                    [class*="opacity-"] { opacity: inherit !important; }
                    .opacity-\\[0\\.03\\] { opacity: 0.03 !important; }
                    .opacity-\\[0\\.05\\] { opacity: 0.05 !important; }
                    
                    /* Hide screen-only elements */
                    .print\\:hidden { display: none !important; }
                    
                    /* Ensure images load */
                    img { 
                        max-width: 100% !important; 
                        height: auto !important;
                    }
                    
                    /* Remove shadows and borders for print */
                    .shadow-lg { box-shadow: none !important; }
                    .border { border: 1px solid #e5e7eb !important; }
                </style>
            </head>
            <body>
                ${content.outerHTML}
            </body>
            </html>
        `);

        printWindow.document.close();

        // Wait for images to load, then print
        printWindow.onload = () => {
            // Wait a bit longer to ensure images (watermark, logo) are loaded
            setTimeout(() => {
                printWindow.print();
            }, 800);
        };
    };



    // Pass/Unpublish report cards for a class
    const handlePassReportCards = (pass: boolean) => {
        const classScores = scores.filter(s =>
            s.class_id === selectedClass &&
            s.session === settings.current_session &&
            s.term === settings.current_term
        );

        if (classScores.length === 0) {
            addToast('No scores found for this class', 'warning');
            return;
        }

        classScores.forEach(score => {
            const updatedScore: Types.Score = {
                ...score,
                is_passed: pass,
                passed_at: pass ? Date.now() : undefined,
                passed_by: pass ? currentUser?.id : undefined,
                updated_at: Date.now()
            };
            onUpsertScore(updatedScore);
        });

        addToast(
            pass
                ? `Report cards published for ${classScores.length} students`
                : `Report cards unpublished for ${classScores.length} students`,
            pass ? 'success' : 'info'
        );
    };

    // Pass individual student report card
    const handlePassSingleReport = (studentId: string, pass: boolean) => {
        const score = scores.find(s =>
            s.student_id === studentId &&
            s.session === settings.current_session &&
            s.term === settings.current_term
        );

        if (!score) {
            addToast('No score found for this student', 'warning');
            return;
        }

        const updatedScore: Types.Score = {
            ...score,
            is_passed: pass,
            passed_at: pass ? Date.now() : undefined,
            passed_by: pass ? currentUser?.id : undefined,
            updated_at: Date.now()
        };
        onUpsertScore(updatedScore);

        const student = students.find(s => s.id === studentId);
        addToast(
            pass
                ? `Report card published for ${student?.names}`
                : `Report card unpublished for ${student?.names}`,
            pass ? 'success' : 'info'
        );
    };

    // Get class publish status
    const classPublishStatus = useMemo(() => {
        const classScores = scores.filter(s =>
            s.class_id === selectedClass &&
            s.session === settings.current_session &&
            s.term === settings.current_term
        );
        const passedCount = classScores.filter(s => s.is_passed).length;
        const totalCount = classScores.length;
        return {
            passedCount,
            totalCount,
            allPassed: totalCount > 0 && passedCount === totalCount,
            nonePassed: passedCount === 0
        };
    }, [scores, selectedClass, settings.current_session, settings.current_term]);

    return (
        <div className="space-y-4 lg:space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 no-print">
                <h1 className="text-xl lg:text-2xl font-bold text-gray-900">Academic Grading</h1>
                <div className="flex bg-gray-100 p-1 rounded-lg overflow-x-auto w-full sm:w-auto">
                    <button onClick={() => setActiveTab('broadsheet')} className={`px-3 lg:px-4 py-2 text-xs lg:text-sm font-medium rounded-md whitespace-nowrap ${activeTab === 'broadsheet' ? 'bg-white shadow text-brand-700' : 'text-gray-600'}`}>Score Entry</button>
                    <button onClick={() => setActiveTab('skills')} className={`px-3 lg:px-4 py-2 text-xs lg:text-sm font-medium rounded-md whitespace-nowrap ${activeTab === 'skills' ? 'bg-white shadow text-brand-700' : 'text-gray-600'}`}>Skills</button>
                    <button onClick={() => setActiveTab('report')} className={`px-3 lg:px-4 py-2 text-xs lg:text-sm font-medium rounded-md whitespace-nowrap ${activeTab === 'report' ? 'bg-white shadow text-brand-700' : 'text-gray-600'}`}>Report Cards</button>
                    {currentRole === 'admin' && (
                        <>
                            <button onClick={() => setActiveTab('publish')} className={`px-3 lg:px-4 py-2 text-xs lg:text-sm font-medium rounded-md flex items-center gap-1 whitespace-nowrap ${activeTab === 'publish' ? 'bg-white shadow text-brand-700' : 'text-gray-600'}`}>
                                <Shield className="h-3 w-3 lg:h-4 lg:w-4" />
                                Publish
                            </button>
                            <button onClick={() => setActiveTab('schemes')} className={`px-3 lg:px-4 py-2 text-xs lg:text-sm font-medium rounded-md whitespace-nowrap ${activeTab === 'schemes' ? 'bg-white shadow text-brand-700' : 'text-gray-600'}`}>
                                Schemes
                            </button>
                            <button onClick={() => setActiveTab('assignments')} className={`px-3 lg:px-4 py-2 text-xs lg:text-sm font-medium rounded-md whitespace-nowrap ${activeTab === 'assignments' ? 'bg-white shadow text-brand-700' : 'text-gray-600'}`}>
                                Assignments
                            </button>
                        </>
                    )}
                </div>
            </div>
            {activeTab === 'assignments' && <SubjectTeacherManager />}
            {activeTab === 'schemes' && <GradingSchemeManager />}
            {activeTab === 'broadsheet' && (
                <Card className="min-h-[400px] lg:min-h-[600px] flex flex-col">
                    <div className="flex flex-col sm:flex-row gap-3 lg:gap-4 mb-4 lg:mb-6 p-3 lg:p-4 bg-gray-50 border-b items-end">
                        <div className="w-full sm:w-1/3">
                            <Select label="Select Class" value={selectedClass} onChange={e => setSelectedClass(e.target.value)}>
                                {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                            </Select>
                        </div>
                        <div className="w-full sm:w-1/3">
                            <Select label="Select Subject" value={selectedSubject} onChange={e => setSelectedSubject(e.target.value)}>
                                {classSubjects.map(s => <option key={s} value={s}>{s}</option>)}
                            </Select>
                        </div>
                        <div className="w-full sm:w-auto">
                            <Button
                                onClick={() => addToast('All changes are saved automatically as you type!', 'success')}
                                className="w-full sm:w-auto flex items-center gap-2"
                            >
                                <Save className="h-4 w-4" />
                                Save Changes
                            </Button>
                        </div>
                    </div>
                    <div className="overflow-x-auto flex-1 -mx-3 lg:mx-0">
                        <table className="w-full text-xs lg:text-sm text-left min-w-[600px]">
                            <thead className="bg-gray-100 text-gray-700 uppercase text-[10px] lg:text-xs font-semibold">
                                <tr>
                                    <th className="px-2 lg:px-4 py-2 lg:py-3 sticky left-0 bg-gray-100 min-w-[120px]">Student</th>
                                    <th className="px-2 lg:px-4 py-2 lg:py-3 text-center">HW/CW</th>
                                    <th className="px-2 lg:px-4 py-2 lg:py-3 text-center">CAT</th>
                                    <th className="px-2 lg:px-4 py-2 lg:py-3 text-center">Exam</th>
                                    <th className="px-2 lg:px-4 py-2 lg:py-3 text-center">Total</th>
                                    <th className="px-2 lg:px-4 py-2 lg:py-3 text-center">Grade</th>
                                    <th className="px-2 lg:px-4 py-2 lg:py-3 hidden sm:table-cell">Remark</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {activeStudents.map(s => {
                                    const row = getRow(s.id);
                                    return (
                                        <tr key={s.id} className="hover:bg-gray-50">
                                            <td className="px-2 lg:px-4 py-2 font-medium text-gray-900 sticky left-0 bg-white">
                                                <span className="block truncate max-w-[100px] lg:max-w-none">{s.names}</span>
                                                <span className="text-[10px] lg:text-xs text-gray-500 font-normal">{s.student_no}</span>
                                            </td>
                                            <td className="px-2 lg:px-4 py-2 text-center"><ScoreInput value={row.ca1} max={20} onChange={(v) => handleScoreChange(s.id, 'ca1', v)} className="!w-12 lg:!w-16" /></td>
                                            <td className="px-2 lg:px-4 py-2 text-center"><ScoreInput value={row.ca2} max={20} onChange={(v) => handleScoreChange(s.id, 'ca2', v)} className="!w-12 lg:!w-16" /></td>
                                            <td className="px-2 lg:px-4 py-2 text-center"><ScoreInput value={row.exam} max={60} onChange={(v) => handleScoreChange(s.id, 'exam', v)} className="!w-12 lg:!w-16" /></td>
                                            <td className="px-2 lg:px-4 py-2 text-center font-bold"><span className={row.total < 40 ? 'text-red-600' : 'text-gray-900'}>{row.total}</span></td>
                                            <td className="px-2 lg:px-4 py-2 text-center"><span className={`px-1.5 lg:px-2 py-0.5 lg:py-1 rounded text-[10px] lg:text-xs font-bold ${row.grade === 'A' ? 'bg-green-100 text-green-800' : row.grade === 'F' ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'}`}>{row.grade}</span></td>
                                            <td className="px-2 lg:px-4 py-2 text-xs text-gray-500 hidden sm:table-cell">{row.comment}</td>
                                        </tr>
                                    );
                                })}
                                {activeStudents.length === 0 && <tr><td colSpan={7} className="text-center py-8 text-gray-500">No students in this class.</td></tr>}
                            </tbody>
                        </table>
                    </div>
                </Card>
            )}

            {activeTab === 'skills' && (
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                    <div className="lg:col-span-1 space-y-4">
                        <Card title="Select Student">
                            <div className="space-y-4">
                                <Select label="Class" value={selectedClass} onChange={e => { setSelectedClass(e.target.value); setReportStudentId(''); }}>
                                    {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                </Select>
                                <div className="space-y-1 max-h-[500px] overflow-y-auto border rounded-md">
                                    {activeStudents.map(s => (
                                        <button key={s.id} onClick={() => setReportStudentId(s.id)} className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-50 flex justify-between ${reportStudentId === s.id ? 'bg-brand-50 text-brand-700 font-medium' : 'text-gray-700'}`}>{s.names}<ChevronRight className="h-4 w-4 opacity-50" /></button>
                                    ))}
                                </div>
                            </div>
                        </Card>
                    </div>
                    <div className="lg:col-span-3 space-y-6">
                        {reportStudentId ? (
                            <>
                                <Card title="Affective Domain (Behavior & Traits)">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        {Utils.DOMAINS_AFFECTIVE.map(trait => {
                                            const score = scores.find(s => s.student_id === reportStudentId && s.session === settings.current_session && s.term === settings.current_term);
                                            const value = score?.affective?.[trait] || 0;
                                            return (
                                                <div key={trait} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                                    <span className="text-sm font-medium text-gray-700">{trait}</span>
                                                    <div className="flex gap-1">
                                                        {[1, 2, 3, 4, 5].map(num => (
                                                            <button
                                                                key={num}
                                                                onClick={() => handleTraitChange(reportStudentId, 'affective', trait, num)}
                                                                className={`h-8 w-8 rounded-md text-sm font-bold transition-colors ${value === num ? 'bg-brand-600 text-white' : 'bg-white border text-gray-400 hover:border-brand-300'}`}
                                                            >
                                                                {num}
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </Card>
                                <Card title="Psychomotor Skills (Physical & Creative)">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        {Utils.DOMAINS_PSYCHOMOTOR.map(skill => {
                                            const score = scores.find(s => s.student_id === reportStudentId && s.session === settings.current_session && s.term === settings.current_term);
                                            const value = score?.psychomotor?.[skill] || 0;
                                            return (
                                                <div key={skill} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                                    <span className="text-sm font-medium text-gray-700">{skill}</span>
                                                    <div className="flex gap-1">
                                                        {[1, 2, 3, 4, 5].map(num => (
                                                            <button
                                                                key={num}
                                                                onClick={() => handleTraitChange(reportStudentId, 'psychomotor', skill, num)}
                                                                className={`h-8 w-8 rounded-md text-sm font-bold transition-colors ${value === num ? 'bg-brand-600 text-white' : 'bg-white border text-gray-400 hover:border-brand-300'}`}
                                                            >
                                                                {num}
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </Card>
                                <Card title="Attendance & Remarks">
                                    <div className="space-y-4">
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-1">
                                                <label className="text-xs font-bold text-gray-500 uppercase">Times Present</label>
                                                <input
                                                    type="number"
                                                    value={scores.find(s => s.student_id === reportStudentId && s.session === settings.current_session && s.term === settings.current_term)?.attendance_present || 0}
                                                    onChange={e => handleScoreFieldChange(reportStudentId, 'attendance_present', parseInt(e.target.value) || 0)}
                                                    className="w-full h-10 px-3 border rounded-md focus:ring-2 focus:ring-brand-500 focus:outline-none"
                                                />
                                            </div>
                                            <div className="space-y-1">
                                                <label className="text-xs font-bold text-gray-500 uppercase">Total Times School Opened</label>
                                                <input
                                                    type="number"
                                                    value={scores.find(s => s.student_id === reportStudentId && s.session === settings.current_session && s.term === settings.current_term)?.attendance_total || 0}
                                                    onChange={e => handleScoreFieldChange(reportStudentId, 'attendance_total', parseInt(e.target.value) || 0)}
                                                    className="w-full h-10 px-3 border rounded-md focus:ring-2 focus:ring-brand-500 focus:outline-none"
                                                />
                                            </div>
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-xs font-bold text-gray-500 uppercase">{settings.class_teacher_label} Remark</label>
                                            <textarea
                                                value={scores.find(s => s.student_id === reportStudentId && s.session === settings.current_session && s.term === settings.current_term)?.teacher_remark || ''}
                                                onChange={e => handleScoreFieldChange(reportStudentId, 'teacher_remark', e.target.value)}
                                                className="w-full p-3 border rounded-md focus:ring-2 focus:ring-brand-500 focus:outline-none min-h-[80px]"
                                                placeholder={`Enter ${settings.class_teacher_label.toLowerCase()}'s comment...`}
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-xs font-bold text-gray-500 uppercase">{settings.head_teacher_label} Remark</label>
                                            <textarea
                                                value={scores.find(s => s.student_id === reportStudentId && s.session === settings.current_session && s.term === settings.current_term)?.head_teacher_remark || ''}
                                                onChange={e => handleScoreFieldChange(reportStudentId, 'head_teacher_remark', e.target.value)}
                                                className="w-full p-3 border rounded-md focus:ring-2 focus:ring-brand-500 focus:outline-none min-h-[80px]"
                                                placeholder={`Enter ${settings.head_teacher_label.toLowerCase()}'s comment...`}
                                            />
                                        </div>
                                    </div>
                                </Card>
                            </>
                        ) : (
                            <div className="h-full border-2 border-dashed border-gray-200 rounded-xl flex flex-col items-center justify-center p-12 text-gray-400">
                                Select a student to set their behavior and skills ratings
                            </div>
                        )}
                    </div>
                </div>
            )}

            {activeTab === 'report' && (
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 print:block">
                    <div className="lg:col-span-1 space-y-4 no-print">
                        <Card title="Selection">
                            <div className="space-y-4">
                                <Select label="Class" value={selectedClass} onChange={e => { setSelectedClass(e.target.value); setReportStudentId(''); }}>
                                    {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                </Select>
                                <div className="space-y-1 max-h-[400px] overflow-y-auto border rounded-md">
                                    <button
                                        onClick={() => setReportStudentId('all')}
                                        className={`w-full text-left px-3 py-2 text-sm font-medium border-b flex justify-between ${reportStudentId === 'all' ? 'bg-brand-100 text-brand-700' : 'bg-gray-50 text-gray-700 hover:bg-gray-100'}`}
                                    >
                                        📄 All Students ({activeStudents.length})
                                        <ChevronRight className="h-4 w-4 opacity-50" />
                                    </button>
                                    {activeStudents.map(s => (
                                        <button key={s.id} onClick={() => setReportStudentId(s.id)} className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-50 flex justify-between ${reportStudentId === s.id ? 'bg-brand-50 text-brand-700 font-medium' : 'text-gray-700'}`}>{s.names}<ChevronRight className="h-4 w-4 opacity-50" /></button>
                                    ))}
                                </div>
                                {reportStudentId && (
                                    <Button className="w-full mt-4 flex items-center justify-center gap-2" onClick={handlePrint}>
                                        <Printer className="h-4 w-4" />
                                        {reportStudentId === 'all' ? `Print All (${activeStudents.length} students)` : 'Print / Save as PDF'}
                                    </Button>
                                )}
                            </div>
                        </Card>
                    </div>
                    <div className="lg:col-span-3 print:w-full overflow-y-auto print:overflow-visible">
                        {reportStudentId === 'all' && currentClass ? (
                            // Print all students with page breaks
                            <div id="report-card" className="space-y-0">
                                {activeStudents.map((student, index) => {
                                    const studentScore = scores.find(s => s.student_id === student.id && s.session === settings.current_session && s.term === settings.current_term);
                                    return (
                                        <div key={student.id} className={index > 0 ? 'page-break-before' : ''}>
                                            <ReportCardTemplate
                                                student={student}
                                                currentClass={currentClass}
                                                score={studentScore || { id: '', student_id: student.id, class_id: selectedClass, session: settings.current_session, term: settings.current_term, rows: [], average: 0, created_at: Date.now(), updated_at: Date.now(), affective: {}, psychomotor: {} }}
                                                settings={settings}
                                                subjects={classSubjects}
                                            />
                                        </div>
                                    );
                                })}
                            </div>
                        ) : previewScore && selectedStudent && currentClass ? (
                            <div id="report-card" className="bg-white shadow-lg relative" style={{ fontFamily: settings?.report_font_family || 'inherit' }}>
                                {/* Watermark */}
                                {settings?.watermark_media && (
                                    <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
                                        {settings?.tiled_watermark ? (
                                            <div
                                                className="absolute opacity-[0.06]"
                                                style={{
                                                    backgroundImage: `url(${settings.watermark_media})`,
                                                    backgroundRepeat: 'repeat',
                                                    backgroundSize: '100px 100px',
                                                    width: '200%',
                                                    height: '200%',
                                                    top: '-50%',
                                                    left: '-50%',
                                                    transform: 'rotate(-30deg)',
                                                    filter: 'grayscale(50%) opacity(0.7)'
                                                }}
                                            />
                                        ) : (
                                            <div className="absolute inset-0 flex items-center justify-center opacity-[0.08]">
                                                <img src={settings.watermark_media} alt="" className="w-2/3 max-w-md object-contain" style={{ filter: 'grayscale(50%)' }} />
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Content wrapper */}
                                <div className="relative z-10 p-8">
                                    {/* School Header - Clean centered design */}
                                    <div className="text-center mb-8">
                                        {settings?.logo_media && (
                                            <div className="flex justify-center mb-3">
                                                <img src={settings.logo_media} alt="Logo" className="h-20 w-20 object-contain" />
                                            </div>
                                        )}
                                        <h1 className="text-2xl md:text-3xl font-black text-blue-900 uppercase tracking-wide">
                                            {settings?.school_name || 'School Name'}
                                        </h1>
                                        <p className="text-gray-600 text-sm mt-1">{settings?.school_address}</p>
                                        {(settings?.school_email || settings?.school_phone) && (
                                            <p className="text-blue-600 text-xs mt-1">
                                                {settings?.school_email}{settings?.school_email && settings?.school_phone ? ' | ' : ''}{settings?.school_phone}
                                            </p>
                                        )}
                                    </div>

                                    {/* Student Info - Simple bordered table style */}
                                    <div className="border border-gray-300 rounded mb-6">
                                        <div className="grid grid-cols-2 divide-x divide-gray-300">
                                            <div className="p-3 border-b border-gray-300 flex">
                                                <span className="text-xs text-gray-500 uppercase w-32">Student Name:</span>
                                                <span className="font-bold text-gray-800">{selectedStudent.names}</span>
                                            </div>
                                            <div className="p-3 border-b border-gray-300 flex">
                                                <span className="text-xs text-gray-500 uppercase w-32">Admission No:</span>
                                                <span className="font-bold text-gray-800">{selectedStudent.student_no}</span>
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-2 divide-x divide-gray-300">
                                            <div className="p-3 border-b border-gray-300 flex">
                                                <span className="text-xs text-gray-500 uppercase w-32">Class:</span>
                                                <span className="font-bold text-gray-800">{currentClass.name}</span>
                                            </div>
                                            <div className="p-3 border-b border-gray-300 flex">
                                                <span className="text-xs text-gray-500 uppercase w-32">Session / Term:</span>
                                                <span className="font-bold text-blue-700">{settings.current_session} | {settings.current_term}</span>
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-2 divide-x divide-gray-300">
                                            <div className="p-3 flex">
                                                <span className="text-xs text-gray-500 uppercase w-32">Attendance:</span>
                                                <span className="font-bold text-gray-800">{previewScore.attendance_present || 0} / {previewScore.attendance_total || 0}</span>
                                            </div>
                                            <div className="p-3 flex">
                                                <span className="text-xs text-gray-500 uppercase w-32">Next Term Resumes:</span>
                                                <span className="font-bold text-blue-700">{settings?.next_term_begins || '-'}</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Academic Performance Table - Clean design */}
                                    <table className="w-full border-collapse border border-gray-300 text-sm mb-6">
                                        <thead>
                                            <tr className="bg-gray-50">
                                                <th className="border border-gray-300 p-3 text-left text-gray-700 font-bold">Subject</th>
                                                <th className="border border-gray-300 p-3 text-center text-gray-700 font-bold w-16">HW/CW</th>
                                                <th className="border border-gray-300 p-3 text-center text-gray-700 font-bold w-16">CAT</th>
                                                <th className="border border-gray-300 p-3 text-center text-gray-700 font-bold w-16">Exam</th>
                                                <th className="border border-gray-300 p-3 text-center text-gray-700 font-bold w-16">Total</th>
                                                <th className="border border-gray-300 p-3 text-center text-gray-700 font-bold w-14">Grade</th>
                                                <th className="border border-gray-300 p-3 text-left text-gray-700 font-bold">Remark</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {classSubjects.map((subj) => {
                                                const row = previewScore.rows?.find(r => r.subject === subj) || { ca1: 0, ca2: 0, exam: 0, total: 0, grade: '-', comment: '-' };
                                                const gradeColor = row.grade === 'A' ? 'text-green-600' : row.grade === 'B' ? 'text-blue-600' : row.grade === 'C' ? 'text-amber-600' : row.grade === 'D' ? 'text-orange-500' : row.grade === 'F' ? 'text-red-500' : 'text-gray-400';
                                                return (
                                                    <tr key={subj} className="hover:bg-gray-50">
                                                        <td className="border border-gray-300 p-3 font-medium text-gray-800">{subj}</td>
                                                        <td className="border border-gray-300 p-3 text-center text-gray-600">{row.ca1 || '-'}</td>
                                                        <td className="border border-gray-300 p-3 text-center text-gray-600">{row.ca2 || '-'}</td>
                                                        <td className="border border-gray-300 p-3 text-center text-gray-600">{row.exam || '-'}</td>
                                                        <td className="border border-gray-300 p-3 text-center font-bold text-gray-900">{row.total || '-'}</td>
                                                        <td className={`border border-gray-300 p-3 text-center font-bold ${gradeColor}`}>{row.grade}</td>
                                                        <td className="border border-gray-300 p-3 text-xs text-gray-500 italic">{row.comment || '-'}</td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>

                                    {/* Summary Row */}
                                    <div className="flex justify-end gap-6 mb-6 text-sm">
                                        <div className="flex items-center gap-2">
                                            <span className="text-gray-500 uppercase text-xs font-bold">Total Score:</span>
                                            <span className="font-black text-lg text-gray-800">{previewScore.total_score || '-'}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-gray-500 uppercase text-xs font-bold">Average:</span>
                                            <span className="font-black text-lg text-blue-700">{(previewScore.average || 0).toFixed(1)}%</span>
                                        </div>
                                    </div>

                                    {/* Skills & Behavior - Side by Side */}
                                    {settings?.show_skills && (
                                        <div className="grid grid-cols-2 gap-6 mb-6">
                                            <div className="border border-gray-300 rounded">
                                                <div className="bg-gray-100 px-3 py-2 border-b border-gray-300">
                                                    <h3 className="text-xs font-bold text-gray-700 uppercase">Affective Domain</h3>
                                                </div>
                                                <table className="w-full text-xs">
                                                    <tbody>
                                                        {Utils.DOMAINS_AFFECTIVE.map((trait, idx) => (
                                                            <tr key={trait} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                                                                <td className="p-2 text-gray-700 border-b border-gray-200">{trait}</td>
                                                                <td className="p-2 text-center font-bold text-gray-800 w-10 border-b border-gray-200">{previewScore.affective?.[trait] || '-'}</td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                            <div className="border border-gray-300 rounded">
                                                <div className="bg-gray-100 px-3 py-2 border-b border-gray-300">
                                                    <h3 className="text-xs font-bold text-gray-700 uppercase">Psychomotor Skills</h3>
                                                </div>
                                                <table className="w-full text-xs">
                                                    <tbody>
                                                        {Utils.DOMAINS_PSYCHOMOTOR.map((skill, idx) => (
                                                            <tr key={skill} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                                                                <td className="p-2 text-gray-700 border-b border-gray-200">{skill}</td>
                                                                <td className="p-2 text-center font-bold text-gray-800 w-10 border-b border-gray-200">{previewScore.psychomotor?.[skill] || '-'}</td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>
                                    )}

                                    {/* Remarks Section - Simple bordered */}
                                    <div className="border border-gray-300 rounded mb-6">
                                        <div className="p-3 border-b border-gray-300">
                                            <span className="text-xs font-bold text-gray-500 uppercase">{settings?.class_teacher_label || 'Class Teacher'}&apos;s Remark:</span>
                                            <p className="text-sm text-gray-700 mt-1">{previewScore.teacher_remark || 'No comment provided.'}</p>
                                        </div>
                                        <div className="p-3">
                                            <span className="text-xs font-bold text-gray-500 uppercase">{settings?.head_teacher_label || 'Head Teacher'}&apos;s Remark:</span>
                                            <p className="text-sm text-gray-700 mt-1">{previewScore.head_teacher_remark || 'No comment provided.'}</p>
                                        </div>
                                    </div>

                                    {/* Signatures */}
                                    <div className="grid grid-cols-2 gap-12 pt-4">
                                        <div className="text-center">
                                            <div className="h-12 border-b border-gray-400 mb-2"></div>
                                            <p className="text-xs font-bold text-gray-600 uppercase">{settings?.class_teacher_label || 'Class Teacher'}&apos;s Signature</p>
                                        </div>
                                        <div className="text-center">
                                            <div className="h-12 border-b border-gray-400 mb-2 flex items-end justify-center">
                                                {settings?.head_of_school_signature && (
                                                    <img src={settings.head_of_school_signature} className="h-10 object-contain" alt="Signature" />
                                                )}
                                            </div>
                                            <p className="text-xs font-bold text-gray-600 uppercase">{settings?.head_teacher_label || 'Head Teacher'}&apos;s Signature</p>
                                        </div>
                                    </div>

                                    {/* Tagline */}
                                    {settings?.school_tagline && (
                                        <div className="mt-8 text-center border-t border-gray-200 pt-4">
                                            <p className="text-xs text-gray-500 italic">&quot;{settings.school_tagline}&quot;</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ) : (
                            <div className="h-full border-2 border-dashed border-gray-200 rounded-xl flex flex-col items-center justify-center p-12 text-gray-400">
                                Select a student or &quot;All Students&quot; to preview report cards
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Publish Results Tab - Admin Only */}
            {activeTab === 'publish' && currentRole === 'admin' && (
                <div className="space-y-6">
                    {/* Status Overview */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <Card className="p-6 bg-gradient-to-br from-green-50 to-white border-green-200">
                            <div className="flex items-center gap-3">
                                <div className="p-3 bg-green-100 rounded-full">
                                    <ShieldCheck className="h-6 w-6 text-green-600" />
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500">Published</p>
                                    <p className="text-2xl font-bold text-green-700">{classPublishStatus.passedCount}</p>
                                </div>
                            </div>
                        </Card>
                        <Card className="p-6 bg-gradient-to-br from-amber-50 to-white border-amber-200">
                            <div className="flex items-center gap-3">
                                <div className="p-3 bg-amber-100 rounded-full">
                                    <AlertTriangle className="h-6 w-6 text-amber-600" />
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500">Unpublished</p>
                                    <p className="text-2xl font-bold text-amber-700">{classPublishStatus.totalCount - classPublishStatus.passedCount}</p>
                                </div>
                            </div>
                        </Card>
                        <Card className="p-6 bg-gradient-to-br from-blue-50 to-white border-blue-200">
                            <div className="flex items-center gap-3">
                                <div className="p-3 bg-blue-100 rounded-full">
                                    <Shield className="h-6 w-6 text-blue-600" />
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500">Total Scores</p>
                                    <p className="text-2xl font-bold text-blue-700">{classPublishStatus.totalCount}</p>
                                </div>
                            </div>
                        </Card>
                    </div>

                    <Card>
                        <div className="p-4 border-b bg-gray-50 flex flex-wrap gap-4 justify-between items-center">
                            <div className="flex items-center gap-4">
                                <Select
                                    label="Select Class"
                                    value={selectedClass}
                                    onChange={e => setSelectedClass(e.target.value)}
                                >
                                    {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                </Select>
                                <div className="text-sm text-gray-500">
                                    {settings.current_session} • {settings.current_term}
                                </div>
                            </div>
                            <div className="flex gap-3">
                                <Button
                                    variant="secondary"
                                    onClick={() => handlePassReportCards(false)}
                                    disabled={classPublishStatus.nonePassed}
                                    className="flex items-center gap-2"
                                >
                                    <ShieldX className="h-4 w-4" />
                                    Unpublish All
                                </Button>
                                <Button
                                    onClick={() => handlePassReportCards(true)}
                                    disabled={classPublishStatus.allPassed}
                                    className="flex items-center gap-2 bg-green-600 hover:bg-green-700"
                                >
                                    <ShieldCheck className="h-4 w-4" />
                                    Publish All Results
                                </Button>
                            </div>
                        </div>

                        <div className="p-4">
                            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-4">
                                <div className="flex items-start gap-3">
                                    <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                                    <div>
                                        <p className="text-sm font-medium text-amber-800">Important Notice</p>
                                        <p className="text-sm text-amber-700 mt-1">
                                            Students and parents can only view report cards and grades after you publish them.
                                            Make sure all scores and remarks are complete before publishing.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <table className="w-full">
                                <thead>
                                    <tr className="border-b text-left">
                                        <th className="py-3 px-4 font-semibold text-gray-700">Student</th>
                                        <th className="py-3 px-4 font-semibold text-gray-700 text-center">Average</th>
                                        <th className="py-3 px-4 font-semibold text-gray-700 text-center">Subjects Graded</th>
                                        <th className="py-3 px-4 font-semibold text-gray-700 text-center">Status</th>
                                        <th className="py-3 px-4 font-semibold text-gray-700 text-center">Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {activeStudents.map(student => {
                                        const studentScore = scores.find(s =>
                                            s.student_id === student.id &&
                                            s.session === settings.current_session &&
                                            s.term === settings.current_term
                                        );
                                        const isPublished = studentScore?.is_passed ?? false;
                                        const subjectsGraded = studentScore?.rows?.filter(r => r.total > 0).length || 0;

                                        return (
                                            <tr key={student.id} className="border-b hover:bg-gray-50">
                                                <td className="py-3 px-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="h-10 w-10 rounded-full bg-brand-100 flex items-center justify-center text-brand-700 font-bold">
                                                            {student.names.charAt(0)}
                                                        </div>
                                                        <div>
                                                            <p className="font-medium text-gray-900">{student.names}</p>
                                                            <p className="text-xs text-gray-500">{student.student_no}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="py-3 px-4 text-center">
                                                    <span className={`font-bold ${(studentScore?.average || 0) >= 50 ? 'text-green-600' : 'text-red-600'}`}>
                                                        {studentScore?.average?.toFixed(1) || '0'}%
                                                    </span>
                                                </td>
                                                <td className="py-3 px-4 text-center">
                                                    <span className={`${subjectsGraded > 0 ? 'text-gray-900' : 'text-red-500'}`}>
                                                        {subjectsGraded} / {classSubjects.length}
                                                    </span>
                                                </td>
                                                <td className="py-3 px-4 text-center">
                                                    {isPublished ? (
                                                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                                                            <CheckCircle className="h-3 w-3" />
                                                            Published
                                                        </span>
                                                    ) : (
                                                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-700">
                                                            <XCircle className="h-3 w-3" />
                                                            Unpublished
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="py-3 px-4 text-center">
                                                    {isPublished ? (
                                                        <Button
                                                            variant="secondary"
                                                            size="sm"
                                                            onClick={() => handlePassSingleReport(student.id, false)}
                                                            className="text-xs"
                                                        >
                                                            Unpublish
                                                        </Button>
                                                    ) : (
                                                        <Button
                                                            size="sm"
                                                            onClick={() => handlePassSingleReport(student.id, true)}
                                                            className="text-xs bg-green-600 hover:bg-green-700"
                                                            disabled={subjectsGraded === 0}
                                                        >
                                                            Publish
                                                        </Button>
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                    {activeStudents.length === 0 && (
                                        <tr>
                                            <td colSpan={5} className="py-8 text-center text-gray-500">
                                                No students found in this class
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </Card>
                </div>
            )}
        </div>
    );
};
