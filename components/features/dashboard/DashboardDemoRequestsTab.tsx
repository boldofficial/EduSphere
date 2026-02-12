'use client';

import React, { useEffect, useState } from 'react';
import { ShieldCheck, Eye, CheckCircle, Mail, Globe, User } from 'lucide-react';
import { useToast } from '@/components/providers/toast-provider';
import apiClient from '@/lib/api-client';
import { Button } from '@/components/ui/button';

interface DemoRequest {
    id: number;
    name: string;
    email: string;
    school_name: string;
    role: string;
    status: 'pending' | 'approved' | 'rejected';
    created_at: string;
}

export const DashboardDemoRequestsTab: React.FC = () => {
    const [requests, setRequests] = useState<DemoRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const { addToast } = useToast();
    const [processingId, setProcessingId] = useState<number | null>(null);

    const fetchRequests = async () => {
        try {
            const response = await apiClient.get('schools/admin/demo-requests/');
            setRequests(response.data);
        } catch (error) {
            console.error('Failed to fetch demo requests:', error);
            addToast('Failed to load demo requests', 'error');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRequests();
    }, []);

    const handleApprove = async (id: number) => {
        setProcessingId(id);
        try {
            const response = await apiClient.post(`schools/admin/demo-requests/${id}/approve/`, {});
            if (response.data.success) {
                addToast(response.data.message || 'Request approved successfully', 'success');
                // Refresh list
                setRequests(prev => prev.map(req =>
                    req.id === id ? { ...req, status: 'approved' } : req
                ));
            } else {
                addToast('Approval failed', 'error');
            }
        } catch (error) {
            console.error('Approval error:', error);
            addToast('Failed to approve request', 'error');
        } finally {
            setProcessingId(null);
        }
    };

    if (loading) {
        return <div className="p-8 text-center text-gray-500">Loading demo requests...</div>;
    }

    return (
        <div className="space-y-6">
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
                <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-bold flex items-center gap-2">
                        <ShieldCheck className="text-brand-600" /> Demo Requests
                    </h3>
                    <div className="text-sm font-medium text-gray-500">
                        Total: {requests.length} Requests
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-gray-100 text-xs font-black uppercase text-gray-400">
                                <th className="pb-4 px-4">Applicant</th>
                                <th className="pb-4 px-4">School Info</th>
                                <th className="pb-4 px-4">Role</th>
                                <th className="pb-4 px-4">Status</th>
                                <th className="pb-4 px-4">Date</th>
                                <th className="pb-4 px-4 text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {requests.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="py-8 text-center text-gray-500 text-sm">
                                        No demo requests found.
                                    </td>
                                </tr>
                            ) : (
                                requests.map(req => (
                                    <tr key={req.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors group">
                                        <td className="py-4 px-4">
                                            <div className="font-bold text-gray-900 flex items-center gap-2">
                                                <User size={14} className="text-gray-400" />
                                                {req.name}
                                            </div>
                                            <div className="text-xs text-gray-500 pl-6">{req.email}</div>
                                        </td>
                                        <td className="py-4 px-4">
                                            <div className="font-bold text-gray-700">{req.school_name}</div>
                                            {req.school_name && <div className="text-[10px] text-brand-600 font-mono">Demo Request</div>}
                                        </td>
                                        <td className="py-4 px-4 text-xs font-medium uppercase text-gray-600">
                                            {req.role}
                                        </td>
                                        <td className="py-4 px-4">
                                            <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase ${req.status === 'approved' ? 'bg-green-100 text-green-700' :
                                                req.status === 'rejected' ? 'bg-red-100 text-red-700' :
                                                    'bg-amber-100 text-amber-700'
                                                }`}>
                                                {req.status}
                                            </span>
                                        </td>
                                        <td className="py-4 px-4 text-xs text-gray-500">
                                            {new Date(req.created_at).toLocaleDateString()}
                                        </td>
                                        <td className="py-4 px-4 text-right">
                                            {req.status === 'pending' && (
                                                <Button
                                                    size="sm"
                                                    onClick={() => handleApprove(req.id)}
                                                    disabled={processingId === req.id}
                                                    className="gap-2 bg-brand-600 hover:bg-brand-700 text-white text-xs h-8"
                                                >
                                                    {processingId === req.id ? (
                                                        'Processing...'
                                                    ) : (
                                                        <>
                                                            <CheckCircle size={14} /> Approve
                                                        </>
                                                    )}
                                                </Button>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};
