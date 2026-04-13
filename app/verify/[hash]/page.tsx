'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { CheckCircle, AlertTriangle, Shield, School, User, GraduationCap, Calendar, TrendingUp } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface VerificationData {
    student_name: string;
    student_no: string;
    class_name: string;
    session: string;
    term: string;
    average: number;
    is_passed: boolean;
    school_name: string;
    verified_at: string;
    teacher_name: string;
}

export default function VerificationPage() {
    const { hash } = useParams();
    const [data, setData] = useState<VerificationData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchVerification = async () => {
            try {
                // Fetch from the public proxy endpoint we just created
                const response = await fetch(`/api/proxy/academic/reports/verify/${hash}/`);
                if (!response.ok) {
                    throw new Error('Invalid or expired verification link');
                }
                const result = await response.json();
                setData(result);
            } catch (err: any) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        if (hash) fetchVerification();
    }, [hash]);

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
                <div className="animate-pulse flex flex-col items-center">
                    <div className="h-16 w-16 bg-brand-200 rounded-full mb-4"></div>
                    <div className="h-4 w-48 bg-gray-200 rounded mb-2"></div>
                    <div className="h-3 w-32 bg-gray-100 rounded"></div>
                </div>
            </div>
        );
    }

    if (error || !data) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
                <Card className="max-w-md w-full p-8 text-center border-red-100 bg-red-50/30">
                    <div className="h-20 w-20 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-6">
                        <AlertTriangle size={40} />
                    </div>
                    <h1 className="text-2xl font-black text-gray-900 mb-2 uppercase">Verification Failed</h1>
                    <p className="text-gray-600 mb-8">{error || "Could not find a matching report for this hash."}</p>
                    <Button className="w-full bg-gray-900" onClick={() => window.location.href = '/'}>
                        Back to Home
                    </Button>
                </Card>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 py-12 px-6">
            <div className="max-w-2xl mx-auto space-y-8">
                {/* Header Badge */}
                <div className="flex flex-col items-center text-center">
                    <div className="h-24 w-24 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-4 shadow-sm border-4 border-white">
                        <CheckCircle size={48} />
                    </div>
                    <div className="inline-flex items-center gap-2 bg-green-50 text-green-700 px-4 py-1.5 rounded-full text-sm font-bold border border-green-200 uppercase tracking-widest shadow-sm">
                        <Shield size={14} /> Official Verified Result
                    </div>
                </div>

                <Card className="overflow-hidden border-0 shadow-2xl rounded-3xl">
                    {/* ID Card Top */}
                    <div className="bg-brand-900 p-8 text-white relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-4 opacity-10">
                            <GraduationCap size={160} />
                        </div>
                        <div className="relative z-10">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="h-10 w-10 bg-white/20 backdrop-blur-md rounded-lg flex items-center justify-center">
                                    <School size={20} />
                                </div>
                                <h2 className="text-lg font-bold tracking-tight">{data.school_name}</h2>
                            </div>
                            <h1 className="text-4xl font-black mb-1">{data.student_name}</h1>
                            <p className="text-brand-300 font-medium uppercase tracking-widest">Student ID: {data.student_no}</p>
                        </div>
                    </div>

                    {/* Result Details */}
                    <div className="p-8 bg-white space-y-8">
                        <div className="grid grid-cols-2 gap-6">
                            <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                                <div className="flex items-center gap-2 text-gray-400 text-xs font-bold uppercase tracking-wider mb-2">
                                    <Calendar size={12} /> Session / Term
                                </div>
                                <p className="text-lg font-bold text-gray-900">{data.session}</p>
                                <p className="text-sm text-brand-600 font-bold">{data.term}</p>
                            </div>
                            <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                                <div className="flex items-center gap-2 text-gray-400 text-xs font-bold uppercase tracking-wider mb-2">
                                    <TrendingUp size={12} /> Academic Standing
                                </div>
                                <p className="text-3xl font-black text-gray-900">{data.average.toFixed(1)}%</p>
                                <span className={`text-xs font-black px-2 py-0.5 rounded-full ${data.is_passed ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                    {data.is_passed ? 'RESULT PASSED' : 'RESULT FAILED'}
                                </span>
                            </div>
                        </div>

                        <div className="space-y-4 pt-4 border-t border-gray-100">
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-gray-500 flex items-center gap-2">
                                    <User size={14} className="text-brand-500" /> Authorized By
                                </span>
                                <span className="font-bold text-gray-900">{data.teacher_name}</span>
                            </div>
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-gray-500 flex items-center gap-2">
                                    <Calendar size={14} className="text-brand-500" /> Verification Date
                                </span>
                                <span className="font-medium text-gray-900">
                                    {new Date(data.verified_at).toLocaleDateString(undefined, { dateStyle: 'long' })}
                                </span>
                            </div>
                        </div>

                        <div className="mt-8 pt-8 border-t border-dashed border-gray-200 flex flex-col items-center">
                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-[0.2em] mb-4">Verification Certificate ID</p>
                            <code className="bg-gray-50 px-4 py-2 rounded-lg text-xs font-mono text-gray-500 border border-gray-100 select-all">
                                {hash}
                            </code>
                        </div>
                    </div>
                </Card>

                <p className="text-center text-xs text-gray-400 px-12">
                    Information provided on this page is an official digital verification of the student's terminal report card. 
                    Any discrepancy between physical documents and this page should be reported to the school administration.
                </p>
            </div>
        </div>
    );
}
