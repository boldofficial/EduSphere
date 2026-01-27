import React, { useState } from 'react';
import { Plus, Edit2, Trash2, Award, Percent, DollarSign, CheckCircle, XCircle } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import * as Types from '@/lib/types';
import * as Utils from '@/lib/utils';
import { useScholarships, useCreateScholarship, useUpdateScholarship, useDeleteScholarship } from '@/lib/hooks/use-data';
import { useToast } from '@/components/providers/toast-provider';

export const ScholarshipManager: React.FC = () => {
    const { data: scholarships, isLoading } = useScholarships();
    const createScholarship = useCreateScholarship();
    const updateScholarship = useUpdateScholarship();
    const deleteScholarship = useDeleteScholarship();
    const { addToast } = useToast();

    const [isAdding, setIsAdding] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);

    // Form State
    const [formData, setFormData] = useState<Partial<Types.Scholarship>>({
        name: '',
        description: '',
        benefit_type: 'percentage',
        value: 0,
        is_active: true
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (editingId) {
                await updateScholarship.mutateAsync({ id: editingId, updates: formData });
                addToast('Scholarship updated successfully', 'success');
            } else {
                await createScholarship.mutateAsync(formData as Types.Scholarship);
                addToast('Scholarship created successfully', 'success');
            }
            resetForm();
        } catch (error) {
            addToast('Failed to save scholarship', 'error');
        }
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm('Are you sure you want to delete this scholarship?')) return;
        try {
            await deleteScholarship.mutateAsync(id);
            addToast('Scholarship deleted successfully', 'success');
        } catch (error) {
            addToast('Failed to delete scholarship', 'error');
        }
    };

    const resetForm = () => {
        setFormData({ name: '', description: '', benefit_type: 'percentage', value: 0, is_active: true });
        setIsAdding(false);
        setEditingId(null);
    };

    const startEdit = (s: Types.Scholarship) => {
        setFormData(s);
        setEditingId(s.id);
        setIsAdding(true);
    };

    if (isLoading) return <div className="text-center py-12 text-gray-500">Loading scholarships...</div>;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-xl font-bold text-gray-900">Scholarships & Waivers</h2>
                    <p className="text-sm text-gray-500">Define financial aid programs for students</p>
                </div>
                {!isAdding && (
                    <Button onClick={() => setIsAdding(true)} className="bg-brand-600 hover:bg-brand-700">
                        <Plus size={18} className="mr-2" />
                        Add New Scholarship
                    </Button>
                )}
            </div>

            {isAdding && (
                <Card className="p-6 border-brand-100 bg-brand-50/30">
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-gray-700">Scholarship Name</label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none"
                                    placeholder="e.g. Merit Scholarship"
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-gray-700">Benefit Type</label>
                                <select
                                    value={formData.benefit_type}
                                    onChange={e => setFormData({ ...formData, benefit_type: e.target.value as any })}
                                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none"
                                >
                                    <option value="percentage">Percentage (%)</option>
                                    <option value="fixed">Fixed Amount</option>
                                </select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-gray-700">
                                    Value {formData.benefit_type === 'percentage' ? '(%)' : '(Currency)'}
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                                        {formData.benefit_type === 'percentage' ? <Percent size={16} /> : <DollarSign size={16} />}
                                    </div>
                                    <input
                                        type="number"
                                        value={formData.value}
                                        onChange={e => setFormData({ ...formData, value: parseFloat(e.target.value) })}
                                        className="w-full pl-10 pr-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none"
                                        required
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-gray-700">Status</label>
                                <div className="flex items-center gap-4 py-2">
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="radio"
                                            checked={formData.is_active}
                                            onChange={() => setFormData({ ...formData, is_active: true })}
                                            className="text-brand-600 focus:ring-brand-500"
                                        />
                                        <span className="text-sm text-gray-600">Active</span>
                                    </label>
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="radio"
                                            checked={!formData.is_active}
                                            onChange={() => setFormData({ ...formData, is_active: false })}
                                            className="text-brand-600 focus:ring-brand-500"
                                        />
                                        <span className="text-sm text-gray-600">Inactive</span>
                                    </label>
                                </div>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-gray-700">Description</label>
                            <textarea
                                value={formData.description}
                                onChange={e => setFormData({ ...formData, description: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none h-20"
                                placeholder="Describe the eligibility or terms..."
                            />
                        </div>
                        <div className="flex justify-end gap-3 pt-2">
                            <Button type="button" variant="ghost" onClick={resetForm}>Cancel</Button>
                            <Button type="submit" className="bg-brand-600 hover:bg-brand-700">
                                {editingId ? 'Update Scholarship' : 'Create Scholarship'}
                            </Button>
                        </div>
                    </form>
                </Card>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {scholarships?.map(s => (
                    <Card key={s.id} className={`p-5 transition-all hover:shadow-md ${!s.is_active ? 'opacity-60 bg-gray-50' : ''}`}>
                        <div className="flex justify-between items-start mb-3">
                            <div className="h-10 w-10 bg-brand-50 text-brand-600 rounded-lg flex items-center justify-center">
                                <Award size={20} />
                            </div>
                            <div className="flex gap-2">
                                <button onClick={() => startEdit(s)} className="p-1.5 text-gray-400 hover:text-brand-600 transition-colors">
                                    <Edit2 size={16} />
                                </button>
                                <button onClick={() => handleDelete(s.id)} className="p-1.5 text-gray-400 hover:text-red-600 transition-colors">
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        </div>
                        <h4 className="font-bold text-gray-900 line-clamp-1">{s.name}</h4>
                        <p className="text-xs text-gray-500 mt-1 h-8 line-clamp-2">{s.description || 'No description provided.'}</p>

                        <div className="mt-4 flex items-center justify-between">
                            <div className="flex flex-col">
                                <span className={`text-lg font-black ${s.is_active ? 'text-brand-700' : 'text-gray-500'}`}>
                                    {s.benefit_type === 'percentage' ? `${s.value}%` : Utils.formatCurrency(s.value)}
                                </span>
                                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                                    {s.benefit_type === 'percentage' ? 'Direct Discount' : 'Fixed Rebate'}
                                </span>
                            </div>
                            <Badge className={s.is_active ? 'bg-green-100 text-green-700 hover:bg-green-100' : 'bg-gray-200 text-gray-600 hover:bg-gray-200'}>
                                {s.is_active ? (
                                    <><CheckCircle size={10} className="mr-1" /> Active</>
                                ) : (
                                    <><XCircle size={10} className="mr-1" /> Inactive</>
                                )}
                            </Badge>
                        </div>
                    </Card>
                ))}
                {scholarships?.length === 0 && !isAdding && (
                    <div className="col-span-full py-12 text-center border-2 border-dashed border-gray-200 rounded-xl">
                        <div className="h-16 w-16 bg-gray-50 text-gray-300 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Award size={32} />
                        </div>
                        <h4 className="text-gray-900 font-bold">No scholarships defined</h4>
                        <p className="text-gray-500 text-sm mt-1">Start by creating your first scholarship or fee waiver program.</p>
                        <Button onClick={() => setIsAdding(true)} variant="outline" className="mt-4 border-brand-200 text-brand-700 hover:bg-brand-50">
                            Create Scholarship
                        </Button>
                    </div>
                )}
            </div>
        </div>
    );
};
