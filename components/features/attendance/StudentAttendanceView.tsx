'use client';

import React, { useMemo } from 'react';
import { Calendar, CheckCircle, XCircle, Clock, TrendingUp } from 'lucide-react';
import * as Types from '@/lib/types';
import { Card } from '@/components/ui/card';

interface StudentAttendanceViewProps {
    student: Types.Student;
    attendance: Types.Attendance[];
    settings: Types.Settings;
}

export const StudentAttendanceView: React.FC<StudentAttendanceViewProps> = ({
    student, attendance, settings
}) => {
    // Filter attendance records for this student's class in the current term
    const myAttendance = useMemo(() => {
        return attendance
            .filter(a =>
                a.class_id === student.class_id &&
                a.session === settings.current_session &&
                a.term === settings.current_term
            )
            .sort((a, b) => b.date.localeCompare(a.date))
            .map(a => {
                const record = a.records.find(r => r.student_id === student.id);
                return {
                    date: a.date,
                    status: record?.status || 'absent',
                    remark: record?.remark
                };
            });
    }, [attendance, student.id, student.class_id, settings]);

    // Calculate attendance stats
    const stats = useMemo(() => {
        const total = myAttendance.length;
        const present = myAttendance.filter(a => a.status === 'present').length;
        const late = myAttendance.filter(a => a.status === 'late').length;
        const absent = myAttendance.filter(a => a.status === 'absent').length;
        const percentage = total > 0 ? Math.round(((present + late) / total) * 100) : 0;

        return { total, present, late, absent, percentage };
    }, [myAttendance]);

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'present': return 'bg-green-100 text-green-700';
            case 'late': return 'bg-yellow-100 text-yellow-700';
            case 'absent': return 'bg-red-100 text-red-700';
            default: return 'bg-gray-100 text-gray-700';
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'present': return <CheckCircle className="h-4 w-4" />;
            case 'late': return <Clock className="h-4 w-4" />;
            case 'absent': return <XCircle className="h-4 w-4" />;
            default: return null;
        }
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-gray-900">My Attendance</h1>
                <p className="text-gray-500">View your attendance records for {settings.current_term} - {settings.current_session}</p>
            </div>

            {/* Attendance Stats */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <Card className="p-4 bg-gradient-to-br from-brand-500 to-brand-600 text-white">
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 bg-white/20 rounded-lg flex items-center justify-center">
                            <TrendingUp className="h-5 w-5" />
                        </div>
                        <div>
                            <p className="text-3xl font-bold">{stats.percentage}%</p>
                            <p className="text-xs text-white/80">Attendance Rate</p>
                        </div>
                    </div>
                </Card>

                <Card className="p-4">
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 bg-gray-100 rounded-lg flex items-center justify-center">
                            <Calendar className="h-5 w-5 text-gray-600" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                            <p className="text-xs text-gray-500">Total Days</p>
                        </div>
                    </div>
                </Card>

                <Card className="p-4">
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 bg-green-100 rounded-lg flex items-center justify-center">
                            <CheckCircle className="h-5 w-5 text-green-600" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-gray-900">{stats.present}</p>
                            <p className="text-xs text-gray-500">Present</p>
                        </div>
                    </div>
                </Card>

                <Card className="p-4">
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                            <Clock className="h-5 w-5 text-yellow-600" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-gray-900">{stats.late}</p>
                            <p className="text-xs text-gray-500">Late</p>
                        </div>
                    </div>
                </Card>

                <Card className="p-4">
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 bg-red-100 rounded-lg flex items-center justify-center">
                            <XCircle className="h-5 w-5 text-red-600" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-gray-900">{stats.absent}</p>
                            <p className="text-xs text-gray-500">Absent</p>
                        </div>
                    </div>
                </Card>
            </div>

            {/* Attendance Records */}
            <Card className="p-6">
                <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-brand-500" />
                    Attendance History
                </h2>

                {myAttendance.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {myAttendance.map((record, i) => (
                            <div
                                key={i}
                                className="flex flex-col p-3 bg-gray-50 rounded-xl border border-gray-100 gap-2"
                            >
                                <div className="flex items-center justify-between w-full">
                                    <div className="flex items-center gap-3">
                                        <div className="h-10 w-10 bg-white rounded-lg border flex items-center justify-center">
                                            <span className="text-xs font-bold text-gray-900">
                                                {new Date(record.date).getDate()}
                                            </span>
                                        </div>
                                        <div>
                                            <p className="font-medium text-gray-900">
                                                {new Date(record.date).toLocaleDateString('en-US', { weekday: 'long' })}
                                            </p>
                                            <p className="text-xs text-gray-500">
                                                {new Date(record.date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                                            </p>
                                        </div>
                                    </div>
                                    <span className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold uppercase ${getStatusColor(record.status)}`}>
                                        {getStatusIcon(record.status)}
                                        {record.status}
                                    </span>
                                </div>
                                {record.remark && (
                                    <div className="text-xs text-gray-500 bg-white border border-gray-100 p-2 rounded-md italic">
                                        "{record.remark}"
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-12 text-gray-400">
                        <Calendar className="h-12 w-12 mx-auto mb-3 opacity-50" />
                        <p className="italic">No attendance records for this term yet.</p>
                    </div>
                )}
            </Card>
        </div>
    );
};
