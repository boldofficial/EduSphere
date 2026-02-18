import React, { useState } from 'react';
import { Plus, Trash2, Key, Shield, Eye, EyeOff, Edit } from 'lucide-react';
import * as Types from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Modal } from '@/components/ui/modal';
import { useToast } from '@/components/providers/toast-provider';

interface StaffViewProps {
    staff: Types.Staff[];
    onAdd: (s: Types.Staff, options?: { onSuccess?: () => void; onError?: (error: Error) => void }) => void;
    onUpdate: (params: { id: string; updates: Partial<Types.Staff> }, options?: { onSuccess?: () => void; onError?: (error: Error) => void }) => void;
    onDelete: (id: string) => void;
}

export const StaffView: React.FC<StaffViewProps> = ({ staff, onAdd, onUpdate, onDelete }) => {
    const [showModal, setShowModal] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [showLoginModal, setShowLoginModal] = useState(false);
    const [selectedStaff, setSelectedStaff] = useState<Types.Staff | null>(null);
    const [loginPassword, setLoginPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isCreatingLogin, setIsCreatingLogin] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [formData, setFormData] = useState({
        name: '', role: '', tasks: '', email: '', phone: '', address: '', assigned_modules: [] as string[],
        passport_url: null as string | null, basic_salary: 0, bank_name: '',
        account_number: '', account_name: '', pfa_name: '', pfa_number: '', tax_id: ''
    });
    const { addToast } = useToast();

    const availableModules = [
        { id: 'students', label: 'Student Records' },
        { id: 'teachers', label: 'Teacher Records' },
        { id: 'classes', label: 'Class Management' },
        { id: 'grading', label: 'Grading & Reports' },
        { id: 'attendance', label: 'Attendance Management' },
        { id: 'bursary', label: 'Bursary / Fees' },
        { id: 'announcements', label: 'Announcements' },
        { id: 'calendar', label: 'School Calendar' },
        { id: 'id_cards', label: 'ID Cards' },
        { id: 'broadsheet', label: 'Broadsheet' },
        { id: 'data', label: 'System Data' },
        { id: 'newsletter', label: 'Newsletter' },
        { id: 'inventory', label: 'Inventory (Coming Soon)' },
    ];

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setFormData(prev => ({ ...prev, passport_url: reader.result as string }));
            };
            reader.readAsDataURL(file);
        }
    };

    const toggleModule = (moduleId: string) => {
        setFormData(prev => ({
            ...prev,
            assigned_modules: prev.assigned_modules.includes(moduleId)
                ? prev.assigned_modules.filter(m => m !== moduleId)
                : [...prev.assigned_modules, moduleId]
        }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);

        const resetForm = () => {
            setShowModal(false);
            setEditingId(null);
            setFormData({
                name: '', role: '', tasks: '', email: '', phone: '', address: '',
                assigned_modules: [], passport_url: null, basic_salary: 0,
                bank_name: '', account_number: '', account_name: '',
                pfa_name: '', pfa_number: '', tax_id: ''
            });
            setIsSaving(false);
        };

        if (editingId) {
            onUpdate(
                { id: editingId, updates: { ...formData, updated_at: Date.now() } },
                {
                    onSuccess: () => {
                        addToast('Staff member updated successfully', 'success');
                        resetForm();
                    },
                    onError: (error) => {
                        addToast(error.message || 'Failed to update staff member', 'error');
                        setIsSaving(false);
                    }
                }
            );
        } else {
            // Let database generate ID and handle timestamps
            const staffData = {
                ...formData,
                id: '', // Empty ID will be removed by data-service, letting DB generate it
            } as Types.Staff;

            onAdd(staffData, {
                onSuccess: () => {
                    addToast('Staff member added successfully', 'success');
                    resetForm();
                },
                onError: (error) => {
                    addToast(error.message || 'Failed to add staff member', 'error');
                    setIsSaving(false);
                }
            });
        }
    };

    const handleEdit = (staffMember: Types.Staff) => {
        setFormData({
            name: staffMember.name,
            role: staffMember.role,
            tasks: staffMember.tasks,
            email: staffMember.email,
            phone: staffMember.phone,
            address: staffMember.address,
            assigned_modules: staffMember.assigned_modules || [],
            passport_url: staffMember.passport_url || null,
            basic_salary: Number(staffMember.basic_salary) || 0,
            bank_name: staffMember.bank_name || '',
            account_number: staffMember.account_number || '',
            account_name: staffMember.account_name || '',
            pfa_name: staffMember.pfa_name || '',
            pfa_number: staffMember.pfa_number || '',
            tax_id: staffMember.tax_id || ''
        });
        setEditingId(staffMember.id);
        setShowModal(true);
    };

    const handleCreate = () => {
        setFormData({
            name: '', role: '', tasks: '', email: '', phone: '', address: '',
            assigned_modules: [], passport_url: null, basic_salary: 0,
            bank_name: '', account_number: '', account_name: '',
            pfa_name: '', pfa_number: '', tax_id: ''
        });
        setEditingId(null);
        setShowModal(true);
    };

    const handleCreateLoginAccount = (staffMember: Types.Staff) => {
        if (!staffMember.email) {
            addToast('Staff member must have an email address to create login account', 'error');
            return;
        }
        setSelectedStaff(staffMember);
        setLoginPassword('');
        setShowLoginModal(true);
    };

    const handleSubmitLoginAccount = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedStaff || !loginPassword) return;

        setIsCreatingLogin(true);
        try {
            const response = await fetch('/api/proxy/users/account-setup/', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    profileId: selectedStaff.id,
                    profileType: 'staff',
                    email: selectedStaff.email,
                    password: loginPassword,
                    name: selectedStaff.name
                })
            });

            const data = await response.json();

            if (!response.ok) {
                addToast(data.error || 'Failed to create login account', 'error');
                return;
            }

            addToast(`Login account created! Email: ${selectedStaff.email}`, 'success');
            setShowLoginModal(false);
            setSelectedStaff(null);
            setLoginPassword('');
        } catch (error) {
            addToast('An error occurred. Please try again.', 'error');
        } finally {
            setIsCreatingLogin(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center"><div><h1 className="text-2xl font-bold text-gray-900">Non-Academic Staff</h1><p className="text-gray-500">Manage support staff and roles</p></div><Button onClick={handleCreate}><Plus className="h-4 w-4 mr-2" /> Add Staff</Button></div>
            <div className="overflow-x-auto bg-white rounded-lg border shadow-sm">
                <table className="w-full text-sm text-left">
                    <thead className="bg-gray-50 text-gray-700 font-medium"><tr><th className="px-4 py-3">Staff</th><th className="px-4 py-3">Role</th><th className="px-4 py-3">Access Modules</th><th className="px-4 py-3">Contact</th><th className="px-4 py-3 text-right">Actions</th></tr></thead>
                    <tbody className="divide-y divide-gray-200">
                        {staff.map(s => (
                            <tr key={s.id} className="hover:bg-gray-50">
                                <td className="px-4 py-3 font-medium text-gray-900 flex items-center gap-3">
                                    {s.passport_url ? (
                                        <img src={s.passport_url} alt={s.name} className="w-8 h-8 rounded-full object-cover border" />
                                    ) : (
                                        <div className="w-8 h-8 rounded-full bg-brand-100 flex items-center justify-center text-brand-700 font-bold text-xs">{s.name.charAt(0)}</div>
                                    )}
                                    {s.name}
                                </td>
                                <td className="px-4 py-3"><span className="px-2 py-1 bg-gray-100 rounded text-xs font-medium">{s.role}</span></td>
                                <td className="px-4 py-3">
                                    <div className="flex flex-wrap gap-1">
                                        {s.assigned_modules?.map(m => (
                                            <span key={m} className="px-1.5 py-0.5 bg-blue-50 text-blue-700 rounded text-[10px] font-bold uppercase">{m}</span>
                                        ))}
                                    </div>
                                </td>
                                <td className="px-4 py-3 text-xs">{s.phone}</td>
                                <td className="px-4 py-3 text-right flex items-center justify-end gap-2">
                                    <button
                                        onClick={() => handleEdit(s)}
                                        className="text-gray-400 hover:text-brand-600"
                                        title="Edit Staff"
                                    >
                                        <Edit className="h-4 w-4" />
                                    </button>
                                    <button
                                        onClick={() => handleCreateLoginAccount(s)}
                                        className="text-gray-400 hover:text-green-600"
                                        title="Create Login Account"
                                    >
                                        <Key className="h-4 w-4" />
                                    </button>
                                    <button onClick={() => onDelete(s.id)} className="text-gray-400 hover:text-red-600" title="Delete Staff">
                                        <Trash2 className="h-4 w-4" />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            <Modal isOpen={showModal} onClose={() => { setShowModal(false); setEditingId(null); }} title={editingId ? "Edit Staff Member" : "Add New Staff"}>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="flex justify-center mb-4">
                        <div className="relative group cursor-pointer">
                            <div className="w-24 h-24 rounded-full bg-gray-100 border-2 border-dashed border-gray-300 flex items-center justify-center overflow-hidden">
                                {formData.passport_url ? (
                                    <img src={formData.passport_url} alt="Preview" className="w-full h-full object-cover" />
                                ) : (
                                    <span className="text-gray-400 text-xs text-center px-2">Click to upload photo</span>
                                )}
                            </div>
                            <input
                                type="file"
                                accept="image/*"
                                onChange={handleImageUpload}
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4"><Input label="Full Name" required value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} /><Input label="Job Title/Role" required value={formData.role} onChange={e => setFormData({ ...formData, role: e.target.value })} /></div>

                    <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                        <label className="block text-sm font-bold text-gray-700 mb-2">Assign System Access</label>
                        <div className="grid grid-cols-2 gap-2">
                            {availableModules.map(module => (
                                <label key={module.id} className="flex items-center gap-2 p-2 bg-white rounded-lg border border-gray-200 cursor-pointer hover:border-brand-300">
                                    <input
                                        type="checkbox"
                                        checked={formData.assigned_modules.includes(module.id)}
                                        onChange={() => toggleModule(module.id)}
                                        className="rounded border-gray-300 text-brand-600 focus:ring-brand-500"
                                    />
                                    <span className="text-xs font-medium text-gray-700">{module.label}</span>
                                </label>
                            ))}
                        </div>
                    </div>

                    <Input label="Assigned Tasks" value={formData.tasks} onChange={e => setFormData({ ...formData, tasks: e.target.value })} />
                    <div className="grid grid-cols-2 gap-4"><Input label="Phone" required value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} /><Input label="Email" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} /></div>
                    <Input label="Address" value={formData.address} onChange={e => setFormData({ ...formData, address: e.target.value })} />

                    {/* Financial Information */}
                    <div className="border-t pt-4 mt-4">
                        <h4 className="text-sm font-bold text-brand-700 mb-3 uppercase tracking-wider">Payroll & Banking Information</h4>
                        <div className="grid grid-cols-2 gap-4">
                            <Input
                                label="Basic Salary (Monthly)"
                                type="number"
                                required
                                value={formData.basic_salary}
                                onChange={e => setFormData({ ...formData, basic_salary: parseFloat(e.target.value) || 0 })}
                            />
                            <Input
                                label="Bank Name"
                                value={formData.bank_name}
                                onChange={e => setFormData({ ...formData, bank_name: e.target.value })}
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4 mt-4">
                            <Input
                                label="Account Number"
                                value={formData.account_number}
                                onChange={e => setFormData({ ...formData, account_number: e.target.value })}
                            />
                            <Input
                                label="Account Name"
                                value={formData.account_name}
                                onChange={e => setFormData({ ...formData, account_name: e.target.value })}
                            />
                        </div>
                        <div className="grid grid-cols-3 gap-2 mt-4">
                            <Input
                                label="PFA Name"
                                value={formData.pfa_name}
                                onChange={e => setFormData({ ...formData, pfa_name: e.target.value })}
                                className="text-xs"
                            />
                            <Input
                                label="PFA Number"
                                value={formData.pfa_number}
                                onChange={e => setFormData({ ...formData, pfa_number: e.target.value })}
                                className="text-xs"
                            />
                            <Input
                                label="Tax ID"
                                value={formData.tax_id}
                                onChange={e => setFormData({ ...formData, tax_id: e.target.value })}
                                className="text-xs"
                            />
                        </div>
                    </div>
                    <Button type="submit" className="w-full" disabled={isSaving}>
                        {isSaving ? 'Saving...' : (editingId ? 'Update Staff Member' : 'Save Staff Member')}
                    </Button>
                </form>
            </Modal>

            {/* Create Login Account Modal */}
            <Modal isOpen={showLoginModal} onClose={() => setShowLoginModal(false)} title="Create Login Account">
                <form onSubmit={handleSubmitLoginAccount} className="space-y-4">
                    <div className="flex items-center gap-3 p-4 bg-amber-50 rounded-lg">
                        <div className="h-12 w-12 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center">
                            <Shield className="h-6 w-6" />
                        </div>
                        <div>
                            <h3 className="font-semibold text-gray-900">{selectedStaff?.name}</h3>
                            <p className="text-sm text-gray-600">{selectedStaff?.role} • {selectedStaff?.email}</p>
                        </div>
                    </div>

                    <div className="p-4 bg-blue-50 rounded-lg text-sm text-blue-800">
                        <p className="font-medium mb-1">📧 Login Email:</p>
                        <p className="font-mono bg-white px-2 py-1 rounded">{selectedStaff?.email}</p>
                    </div>

                    <div className="relative">
                        <Input
                            label="Set Password"
                            type={showPassword ? "text" : "password"}
                            required
                            value={loginPassword}
                            onChange={e => setLoginPassword(e.target.value)}
                            placeholder="Minimum 8 characters"
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-9 text-gray-400 hover:text-gray-600"
                        >
                            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                    </div>

                    {loginPassword && loginPassword.length < 8 && (
                        <p className="text-sm text-red-500">Password must be at least 8 characters</p>
                    )}

                    <Button
                        type="submit"
                        className="w-full bg-green-600 hover:bg-green-700"
                        disabled={isCreatingLogin || loginPassword.length < 8}
                    >
                        {isCreatingLogin ? 'Creating...' : 'Create Login Account'}
                    </Button>

                    <p className="text-xs text-gray-500 text-center">
                        The staff member can use their email and this password to login.
                    </p>
                </form>
            </Modal>
        </div>
    );
};
