'use client';

import React, { useEffect, useMemo, useState } from 'react';
import {
    Briefcase,
    ClipboardList,
    Calendar,
    Users,
    Package,
    Clock,
    DollarSign,
    Megaphone,
    TrendingDown,
    FileText,
    Mail
} from 'lucide-react';
import { useSchoolStore } from '@/lib/store';
import { useStaff, useSettings, useExpenses, usePayments, useAnnouncements, useStudents } from '@/lib/hooks/use-data';
import * as Utils from '@/lib/utils';
import * as Types from '@/lib/types';
import { MessageInboxWidget } from './dashboard/MessageInboxWidget';

export const StaffDashboardView = () => {
    const { currentUser } = useSchoolStore();
    const { data: staff = [] } = useStaff();
    const { data: settings = Utils.INITIAL_SETTINGS } = useSettings();
    const { data: expenses = [] } = useExpenses({ include_all_periods: true });
    const { data: payments = [] } = usePayments({ include_all_periods: true });
    const { data: announcements = [] } = useAnnouncements();
    const { data: students = [] } = useStudents();
    const [selectedSession, setSelectedSession] = useState('');
    const [selectedTerm, setSelectedTerm] = useState('');

    useEffect(() => {
        if (!selectedSession && settings.current_session) setSelectedSession(settings.current_session);
        if (!selectedTerm && settings.current_term) setSelectedTerm(settings.current_term);
    }, [settings.current_session, settings.current_term, selectedSession, selectedTerm]);

    const targetSession = selectedSession || settings.current_session;
    const targetTerm = selectedTerm || settings.current_term;
    const availableSessions = useMemo(() => {
        const sessions = new Set<string>();
        expenses.forEach(e => sessions.add(e.session));
        payments.forEach(p => sessions.add(p.session));
        if (settings.current_session) sessions.add(settings.current_session);
        return Array.from(sessions).sort().reverse();
    }, [expenses, payments, settings.current_session]);
    const availableTerms = settings.terms?.length ? settings.terms : ['First Term', 'Second Term', 'Third Term'];

    // Get current staff member profile
    const myProfile = useMemo(() => {
        if (currentUser?.email) {
            return staff.find(s => s.email === currentUser.email);
        }
        return null;
    }, [staff, currentUser]);

    // Recent activity - expenses from current term
    const currentTermExpenses = useMemo(() =>
        expenses
            .filter(e => e.session === targetSession && e.term === targetTerm)
            .slice(0, 5),
        [expenses, targetSession, targetTerm]
    );

    // Recent payments from current term
    const currentTermPayments = useMemo(() =>
        payments
            .filter(p => p.session === targetSession && p.term === targetTerm)
            .slice(0, 5),
        [payments, targetSession, targetTerm]
    );

    // Recent announcements
    const recentAnnouncements = useMemo(() =>
        announcements
            .filter(a => a.target === 'all' || a.target === 'staff')
            .slice(0, 3),
        [announcements]
    );

    // Calculate totals for current term
    const totalExpensesThisTerm = currentTermExpenses.reduce((acc, e) => acc + e.amount, 0);
    const totalPaymentsThisTerm = currentTermPayments.reduce((acc, p) => acc + p.amount, 0);

    return (
        <div className="space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black text-gray-900 uppercase flex items-center gap-3">
                        <Briefcase className="text-amber-500" size={32} />
                        Operations Dashboard
                    </h1>
                    <p className="text-gray-500 font-medium">
                        {myProfile ? `Welcome, ${myProfile.name}` : 'Non-Teaching Staff Portal'} | {targetTerm}, {targetSession}
                    </p>
                    <div className="mt-2 flex gap-2">
                        <select
                            value={targetSession}
                            onChange={(e) => setSelectedSession(e.target.value)}
                            className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-700"
                        >
                            {availableSessions.map(session => (
                                <option key={session} value={session}>{session}</option>
                            ))}
                        </select>
                        <select
                            value={targetTerm}
                            onChange={(e) => setSelectedTerm(e.target.value)}
                            className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-700"
                        >
                            {availableTerms.map((term: string) => (
                                <option key={term} value={term}>{term}</option>
                            ))}
                        </select>
                    </div>
                </div>
                <div className="flex gap-3">
                    <div className="bg-white px-4 py-2 rounded-xl shadow-sm border flex items-center gap-2">
                        <Clock size={16} className="text-gray-400" />
                        <span className="text-sm font-bold text-gray-600">{new Date().toLocaleDateString()}</span>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
                    <div className="bg-green-500 p-3 rounded-xl text-white">
                        <DollarSign size={24} />
                    </div>
                    <div>
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Payments (Term)</p>
                        <p className="text-2xl font-black text-gray-900">{Utils.formatCurrency(totalPaymentsThisTerm)}</p>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
                    <div className="bg-red-500 p-3 rounded-xl text-white">
                        <TrendingDown size={24} />
                    </div>
                    <div>
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Expenses (Term)</p>
                        <p className="text-2xl font-black text-gray-900">{Utils.formatCurrency(totalExpensesThisTerm)}</p>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
                    <div className="bg-blue-500 p-3 rounded-xl text-white">
                        <Users size={24} />
                    </div>
                    <div>
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Total Students</p>
                        <p className="text-2xl font-black text-gray-900">{students.length}</p>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
                    <div className="bg-purple-500 p-3 rounded-xl text-white">
                        <Package size={24} />
                    </div>
                    <div>
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Staff Members</p>
                        <p className="text-2xl font-black text-gray-900">{staff.length}</p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-6">
                    {/* Recent Expenses */}
                    <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
                        <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                            <FileText size={20} className="text-brand-500" />
                            Recent Expenses
                        </h2>
                        <div className="space-y-3">
                            {currentTermExpenses.length > 0 ? currentTermExpenses.map((expense) => (
                                <div key={expense.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-gray-100">
                                    <div className="flex items-center gap-3">
                                        <div className="h-10 w-10 bg-red-100 rounded-xl flex items-center justify-center">
                                            <TrendingDown size={18} className="text-red-600" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-gray-900">{expense.category}</p>
                                            <p className="text-xs text-gray-500">{expense.description}</p>
                                        </div>
                                    </div>
                                    <span className="text-sm font-bold text-red-600">-{Utils.formatCurrency(expense.amount)}</span>
                                </div>
                            )) : (
                                <div className="text-center py-8 text-gray-400">
                                    <Package size={32} className="mx-auto mb-2 opacity-50" />
                                    <p>No expenses recorded this term.</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Recent Announcements */}
                    <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
                        <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                            <Megaphone size={20} className="text-amber-500" />
                            Announcements
                        </h2>
                        <div className="space-y-3">
                            {recentAnnouncements.length > 0 ? recentAnnouncements.map((announcement) => (
                                <div key={announcement.id} className="p-4 bg-amber-50 rounded-2xl border border-amber-100">
                                    <div className="flex items-start gap-3">
                                        <div className="h-8 w-8 bg-amber-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                            <Megaphone size={14} className="text-amber-600" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-gray-900">{announcement.title}</p>
                                            <p className="text-xs text-gray-600 mt-1 line-clamp-2">{announcement.content}</p>
                                            <span className={`inline-block mt-2 px-2 py-0.5 text-[10px] font-bold uppercase rounded ${announcement.priority === 'urgent' ? 'bg-red-100 text-red-700' :
                                                announcement.priority === 'important' ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-600'
                                                }`}>{announcement.priority}</span>
                                        </div>
                                    </div>
                                </div>
                            )) : (
                                <div className="text-center py-8 text-gray-400">
                                    <Megaphone size={32} className="mx-auto mb-2 opacity-50" />
                                    <p>No announcements at this time.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="space-y-6">
                    {/* Quick Links */}
                    <div className="bg-amber-900 text-white p-6 rounded-3xl shadow-xl relative overflow-hidden">
                        <div className="relative z-10">
                            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                                <Calendar size={18} />
                                Quick Links
                            </h3>
                            <div className="space-y-3">
                                {myProfile?.assigned_modules && myProfile.assigned_modules.length > 0 ? (
                                    myProfile.assigned_modules.map((module: string) => (
                                        <a key={module} href={`/${module}`} className="block p-3 bg-white/10 rounded-xl hover:bg-white/20 transition-colors uppercase text-xs font-bold tracking-wider">
                                            Go to {module.replace(/_/g, ' ')}
                                        </a>
                                    ))
                                ) : (
                                    <p className="text-amber-200 text-sm">No specific modules assigned.</p>
                                )}
                            </div>
                        </div>
                        <div className="absolute top-0 right-0 -mr-8 -mt-8 w-32 h-32 bg-amber-800 rounded-full blur-3xl opacity-50"></div>
                    </div>

                    {/* My Role Info */}
                    {myProfile && (
                        <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
                            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                                <Briefcase size={18} className="text-brand-500" />
                                My Profile
                            </h3>
                            <div className="space-y-3">
                                <div>
                                    <p className="text-xs font-bold text-gray-400 uppercase">Role</p>
                                    <p className="text-sm font-medium text-gray-900">{myProfile.role}</p>
                                </div>
                                <div>
                                    <p className="text-xs font-bold text-gray-400 uppercase">Tasks</p>
                                    <p className="text-sm font-medium text-gray-900">{myProfile.tasks || 'General duties'}</p>
                                </div>
                                <div>
                                    <p className="text-xs font-bold text-gray-400 uppercase">Contact</p>
                                    <p className="text-sm font-medium text-gray-900">{myProfile.email}</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Messages Inbox */}
                    <MessageInboxWidget maxMessages={3} />
                </div>
            </div>
        </div>
    );
};
