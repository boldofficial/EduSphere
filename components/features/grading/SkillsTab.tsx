/**
 * Skills Tab
 * 
 * Affective domain (behavioral traits) and Psychomotor skills rating,
 * plus attendance & remarks per student.
 */
import React from 'react';
import { ChevronRight, Sparkles, Loader2 } from 'lucide-react';
import * as Types from '@/lib/types';
import * as Utils from '@/lib/utils';
import { Card } from '@/components/ui/card';
import { Select } from '@/components/ui/select';

interface SkillsTabProps {
    classes: Types.Class[];
    selectedClass: string;
    setSelectedClass: (id: string) => void;
    activeStudents: Types.Student[];
    reportStudentId: string;
    setReportStudentId: (id: string) => void;
    scores: Types.Score[];
    settings: Types.Settings;
    handleTraitChange: (studentId: string, category: 'affective' | 'psychomotor', trait: string, value: number) => void;
    handleScoreFieldChange: (studentId: string, field: keyof Types.Score, value: any) => void;
    onMagicRemark: (studentId: string) => Promise<void>;
}

export const SkillsTab: React.FC<SkillsTabProps> = ({
    classes, selectedClass, setSelectedClass, activeStudents,
    reportStudentId, setReportStudentId, scores, settings,
    handleTraitChange, handleScoreFieldChange, onMagicRemark
}) => {
    const [isGenerating, setIsGenerating] = React.useState(false);

    const handleAIGenerate = async () => {
        setIsGenerating(true);
        try {
            await onMagicRemark(reportStudentId);
        } finally {
            setIsGenerating(false);
        }
    };
    return (
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
                                    <div className="flex justify-between items-center">
                                        <label className="text-xs font-bold text-gray-500 uppercase">{settings.class_teacher_label} Remark</label>
                                        <button
                                            onClick={handleAIGenerate}
                                            disabled={isGenerating}
                                            className="flex items-center gap-1.5 text-[10px] font-bold uppercase py-1 px-2 rounded-full bg-brand-50 text-brand-600 hover:bg-brand-100 transition-colors disabled:opacity-50"
                                        >
                                            {isGenerating ? (
                                                <Loader2 className="h-3 w-3 animate-spin" />
                                            ) : (
                                                <Sparkles className="h-3 w-3" />
                                            )}
                                            Magic Remark
                                        </button>
                                    </div>
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
    );
};
