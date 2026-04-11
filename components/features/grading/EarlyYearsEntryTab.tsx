import React from 'react';
import { ChevronRight, UserCircle2, Sparkles } from 'lucide-react';
import * as Types from '@/lib/types';
import * as Utils from '@/lib/utils';
import { Card } from '@/components/ui/card';
import { Select } from '@/components/ui/select';

interface EarlyYearsEntryTabProps {
    classes: Types.Class[];
    selectedClass: string;
    setSelectedClass: (id: string) => void;
    activeStudents: Types.Student[];
    reportStudentId: string;
    setReportStudentId: (id: string) => void;
    scores: Types.Score[];
    settings: Types.Settings;
    handleScoreFieldChange: (studentId: string, field: keyof Types.Score, value: any) => void;
}

const LEVEL_OPTIONS: Types.EarlyYearsObservation['status'][] = ['Emerging', 'Developing', 'Secure'];

export const EarlyYearsEntryTab: React.FC<EarlyYearsEntryTabProps> = ({
    classes,
    selectedClass,
    setSelectedClass,
    activeStudents,
    reportStudentId,
    setReportStudentId,
    scores,
    settings,
    handleScoreFieldChange,
}) => {
    const currentScore = scores.find(
        s => s.student_id === reportStudentId && s.session === settings.current_session && s.term === settings.current_term
    );
    const observations = currentScore?.early_years_observations || [];

    const upsertObservation = (area: string, patch: Partial<Types.EarlyYearsObservation>) => {
        if (!reportStudentId) return;
        const current = [...observations];
        const existingIndex = current.findIndex(item => item.area === area);

        if (existingIndex >= 0) {
            current[existingIndex] = { ...current[existingIndex], ...patch };
        } else {
            current.push({
                area,
                status: 'Developing',
                comment: '',
                next_step: '',
                ...patch,
            });
        }
        handleScoreFieldChange(reportStudentId, 'early_years_observations', current);
    };

    return (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
            <div className="space-y-4 lg:col-span-1">
                <div className="overflow-hidden rounded-3xl border border-brand-100 bg-white shadow-sm">
                    <div className="bg-gradient-to-r from-brand-900 via-teal-700 to-emerald-500 px-5 py-4 text-white">
                        <h3 className="text-sm font-semibold uppercase tracking-[0.14em]">Early Years Journal</h3>
                        <p className="mt-1 text-xs text-white/75">Track what each child can do, with narrative evidence.</p>
                    </div>
                    <div className="space-y-4 p-5">
                        <Select
                            label="Class"
                            value={selectedClass}
                            onChange={e => {
                                setSelectedClass(e.target.value);
                                setReportStudentId('');
                            }}
                        >
                            {classes.map(c => (
                                <option key={c.id} value={c.id}>
                                    {c.name}
                                </option>
                            ))}
                        </Select>

                        <div className="max-h-[520px] overflow-y-auto rounded-2xl border border-gray-200">
                            {activeStudents.map(student => (
                                <button
                                    key={student.id}
                                    onClick={() => setReportStudentId(student.id)}
                                    className={`flex w-full items-center justify-between px-3 py-2.5 text-left text-sm transition-colors ${
                                        reportStudentId === student.id
                                            ? 'bg-brand-50 text-brand-700 font-medium'
                                            : 'text-gray-700 hover:bg-gray-50'
                                    }`}
                                >
                                    <span className="truncate pr-2">{student.names}</span>
                                    <ChevronRight className="h-4 w-4 opacity-50" />
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            <div className="space-y-6 lg:col-span-3">
                {reportStudentId ? (
                    <Card className="rounded-3xl border border-emerald-100 bg-gradient-to-br from-emerald-50/70 to-white">
                        <div className="mb-4 flex items-center justify-between">
                            <div>
                                <h3 className="text-base font-bold text-gray-900">Learning Area Observations</h3>
                                <p className="text-xs text-gray-500">
                                    Use narrative evidence and next steps. No numeric scores required for early years.
                                </p>
                            </div>
                            <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-100 px-3 py-1 text-[11px] font-semibold text-emerald-700">
                                <Sparkles className="h-3.5 w-3.5" />
                                {settings.current_term}
                            </span>
                        </div>

                        <div className="space-y-3">
                            {Utils.EARLY_YEARS_LEARNING_AREAS.map(area => {
                                const row = observations.find(item => item.area === area) || {
                                    area,
                                    status: 'Developing' as Types.EarlyYearsObservation['status'],
                                    comment: '',
                                    next_step: '',
                                };
                                return (
                                    <div key={area} className="rounded-2xl border border-emerald-100 bg-white p-4">
                                        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                                            <div className="md:col-span-2">
                                                <p className="text-sm font-semibold text-gray-800">{area}</p>
                                                <p className="mt-0.5 text-[11px] text-gray-500">Evidence of current capability</p>
                                            </div>
                                            <Select
                                                label="Development Level"
                                                value={row.status}
                                                onChange={e =>
                                                    upsertObservation(area, {
                                                        status: e.target.value as Types.EarlyYearsObservation['status'],
                                                    })
                                                }
                                            >
                                                {LEVEL_OPTIONS.map(level => (
                                                    <option key={level} value={level}>
                                                        {level}
                                                    </option>
                                                ))}
                                            </Select>
                                        </div>

                                        <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
                                            <div>
                                                <label className="mb-1 block text-xs font-semibold uppercase tracking-[0.12em] text-gray-500">
                                                    Observation
                                                </label>
                                                <textarea
                                                    value={row.comment || ''}
                                                    onChange={e => upsertObservation(area, { comment: e.target.value })}
                                                    className="min-h-[92px] w-full rounded-xl border border-emerald-100 p-3 text-sm focus:border-emerald-300 focus:outline-none focus:ring-2 focus:ring-emerald-100"
                                                    placeholder="Describe what the learner can confidently do..."
                                                />
                                            </div>
                                            <div>
                                                <label className="mb-1 block text-xs font-semibold uppercase tracking-[0.12em] text-gray-500">
                                                    Next Step
                                                </label>
                                                <textarea
                                                    value={row.next_step || ''}
                                                    onChange={e => upsertObservation(area, { next_step: e.target.value })}
                                                    className="min-h-[92px] w-full rounded-xl border border-emerald-100 p-3 text-sm focus:border-emerald-300 focus:outline-none focus:ring-2 focus:ring-emerald-100"
                                                    placeholder="State the next support target for home/school..."
                                                />
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </Card>
                ) : (
                    <div className="flex min-h-[520px] flex-col items-center justify-center rounded-3xl border border-dashed border-brand-200 bg-gradient-to-br from-brand-50/60 via-white to-emerald-50/40 px-6 text-center">
                        <div className="mb-3 rounded-2xl bg-brand-100 p-3 text-brand-700">
                            <UserCircle2 className="h-8 w-8" />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900">Select a learner to begin</h3>
                        <p className="mt-2 max-w-md text-sm text-gray-500">
                            Choose a learner from the left panel to record narrative development observations.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};
