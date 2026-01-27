'use client';

import React, { useState, useMemo } from 'react';
import { ArrowUp, Check, X, AlertCircle, Save, RefreshCw } from 'lucide-react';
import { useSchoolStore } from '@/lib/store';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/providers/toast-provider';
import * as Utils from '@/lib/utils';
import * as Types from '@/lib/types';
import {
    useStudents, useClasses, useScores, useSettings, useUpdateSettings, useUpdateScore, useBulkPromoteStudents
} from '@/lib/hooks/use-data';

export const PromotionManager: React.FC = () => {
    // Auth
    const { addToast } = useToast();

    // Data Hooks
    const { data: students = [] } = useStudents();
    const { data: classes = [] } = useClasses();
    const { data: scores = [] } = useScores();
    const { data: settings = Utils.INITIAL_SETTINGS } = useSettings();

    // Mutations
    const { mutate: updateSettings } = useUpdateSettings();
    const { mutate: updateScore } = useUpdateScore();
    const { mutate: bulkPromote } = useBulkPromoteStudents();
    const setSettings = (newSettings: Types.Settings) => updateSettings(newSettings); // Adapter for state setter style

    const [selectedClass, setSelectedClass] = useState(classes[0]?.id || '');
    const [localThreshold, setLocalThreshold] = useState(settings.promotion_threshold);
    const [promotionResults, setPromotionResults] = useState<Map<string, string | null>>(new Map());
    const [isProcessing, setIsProcessing] = useState(false);

    const currentClass = classes.find(c => c.id === selectedClass);
    const nextClass = classes.find((c, i) => {
        const currentIndex = classes.findIndex(cl => cl.id === selectedClass);
        return i === currentIndex + 1;
    });

    const activeStudents = students.filter((s: Types.Student) => s.class_id === selectedClass);

    // Calculate student averages for promotion eligibility
    const studentStats = useMemo(() => {
        return activeStudents.map((student: Types.Student) => {
            // Get scores from all terms in current session
            const termScores = scores.filter(
                (s: Types.Score) => s.student_id === student.id && s.session === settings.current_session
            );

            // Calculate overall average across all terms
            const allAverages = termScores.map((s: Types.Score) => s.average).filter((a: number) => a > 0);
            const overallAverage = allAverages.length > 0
                ? allAverages.reduce((a: number, b: number) => a + b, 0) / allAverages.length
                : 0;

            // Get position in class
            const position = Utils.getStudentPosition(
                student.id, students, scores, settings.current_session, settings.current_term
            );

            return {
                student,
                average: Math.round(overallAverage * 100) / 100,
                termsWithScores: allAverages.length,
                position,
                eligible: overallAverage >= localThreshold,
                promotedTo: promotionResults.get(student.id) || null
            };
        }).sort((a: any, b: any) => b.average - a.average);
    }, [activeStudents, scores, settings, localThreshold, promotionResults]);

    const eligibleCount = studentStats.filter((s: any) => s.eligible).length;
    const processedCount = studentStats.filter((s: any) => s.promotedTo !== null).length;

    const handleRunPromotion = () => {
        if (!nextClass) {
            addToast('No next class available for promotion', 'warning');
            return;
        }

        setIsProcessing(true);
        const results = new Map<string, string | null>();

        studentStats.forEach((stat: any) => {
            if (stat.eligible) {
                results.set(stat.student.id, nextClass.id);
            } else {
                results.set(stat.student.id, selectedClass); // Repeat class
            }
        });

        setPromotionResults(results);
        setIsProcessing(false);
        addToast(`Processed ${studentStats.length} students`, 'success');
    };

    const handleTogglePromotion = (studentId: string) => {
        if (!nextClass) return;

        const current = promotionResults.get(studentId);
        const newResults = new Map(promotionResults);

        if (current === nextClass.id) {
            newResults.set(studentId, selectedClass); // Demote to repeat
        } else {
            newResults.set(studentId, nextClass.id); // Promote
        }

        setPromotionResults(newResults);
    };

    const handleSavePromotions = () => {
        const promotions: Record<string, string> = {};
        promotionResults.forEach((val, key) => {
            if (val) promotions[key] = val;
        });

        if (Object.keys(promotions).length === 0) {
            addToast('No changes to save', 'info');
            return;
        }

        bulkPromote(promotions, {
            onSuccess: () => {
                addToast(`Successfully promoted ${Object.keys(promotions).length} students`, 'success');
                setPromotionResults(new Map());

                // Also update the score records to reflect promotion status for the session
                scores.forEach(score => {
                    const promotedTo = promotions[score.student_id];
                    if (promotedTo && score.session === settings.current_session && score.promoted_to !== promotedTo) {
                        updateScore({ id: score.id, updates: { promoted_to: promotedTo } });
                    }
                });
            },
            onError: (err) => {
                addToast('Failed to save promotions', 'error');
                console.error(err);
            }
        });
    };

    const handleSaveThreshold = () => {
        setSettings({ ...settings, promotion_threshold: localThreshold });
        addToast(`Threshold updated to ${localThreshold}%`, 'success');
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-xl font-bold text-gray-900">Promotion Engine</h2>
                    <p className="text-sm text-gray-500 mt-1">
                        Manage end-of-session student promotions
                    </p>
                </div>
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-500">Threshold:</span>
                        <Input
                            type="number"
                            value={localThreshold}
                            onChange={e => setLocalThreshold(parseInt(e.target.value) || 0)}
                            min={0}
                            max={100}
                            className="w-20"
                        />
                        <span className="text-sm text-gray-500">%</span>
                        {localThreshold !== settings.promotion_threshold && (
                            <Button variant="outline" size="sm" onClick={handleSaveThreshold}>
                                <Save className="h-3 w-3 mr-1" />
                                Save
                            </Button>
                        )}
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                {/* Stats Cards */}
                <Card className="bg-gradient-to-br from-brand-50 to-white">
                    <div className="p-4 text-center">
                        <p className="text-sm text-gray-500">Total Students</p>
                        <p className="text-3xl font-bold text-gray-900">{studentStats.length}</p>
                    </div>
                </Card>
                <Card className="bg-gradient-to-br from-green-50 to-white">
                    <div className="p-4 text-center">
                        <p className="text-sm text-gray-500">Eligible for Promotion</p>
                        <p className="text-3xl font-bold text-green-600">{eligibleCount}</p>
                    </div>
                </Card>
                <Card className="bg-gradient-to-br from-red-50 to-white">
                    <div className="p-4 text-center">
                        <p className="text-sm text-gray-500">To Repeat</p>
                        <p className="text-3xl font-bold text-red-600">{studentStats.length - eligibleCount}</p>
                    </div>
                </Card>
                <Card className="bg-gradient-to-br from-blue-50 to-white">
                    <div className="p-4 text-center">
                        <p className="text-sm text-gray-500">Processed</p>
                        <p className="text-3xl font-bold text-blue-600">{processedCount}</p>
                    </div>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                {/* Class Selection */}
                <Card className="lg:col-span-1">
                    <div className="p-4 space-y-4">
                        <Select
                            label="Select Class"
                            value={selectedClass}
                            onChange={e => {
                                setSelectedClass(e.target.value);
                                setPromotionResults(new Map());
                            }}
                        >
                            {classes.map(c => (
                                <option key={c.id} value={c.id}>{c.name}</option>
                            ))}
                        </Select>

                        <div className="p-3 bg-gray-50 rounded-lg space-y-2 text-sm">
                            <div className="flex justify-between">
                                <span className="text-gray-500">From:</span>
                                <span className="font-medium">{currentClass?.name}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-500">To:</span>
                                <span className="font-medium text-brand-600">
                                    {nextClass?.name || 'N/A (Final Class)'}
                                </span>
                            </div>
                        </div>

                        <Button
                            className="w-full"
                            onClick={handleRunPromotion}
                            disabled={isProcessing || !nextClass}
                        >
                            <RefreshCw className={`h-4 w-4 mr-2 ${isProcessing ? 'animate-spin' : ''}`} />
                            Run Auto-Promotion
                        </Button>

                        {processedCount > 0 && (
                            <Button
                                className="w-full"
                                variant="outline"
                                onClick={handleSavePromotions}
                            >
                                <Save className="h-4 w-4 mr-2" />
                                Save Promotions
                            </Button>
                        )}
                    </div>
                </Card>

                {/* Student List */}
                <Card className="lg:col-span-3">
                    <div className="p-4">
                        <h3 className="font-semibold text-gray-700 mb-4">
                            Students in {currentClass?.name}
                        </h3>

                        <table className="w-full text-sm">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-4 py-2 text-left">Student</th>
                                    <th className="px-4 py-2 text-center">Average</th>
                                    <th className="px-4 py-2 text-center">Position</th>
                                    <th className="px-4 py-2 text-center">Status</th>
                                    <th className="px-4 py-2 text-center">Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {studentStats.map((stat: any) => {
                                    const isPromoted = stat.promotedTo === nextClass?.id;

                                    return (
                                        <tr key={stat.student.id} className="border-t">
                                            <td className="px-4 py-3">
                                                <div>
                                                    <p className="font-medium text-gray-900">{stat.student.names}</p>
                                                    <p className="text-xs text-gray-500">{stat.student.student_no}</p>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                <span className={`font-bold ${stat.eligible ? 'text-green-600' : 'text-red-600'
                                                    }`}>
                                                    {stat.average.toFixed(1)}%
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                {stat.position ? Utils.ordinalSuffix(stat.position) : '-'}
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                {stat.promotedTo ? (
                                                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${isPromoted
                                                        ? 'bg-green-100 text-green-700'
                                                        : 'bg-red-100 text-red-700'
                                                        }`}>
                                                        {isPromoted ? (
                                                            <><ArrowUp className="h-3 w-3" /> Promoted</>
                                                        ) : (
                                                            <><X className="h-3 w-3" /> Repeat</>
                                                        )}
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                                                        {stat.eligible ? (
                                                            <><Check className="h-3 w-3" /> Eligible</>
                                                        ) : (
                                                            <><AlertCircle className="h-3 w-3" /> Below Threshold</>
                                                        )}
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                {stat.promotedTo && nextClass && (
                                                    <button
                                                        onClick={() => handleTogglePromotion(stat.student.id)}
                                                        className={`text-xs px-2 py-1 rounded ${isPromoted
                                                            ? 'text-red-600 hover:bg-red-50'
                                                            : 'text-green-600 hover:bg-green-50'
                                                            }`}
                                                    >
                                                        {isPromoted ? 'Set to Repeat' : 'Promote'}
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })}

                                {studentStats.length === 0 && (
                                    <tr>
                                        <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                                            No students in this class
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </Card>
            </div>
        </div>
    );
};
