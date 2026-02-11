/**
 * Report Preview Tab
 * 
 * Student selection sidebar + inline report card preview with print support.
 */
import React from 'react';
import { ChevronRight, Printer } from 'lucide-react';
import * as Types from '@/lib/types';
import * as Utils from '@/lib/utils';
import { Card } from '@/components/ui/card';
import { Select } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { ReportCardTemplate } from './ReportCardTemplate';

interface ReportPreviewTabProps {
    classes: Types.Class[];
    selectedClass: string;
    setSelectedClass: (id: string) => void;
    activeStudents: Types.Student[];
    reportStudentId: string;
    setReportStudentId: (id: string) => void;
    scores: Types.Score[];
    settings: Types.Settings;
    classSubjects: string[];
    currentClass: Types.Class | undefined;
    previewScore: Types.Score | null;
    selectedStudent: Types.Student | null;
    handlePrint: () => void;
}

export const ReportPreviewTab: React.FC<ReportPreviewTabProps> = ({
    classes, selectedClass, setSelectedClass, activeStudents,
    reportStudentId, setReportStudentId, scores, settings,
    classSubjects, currentClass, previewScore, selectedStudent, handlePrint
}) => {
    return (
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
                            {/* School Header */}
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

                            {/* Student Info */}
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

                            {/* Academic Performance Table */}
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

                            {/* Skills & Behavior */}
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

                            {/* Remarks Section */}
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
    );
};
