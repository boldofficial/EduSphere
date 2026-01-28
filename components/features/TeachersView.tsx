import React, { useState } from 'react';
import { Plus, Trash2, Phone, MapPin, Edit, User, Key, Shield, Eye, EyeOff } from 'lucide-react';
import * as Types from '@/lib/types';
import * as Utils from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Modal } from '@/components/ui/modal';
import { PhotoUpload } from '@/components/ui/photo-upload';
import { useToast } from '@/components/providers/toast-provider';

interface TeachersViewProps {
    teachers: Types.Teacher[];
    onAdd: (t: Types.Teacher, options?: { onSuccess?: () => void, onError?: (err: any) => void }) => void;
    onUpdate: (params: { id: string, updates: Partial<Types.Teacher> }, options?: { onSuccess?: () => void, onError?: (err: any) => void }) => void;
    onDelete: (id: string) => void;
}

export const TeachersView: React.FC<TeachersViewProps> = ({ teachers, onAdd, onUpdate, onDelete }) => {
    const [showModal, setShowModal] = useState(false);
    const [showLoginModal, setShowLoginModal] = useState(false);
    const [selectedTeacher, setSelectedTeacher] = useState<Types.Teacher | null>(null);
    const [loginPassword, setLoginPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isCreatingLogin, setIsCreatingLogin] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [formData, setFormData] = useState<Partial<Types.Teacher>>({
        name: '', email: '', phone: '', address: '', passport_url: null
    });
    const { addToast } = useToast();

    const handleEdit = (t: Types.Teacher) => {
        setFormData(t);
        setEditingId(t.id);
        setShowModal(true);
    };

    const handleCreate = () => {
        setFormData({ name: '', email: '', phone: '', address: '', passport_url: null });
        setEditingId(null);
        setShowModal(true);
    };

    const handleCreateLoginAccount = (teacher: Types.Teacher) => {
        if (!teacher.email) {
            addToast('Teacher must have an email address to create login account', 'error');
            return;
        }
        setSelectedTeacher(teacher);
        setLoginPassword('');
        setShowLoginModal(true);
    };

    const handleSubmitLoginAccount = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedTeacher || !loginPassword) return;

        setIsCreatingLogin(true);
        try {
            const response = await fetch('/api/proxy/users/account-setup/', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    profileId: selectedTeacher.id,
                    profileType: 'teacher',
                    email: selectedTeacher.email,
                    password: loginPassword,
                    name: selectedTeacher.name
                })
            });

            const data = await response.json();

            if (!response.ok) {
                addToast(data.error || 'Failed to create login account', 'error');
                return;
            }

            addToast(`Login account created! Email: ${selectedTeacher.email}`, 'success');
            setShowLoginModal(false);
            setSelectedTeacher(null);
            setLoginPassword('');
        } catch (error) {
            addToast('An error occurred. Please try again.', 'error');
        } finally {
            setIsCreatingLogin(false);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        const onSuccess = () => {
            addToast(editingId ? 'Teacher updated successfully' : 'Teacher added successfully', 'success');
            setIsSubmitting(false);
            setShowModal(false);
            setFormData({ name: '', email: '', phone: '', address: '', passport_url: null });
            setEditingId(null);
        };

        const onError = (err: any) => {
            addToast(err?.response?.data?.error || err?.message || 'Transaction failed. Please check your data.', 'error');
            setIsSubmitting(false);
        };

        if (editingId) {
            onUpdate(
                { id: editingId, updates: formData },
                { onSuccess, onError }
            );
        } else {
            onAdd(
                formData as Types.Teacher,
                { onSuccess, onError }
            );
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Teachers Directory</h1>
                    <p className="text-gray-500">Manage academic staff</p>
                </div>
                <Button onClick={handleCreate}>
                    <Plus className="h-4 w-4 mr-2" /> Add Teacher
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {teachers.map(t => (
                    <Card key={t.id} className="flex flex-col justify-between">
                        <div className="flex items-start justify-between mb-4">
                            <div className="flex items-center gap-3">
                                <div className="h-14 w-14 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center font-bold text-lg overflow-hidden border-2 border-purple-200">
                                    {t.passport_url ? (
                                        <img src={t.passport_url} alt={t.name} className="h-full w-full object-cover" />
                                    ) : (
                                        <User className="h-7 w-7" />
                                    )}
                                </div>
                                <div>
                                    <h3 className="font-bold text-gray-900">{t.name}</h3>
                                    <span className="text-xs bg-purple-50 text-purple-700 px-2 py-0.5 rounded-full">Teacher</span>
                                </div>
                            </div>
                            <div className="flex gap-1">
                                <button
                                    onClick={() => handleCreateLoginAccount(t)}
                                    className="text-gray-400 hover:text-green-600 transition-colors p-1"
                                    title="Create Login Account"
                                >
                                    <Key className="h-4 w-4" />
                                </button>
                                <button onClick={() => handleEdit(t)} className="text-gray-400 hover:text-brand-600 transition-colors p-1">
                                    <Edit className="h-4 w-4" />
                                </button>
                                <button onClick={() => onDelete(t.id)} className="text-gray-400 hover:text-red-600 transition-colors p-1">
                                    <Trash2 className="h-4 w-4" />
                                </button>
                            </div>
                        </div>
                        <div className="space-y-2 text-sm text-gray-600">
                            <div className="flex items-center gap-2">
                                <Phone className="h-3 w-3" /> {t.phone}
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="h-3 w-3 flex items-center justify-center">@</div> {t.email}
                            </div>
                            <div className="flex items-center gap-2">
                                <MapPin className="h-3 w-3" /> {t.address}
                            </div>
                        </div>
                    </Card>
                ))}
            </div>

            <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editingId ? "Edit Teacher" : "Add New Teacher"}>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="flex justify-center mb-4">
                        <PhotoUpload
                            value={formData.passport_url}
                            onChange={photo => setFormData({ ...formData, passport_url: photo })}
                            label="Passport Photo"
                            size="lg"
                        />
                    </div>
                    <Input
                        label="Full Name"
                        required
                        value={formData.name}
                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                    />
                    <div className="grid grid-cols-2 gap-4">
                        <Input
                            label="Phone Number"
                            required
                            value={formData.phone}
                            onChange={e => setFormData({ ...formData, phone: e.target.value })}
                        />
                        <Input
                            label="Email Address"
                            type="email"
                            value={formData.email}
                            onChange={e => setFormData({ ...formData, email: e.target.value })}
                        />
                    </div>
                    <Input
                        label="Residential Address"
                        value={formData.address}
                        onChange={e => setFormData({ ...formData, address: e.target.value })}
                    />
                    <Button type="submit" className="w-full" disabled={isSubmitting}>
                        {isSubmitting ? 'Processing...' : (editingId ? 'Update Teacher' : 'Save Teacher')}
                    </Button>
                </form>
            </Modal>

            {/* Create Login Account Modal */}
            <Modal isOpen={showLoginModal} onClose={() => setShowLoginModal(false)} title="Create Login Account">
                <form onSubmit={handleSubmitLoginAccount} className="space-y-4">
                    <div className="flex items-center gap-3 p-4 bg-purple-50 rounded-lg">
                        <div className="h-12 w-12 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center">
                            <Shield className="h-6 w-6" />
                        </div>
                        <div>
                            <h3 className="font-semibold text-gray-900">{selectedTeacher?.name}</h3>
                            <p className="text-sm text-gray-600">{selectedTeacher?.email}</p>
                        </div>
                    </div>

                    <div className="p-4 bg-blue-50 rounded-lg text-sm text-blue-800">
                        <p className="font-medium mb-1">📧 Login Email:</p>
                        <p className="font-mono bg-white px-2 py-1 rounded">{selectedTeacher?.email}</p>
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
                        The teacher can use their email and this password to login to the dashboard.
                    </p>
                </form>
            </Modal>
        </div>
    );
};
