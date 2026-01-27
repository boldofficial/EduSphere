import React from 'react';
import * as Types from '@/lib/types';
import * as Utils from '@/lib/utils';
import {
    ResponsiveContainer,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Cell,
    PieChart,
    Pie
} from 'recharts';

interface ReportCardTemplateProps {
    student: Types.Student;
    currentClass: Types.Class;
    score: Types.Score;
    settings: Types.Settings;
    subjects: string[];
}

// Grading key for the report card
const GRADING_KEY = [
    { grade: 'A', range: '75-100', remark: 'Excellent', color: '#10b981' },
    { grade: 'B', range: '65-74', remark: 'Very Good', color: '#3b82f6' },
    { grade: 'C', range: '50-64', remark: 'Good', color: '#f59e0b' },
    { grade: 'D', range: '40-49', remark: 'Fair', color: '#f97316' },
    { grade: 'F', range: '0-39', remark: 'Fail', color: '#ef4444' },
];

const RATING_KEY = [
    { rating: 5, meaning: 'Outstanding' },
    { rating: 4, meaning: 'Very Good' },
    { rating: 3, meaning: 'Good' },
    { rating: 2, meaning: 'Fair' },
    { rating: 1, meaning: 'Poor' },
];

const getGradeColor = (grade: string) => {
    switch (grade) {
        case 'A': return 'text-emerald-700 bg-emerald-50 border-emerald-200';
        case 'B': return 'text-blue-700 bg-blue-50 border-blue-200';
        case 'C': return 'text-amber-700 bg-amber-50 border-amber-200';
        case 'D': return 'text-orange-700 bg-orange-50 border-orange-200';
        case 'F': return 'text-red-700 bg-red-50 border-red-200';
        default: return 'text-gray-700 bg-gray-50 border-gray-200';
    }
};

const SkillBar = ({ label, rating }: { label: string, rating: number }) => {
    const percentage = (rating / 5) * 100;
    return (
        <div className="space-y-1">
            <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-tight text-gray-500 px-0.5">
                <span>{label}</span>
                <span className="text-brand-700">{rating}/5</span>
            </div>
            <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden border border-gray-200/50">
                <div
                    className="h-full bg-gradient-to-r from-brand-500 to-brand-700 rounded-full transition-all duration-500"
                    style={{ width: `${percentage}%` }}
                />
            </div>
        </div>
    );
};

export const ReportCardTemplate: React.FC<ReportCardTemplateProps> = ({
    student,
    currentClass,
    score,
    settings,
    subjects
}) => {
    const attendancePercent = score?.attendance_total
        ? Math.round((score.attendance_present || 0) / score.attendance_total * 100)
        : null;

    // Data for charts
    const chartData = subjects.map(subj => {
        const row = score?.rows?.find(r => r.subject === subj);
        return {
            name: subj.substring(0, 10), // Truncate for display
            fullName: subj,
            score: row?.total || 0,
            fill: (row?.total || 0) >= 70 ? '#10b981' : (row?.total || 0) >= 50 ? '#3b82f6' : '#ef4444'
        };
    });

    const averageData = [
        { name: 'Average', value: score?.average || 0, fill: '#0f172a' },
        { name: 'Remaining', value: Math.max(0, 100 - (score?.average || 0)), fill: '#f1f5f9' }
    ];

    return (
        <div
            id="report-card"
            className="bg-white shadow-2xl max-w-4xl mx-auto overflow-hidden ring-1 ring-gray-200 print:shadow-none print:ring-0"
            style={{ fontFamily: settings?.report_font_family || "'Inter', sans-serif" }}
        >
            {/* Top Bar Decoration */}
            <div className="h-2.5 bg-gradient-to-r from-[#1e293b] via-[#334155] to-[#1e293b]" />

            <div className="relative px-10 py-8">
                {/* Watermark Logo */}
                {settings?.watermark_media && !settings?.tiled_watermark && (
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-[0.04] pointer-events-none">
                        <img src={settings.watermark_media} className="w-[450px]" alt="Watermark" />
                    </div>
                )}

                {/* header */}
                <div className="flex justify-between items-start border-b-2 border-slate-100 pb-8 mb-8 relative">
                    <div className="flex items-center gap-6">
                        {settings?.logo_media && (
                            <div className="h-28 w-28 rounded-2xl bg-white shadow-lg border border-slate-100 p-2 overflow-hidden ring-4 ring-slate-50">
                                <img src={settings.logo_media} className="w-full h-full object-contain" alt="Logo" />
                            </div>
                        )}
                        <div>
                            <h1 className="text-3xl font-black text-slate-900 tracking-tighter uppercase mb-1">
                                {settings?.school_name}
                            </h1>
                            <p className="text-sm font-medium text-brand-600 italic mb-2 tracking-wide">
                                "{settings?.school_tagline}"
                            </p>
                            <div className="space-y-0.5">
                                <p className="text-[11px] text-slate-500 font-semibold uppercase tracking-widest">{settings?.school_address}</p>
                                <p className="text-[11px] text-slate-500 font-semibold tracking-widest">
                                    {settings?.school_phone} <span className="mx-2 text-slate-300">|</span> {settings?.school_email}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="text-right">
                        <div className="bg-slate-900 text-white px-5 py-2.5 rounded-xl shadow-xl inline-block mb-3">
                            <span className="text-[10px] font-black uppercase tracking-[0.2em] block leading-tight opacity-70">Official Document</span>
                            <span className="text-lg font-bold tracking-tight">Academic Performance Report</span>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                            <span className="text-sm font-black text-slate-800 tracking-tight">{settings?.current_term}</span>
                            <span className="text-xs font-bold text-slate-400 bg-slate-50 px-2 py-0.5 rounded border border-slate-100">{settings?.current_session} Session</span>
                        </div>
                    </div>
                </div>

                {/* Bio Section */}
                <div className="grid grid-cols-12 gap-8 mb-10">
                    <div className="col-span-3">
                        <div className="aspect-[4/5] rounded-2xl overflow-hidden border-4 border-white shadow-2xl shadow-slate-200 ring-1 ring-slate-100 relative group bg-slate-50">
                            {student?.passport_url ? (
                                <img src={student.passport_url} alt={student.names} className="w-full h-full object-cover" />
                            ) : (
                                <div className="h-full w-full flex items-center justify-center bg-slate-100">
                                    <span className="font-black text-4xl text-slate-200">?</span>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="col-span-6 grid grid-cols-2 gap-y-6 content-center">
                        <div>
                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Student Name</span>
                            <span className="text-xl font-black text-slate-800 tracking-tight block leading-tight">{student?.names}</span>
                        </div>
                        <div>
                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Matric / Admission No.</span>
                            <span className="text-xl font-black text-brand-700 tracking-tight block leading-tight">{student?.student_no}</span>
                        </div>
                        <div>
                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Current Class</span>
                            <span className="text-base font-bold text-slate-700 block leading-tight">{currentClass?.name}</span>
                        </div>
                        <div>
                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Gender / Health</span>
                            <span className="text-base font-bold text-slate-700 block leading-tight capitalize">{student?.gender || '-'}</span>
                        </div>
                    </div>

                    <div className="col-span-3 flex flex-col items-center justify-center border-l-2 border-dashed border-slate-100 pl-8">
                        <div className="relative h-28 w-28">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={averageData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={35}
                                        outerRadius={45}
                                        paddingAngle={0}
                                        dataKey="value"
                                        startAngle={90}
                                        endAngle={-270}
                                    >
                                        {averageData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.fill} />
                                        ))}
                                    </Pie>
                                </PieChart>
                            </ResponsiveContainer>
                            <div className="absolute inset-0 flex flex-col items-center justify-center m-[12px] shadow-inner bg-white rounded-full">
                                <span className="text-xl font-black text-slate-900 leading-none">{(score?.average || 0).toFixed(0)}</span>
                                <span className="text-[9px] font-black text-slate-400 uppercase">AVG %</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Score Table */}
                <div className="mb-10">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="h-6 w-1.5 bg-slate-800 rounded-full shadow-sm" />
                        <h2 className="text-sm font-black text-slate-800 uppercase tracking-widest">Academic Transcript</h2>
                    </div>

                    <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-xl shadow-slate-100/50">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="bg-slate-900 text-white">
                                    <th className="py-4 px-6 text-left font-bold text-[10px] uppercase tracking-[0.2em] border-r border-slate-800">Subject / Course</th>
                                    <th className="py-4 px-2 text-center font-bold text-[10px] uppercase tracking-[0.2em] border-r border-slate-800 w-20">HW/CW<br /><span className="text-slate-400 font-normal opacity-70">(20)</span></th>
                                    <th className="py-4 px-2 text-center font-bold text-[10px] uppercase tracking-[0.2em] border-r border-slate-800 w-20">CAT<br /><span className="text-slate-400 font-normal opacity-70">(20)</span></th>
                                    <th className="py-4 px-2 text-center font-bold text-[10px] uppercase tracking-[0.2em] border-r border-slate-800 w-20">EXAM<br /><span className="text-slate-400 font-normal opacity-70">(60)</span></th>
                                    <th className="py-4 px-2 text-center font-black text-[10px] uppercase tracking-[0.2em] border-r border-slate-800 w-20 bg-slate-800">TOTAL<br /><span className="text-slate-200 font-normal opacity-70">(100)</span></th>
                                    <th className="py-4 px-4 text-center font-bold text-[10px] uppercase tracking-[0.2em] w-16">Grade</th>
                                    <th className="py-4 px-6 text-left font-bold text-[10px] uppercase tracking-[0.2em]">Instructor's Remark</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {subjects?.map((subj, idx) => {
                                    const row = score?.rows?.find(r => r.subject === subj) || { ca1: 0, ca2: 0, exam: 0, total: 0, grade: '-', comment: '-' };
                                    const gradeColors = getGradeColor(row.grade);
                                    return (
                                        <tr key={subj} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/30'}>
                                            <td className="py-3 px-6 font-bold text-slate-700 tracking-tight border-r border-slate-100">{subj}</td>
                                            <td className="py-3 px-2 text-center text-slate-500 font-medium border-r border-slate-100">{row.ca1 || 0}</td>
                                            <td className="py-3 px-2 text-center text-slate-500 font-medium border-r border-slate-100">{row.ca2 || 0}</td>
                                            <td className="py-3 px-2 text-center text-slate-500 font-medium border-r border-slate-100">{row.exam || 0}</td>
                                            <td className="py-3 px-2 text-center font-black text-slate-900 bg-slate-100/30 border-r border-slate-100">{row.total || 0}</td>
                                            <td className="py-3 px-4 text-center border-r border-slate-100">
                                                <span className={`inline-block px-2.5 py-0.5 rounded-md font-black text-[11px] border ${gradeColors}`}>
                                                    {row.grade}
                                                </span>
                                            </td>
                                            <td className="py-3 px-6 text-[11px] text-slate-500 font-medium italic">"{row.comment}"</td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Charts & Skills */}
                <div className="grid grid-cols-12 gap-10 mb-10">
                    <div className="col-span-7">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="h-6 w-1.5 bg-brand-600 rounded-full shadow-sm" />
                            <h2 className="text-sm font-black text-slate-800 uppercase tracking-widest">Performance Analysis</h2>
                        </div>
                        <div className="h-[260px] w-full bg-slate-50 rounded-2xl p-6 border border-slate-100 shadow-inner">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={chartData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                    <XAxis
                                        dataKey="name"
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 700 }}
                                    />
                                    <YAxis
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 700 }}
                                        domain={[0, 100]}
                                    />
                                    <Tooltip
                                        cursor={{ fill: '#f1f5f9' }}
                                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', fontSize: '11px', fontWeight: 'bold' }}
                                    />
                                    <Bar dataKey="score" radius={[6, 6, 0, 0]} barSize={24}>
                                        {chartData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.fill} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    <div className="col-span-5 space-y-6">
                        {settings?.show_skills && (
                            <>
                                <div>
                                    <div className="flex items-center gap-2 mb-3 px-1">
                                        <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Affective Domain</h3>
                                    </div>
                                    <div className="space-y-3 bg-white p-5 rounded-2xl border border-slate-100 shadow-xl shadow-slate-100/40">
                                        {Utils.DOMAINS_AFFECTIVE.slice(0, 5).map(trait => (
                                            <SkillBar key={trait} label={trait} rating={score?.affective?.[trait] || 0} />
                                        ))}
                                    </div>
                                </div>
                                <div>
                                    <div className="flex items-center gap-2 mb-3 px-1">
                                        <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Psychomotor Skills</h3>
                                    </div>
                                    <div className="space-y-3 bg-white p-5 rounded-2xl border border-slate-100 shadow-xl shadow-slate-100/40">
                                        {Utils.DOMAINS_PSYCHOMOTOR.slice(0, 5).map(skill => (
                                            <SkillBar key={skill} label={skill} rating={score?.psychomotor?.[skill] || 0} />
                                        ))}
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                </div>

                {/* Key Summary Footer */}
                <div className="grid grid-cols-4 gap-4 mb-8">
                    <div className="bg-slate-900 rounded-2xl p-4 text-center shadow-xl shadow-slate-200">
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Total Aggregate</span>
                        <span className="text-2xl font-black text-white tracking-tight">{score?.total_score || 0} pts</span>
                    </div>
                    <div className="bg-white rounded-2xl p-4 text-center shadow-xl shadow-slate-200 border border-slate-100">
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Class Position</span>
                        <span className="text-2xl font-black text-brand-700 tracking-tight">{score?.position ? Utils.ordinalSuffix(score.position) : 'N/A'}</span>
                    </div>
                    <div className="bg-white rounded-2xl p-4 text-center shadow-xl shadow-slate-200 border border-slate-100">
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Attendance Rate</span>
                        <span className="text-2xl font-black text-emerald-600 tracking-tight">{attendancePercent ? `${attendancePercent}%` : '100%'}</span>
                    </div>
                    <div className="bg-white rounded-2xl p-4 text-center shadow-xl shadow-slate-200 border border-slate-100">
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Final Standing</span>
                        <span className="text-2xl font-black text-slate-800 tracking-tight">{(score?.average || 0) >= settings?.promotion_threshold ? 'PASS' : 'FAIL'}</span>
                    </div>
                </div>

                {/* Remarks & Signatures */}
                <div className="grid grid-cols-2 gap-8 mb-10 pt-4 border-t border-slate-100">
                    <div className="space-y-6">
                        <div className="bg-slate-50/50 rounded-2xl p-6 relative">
                            <span className="absolute -top-3 left-6 bg-slate-900 text-white px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest">
                                {settings?.class_teacher_label} Remark
                            </span>
                            <p className="text-sm text-slate-600 font-bold italic leading-relaxed py-2">
                                "{score?.teacher_remark || 'Excellent performance throughout the term. Keep it up.'}"
                            </p>
                            <div className="mt-4 pt-4 border-t border-slate-200/50 flex justify-between items-end">
                                <div className="h-10 w-24 border-b border-slate-300" />
                                <span className="text-[10px] font-black text-slate-300 uppercase italic">Signature</span>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-6">
                        <div className="bg-slate-50/50 rounded-2xl p-6 relative">
                            <span className="absolute -top-3 left-6 bg-emerald-600 text-white px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest">
                                {settings?.head_teacher_label} Remark
                            </span>
                            <p className="text-sm text-slate-600 font-bold italic leading-relaxed py-2">
                                "{score?.head_teacher_remark || 'A well-deserved result. Keep striving for excellence.'}"
                            </p>
                            <div className="mt-4 pt-4 border-t border-slate-200/50 flex justify-between items-end">
                                <div className="h-10 w-32 flex items-end justify-center">
                                    {settings?.head_of_school_signature && (
                                        <img src={settings.head_of_school_signature} className="h-full object-contain mix-blend-multiply" />
                                    )}
                                </div>
                                <span className="text-[10px] font-black text-slate-300 uppercase italic">Signature & Stamp</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Legend & Next Term */}
                <div className="flex flex-col gap-6 pt-6 border-t border-slate-100">
                    <div className="flex justify-between items-center text-[9px]">
                        <div className="flex gap-4">
                            <span className="font-black text-slate-400 uppercase tracking-widest">Grading Matrix:</span>
                            {GRADING_KEY.map(g => (
                                <div key={g.grade} className="flex items-center gap-1.5 font-bold">
                                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: g.color }} />
                                    <span className="text-slate-800">{g.grade}</span>
                                    <span className="text-slate-400 italic">({g.range})</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="flex justify-between items-center bg-slate-900 p-6 rounded-3xl shadow-2xl text-white">
                        <div className="flex items-center gap-8">
                            <div className="bg-slate-800/50 px-4 py-2 rounded-xl border border-slate-700/50">
                                <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest block">Next Session Begins</span>
                                <span className="text-sm font-bold tracking-tight">
                                    {settings?.next_term_begins ? new Date(settings.next_term_begins).toDateString() : 'Visit Portal for Dates'}
                                </span>
                            </div>
                            {score?.promoted_to && (
                                <div className="bg-emerald-600/20 px-4 py-2 rounded-xl border border-emerald-500/30">
                                    <span className="text-[9px] font-black text-emerald-400 uppercase tracking-widest block">Promotion / Advancement</span>
                                    <span className="text-sm font-black tracking-tight text-white">{score.promoted_to}</span>
                                </div>
                            )}
                        </div>
                        <div className="text-right">
                            <p className="text-[10px] font-black tracking-widest opacity-40 mb-1">DOCUMENT VERIFICATION ID</p>
                            <p className="text-xs font-mono font-bold tracking-tighter opacity-80 uppercase">{String(student?.id || '').substring(0, 13) || 'TEMP'}-{Date.now().toString().substring(7)}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Bottom Accent */}
            <div className="h-1 bg-slate-100" />
        </div>
    );
};
