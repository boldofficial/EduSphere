/**
 * Dashboard Super Admin Tabs
 *
 * Health, Schools Management, Platform Settings tabs, and School Modal.
 * These are only visible to super admin users.
 */
'use client';

import React from 'react';
import {
    ShieldCheck, Database, AlertCircle, CheckCircle,
    Save, Eye, Trash2, Settings, Activity,
    Image, CreditCard, Lock
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import * as Types from '@/lib/types';

// ─── System Health Tab ─────────────────────────────────────────────────

interface HealthTabProps {
    systemHealth: { name: string; status: string; ok: boolean }[];
    students: Types.Student[];
    teachers: Types.Teacher[];
    staff: Types.Staff[];
    classes: Types.Class[];
}

export const DashboardHealthTab: React.FC<HealthTabProps> = ({
    systemHealth, students, teachers, staff, classes
}) => (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
            <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                <Database size={18} className="text-brand-500" />
                System Status
            </h3>
            <div className="space-y-4">
                {systemHealth.map((item, i) => (
                    <div key={i} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                        <span className="font-medium text-gray-700">{item.name}</span>
                        <span className={`text-sm font-bold flex items-center gap-2 ${item.ok ? 'text-green-600' : 'text-yellow-600'}`}>
                            {item.ok ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
                            {item.status}
                        </span>
                    </div>
                ))}
            </div>
        </div>

        <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
            <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                <Activity size={18} className="text-brand-500" />
                Data Summary
            </h3>
            <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-blue-50 rounded-xl">
                    <span className="font-medium text-gray-700">Students</span>
                    <span className="text-lg font-bold text-blue-600">{students.length}</span>
                </div>
                <div className="flex items-center justify-between p-4 bg-green-50 rounded-xl">
                    <span className="font-medium text-gray-700">Teachers</span>
                    <span className="text-lg font-bold text-green-600">{teachers.length}</span>
                </div>
                <div className="flex items-center justify-between p-4 bg-amber-50 rounded-xl">
                    <span className="font-medium text-gray-700">Non-Academic Staff</span>
                    <span className="text-lg font-bold text-amber-600">{staff.length}</span>
                </div>
                <div className="flex items-center justify-between p-4 bg-purple-50 rounded-xl">
                    <span className="font-medium text-gray-700">Classes</span>
                    <span className="text-lg font-bold text-purple-600">{classes.length}</span>
                </div>
            </div>
        </div>
    </div>
);

// ─── Schools Management Tab ────────────────────────────────────────────

interface SchoolsTabProps {
    schools: any[];
    onSelectSchool: (school: any) => void;
}

export const DashboardSchoolsTab: React.FC<SchoolsTabProps> = ({ schools, onSelectSchool }) => (
    <div className="space-y-6">
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold flex items-center gap-2">
                    <ShieldCheck className="text-brand-600" /> Registered Schools
                </h3>
                <div className="text-sm font-medium text-gray-500">
                    Total: {schools.length} Schools
                </div>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="border-b border-gray-100 text-xs font-black uppercase text-gray-400">
                            <th className="pb-4 px-4">School</th>
                            <th className="pb-4 px-4">Subdomain</th>
                            <th className="pb-4 px-4">Admin Email</th>
                            <th className="pb-4 px-4">Status</th>
                            <th className="pb-4 px-4 text-right">Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {schools.map(school => (
                            <tr key={school.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors group">
                                <td className="py-4 px-4">
                                    <div className="font-bold text-gray-900">{school.name}</div>
                                    <div className="text-xs text-gray-500">{new Date(school.created_at).toLocaleDateString()}</div>
                                </td>
                                <td className="py-4 px-4 font-mono text-xs text-brand-600">.{school.domain}</td>
                                <td className="py-4 px-4 text-sm text-gray-600">{school.email || 'N/A'}</td>
                                <td className="py-4 px-4">
                                    <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase ${school.subscription_status === 'active' ? 'bg-green-100 text-green-700' :
                                        school.subscription_status === 'pending' ? 'bg-amber-100 text-amber-700' :
                                            'bg-gray-100 text-gray-700'
                                        }`}>
                                        {school.subscription_status}
                                    </span>
                                </td>
                                <td className="py-4 px-4 text-right">
                                    <button
                                        onClick={() => onSelectSchool(school)}
                                        className="p-2 hover:bg-brand-50 text-brand-600 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                                    >
                                        <Eye size={18} />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    </div>
);

// ─── Platform Settings Tab ─────────────────────────────────────────────

interface PlatformSettingsTabProps {
    editedPlatformSettings: any;
    setEditedPlatformSettings: (v: any) => void;
    handleSavePlatformSettings: () => void;
}

export const DashboardPlatformSettingsTab: React.FC<PlatformSettingsTabProps> = ({
    editedPlatformSettings, setEditedPlatformSettings, handleSavePlatformSettings
}) => (
    <div className="max-w-2xl mx-auto space-y-8">
        <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
            <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                <Settings className="text-brand-600" /> Platform Configuration
            </h3>

            <div className="space-y-6">
                <div className="p-6 bg-brand-900 text-white rounded-2xl space-y-4">
                    <h4 className="font-bold border-b border-white/10 pb-2">Global Bank Details</h4>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-[10px] uppercase opacity-60 font-black mb-1">Bank Name</label>
                            <input
                                value={editedPlatformSettings?.bank_name || ''}
                                onChange={(e) => setEditedPlatformSettings({ ...editedPlatformSettings, bank_name: e.target.value })}
                                className="w-full bg-white/10 border-0 rounded-lg px-3 py-2 text-sm focus:ring-1 focus:ring-white"
                            />
                        </div>
                        <div>
                            <label className="block text-[10px] uppercase opacity-60 font-black mb-1">Account Number</label>
                            <input
                                value={editedPlatformSettings?.account_number || ''}
                                onChange={(e) => setEditedPlatformSettings({ ...editedPlatformSettings, account_number: e.target.value })}
                                className="w-full bg-white/10 border-0 rounded-lg px-3 py-2 text-sm focus:ring-1 focus:ring-white"
                            />
                        </div>
                        <div className="col-span-2">
                            <label className="block text-[10px] uppercase opacity-60 font-black mb-1">Account Name</label>
                            <input
                                value={editedPlatformSettings?.account_name || ''}
                                onChange={(e) => setEditedPlatformSettings({ ...editedPlatformSettings, account_name: e.target.value })}
                                className="w-full bg-white/10 border-0 rounded-lg px-3 py-2 text-sm focus:ring-1 focus:ring-white"
                            />
                        </div>
                    </div>
                </div>

                <div className="p-6 bg-gray-900 text-white rounded-2xl space-y-4">
                    <h4 className="font-bold border-b border-white/10 pb-2 flex items-center gap-2">
                        <CreditCard size={16} /> Paystack Configuration
                    </h4>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-[10px] uppercase opacity-60 font-black mb-1">Public Key (pk_test_...)</label>
                            <input
                                value={editedPlatformSettings?.paystack_public_key || ''}
                                onChange={(e) => setEditedPlatformSettings({ ...editedPlatformSettings, paystack_public_key: e.target.value })}
                                className="w-full bg-white/10 border-0 rounded-lg px-3 py-2 text-sm focus:ring-1 focus:ring-white font-mono"
                                placeholder="pk_test_..."
                            />
                        </div>
                        <div>
                            <label className="block text-[10px] uppercase opacity-60 font-black mb-1">Secret Key (sk_test_...)</label>
                            <input
                                type="password"
                                value={editedPlatformSettings?.paystack_secret_key || ''}
                                onChange={(e) => setEditedPlatformSettings({ ...editedPlatformSettings, paystack_secret_key: e.target.value })}
                                className="w-full bg-white/10 border-0 rounded-lg px-3 py-2 text-sm focus:ring-1 focus:ring-white font-mono"
                                placeholder="sk_test_..."
                            />
                        </div>
                    </div>
                </div>

                <div className="pt-4 flex justify-end">
                    <Button onClick={handleSavePlatformSettings} className="gap-2">
                        <Save size={18} /> Save Global Settings
                    </Button>
                </div>
            </div>
        </div>
    </div>
);

// ─── School Management Modal ───────────────────────────────────────────

interface SchoolModalProps {
    isOpen: boolean;
    onClose: () => void;
    selectedSchool: any;
    handleApproveSchool: (schoolId: number) => void;
    handleUpdateSchool: (schoolId: number, data: any) => void;
}

export const SchoolManagementModal: React.FC<SchoolModalProps> = ({
    isOpen, onClose, selectedSchool, handleApproveSchool, handleUpdateSchool
}) => {
    if (!isOpen || !selectedSchool) return null;

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto overflow-x-hidden animate-in zoom-in-95 duration-200">
                <div className="p-8">
                    <div className="flex justify-between items-start mb-6">
                        <div>
                            <h2 className="text-2xl font-black text-gray-900">{selectedSchool.name}</h2>
                            <p className="text-sm font-mono text-brand-600">.{selectedSchool.domain} (Subdomain)</p>
                        </div>
                        <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-xl text-gray-400">
                            <Trash2 size={24} className="rotate-45" />
                        </button>
                    </div>

                    <div className="grid grid-cols-2 gap-8 mb-8">
                        <div className="space-y-4">
                            <h4 className="text-[10px] font-black uppercase text-gray-400 tracking-wider">Contact Details</h4>
                            <div>
                                <p className="text-xs text-gray-500">Official Email</p>
                                <p className="font-bold">{selectedSchool.email || 'N/A'}</p>
                            </div>
                            <div>
                                <p className="text-xs text-gray-500">Contact Person</p>
                                <p className="font-bold">{selectedSchool.contact_person || 'N/A'}</p>
                            </div>
                            <div>
                                <p className="text-xs text-gray-500">Phone</p>
                                <p className="font-bold">{selectedSchool.phone || 'N/A'}</p>
                            </div>
                        </div>
                        <div className="space-y-4">
                            <h4 className="text-[10px] font-black uppercase text-gray-400 tracking-wider">Subscription Info</h4>
                            <div>
                                <p className="text-xs text-gray-500">Plan</p>
                                <p className="font-bold">{selectedSchool.subscription?.plan_name || 'Free'}</p>
                            </div>
                            <div>
                                <p className="text-xs text-gray-500">Payment Method</p>
                                <p className="font-bold uppercase tracking-tight">{selectedSchool.subscription?.payment_method || 'N/A'}</p>
                            </div>
                            <div>
                                <p className="text-xs text-gray-500">Current Status</p>
                                <p className="font-bold uppercase text-amber-600">{selectedSchool.subscription_status}</p>
                            </div>
                        </div>
                    </div>

                    {selectedSchool.subscription?.payment_proof && (
                        <div className="mb-8 p-6 bg-gray-50 rounded-2xl">
                            <h4 className="text-[10px] font-black uppercase text-gray-400 tracking-wider mb-4 flex items-center gap-2">
                                <Image size={14} /> Proof of Payment
                            </h4>
                            <img
                                src={selectedSchool.subscription.payment_proof}
                                alt="Payment Proof"
                                className="w-full rounded-xl border border-gray-200 cursor-pointer hover:opacity-90 transition-opacity"
                                onClick={() => window.open(selectedSchool.subscription.payment_proof)}
                            />
                        </div>
                    )}

                    <div className="bg-gray-50 p-6 rounded-2xl mb-8 space-y-4">
                        <h4 className="text-[10px] font-black uppercase text-gray-400 tracking-wider">Management Actions</h4>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 mb-1">Edit Domain / URL</label>
                                <div className="flex gap-2">
                                    <Input
                                        defaultValue={selectedSchool.domain}
                                        id="school_domain_input"
                                        className="font-mono text-sm"
                                    />
                                    <Button
                                        variant="outline"
                                        onClick={() => {
                                            const input = document.getElementById('school_domain_input') as HTMLInputElement;
                                            handleUpdateSchool(selectedSchool.id, { domain: input.value });
                                        }}
                                    >
                                        Update
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="flex gap-3">
                        {selectedSchool.subscription_status === 'pending' && (
                            <Button
                                className="flex-1 h-12 gap-2 text-lg"
                                onClick={() => handleApproveSchool(selectedSchool.id)}
                            >
                                <CheckCircle size={20} /> Approve & Activate
                            </Button>
                        )}
                        <Button
                            variant="outline"
                            className="flex-1 h-12 text-gray-500"
                            onClick={onClose}
                        >
                            Close
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
};
