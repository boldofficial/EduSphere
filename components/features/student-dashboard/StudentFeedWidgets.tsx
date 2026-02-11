'use client';

import React from 'react';
import { Megaphone, Pin, FileText } from 'lucide-react';
import Link from 'next/link';

interface StudentFeedWidgetsProps {
    announcements: any[];
    payments: any[];
    studentId: string;
}

export const StudentFeedWidgets: React.FC<StudentFeedWidgetsProps> = ({
    announcements,
    payments,
    studentId
}) => {
    return (
        <div className="space-y-6">
            {/* Announcements Widget */}
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                        <Megaphone size={20} className="text-brand-500" />
                        Announcements
                    </h2>
                    <Link href="/announcements" className="text-sm text-brand-600 hover:text-brand-700 font-medium">
                        View All →
                    </Link>
                </div>
                <div className="space-y-3">
                    {announcements.length > 0 ? (
                        announcements.map((a, i) => (
                            <div key={a.id} className={`p-4 rounded-2xl border-l-4 ${a.priority === 'urgent' ? 'bg-red-50 border-l-red-500' : a.priority === 'important' ? 'bg-yellow-50 border-l-yellow-500' : 'bg-gray-50 border-l-brand-500'}`}>
                                <div className="flex items-start justify-between gap-2">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                            {a.is_pinned && <Pin className="h-3 w-3 text-yellow-500" />}
                                            <p className="text-sm font-bold text-gray-900">{a.title}</p>
                                            {a.priority !== 'normal' && (
                                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${a.priority === 'urgent' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}>
                                                    {a.priority}
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-xs text-gray-600 line-clamp-2">{a.content}</p>
                                    </div>
                                    <span className="text-[10px] text-gray-400 whitespace-nowrap">
                                        {new Date(a.created_at).toLocaleDateString()}
                                    </span>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="text-center py-8 text-gray-400 italic text-sm">No announcements.</div>
                    )}
                </div>
            </div>

            {/* Recent Payments */}
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                        <FileText size={20} className="text-brand-500" />
                        Recent Payments
                    </h2>
                    <Link href="/bursary" className="text-sm text-brand-600 hover:text-brand-700 font-medium font-bold">
                        Full Statement →
                    </Link>
                </div>
                <div className="space-y-3">
                    {payments.filter(p => p.student_id === studentId).length > 0 ? (
                        payments.filter(p => p.student_id === studentId).slice(0, 3).map((p, i) => (
                            <div key={i} className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-dashed">
                                <div>
                                    <p className="text-sm font-bold text-gray-900">₦{p.amount.toLocaleString()}</p>
                                    <p className="text-xs text-gray-500">{p.date}</p>
                                </div>
                                <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-[10px] font-black uppercase tracking-tighter">Verified</span>
                            </div>
                        ))
                    ) : (
                        <div className="text-center py-8 text-gray-400 italic text-sm">No recent transactions.</div>
                    )}
                </div>
            </div>
        </div>
    );
};
