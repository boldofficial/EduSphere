import React from 'react';
import * as Types from '@/lib/types';
import * as Utils from '@/lib/utils';
import { School, User, TrendingUp, Brain, Target, ShieldCheck } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';

interface ReportCardTemplateProps {
    student: Types.Student;
    currentClass: Types.Class;
    score: Types.Score;
    settings: Types.Settings;
    subjects: string[];
    historyScores?: Types.Score[];
}

const GRADE_BANDS = [
    { grade: 'A+', min: 90, max: 100, remark: 'Excellent', badgeClass: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
    { grade: 'A', min: 80, max: 89, remark: 'Excellent', badgeClass: 'bg-teal-100 text-teal-700 border-teal-200' },
    { grade: 'B+', min: 70, max: 79, remark: 'Very Good', badgeClass: 'bg-cyan-100 text-cyan-700 border-cyan-200' },
    { grade: 'B', min: 60, max: 69, remark: 'Good', badgeClass: 'bg-blue-100 text-blue-700 border-blue-200' },
    { grade: 'C', min: 50, max: 59, remark: 'Fair', badgeClass: 'bg-amber-100 text-amber-700 border-amber-200' },
    { grade: 'D', min: 40, max: 49, remark: 'Pass', badgeClass: 'bg-orange-100 text-orange-700 border-orange-200' },
    { grade: 'F', min: 0, max: 39, remark: 'Fail', badgeClass: 'bg-rose-100 text-rose-700 border-rose-200' },
];

const getBand = (value: number) => GRADE_BANDS.find(band => value >= band.min && value <= band.max) || GRADE_BANDS[GRADE_BANDS.length - 1];

const isHexColor = (value?: string | null) => Boolean(value && /^#([0-9a-fA-F]{6})$/.test(value));

const clampChannel = (value: number) => Math.max(0, Math.min(255, Math.round(value)));

const shiftHex = (hex: string, delta: number) => {
    if (!isHexColor(hex)) return '#103c68';
    const color = hex.replace('#', '');
    const r = clampChannel(parseInt(color.slice(0, 2), 16) + delta);
    const g = clampChannel(parseInt(color.slice(2, 4), 16) + delta);
    const b = clampChannel(parseInt(color.slice(4, 6), 16) + delta);
    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
};

const toRgb = (hex: string) => {
    const safeHex = isHexColor(hex) ? hex : '#103c68';
    const color = safeHex.replace('#', '');
    return {
        r: parseInt(color.slice(0, 2), 16),
        g: parseInt(color.slice(2, 4), 16),
        b: parseInt(color.slice(4, 6), 16),
    };
};

const toRgba = (hex: string, alpha: number) => {
    const { r, g, b } = toRgb(hex);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

const formatDateLabel = (value?: string | number) => {
    if (!value) return '-';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '-';
    return date.toLocaleDateString();
};

const hashString = (value: string) => {
    let hash = 0;
    for (let i = 0; i < value.length; i += 1) {
        hash = ((hash << 5) - hash + value.charCodeAt(i)) >>> 0;
    }
    return hash.toString(36).toUpperCase().padStart(7, '0');
};

const DotRating = ({ value, color }: { value: number; color: string }) => {
    const safe = Math.max(0, Math.min(5, Math.round(value || 0)));
    const inactiveBorder = toRgba(color, 0.35);

    return (
        <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5].map(item => (
                <span
                    key={item}
                    className="h-2.5 w-2.5 rounded-full border"
                    style={{
                        borderColor: item <= safe ? color : inactiveBorder,
                        backgroundColor: item <= safe ? color : '#ffffff',
                    }}
                />
            ))}
        </div>
    );
};

const termOrder = (term: string) => {
    const key = term.toLowerCase();
    if (key.includes('first')) return 1;
    if (key.includes('second')) return 2;
    if (key.includes('third')) return 3;
    return 99;
};

const sessionStart = (session: string) => {
    const start = Number.parseInt((session || '').split('/')[0], 10);
    return Number.isFinite(start) ? start : 0;
};

const compactTermLabel = (term: string) => {
    const key = term.toLowerCase();
    if (key.includes('first')) return 'T1';
    if (key.includes('second')) return 'T2';
    if (key.includes('third')) return 'T3';
    return term;
};

const Sparkline = ({ values, color }: { values: number[]; color: string }) => {
    if (values.length < 2) {
        return <p className="text-[10px] text-slate-500">Add more terms to see trend analysis.</p>;
    }

    const width = 240;
    const height = 72;
    const padding = 8;
    const min = Math.min(...values, 0);
    const max = Math.max(...values, 100);
    const range = Math.max(1, max - min);

    const points = values.map((value, index) => {
        const x = padding + (index * (width - padding * 2)) / Math.max(1, values.length - 1);
        const y = height - padding - ((value - min) / range) * (height - padding * 2);
        return `${x},${y}`;
    });

    return (
        <svg width="100%" viewBox={`0 0 ${width} ${height}`} className="h-20 w-full">
            <polyline fill="none" stroke={toRgba(color, 0.2)} strokeWidth="8" points={points.join(' ')} strokeLinecap="round" strokeLinejoin="round" />
            <polyline fill="none" stroke={color} strokeWidth="2.5" points={points.join(' ')} strokeLinecap="round" strokeLinejoin="round" />
            {points.map((point, index) => {
                const [x, y] = point.split(',').map(Number);
                return <circle key={index} cx={x} cy={y} r="3" fill={color} />;
            })}
        </svg>
    );
};

export const ReportCardTemplate: React.FC<ReportCardTemplateProps> = ({
    student,
    currentClass,
    score,
    settings,
    subjects,
    historyScores = [],
}) => {
    const themePrimary = isHexColor(settings?.landing_primary_color) ? settings.landing_primary_color : '#103c68';
    const themeDeep = shiftHex(themePrimary, -30);
    const themeSoft = toRgba(themePrimary, 0.08);
    const themeSoftBorder = toRgba(themePrimary, 0.28);
    const isEarlyYears = Utils.isEarlyYearsClass(currentClass);

    const earlyObservations = (score?.early_years_observations || []).map(item => ({
        area: item.area || 'Learning Area',
        status: item.status || 'Developing',
        comment: item.comment || '',
        next_step: item.next_step || '',
    }));

    const subjectRows = (subjects.length ? subjects : score?.rows?.map(row => row.subject) || []).map(subject => {
        const row = score?.rows?.find(item => item.subject === subject) || {
            subject,
            ca1: 0,
            ca2: 0,
            exam: 0,
            total: 0,
            grade: '-',
            comment: '',
        };

        const band = getBand(row.total || 0);

        return {
            ...row,
            band,
            remark: row.comment || band.remark,
        };
    });

    const secureCount = earlyObservations.filter(item => item.status === 'Secure').length;
    const developingCount = earlyObservations.filter(item => item.status === 'Developing').length;
    const emergingCount = earlyObservations.filter(item => item.status === 'Emerging').length;
    const earlySecurePercent = earlyObservations.length ? (secureCount / earlyObservations.length) * 100 : 0;

    const totalAggregate = isEarlyYears
        ? earlyObservations.length
        : score?.total_score || subjectRows.reduce((sum, row) => sum + (row.total || 0), 0);
    const average = isEarlyYears
        ? earlySecurePercent
        : score?.average || (subjectRows.length ? totalAggregate / subjectRows.length : 0);
    const attendancePercent = score?.attendance_total
        ? Math.round(((score.attendance_present || 0) / score.attendance_total) * 100)
        : 0;

    const affectiveTraits = Utils.DOMAINS_AFFECTIVE.slice(0, 6);
    const psychomotorTraits = Utils.DOMAINS_PSYCHOMOTOR.slice(0, 6);

    const sessionYear = settings?.current_session || '-';
    const term = settings?.current_term || '-';
    const resumptionDate = settings?.next_term_begins ? new Date(settings.next_term_begins).toLocaleDateString() : 'To Be Announced';
    const issuedOn = formatDateLabel(score?.updated_at || score?.created_at);

    const progressionRows = historyScores
        .filter(item => item.student_id === student.id && Number.isFinite(item.average))
        .sort((a, b) => {
            const sessionDiff = sessionStart(a.session) - sessionStart(b.session);
            if (sessionDiff !== 0) return sessionDiff;
            return termOrder(a.term) - termOrder(b.term);
        })
        .slice(-6)
        .map((item, index, arr) => {
            const previous = index > 0 ? arr[index - 1] : null;
            const currentObservations = item.early_years_observations || [];
            const currentSecureCount = currentObservations.filter(obs => obs.status === 'Secure').length;
            const currentSecurePercent = currentObservations.length ? (currentSecureCount / currentObservations.length) * 100 : 0;
            const previousObservations = previous?.early_years_observations || [];
            const previousSecureCount = previousObservations.filter(obs => obs.status === 'Secure').length;
            const previousSecurePercent = previousObservations.length ? (previousSecureCount / previousObservations.length) * 100 : 0;

            const previousAverage = previous ? (isEarlyYears ? previousSecurePercent : Number(previous.average || 0)) : 0;
            const currentAverage = isEarlyYears ? currentSecurePercent : Number(item.average || 0);
            const growth = previous ? currentAverage - previousAverage : null;
            const attendance = item.attendance_total
                ? Math.round(((item.attendance_present || 0) / item.attendance_total) * 100)
                : null;

            return {
                id: item.id,
                session: item.session,
                term: item.term,
                average: currentAverage,
                position: item.position,
                attendance,
                growth,
                isPassed: Boolean(item.is_passed),
            };
        });

    const trendHistory = progressionRows
        .slice(-3)
        .map(item => ({
            label: `${item.session.split('/')[0]} ${compactTermLabel(item.term)}`,
            average: item.average,
        }));

    const trendValues = trendHistory.map(item => item.average);
    const trendDelta = trendValues.length > 1 ? trendValues[trendValues.length - 1] - trendValues[0] : 0;
    const trendText = trendValues.length < 2 ? 'Baseline captured' : trendDelta >= 4 ? 'Strong improvement' : trendDelta <= -4 ? 'Needs intervention' : 'Stable progression';

    const sortedSubjects = [...subjectRows].sort((a, b) => (b.total || 0) - (a.total || 0));
    const strengths = isEarlyYears
        ? earlyObservations
            .filter(item => item.status === 'Secure')
            .slice(0, 2)
            .map(item => ({ subject: item.area, total: 100 }))
        : sortedSubjects.filter(item => item.total > 0).slice(0, 2);
    const interventionAreas = isEarlyYears
        ? earlyObservations
            .filter(item => item.status === 'Emerging')
            .slice(0, 2)
            .map(item => ({ subject: item.area, total: 0 }))
        : [...sortedSubjects].reverse().filter(item => item.total < 60).slice(0, 2);

    const actionPlan: string[] = [];
    if (attendancePercent < 75) actionPlan.push('Target at least 85% attendance next term with weekly tracking.');
    if (interventionAreas.length > 0) actionPlan.push(`Schedule focused support for ${interventionAreas.map(item => item.subject).join(' and ')}.`);
    if (isEarlyYears) {
        if (secureCount < Math.ceil(Math.max(1, earlyObservations.length / 2))) {
            actionPlan.push('Increase home-school reading and fine-motor routines with weekly feedback notes.');
        }
    } else if (average < 65) {
        actionPlan.push('Adopt a structured 4-day revision timetable with parent supervision.');
    }
    if (actionPlan.length === 0) actionPlan.push('Maintain momentum with enrichment tasks and peer mentoring opportunities.');

    const standoutBadges = (
        isEarlyYears
            ? [
                secureCount >= Math.max(3, Math.ceil(earlyObservations.length * 0.6)) ? 'Strong Development Milestones' : null,
                attendancePercent >= 90 ? 'Excellent Attendance' : null,
                trendDelta >= 5 ? 'Rapid Progress' : null,
            ]
            : [
                average >= 85 ? 'High Distinction' : null,
                attendancePercent >= 90 ? 'Excellent Attendance' : null,
                trendDelta >= 5 ? 'Most Improved' : null,
                score?.position && score.position <= 3 ? 'Top Performer' : null,
            ]
    ).filter(Boolean) as string[];

    const verificationSeed = [
        settings?.school_name || '',
        score?.id || '',
        student?.id || '',
        score?.session || settings?.current_session || '',
        score?.term || settings?.current_term || '',
        Number(score?.average || 0).toFixed(2),
        Number(score?.total_score || totalAggregate || 0).toFixed(0),
        String(score?.updated_at || score?.created_at || ''),
    ].join('|');

    const verificationCode = `RC-${hashString(verificationSeed).slice(0, 4)}-${hashString(`${verificationSeed}|verify`).slice(0, 4)}`;
    const resultFingerprint = hashString(`${verificationSeed}|fingerprint`).slice(0, 10);
    const verificationPayload = JSON.stringify({
        type: 'report_card',
        school: settings?.school_name || '',
        student: student?.names || '',
        admission_no: student?.student_no || '',
        class: currentClass?.name || '',
        session: score?.session || settings?.current_session || '',
        term: score?.term || settings?.current_term || '',
        average: Number(average.toFixed(1)),
        verification_code: verificationCode,
        fingerprint: resultFingerprint,
    });

    return (
        <div
            id="report-card"
            className="mx-auto max-w-[820px] overflow-hidden border border-slate-300 bg-white text-[11px] text-slate-700 shadow-sm print:max-w-none print:border-none print:shadow-none"
            style={{ fontFamily: settings?.report_font_family || "'Inter', sans-serif" }}
        >
            <div className="h-1" style={{ backgroundColor: themePrimary }} />

            <div className="border-b border-slate-200 px-4 py-3">
                <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                        <div className="flex h-14 w-14 items-center justify-center overflow-hidden rounded border border-slate-300 bg-white">
                            {settings?.logo_media ? (
                                <img src={settings.logo_media} alt="School logo" className="h-full w-full object-contain" />
                            ) : (
                                <School className="h-7 w-7" style={{ color: themePrimary }} />
                            )}
                        </div>
                        <div>
                            <h1 className="text-[14px] font-extrabold uppercase tracking-wide" style={{ color: themeDeep }}>{settings?.school_name || 'School Name'}</h1>
                            <p className="text-[10px] font-semibold uppercase tracking-wide" style={{ color: themePrimary }}>
                                {settings?.school_tagline || 'A Leading Nursery and Primary School'}
                            </p>
                            <p className="mt-0.5 text-[10px] text-slate-500">{settings?.school_address || 'Address not provided'}</p>
                        </div>
                    </div>

                    <div className="rounded-lg border border-slate-200 bg-[#f8fbff] px-3 py-2 text-right text-[10px]">
                        <p className="font-extrabold uppercase tracking-[0.14em] text-slate-500">Official Result Slip</p>
                        <p className="mt-0.5 font-semibold" style={{ color: themeDeep }}>
                            {term} | {sessionYear}
                        </p>
                    </div>
                </div>
            </div>

            <div className="px-4 py-1.5 text-[11px] font-bold uppercase tracking-[0.12em] text-white" style={{ backgroundColor: themeDeep }}>Student Report Card</div>

            <div className="border-b border-slate-200 px-4 py-3">
                <div className="rounded-xl border border-slate-200 bg-[#fbfdff] p-3">
                    <div className="grid grid-cols-12 gap-3">
                        <div className="col-span-2">
                            <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded border border-slate-300 bg-slate-50 shadow-sm">
                                {student?.passport_url ? (
                                    <img src={student.passport_url} alt={student.names} className="h-full w-full object-cover" />
                                ) : (
                                    <User className="h-8 w-8 text-slate-300" />
                                )}
                            </div>
                        </div>

                        <div className="col-span-7 grid grid-cols-2 gap-x-4 gap-y-2 text-[11px]">
                            <div>
                                <span className="text-slate-500">Student Name:</span>
                                <span className="ml-1 font-semibold text-slate-800">{student?.names || '-'}</span>
                            </div>
                            <div>
                                <span className="text-slate-500">Class:</span>
                                <span className="ml-1 font-semibold text-slate-800">{currentClass?.name || '-'}</span>
                            </div>
                            <div>
                                <span className="text-slate-500">Gender:</span>
                                <span className="ml-1 font-semibold text-slate-800">{student?.gender || '-'}</span>
                            </div>
                            <div>
                                <span className="text-slate-500">Position:</span>
                                <span className="ml-1 font-semibold text-slate-800">{score?.position ? Utils.ordinalSuffix(score.position) : '-'}</span>
                            </div>
                        </div>

                        <div className="col-span-3 grid grid-cols-1 gap-2 text-[10px]">
                            <div className="rounded border border-cyan-100 bg-cyan-50 px-2 py-1.5">
                                <p className="text-[9px] font-bold uppercase tracking-wide text-cyan-700">Term</p>
                                <p className="font-semibold text-slate-800">{term}</p>
                            </div>
                            <div className="rounded border border-indigo-100 bg-indigo-50 px-2 py-1.5">
                                <p className="text-[9px] font-bold uppercase tracking-wide text-indigo-700">Year</p>
                                <p className="font-semibold text-slate-800">{sessionYear}</p>
                            </div>
                            <div className="rounded border border-amber-100 bg-amber-50 px-2 py-1.5">
                                <p className="text-[9px] font-bold uppercase tracking-wide text-amber-700">Adm No</p>
                                <p className="font-semibold text-slate-800">{student?.student_no || '-'}</p>
                            </div>
                        </div>
                    </div>
                </div>

                <div
                    className="relative mt-3 overflow-hidden rounded-xl border px-3 py-2.5 text-[10px] leading-relaxed text-slate-700"
                    style={{
                        borderColor: themeSoftBorder,
                        background: `linear-gradient(95deg, ${toRgba(themePrimary, 0.12)} 0%, #ffffff 55%)`,
                    }}
                >
                    <div className="absolute -right-4 -top-4 h-16 w-16 rounded-full" style={{ backgroundColor: toRgba(themePrimary, 0.14) }} />
                    <p className="relative z-10 text-[9px] font-bold uppercase tracking-[0.14em]" style={{ color: themeDeep }}>
                        Term Summary
                    </p>
                    <p className="relative z-10 mt-1 font-medium">
                        {score?.ai_performance_remark || score?.teacher_remark || 'A commendable termly performance. Continue to build discipline, confidence, and consistency in all learning tasks.'}
                    </p>
                </div>
            </div>

            <div className="px-4 py-1.5 text-[11px] font-bold uppercase tracking-[0.12em] text-white" style={{ backgroundColor: themeDeep }}>
                {isEarlyYears ? 'Learning & Development' : 'Academic Performance'}
            </div>

            {isEarlyYears ? (
                <div className="overflow-x-auto border-b border-slate-200">
                    <table className="w-full min-w-[760px] border-collapse text-[10px]">
                        <thead>
                            <tr>
                                <th className="border border-slate-200 px-2 py-2 text-left font-bold uppercase tracking-wide text-white" style={{ backgroundColor: themePrimary }}>Learning Area</th>
                                <th className="border border-slate-200 bg-[#dcfce7] px-2 py-2 text-center font-bold uppercase tracking-wide text-emerald-700">Status</th>
                                <th className="border border-slate-200 bg-[#eef4ff] px-2 py-2 text-left font-bold uppercase tracking-wide text-[#0f355d]">Observation</th>
                                <th className="border border-slate-200 bg-[#fff7ed] px-2 py-2 text-left font-bold uppercase tracking-wide text-amber-700">Next Step</th>
                            </tr>
                        </thead>
                        <tbody>
                            {(earlyObservations.length ? earlyObservations : Utils.EARLY_YEARS_LEARNING_AREAS.map(area => ({
                                area,
                                status: 'Developing',
                                comment: '',
                                next_step: '',
                            }))).map((row, index) => (
                                <tr key={row.area} className={index % 2 === 0 ? 'bg-white' : 'bg-[#fbfdff]'}>
                                    <td className="border border-slate-200 px-2 py-2 font-semibold text-slate-700">{row.area}</td>
                                    <td className="border border-slate-200 px-2 py-2 text-center">
                                        <span className={`inline-flex min-w-16 items-center justify-center rounded-full border px-2 py-0.5 text-[10px] font-bold ${
                                            row.status === 'Secure'
                                                ? 'bg-emerald-100 text-emerald-700 border-emerald-200'
                                                : row.status === 'Developing'
                                                    ? 'bg-amber-100 text-amber-700 border-amber-200'
                                                    : 'bg-rose-100 text-rose-700 border-rose-200'
                                        }`}>
                                            {row.status}
                                        </span>
                                    </td>
                                    <td className="border border-slate-200 px-2 py-2 text-slate-600">{row.comment || '-'}</td>
                                    <td className="border border-slate-200 px-2 py-2 text-slate-600">{row.next_step || '-'}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            ) : (
                <div className="overflow-x-auto border-b border-slate-200">
                    <table className="w-full min-w-[760px] border-collapse text-[10px]">
                        <thead>
                            <tr>
                                <th className="border border-slate-200 px-2 py-2 text-left font-bold uppercase tracking-wide text-white" style={{ backgroundColor: themePrimary }}>Subject</th>
                                <th className="border border-slate-200 bg-[#d7e9ff] px-2 py-2 text-center font-bold uppercase tracking-wide text-[#0f355d]">Homework</th>
                                <th className="border border-slate-200 bg-[#d9f0ff] px-2 py-2 text-center font-bold uppercase tracking-wide text-[#0f355d]">CA</th>
                                <th className="border border-slate-200 bg-[#ffe5c7] px-2 py-2 text-center font-bold uppercase tracking-wide text-[#6a3b00]">Exam</th>
                                <th className="border border-slate-200 bg-[#f1f6ff] px-2 py-2 text-center font-bold uppercase tracking-wide text-[#0f355d]">Total</th>
                                <th className="border border-slate-200 bg-[#e1ffe9] px-2 py-2 text-center font-bold uppercase tracking-wide text-[#0f5a30]">Grade</th>
                                <th className="border border-slate-200 bg-[#f5f8fb] px-2 py-2 text-center font-bold uppercase tracking-wide text-[#4a6078]">Remark</th>
                            </tr>
                        </thead>
                        <tbody>
                            {subjectRows.map((row, index) => (
                                <tr key={row.subject} className={index % 2 === 0 ? 'bg-white' : 'bg-[#fbfdff]'}>
                                    <td className="border border-slate-200 px-2 py-2 font-semibold text-slate-700">{row.subject}</td>
                                    <td className="border border-slate-200 px-2 py-2 text-center text-slate-600">{row.ca1 || 0}</td>
                                    <td className="border border-slate-200 px-2 py-2 text-center text-slate-600">{row.ca2 || 0}</td>
                                    <td className="border border-slate-200 px-2 py-2 text-center text-slate-600">{row.exam || 0}</td>
                                    <td className="border border-slate-200 px-2 py-2 text-center font-bold text-slate-800">{row.total || 0}</td>
                                    <td className="border border-slate-200 px-2 py-2 text-center">
                                        <span className={`inline-flex min-w-9 items-center justify-center rounded-full border px-2 py-0.5 text-[10px] font-bold ${row.band.badgeClass}`}>
                                            {row.band.grade}
                                        </span>
                                    </td>
                                    <td className="border border-slate-200 px-2 py-2 text-center">
                                        <span className="inline-flex items-center rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
                                            {row.remark}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            <div className="grid grid-cols-4 gap-2 border-b border-slate-200 bg-[#f8fbff] px-4 py-3 text-center">
                {isEarlyYears ? (
                    <>
                        <div className="rounded border border-emerald-200 bg-emerald-50 px-2 py-2">
                            <p className="text-[9px] font-semibold uppercase tracking-wide text-emerald-700">Secure Areas</p>
                            <p className="mt-1 text-[14px] font-bold text-emerald-700">{secureCount}</p>
                        </div>
                        <div className="rounded border border-amber-200 bg-amber-50 px-2 py-2">
                            <p className="text-[9px] font-semibold uppercase tracking-wide text-amber-700">Developing</p>
                            <p className="mt-1 text-[14px] font-bold text-amber-700">{developingCount}</p>
                        </div>
                        <div className="rounded border border-rose-200 bg-rose-50 px-2 py-2">
                            <p className="text-[9px] font-semibold uppercase tracking-wide text-rose-700">Emerging</p>
                            <p className="mt-1 text-[14px] font-bold text-rose-700">{emergingCount}</p>
                        </div>
                        <div className="rounded border border-[#ecd7ff] bg-[#f7efff] px-2 py-2">
                            <p className="text-[9px] font-semibold uppercase tracking-wide text-[#8054a6]">Attendance</p>
                            <p className="mt-1 text-[14px] font-bold text-[#7f3bb4]">{attendancePercent}%</p>
                        </div>
                    </>
                ) : (
                    <>
                        <div className="rounded border border-[#d8e5f5] bg-[#e9f2ff] px-2 py-2">
                            <p className="text-[9px] font-semibold uppercase tracking-wide text-[#46658a]">Total Score</p>
                            <p className="mt-1 text-[14px] font-bold" style={{ color: themeDeep }}>{totalAggregate}</p>
                        </div>
                        <div className="rounded border border-[#d6f1df] bg-[#eaffef] px-2 py-2">
                            <p className="text-[9px] font-semibold uppercase tracking-wide text-emerald-700">Average</p>
                            <p className="mt-1 text-[14px] font-bold text-emerald-700">{average.toFixed(1)}%</p>
                        </div>
                        <div className="rounded border border-[#dbe8ff] bg-[#eef4ff] px-2 py-2">
                            <p className="text-[9px] font-semibold uppercase tracking-wide text-[#4d67a1]">Position</p>
                            <p className="mt-1 text-[14px] font-bold text-[#3558a2]">{score?.position ? Utils.ordinalSuffix(score.position) : '-'}</p>
                        </div>
                        <div className="rounded border border-[#ecd7ff] bg-[#f7efff] px-2 py-2">
                            <p className="text-[9px] font-semibold uppercase tracking-wide text-[#8054a6]">Attendance</p>
                            <p className="mt-1 text-[14px] font-bold text-[#7f3bb4]">{attendancePercent}%</p>
                        </div>
                    </>
                )}
            </div>

            <div className="border-b border-slate-200 px-4 py-3">
                <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
                    <div className="rounded border border-slate-200 p-3" style={{ backgroundColor: themeSoft }}>
                        <div className="mb-2 flex items-center gap-2">
                            <TrendingUp className="h-4 w-4" style={{ color: themePrimary }} />
                            <p className="text-[10px] font-bold uppercase tracking-wide text-slate-600">Performance Story</p>
                        </div>
                        <Sparkline values={trendValues} color={themePrimary} />
                        <div className="mt-1 flex flex-wrap items-center gap-2 text-[10px]">
                            <span className="rounded-full px-2 py-0.5 font-semibold" style={{ backgroundColor: '#eef4ff', color: themeDeep }}>{trendText}</span>
                            {trendValues.length > 1 && (
                                <span className={`font-semibold ${trendDelta >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                                    {trendDelta >= 0 ? '+' : ''}{trendDelta.toFixed(1)} points across recent terms
                                </span>
                            )}
                        </div>
                        {trendHistory.length > 0 && (
                            <div className="mt-2 flex flex-wrap gap-1.5">
                                {trendHistory.map(point => (
                                    <span key={point.label} className="rounded-full border border-slate-200 bg-white px-2 py-0.5 text-[9px] font-semibold text-slate-600">
                                        {point.label}: {point.average.toFixed(1)}%
                                    </span>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="rounded border border-slate-200 p-3">
                        <div className="mb-2 flex items-center gap-2">
                            <Brain className="h-4 w-4" style={{ color: themePrimary }} />
                            <p className="text-[10px] font-bold uppercase tracking-wide text-slate-600">AI Actionable Insights</p>
                        </div>
                        <p className="text-[10px] leading-relaxed text-slate-600">
                            {score?.ai_performance_remark || 'Insights generated from academic performance, attendance, and class behavior for targeted improvement.'}
                        </p>

                        <div className="mt-2 grid grid-cols-1 gap-2 text-[10px] sm:grid-cols-2">
                            <div className="rounded border border-emerald-100 bg-emerald-50 p-2">
                                <p className="font-semibold text-emerald-700">Top Strengths</p>
                                <ul className="mt-1 space-y-0.5 text-slate-600">
                                    {strengths.length > 0 ? strengths.map(item => <li key={item.subject}>- {item.subject} ({item.total})</li>) : <li>- No scored subjects yet</li>}
                                </ul>
                            </div>
                            <div className="rounded border border-amber-100 bg-amber-50 p-2">
                                <p className="font-semibold text-amber-700">Focus Areas</p>
                                <ul className="mt-1 space-y-0.5 text-slate-600">
                                    {interventionAreas.length > 0 ? interventionAreas.map(item => <li key={item.subject}>- {item.subject} ({item.total})</li>) : <li>- Maintain current progress</li>}
                                </ul>
                            </div>
                        </div>

                        <div className="mt-2 rounded border border-slate-200 bg-slate-50 p-2">
                            <div className="mb-1 flex items-center gap-1.5">
                                <Target className="h-3.5 w-3.5 text-slate-600" />
                                <p className="text-[10px] font-semibold text-slate-600">30-Day Action Plan</p>
                            </div>
                            <ul className="space-y-0.5 text-[10px] text-slate-600">
                                {actionPlan.map((item, index) => (
                                    <li key={index}>- {item}</li>
                                ))}
                            </ul>
                        </div>
                    </div>
                </div>

                <div className="mt-3 overflow-hidden rounded border border-slate-200">
                    <div className="flex items-center justify-between px-3 py-2 text-[10px] font-bold uppercase tracking-wide text-white" style={{ backgroundColor: themePrimary }}>
                        <span>Term Progression Table</span>
                        <span className="text-white/90">Recent 6 Terms</span>
                    </div>
                    {progressionRows.length > 0 ? (
                        <div className="overflow-x-auto">
                            <table className="w-full min-w-[620px] border-collapse text-[10px]">
                                <thead>
                                    <tr>
                                        <th className="border border-slate-200 bg-[#f3f7ff] px-2 py-2 text-left font-bold text-slate-600">Session</th>
                                        <th className="border border-slate-200 bg-[#f3f7ff] px-2 py-2 text-left font-bold text-slate-600">Term</th>
                                        <th className="border border-slate-200 bg-[#eaffef] px-2 py-2 text-center font-bold text-emerald-700">{isEarlyYears ? 'Secure %' : 'Average'}</th>
                                        <th className="border border-slate-200 bg-[#eef4ff] px-2 py-2 text-center font-bold text-[#3f5f98]">Position</th>
                                        <th className="border border-slate-200 bg-[#f7efff] px-2 py-2 text-center font-bold text-[#7a4aa3]">Attendance</th>
                                        <th className="border border-slate-200 bg-[#fff3df] px-2 py-2 text-center font-bold text-amber-700">Growth</th>
                                        <th className="border border-slate-200 bg-[#f8fbff] px-2 py-2 text-center font-bold text-slate-600">Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {progressionRows.map((row, index) => (
                                        <tr key={row.id || `${row.session}-${row.term}`} className={index % 2 === 0 ? 'bg-white' : 'bg-[#fbfdff]'}>
                                            <td className="border border-slate-200 px-2 py-1.5 text-slate-700">{row.session}</td>
                                            <td className="border border-slate-200 px-2 py-1.5 font-semibold text-slate-700">{row.term}</td>
                                            <td className="border border-slate-200 px-2 py-1.5 text-center font-bold text-emerald-700">{row.average.toFixed(1)}%</td>
                                            <td className="border border-slate-200 px-2 py-1.5 text-center font-semibold text-[#385ea4]">{row.position ? Utils.ordinalSuffix(row.position) : '-'}</td>
                                            <td className="border border-slate-200 px-2 py-1.5 text-center font-semibold text-[#6d3e9c]">{row.attendance === null ? '-' : `${row.attendance}%`}</td>
                                            <td className="border border-slate-200 px-2 py-1.5 text-center">
                                                <span className={`font-semibold ${row.growth === null ? 'text-slate-500' : row.growth >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                                                    {row.growth === null ? '-' : `${row.growth >= 0 ? '+' : ''}${row.growth.toFixed(1)}`}
                                                </span>
                                            </td>
                                            <td className="border border-slate-200 px-2 py-1.5 text-center">
                                                <span className={`inline-flex items-center rounded-full px-2 py-0.5 font-semibold ${row.isPassed ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>
                                                    {row.isPassed ? 'Published' : 'Pending'}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <p className="px-3 py-3 text-[10px] text-slate-500">No historical term data yet. Progression table will populate once more results are recorded.</p>
                    )}
                </div>

                {standoutBadges.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-1.5">
                        {standoutBadges.map(badge => (
                            <span key={badge} className="rounded-full border px-2.5 py-0.5 text-[10px] font-semibold" style={{ borderColor: themeSoftBorder, color: themeDeep, backgroundColor: themeSoft }}>
                                {badge}
                            </span>
                        ))}
                    </div>
                )}
            </div>

            <div className="border-b border-slate-200 px-4 py-3">
                <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                    <div className="rounded border border-slate-200 p-3 md:col-span-2" style={{ backgroundColor: themeSoft }}>
                        <div className="mb-1.5 flex items-center gap-2">
                            <ShieldCheck className="h-4 w-4" style={{ color: themePrimary }} />
                            <p className="text-[10px] font-bold uppercase tracking-wide text-slate-600">Trust & Authenticity</p>
                        </div>
                        <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-[10px] text-slate-600">
                            <span className="font-semibold text-slate-500">Verification ID</span>
                            <span className="font-bold" style={{ color: themeDeep }}>{verificationCode}</span>
                            <span className="font-semibold text-slate-500">Issued On</span>
                            <span>{issuedOn}</span>
                            <span className="font-semibold text-slate-500">Issued By</span>
                            <span>{settings?.school_name || 'School Administration'}</span>
                            <span className="font-semibold text-slate-500">Fingerprint</span>
                            <span className="font-mono tracking-[0.06em] text-slate-700">{resultFingerprint}</span>
                        </div>
                        <p className="mt-2 text-[9px] text-slate-500">
                            Scan the QR code or quote the Verification ID at the school office to confirm this report card.
                        </p>
                    </div>

                    <div className="rounded border border-slate-200 bg-white p-3 text-center">
                        <p className="text-[9px] font-semibold uppercase tracking-wide text-slate-500">Quick Verify QR</p>
                        <div className="mt-2 flex justify-center">
                            <QRCodeSVG value={verificationPayload} size={84} level="M" fgColor={themeDeep} bgColor="#ffffff" />
                        </div>
                        <p className="mt-2 text-[9px] text-slate-500">Secure document metadata embedded</p>
                    </div>
                </div>
            </div>

            <div className="border-b border-slate-200 px-4 py-3">
                <div className="grid grid-cols-2 gap-3">
                    <div className="overflow-hidden rounded border border-slate-200">
                        <div className="px-2 py-1.5 text-[10px] font-bold uppercase tracking-wide text-white" style={{ backgroundColor: themePrimary }}>Affective Domain</div>
                        <div className="divide-y divide-slate-100">
                            {affectiveTraits.map(trait => (
                                <div key={trait} className="flex items-center justify-between px-2 py-1.5 text-[10px]">
                                    <span className="text-slate-600">{trait}</span>
                                    <DotRating value={score?.affective?.[trait] || 0} color={themePrimary} />
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="overflow-hidden rounded border border-slate-200">
                        <div className="px-2 py-1.5 text-[10px] font-bold uppercase tracking-wide text-white" style={{ backgroundColor: themePrimary }}>Psychomotor Skills</div>
                        <div className="divide-y divide-slate-100">
                            {psychomotorTraits.map(trait => (
                                <div key={trait} className="flex items-center justify-between px-2 py-1.5 text-[10px]">
                                    <span className="text-slate-600">{trait}</span>
                                    <DotRating value={score?.psychomotor?.[trait] || 0} color={themePrimary} />
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {!isEarlyYears && (
                    <div className="mt-3 rounded border border-slate-200 bg-[#f9fbfd] px-3 py-2 text-[10px]">
                        <p className="font-semibold uppercase tracking-wide text-slate-500">Grading Key</p>
                        <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-slate-600">
                            {GRADE_BANDS.map(band => (
                                <span key={band.grade}>
                                    <span className="font-bold text-slate-700">{band.grade}</span> ({band.min}-{band.max})
                                </span>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            <div className="grid grid-cols-2 gap-3 px-4 py-3">
                <div className="rounded border border-slate-200 p-3">
                    <p className="text-[10px] font-bold uppercase tracking-wide text-slate-500">{settings?.class_teacher_label || 'Class Teacher'} Remark</p>
                    <p className="mt-2 min-h-14 text-[10px] leading-relaxed text-slate-600">
                        {score?.teacher_remark || 'Steady progress this term. Continue to improve class participation and independent study habits.'}
                    </p>
                    <div className="mt-4 border-t border-dashed border-slate-300 pt-2 text-right text-[9px] text-slate-400">Signature</div>
                </div>

                <div className="rounded border border-slate-200 p-3">
                    <p className="text-[10px] font-bold uppercase tracking-wide text-slate-500">{settings?.head_teacher_label || 'Head Teacher'} Remark</p>
                    <p className="mt-2 min-h-14 text-[10px] leading-relaxed text-slate-600">
                        {score?.head_teacher_remark || 'A promising performance. Keep striving for excellence with consistency and discipline.'}
                    </p>
                    <div className="mt-4 flex items-center justify-end border-t border-dashed border-slate-300 pt-2">
                        {settings?.head_of_school_signature ? (
                            <img src={settings.head_of_school_signature} alt="Head signature" className="h-8 object-contain" />
                        ) : (
                            <span className="text-[9px] text-slate-400">Signature</span>
                        )}
                    </div>
                </div>
            </div>

            <div className="flex items-center justify-between border-t border-slate-200 bg-[#f8fbff] px-4 py-2 text-[9px] text-slate-500">
                <span>Next Term Begins: {resumptionDate}</span>
                <span>Result Status: {score?.is_passed ? 'Published' : 'Pending Publication'}</span>
            </div>
        </div>
    );
};
