'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Ghost } from 'lucide-react';
import apiClient from '@/lib/api-client';

const ROOT_DOMAIN = process.env.NEXT_PUBLIC_ROOT_DOMAIN || 'myregistra.net';

export function TenantsTab({ schools, plans, onImpersonate, onEdit }: any) {
    const router = useRouter();
    const [isProcessing, setIsProcessing] = useState(false);
    const [paymentModalOpen, setPaymentModalOpen] = useState(false);
    const [selectedSchool, setSelectedSchool] = useState<any>(null);
    const [amount, setAmount] = useState('');
    const [reference, setReference] = useState('');

    const handleAction = async (schoolId: number, action: 'delete' | 'suspend' | 'activate' | 'approve') => {
        if (!confirm(`Are you sure you want to ${action} this school?`)) return;

        setIsProcessing(true);
        try {
            if (action === 'delete') {
                await apiClient.delete(`/schools/manage/${schoolId}/`);
            } else {
                await apiClient.patch(`/schools/manage/${schoolId}/`, { action });
            }
            window.location.reload();
        } catch (error) {
            alert("Action failed");
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
            alert("Payment Recorded!");
            window.location.reload();
        } catch (error) {
            alert("Payment failed");
        } finally {
            setIsProcessing(false);
            setPaymentModalOpen(false);
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex justify-between items-center">
                <h2 className="text-3xl font-bold text-gray-900">Tenants</h2>
                <button
                    onClick={() => router.push('/onboarding')}
                    className="px-4 py-2 bg-brand-600 text-white rounded-lg flex items-center gap-2 hover:bg-brand-700"
                >
                    <Plus size={18} /> Add School
                </button>
            </div>

            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                            <th className="px-6 py-4 font-bold text-gray-500 text-sm">School Name</th>
                            <th className="px-6 py-4 font-bold text-gray-500 text-sm">Domain</th>
                            <th className="px-6 py-4 font-bold text-gray-500 text-sm">Status</th>
                            <th className="px-6 py-4 font-bold text-gray-500 text-sm text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {schools.map((school: any) => (
                            <tr key={school.id} className="hover:bg-gray-50 transition-colors">
                                <td className="px-6 py-4 font-medium text-gray-900">{school.name}</td>
                                <td className="px-6 py-4 text-gray-600 text-sm">
                                    <a href={`https://${school.domain}.${ROOT_DOMAIN}`} target="_blank" className="hover:text-brand-600 underline decoration-dotted">
                                        {school.domain}.{ROOT_DOMAIN}
                                    </a>
                                </td>
                                <td className="px-6 py-4">
                                    <span className={`px-2 py-1 text-xs font-bold rounded-full ${school.subscription_status === 'active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                                        }`}>
                                        {school.subscription_status || 'Active'}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <div className="flex justify-end gap-2">
                                        <button
                                            onClick={() => onImpersonate(school.admin_id)}
                                            title="Login as Admin"
                                            className="text-blue-600 hover:bg-blue-50 px-2 py-1 rounded text-xs font-bold border border-blue-100 flex items-center gap-1"
                                        >
                                            <Ghost size={14} />
                                            Login
                                        </button>
                                        <button
                                            onClick={() => onEdit(school)}
                                            className="text-brand-600 hover:bg-brand-50 px-2 py-1 rounded text-xs font-bold border border-brand-100"
                                        >
                                            Edit
                                        </button>
                                        <button onClick={() => openPaymentModal(school)} className="text-gray-600 hover:bg-gray-100 px-2 py-1 rounded text-xs font-bold border border-gray-200">Pay</button>

                                        {school.subscription_status === 'active' ? (
                                            <button onClick={() => handleAction(school.id, 'suspend')} className="text-amber-600 hover:bg-amber-50 px-2 py-1 rounded text-xs font-bold">Suspend</button>
                                        ) : (
                                            <button onClick={() => handleAction(school.id, 'activate')} className="text-green-600 hover:bg-green-50 px-2 py-1 rounded text-xs font-bold">Activate</button>
                                        )}
                                        <button onClick={() => handleAction(school.id, 'delete')} className="text-red-600 hover:bg-red-50 px-2 py-1 rounded text-xs font-bold">Delete</button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Payment Modal */}
            {paymentModalOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white p-6 rounded-2xl w-full max-w-md shadow-2xl">
                        <h3 className="text-xl font-bold mb-4">Record Payment for {selectedSchool?.name}</h3>
                        <form onSubmit={handlePayment} className="space-y-4">
                            <div>
                                <label className="block text-sm font-bold text-gray-700">Amount (NGN)</label>
                                <input
                                    type="number"
                                    required
                                    value={amount}
                                    onChange={(e) => setAmount(e.target.value)}
                                    className="w-full border p-2 rounded-lg"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700">Reference</label>
                                <input
                                    type="text"
                                    required
                                    value={reference}
                                    onChange={(e) => setReference(e.target.value)}
                                    className="w-full border p-2 rounded-lg"
                                />
                            </div>
                            <div className="flex justify-end gap-2 pt-4">
                                <button type="button" onClick={() => setPaymentModalOpen(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg font-bold">Cancel</button>
                                <button type="submit" disabled={isProcessing} className="px-4 py-2 bg-green-600 text-white rounded-lg font-bold hover:bg-green-700">Record Payment</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
