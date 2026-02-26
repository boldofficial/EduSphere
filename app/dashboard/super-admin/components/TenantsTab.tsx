'use client';

import React, { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
    Plus, Ghost, Search, Filter, ChevronLeft, ChevronRight,
    MoreHorizontal, Pencil, Trash2, Power, Ban, CreditCard
} from 'lucide-react';
import apiClient from '@/lib/api-client';
import { useToast } from '@/components/providers/toast-provider';

const ROOT_DOMAIN = process.env.NEXT_PUBLIC_ROOT_DOMAIN || 'myregistra.net';
const PAGE_SIZE = 10;

export function TenantsTab({ schools, plans, onImpersonate, onEdit }: any) {
    const router = useRouter();
    const { addToast } = useToast();
    const [isProcessing, setIsProcessing] = useState(false);
    const [paymentModalOpen, setPaymentModalOpen] = useState(false);
    const [selectedSchool, setSelectedSchool] = useState<any>(null);
    const [amount, setAmount] = useState('');
    const [reference, setReference] = useState('');
    const [openDropdown, setOpenDropdown] = useState<number | null>(null);

    // Search, filter, pagination
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [currentPage, setCurrentPage] = useState(1);

    const filteredSchools = useMemo(() => {
        let result = [...schools];
        if (searchTerm) {
            const q = searchTerm.toLowerCase();
            result = result.filter((s: any) =>
                s.name?.toLowerCase().includes(q) || s.domain?.toLowerCase().includes(q)
            );
        }
        if (statusFilter !== 'all') {
            result = result.filter((s: any) => s.subscription_status === statusFilter);
        }
        return result;
    }, [schools, searchTerm, statusFilter]);

    const totalPages = Math.max(1, Math.ceil(filteredSchools.length / PAGE_SIZE));
    const paginatedSchools = filteredSchools.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

    const handleAction = async (schoolId: number, action: 'delete' | 'suspend' | 'activate' | 'approve') => {
        if (!confirm(`Are you sure you want to ${action} this school?`)) return;

        setIsProcessing(true);
        try {
            if (action === 'delete') {
                await apiClient.delete(`/schools/manage/${schoolId}/`);
            } else {
                await apiClient.patch(`/schools/manage/${schoolId}/`, { action });
            }
            addToast(`School ${action}d successfully`, 'success');
            setTimeout(() => window.location.reload(), 500);
        } catch (error) {
            addToast(`Failed to ${action} school`, 'error');
        } finally {
            setIsProcessing(false);
        }
    };

    const openPaymentModal = (school: any) => {
        setSelectedSchool(school);
        setAmount('0');
        setReference(`MANUAL-${Date.now()}`);
        setPaymentModalOpen(true);
    };

    const handlePayment = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsProcessing(true);
        try {
            await apiClient.post('/schools/payments/record/', {
                school_id: selectedSchool.id,
                amount: amount,
                reference: reference
            });
            addToast('Payment recorded successfully', 'success');
            setTimeout(() => window.location.reload(), 500);
        } catch (error) {
            addToast('Payment recording failed', 'error');
        } finally {
            setIsProcessing(false);
            setPaymentModalOpen(false);
        }
    };

    const getStatusStyle = (status: string) => {
        switch (status) {
            case 'active': return 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200';
            case 'suspended': return 'bg-amber-50 text-amber-700 ring-1 ring-amber-200';
            case 'expired': return 'bg-rose-50 text-rose-700 ring-1 ring-rose-200';
            default: return 'bg-slate-50 text-slate-600 ring-1 ring-slate-200';
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-3xl font-black text-gray-900 tracking-tight">Tenants</h2>
                    <p className="text-gray-500 text-sm font-medium mt-1">Manage all registered schools on the platform.</p>
                </div>
                <button
                    onClick={() => router.push('/onboarding')}
                    className="px-5 py-3 bg-gradient-to-r from-brand-600 to-brand-500 text-white rounded-2xl flex items-center gap-2 hover:shadow-lg hover:shadow-brand-600/20 transition-all font-bold text-sm"
                >
                    <Plus size={18} /> Add School
                </button>
            </div>

            {/* Search & Filter Bar */}
            <div className="flex items-center gap-4">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                    <input
                        type="text"
                        placeholder="Search by name or domain..."
                        value={searchTerm}
                        onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                        className="w-full bg-white border border-gray-200 rounded-xl py-2.5 pl-11 pr-4 outline-none text-sm font-medium focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all"
                    />
                </div>
                <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-3 py-1">
                    <Filter size={14} className="text-gray-400" />
                    <select
                        value={statusFilter}
                        onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
                        className="bg-transparent outline-none text-sm font-bold text-gray-700 py-1.5 appearance-none pr-6 cursor-pointer"
                    >
                        <option value="all">All Status</option>
                        <option value="active">Active</option>
                        <option value="suspended">Suspended</option>
                        <option value="expired">Expired</option>
                    </select>
                </div>
                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                    {filteredSchools.length} school{filteredSchools.length !== 1 ? 's' : ''}
                </span>
            </div>

            {/* Table */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-gray-50/80 border-b border-gray-100">
                        <tr>
                            <th className="px-6 py-4 font-bold text-gray-500 text-xs uppercase tracking-wider">School Name</th>
                            <th className="px-6 py-4 font-bold text-gray-500 text-xs uppercase tracking-wider">Domain</th>
                            <th className="px-6 py-4 font-bold text-gray-500 text-xs uppercase tracking-wider">Status</th>
                            <th className="px-6 py-4 font-bold text-gray-500 text-xs uppercase tracking-wider text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                        {paginatedSchools.map((school: any) => (
                            <tr key={school.id} className="hover:bg-brand-50/20 transition-colors group">
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-9 h-9 bg-gradient-to-br from-brand-500 to-indigo-600 rounded-xl flex items-center justify-center text-white text-xs font-black shadow-sm">
                                            {school.name?.[0]?.toUpperCase()}
                                        </div>
                                        <span className="font-bold text-gray-900 text-sm">{school.name}</span>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <a href={`https://${school.domain}.${ROOT_DOMAIN}`} target="_blank"
                                        className="text-sm text-brand-600 hover:text-brand-800 font-medium hover:underline transition-colors">
                                        {school.domain}.{ROOT_DOMAIN}
                                    </a>
                                </td>
                                <td className="px-6 py-4">
                                    <span className={`px-2.5 py-1 text-[10px] font-black rounded-full uppercase tracking-wider ${getStatusStyle(school.subscription_status)}`}>
                                        {school.subscription_status || 'Active'}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-right relative">
                                    <button
                                        onClick={() => setOpenDropdown(openDropdown === school.id ? null : school.id)}
                                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-400 hover:text-gray-700"
                                    >
                                        <MoreHorizontal size={18} />
                                    </button>
                                    {openDropdown === school.id && (
                                        <>
                                            <div className="fixed inset-0 z-10" onClick={() => setOpenDropdown(null)} />
                                            <div className="absolute right-6 top-12 z-20 bg-white rounded-2xl shadow-2xl border border-gray-100 py-2 w-48 animate-in zoom-in-95 duration-150">
                                                <button onClick={() => { onImpersonate(school.admin_id); setOpenDropdown(null); }}
                                                    className="w-full text-left px-4 py-2.5 hover:bg-gray-50 flex items-center gap-3 text-sm font-medium text-gray-700">
                                                    <Ghost size={14} className="text-blue-500" /> Login as Admin
                                                </button>
                                                <button onClick={() => { onEdit(school); setOpenDropdown(null); }}
                                                    className="w-full text-left px-4 py-2.5 hover:bg-gray-50 flex items-center gap-3 text-sm font-medium text-gray-700">
                                                    <Pencil size={14} className="text-brand-500" /> Edit Details
                                                </button>
                                                <button onClick={() => { openPaymentModal(school); setOpenDropdown(null); }}
                                                    className="w-full text-left px-4 py-2.5 hover:bg-gray-50 flex items-center gap-3 text-sm font-medium text-gray-700">
                                                    <CreditCard size={14} className="text-emerald-500" /> Record Payment
                                                </button>
                                                <div className="border-t border-gray-100 my-1" />
                                                {school.subscription_status === 'active' ? (
                                                    <button onClick={() => { handleAction(school.id, 'suspend'); setOpenDropdown(null); }}
                                                        className="w-full text-left px-4 py-2.5 hover:bg-amber-50 flex items-center gap-3 text-sm font-medium text-amber-600">
                                                        <Ban size={14} /> Suspend
                                                    </button>
                                                ) : (
                                                    <button onClick={() => { handleAction(school.id, 'activate'); setOpenDropdown(null); }}
                                                        className="w-full text-left px-4 py-2.5 hover:bg-emerald-50 flex items-center gap-3 text-sm font-medium text-emerald-600">
                                                        <Power size={14} /> Activate
                                                    </button>
                                                )}
                                                <button onClick={() => { handleAction(school.id, 'delete'); setOpenDropdown(null); }}
                                                    className="w-full text-left px-4 py-2.5 hover:bg-rose-50 flex items-center gap-3 text-sm font-medium text-rose-600">
                                                    <Trash2 size={14} /> Delete
                                                </button>
                                            </div>
                                        </>
                                    )}
                                </td>
                            </tr>
                        ))}
                        {paginatedSchools.length === 0 && (
                            <tr>
                                <td colSpan={4} className="px-6 py-16 text-center">
                                    <Search size={40} className="mx-auto mb-4 text-gray-200" />
                                    <p className="font-bold text-gray-400">No schools found matching your criteria.</p>
                                    <p className="text-sm text-gray-300 mt-1">Try adjusting your search or filter.</p>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between bg-gray-50/50">
                        <span className="text-xs font-bold text-gray-400">
                            Showing {(currentPage - 1) * PAGE_SIZE + 1}–{Math.min(currentPage * PAGE_SIZE, filteredSchools.length)} of {filteredSchools.length}
                        </span>
                        <div className="flex items-center gap-2">
                            <button disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)}
                                className="p-2 rounded-lg border border-gray-200 hover:bg-white disabled:opacity-30 disabled:cursor-not-allowed transition-all">
                                <ChevronLeft size={16} />
                            </button>
                            {Array.from({ length: totalPages }, (_, i) => i + 1).slice(
                                Math.max(0, currentPage - 3),
                                Math.min(totalPages, currentPage + 2)
                            ).map(page => (
                                <button key={page} onClick={() => setCurrentPage(page)}
                                    className={`w-8 h-8 rounded-lg text-xs font-black transition-all ${page === currentPage ? 'bg-brand-600 text-white shadow-md' : 'hover:bg-gray-100 text-gray-500'}`}>
                                    {page}
                                </button>
                            ))}
                            <button disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => p + 1)}
                                className="p-2 rounded-lg border border-gray-200 hover:bg-white disabled:opacity-30 disabled:cursor-not-allowed transition-all">
                                <ChevronRight size={16} />
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Payment Modal */}
            {paymentModalOpen && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
                    <div className="bg-white p-8 rounded-3xl w-full max-w-md shadow-2xl animate-in zoom-in-95 duration-200">
                        <h3 className="text-xl font-black text-gray-900 mb-6">Record Payment for {selectedSchool?.name}</h3>
                        <form onSubmit={handlePayment} className="space-y-5">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Amount (NGN)</label>
                                <input type="number" required value={amount} onChange={(e) => setAmount(e.target.value)}
                                    className="w-full bg-gray-50 border-0 rounded-xl px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-brand-600 outline-none transition-all" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Reference</label>
                                <input type="text" required value={reference} onChange={(e) => setReference(e.target.value)}
                                    className="w-full bg-gray-50 border-0 rounded-xl px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-brand-600 outline-none transition-all font-mono" />
                            </div>
                            <div className="flex justify-end gap-3 pt-4">
                                <button type="button" onClick={() => setPaymentModalOpen(false)}
                                    className="px-5 py-3 text-gray-400 hover:bg-gray-50 rounded-xl font-bold text-xs uppercase tracking-widest transition-all">Cancel</button>
                                <button type="submit" disabled={isProcessing}
                                    className="px-6 py-3 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 shadow-lg shadow-emerald-600/20 transition-all text-xs uppercase tracking-widest">
                                    {isProcessing ? 'Recording...' : 'Record Payment'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
