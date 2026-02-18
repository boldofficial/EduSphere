'use client';

import React, { useState } from 'react';
import { FileText, CheckCircle, XCircle, Clock, Eye, User, Mail, Phone, MapPin, Calendar, GraduationCap, Search, Filter, LayoutGrid, List } from 'lucide-react';
import * as Types from '@/lib/types';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/providers/toast-provider';
import * as DataService from '@/lib/data-service';

interface AdmissionsViewProps {
    admissions: Types.Admission[];
    intakes: any[];
    classes: any[];
    onUpdate: (admission: Types.Admission) => void;
}

export const AdmissionsView: React.FC<AdmissionsViewProps> = ({ admissions, intakes, classes, onUpdate }) => {
    const [selectedAdmission, setSelectedAdmission] = useState<Types.Admission | null>(null);
    const [filterStatus, setFilterStatus] = useState<string>('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [isConverting, setIsConverting] = useState(false);
    const [conversionData, setConversionData] = useState({ student_no: '', class_id: '', password: 'merit_student_2025' });
    const { addToast } = useToast();
    const [viewMode, setViewMode] = useState<'list' | 'kanban'>('kanban');

    const filteredAdmissions = admissions.filter(a => {
        const matchesStatus = filterStatus === 'all' || a.status === filterStatus;
        const matchesSearch = a.child_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            a.parent_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            a.parent_email.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesStatus && matchesSearch;
    });

    const updateStatus = (id: string | number, status: Types.Admission['status']) => {
        const admission = admissions.find(a => a.id === id);
        if (!admission) return;

        const updated = { ...admission, status, reviewed_at: Date.now(), updated_at: Date.now() };
        onUpdate(updated);
        addToast(`Application ${status === 'accepted' ? 'accepted' : status === 'rejected' ? 'rejected' : 'updated'}`, status === 'accepted' ? 'success' : status === 'rejected' ? 'error' : 'info');
        if (status !== 'accepted') setSelectedAdmission(null);
    };

    const handleConvertToStudent = async () => {
        if (!selectedAdmission) return;
        if (!conversionData.student_no || !conversionData.class_id) {
            addToast('Student Number and Class are required', 'error');
            return;
        }

        try {
            await DataService.convertAdmissionToStudent(selectedAdmission.id, conversionData);
            addToast('Successfully converted to student with automated fee assignment!', 'success');

            // Refresh local state
            const updated = { ...selectedAdmission, status: 'accepted' as const, reviewed_at: Date.now() };
            onUpdate(updated);

            setIsConverting(false);
            setSelectedAdmission(null);
        } catch (err: any) {
            addToast(err.message || 'Conversion failed', 'error');
        }
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
                <div className="flex items-center gap-2">
                    <div className="flex bg-gray-100 p-1 rounded-lg">
                        <button onClick={() => setViewMode('kanban')} className={`px-3 py-1.5 text-xs font-medium rounded-md flex items-center gap-1.5 transition-colors ${viewMode === 'kanban' ? 'bg-white shadow text-brand-700' : 'text-gray-500'}`}>
                            <LayoutGrid className="h-3.5 w-3.5" /> Pipeline
                        </button>
                        <button onClick={() => setViewMode('list')} className={`px-3 py-1.5 text-xs font-medium rounded-md flex items-center gap-1.5 transition-colors ${viewMode === 'list' ? 'bg-white shadow text-brand-700' : 'text-gray-500'}`}>
                            <List className="h-3.5 w-3.5" /> List
                        </button>
                    </div>
                </div>
            </div>

            {/* Stats Row */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="relative overflow-hidden bg-gradient-to-br from-brand-500 to-brand-700 p-4 rounded-xl shadow-lg text-white">
                    <div className="absolute -top-4 -right-4 h-16 w-16 bg-white/10 rounded-full" />
                    <p className="text-xs font-medium uppercase opacity-80">Total</p>
                    <p className="text-3xl font-bold mt-1">{stats.total}</p>
                </div>
                <div className="relative overflow-hidden bg-gradient-to-br from-amber-400 to-yellow-600 p-4 rounded-xl shadow-lg text-white">
                    <div className="absolute -top-4 -right-4 h-16 w-16 bg-white/10 rounded-full" />
                    <p className="text-xs font-medium uppercase opacity-80">Pending</p>
                    <p className="text-3xl font-bold mt-1">{stats.pending}</p>
                </div>
                <div className="relative overflow-hidden bg-gradient-to-br from-emerald-400 to-green-600 p-4 rounded-xl shadow-lg text-white">
                    <div className="absolute -top-4 -right-4 h-16 w-16 bg-white/10 rounded-full" />
                    <p className="text-xs font-medium uppercase opacity-80">Accepted</p>
                    <p className="text-3xl font-bold mt-1">{stats.accepted}</p>
                </div>
                <div className="relative overflow-hidden bg-gradient-to-br from-rose-400 to-red-600 p-4 rounded-xl shadow-lg text-white">
                    <div className="absolute -top-4 -right-4 h-16 w-16 bg-white/10 rounded-full" />
                    <p className="text-xs font-medium uppercase opacity-80">Rejected</p>
                    <p className="text-3xl font-bold mt-1">{stats.rejected}</p>
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

            {/* Kanban Board */}
            {viewMode === 'kanban' && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {(['pending', 'reviewed', 'accepted', 'rejected'] as const).map(status => {
                        const columnItems = admissions.filter(a => a.status === status);
                        const columnColors = {
                            pending: { bg: 'bg-yellow-50', border: 'border-yellow-200', header: 'text-yellow-700', dot: 'bg-yellow-400' },
                            reviewed: { bg: 'bg-blue-50', border: 'border-blue-200', header: 'text-blue-700', dot: 'bg-blue-400' },
                            accepted: { bg: 'bg-green-50', border: 'border-green-200', header: 'text-green-700', dot: 'bg-green-400' },
                            rejected: { bg: 'bg-red-50', border: 'border-red-200', header: 'text-red-700', dot: 'bg-red-400' },
                        };
                        const colors = columnColors[status];
                        return (
                            <div key={status} className={`${colors.bg} rounded-xl border ${colors.border} p-3 min-h-[300px]`}>
                                <div className="flex items-center justify-between mb-3">
                                    <div className="flex items-center gap-2">
                                        <span className={`h-2.5 w-2.5 rounded-full ${colors.dot}`} />
                                        <h3 className={`font-bold text-sm uppercase tracking-wide ${colors.header}`}>{status}</h3>
                                    </div>
                                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${colors.bg} ${colors.header}`}>{columnItems.length}</span>
                                </div>
                                <div className="space-y-2">
                                    {columnItems.map(a => (
                                        <div
                                            key={a.id}
                                            onClick={() => setSelectedAdmission(a)}
                                            className="bg-white rounded-lg p-3 shadow-sm hover:shadow-md transition-shadow cursor-pointer border border-gray-100"
                                        >
                                            <p className="font-semibold text-gray-900 text-sm truncate">{a.child_name}</p>
                                            <p className="text-xs text-gray-500 mt-0.5">{a.parent_name}</p>
                                            <div className="flex items-center justify-between mt-2">
                                                {getProgramBadge(a.program)}
                                                <span className="text-[10px] text-gray-400">{new Date(a.created_at).toLocaleDateString()}</span>
                                            </div>
                                        </div>
                                    ))}
                                    {columnItems.length === 0 && (
                                        <p className="text-xs text-gray-400 italic text-center py-4">No applications</p>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Applications List */}
            {viewMode === 'list' && filteredAdmissions.length === 0 ? (
                <Card>
                    <div className="text-center py-12">
                        <FileText size={48} className="text-gray-300 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-500">No Applications Found</h3>
                        <p className="text-gray-400 text-sm">Applications submitted through the website will appear here.</p>
                    </div>
                </Card>
            ) : viewMode === 'list' ? (
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
            ) : null}

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

                            {selectedAdmission.status === 'accepted' ? (
                                <div className="flex-1 flex justify-center py-2 text-green-600 font-medium bg-green-50 rounded-xl">
                                    <CheckCircle size={20} className="mr-2" /> Application Accepted & Student Created
                                </div>
                            ) : (
                                <>
                                    {selectedAdmission.status === 'pending' && (
                                        <Button variant="secondary" onClick={() => updateStatus(selectedAdmission.id, 'reviewed')}>
                                            <Eye size={16} className="mr-1" /> Mark Reviewed
                                        </Button>
                                    )}

                                    <Button className="bg-red-500 hover:bg-red-600 text-white" onClick={() => updateStatus(selectedAdmission.id, 'rejected')}>
                                        <XCircle size={16} className="mr-1" /> Reject
                                    </Button>

                                    <Button
                                        className="bg-green-600 hover:bg-green-700 text-white"
                                        onClick={() => setIsConverting(true)}
                                    >
                                        <GraduationCap size={16} className="mr-1" /> Accept & Enroll
                                    </Button>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            )}
            {/* Conversion Modal */}
            {isConverting && selectedAdmission && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
                        <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                            <GraduationCap className="text-brand-600" /> Complete Enrollment
                        </h2>
                        <p className="text-sm text-gray-500 mb-6">
                            Convert <strong>{selectedAdmission.child_name}</strong> to an active student.
                            This will automatically assign bundled fees for the current intake.
                        </p>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Student Number</label>
                                <input
                                    type="text"
                                    placeholder="e.g. STU2025001"
                                    className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-500"
                                    value={conversionData.student_no}
                                    onChange={e => setConversionData({ ...conversionData, student_no: e.target.value })}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Assign Class</label>
                                <select
                                    className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-500"
                                    value={conversionData.class_id}
                                    onChange={e => setConversionData({ ...conversionData, class_id: e.target.value })}
                                >
                                    <option value="">Select a class...</option>
                                    {classes.map(c => (
                                        <option key={c.id} value={c.id}>{c.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="pt-2">
                                <label className="flex items-center gap-2 text-xs text-gray-500">
                                    <CheckCircle size={14} className="text-green-500" />
                                    Fee package will be automatically assigned.
                                </label>
                            </div>
                        </div>

                        <div className="mt-8 flex gap-3">
                            <Button variant="secondary" className="flex-1" onClick={() => setIsConverting(false)}>Cancel</Button>
                            <Button
                                className="flex-1 bg-brand-600 hover:bg-brand-700 text-white font-bold"
                                onClick={handleConvertToStudent}
                            >
                                Enroll Student
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
