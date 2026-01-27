'use client';

import React, { useState } from 'react';
import { FileText, CheckCircle, XCircle, Clock, Eye, User, Mail, Phone, MapPin, Calendar, GraduationCap, Search, Filter } from 'lucide-react';
import * as Types from '@/lib/types';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/providers/toast-provider';

interface AdmissionsViewProps {
    admissions: Types.Admission[];
    onUpdate: (admission: Types.Admission) => void;
}

export const AdmissionsView: React.FC<AdmissionsViewProps> = ({ admissions, onUpdate }) => {
    const [selectedAdmission, setSelectedAdmission] = useState<Types.Admission | null>(null);
    const [filterStatus, setFilterStatus] = useState<string>('all');
    const [searchQuery, setSearchQuery] = useState('');
    const { addToast } = useToast();

    const filteredAdmissions = admissions.filter(a => {
        const matchesStatus = filterStatus === 'all' || a.status === filterStatus;
        const matchesSearch = a.child_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            a.parent_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            a.parent_email.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesStatus && matchesSearch;
    });

    const updateStatus = (id: string, status: Types.Admission['status']) => {
        const admission = admissions.find(a => a.id === id);
        if (!admission) return;

        const updated = { ...admission, status, reviewed_at: Date.now(), updated_at: Date.now() };
        onUpdate(updated);
        addToast(`Application ${status === 'accepted' ? 'accepted' : status === 'rejected' ? 'rejected' : 'updated'}`, status === 'accepted' ? 'success' : status === 'rejected' ? 'error' : 'info');
        setSelectedAdmission(null);
    };

    const getStatusBadge = (status: Types.Admission['status']) => {
        const styles = {
            pending: 'bg-yellow-100 text-yellow-700',
            reviewed: 'bg-blue-100 text-blue-700',
            accepted: 'bg-green-100 text-green-700',
            rejected: 'bg-red-100 text-red-700',
        };
        return <span className={`px-2 py-1 rounded-full text-xs font-bold ${styles[status]}`}>{status.toUpperCase()}</span>;
    };

    const getProgramBadge = (program: Types.Admission['program']) => {
        const styles = {
            'creche': 'bg-pink-100 text-pink-700',
            'pre-school': 'bg-purple-100 text-purple-700',
            'primary': 'bg-indigo-100 text-indigo-700',
        };
        const labels = { 'creche': 'Crèche', 'pre-school': 'Pre-School', 'primary': 'Primary' };
        return <span className={`px-2 py-1 rounded-full text-xs font-bold ${styles[program]}`}>{labels[program]}</span>;
    };

    const stats = {
        total: admissions.length,
        pending: admissions.filter(a => a.status === 'pending').length,
        accepted: admissions.filter(a => a.status === 'accepted').length,
        rejected: admissions.filter(a => a.status === 'rejected').length,
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Admissions</h1>
                    <p className="text-gray-500">Review and process admission applications</p>
                </div>
            </div>

            {/* Stats Row */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                    <p className="text-xs text-gray-500 font-medium uppercase">Total</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                </div>
                <div className="bg-yellow-50 p-4 rounded-xl border border-yellow-100">
                    <p className="text-xs text-yellow-600 font-medium uppercase">Pending</p>
                    <p className="text-2xl font-bold text-yellow-700">{stats.pending}</p>
                </div>
                <div className="bg-green-50 p-4 rounded-xl border border-green-100">
                    <p className="text-xs text-green-600 font-medium uppercase">Accepted</p>
                    <p className="text-2xl font-bold text-green-700">{stats.accepted}</p>
                </div>
                <div className="bg-red-50 p-4 rounded-xl border border-red-100">
                    <p className="text-xs text-red-600 font-medium uppercase">Rejected</p>
                    <p className="text-2xl font-bold text-red-700">{stats.rejected}</p>
                </div>
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                    <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search by name or email..."
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
                    />
                </div>
                <div className="flex items-center gap-2">
                    <Filter size={18} className="text-gray-400" />
                    <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="px-4 py-2 border border-gray-200 rounded-xl bg-white focus:ring-2 focus:ring-brand-500">
                        <option value="all">All Status</option>
                        <option value="pending">Pending</option>
                        <option value="reviewed">Reviewed</option>
                        <option value="accepted">Accepted</option>
                        <option value="rejected">Rejected</option>
                    </select>
                </div>
            </div>

            {/* Applications List */}
            {filteredAdmissions.length === 0 ? (
                <Card>
                    <div className="text-center py-12">
                        <FileText size={48} className="text-gray-300 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-500">No Applications Found</h3>
                        <p className="text-gray-400 text-sm">Applications submitted through the website will appear here.</p>
                    </div>
                </Card>
            ) : (
                <div className="grid gap-4">
                    {filteredAdmissions.map(admission => (
                        <Card key={admission.id} className="hover:shadow-md transition-shadow cursor-pointer">
                            <div onClick={() => setSelectedAdmission(admission)} className="p-4">
                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                    <div className="flex items-start gap-4">
                                        <div className="h-12 w-12 bg-brand-100 rounded-xl flex items-center justify-center text-brand-600 shrink-0">
                                            <User size={24} />
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2 mb-1">
                                                <h3 className="font-bold text-gray-900">{admission.child_name}</h3>
                                                {getStatusBadge(admission.status)}
                                            </div>
                                            <p className="text-sm text-gray-500">Applied for {admission.class_applied} • {getProgramBadge(admission.program)}</p>
                                            <p className="text-xs text-gray-400 mt-1">Submitted {new Date(admission.created_at).toLocaleDateString()}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Button variant="secondary" size="sm" onClick={(e) => { e.stopPropagation(); setSelectedAdmission(admission); }}>
                                            <Eye size={16} className="mr-1" /> View
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </Card>
                    ))}
                </div>
            )}

            {/* Detail Modal */}
            {selectedAdmission && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setSelectedAdmission(null)}>
                    <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                        <div className="p-6 border-b border-gray-100">
                            <div className="flex items-center justify-between">
                                <h2 className="text-xl font-bold text-gray-900">Application Details</h2>
                                {getStatusBadge(selectedAdmission.status)}
                            </div>
                        </div>
                        <div className="p-6 space-y-6">
                            {/* Child Info */}
                            <div>
                                <h3 className="font-bold text-gray-700 mb-3 flex items-center gap-2"><User size={18} /> Child Information</h3>
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                    <div><span className="text-gray-500">Name:</span> <span className="font-medium">{selectedAdmission.child_name}</span></div>
                                    <div><span className="text-gray-500">Gender:</span> <span className="font-medium">{selectedAdmission.child_gender}</span></div>
                                    <div><span className="text-gray-500">Date of Birth:</span> <span className="font-medium">{selectedAdmission.child_dob}</span></div>
                                    <div><span className="text-gray-500">Previous School:</span> <span className="font-medium">{selectedAdmission.previous_school || 'N/A'}</span></div>
                                </div>
                            </div>

                            {/* Program */}
                            <div>
                                <h3 className="font-bold text-gray-700 mb-3 flex items-center gap-2"><GraduationCap size={18} /> Program</h3>
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                    <div><span className="text-gray-500">Program:</span> {getProgramBadge(selectedAdmission.program)}</div>
                                    <div><span className="text-gray-500">Class:</span> <span className="font-medium">{selectedAdmission.class_applied}</span></div>
                                </div>
                            </div>

                            {/* Parent Info */}
                            <div>
                                <h3 className="font-bold text-gray-700 mb-3 flex items-center gap-2"><User size={18} /> Parent/Guardian</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                    <div className="flex items-center gap-2"><User size={14} className="text-gray-400" /> {selectedAdmission.parent_name} ({selectedAdmission.relationship})</div>
                                    <div className="flex items-center gap-2"><Mail size={14} className="text-gray-400" /> {selectedAdmission.parent_email}</div>
                                    <div className="flex items-center gap-2"><Phone size={14} className="text-gray-400" /> {selectedAdmission.parent_phone}</div>
                                    <div className="flex items-center gap-2 md:col-span-2"><MapPin size={14} className="text-gray-400" /> {selectedAdmission.parent_address}</div>
                                </div>
                            </div>

                            {/* Timeline */}
                            <div className="text-xs text-gray-400 flex items-center gap-4">
                                <span className="flex items-center gap-1"><Calendar size={12} /> Submitted: {new Date(selectedAdmission.created_at).toLocaleString()}</span>
                                {selectedAdmission.reviewed_at && <span className="flex items-center gap-1"><Clock size={12} /> Reviewed: {new Date(selectedAdmission.reviewed_at).toLocaleString()}</span>}
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="p-6 border-t border-gray-100 bg-gray-50 flex flex-wrap gap-3 justify-end rounded-b-2xl">
                            <Button variant="secondary" onClick={() => setSelectedAdmission(null)}>Close</Button>
                            {selectedAdmission.status === 'pending' && (
                                <>
                                    <Button variant="secondary" onClick={() => updateStatus(selectedAdmission.id, 'reviewed')}>
                                        <Eye size={16} className="mr-1" /> Mark Reviewed
                                    </Button>
                                    <Button className="bg-red-500 hover:bg-red-600 text-white" onClick={() => updateStatus(selectedAdmission.id, 'rejected')}>
                                        <XCircle size={16} className="mr-1" /> Reject
                                    </Button>
                                    <Button className="bg-green-500 hover:bg-green-600 text-white" onClick={() => updateStatus(selectedAdmission.id, 'accepted')}>
                                        <CheckCircle size={16} className="mr-1" /> Accept
                                    </Button>
                                </>
                            )}
                            {selectedAdmission.status === 'reviewed' && (
                                <>
                                    <Button className="bg-red-500 hover:bg-red-600 text-white" onClick={() => updateStatus(selectedAdmission.id, 'rejected')}>
                                        <XCircle size={16} className="mr-1" /> Reject
                                    </Button>
                                    <Button className="bg-green-500 hover:bg-green-600 text-white" onClick={() => updateStatus(selectedAdmission.id, 'accepted')}>
                                        <CheckCircle size={16} className="mr-1" /> Accept
                                    </Button>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
