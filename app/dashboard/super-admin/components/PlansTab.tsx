'use client';

import React, { useState } from 'react';
import { Plus, Grid } from 'lucide-react';
import apiClient from '@/lib/api-client';

export function PlansTab({ plans, modules = [] }: any) {
    const [isProcessing, setIsProcessing] = useState(false);
    const [modalOpen, setModalOpen] = useState(false);
    const [editingPlan, setEditingPlan] = useState<any>(null);

    // Form State
    const [name, setName] = useState('');
    const [price, setPrice] = useState('');
    const [duration, setDuration] = useState('30');
    const [description, setDescription] = useState('');
    const [features, setFeatures] = useState('');
    const [slug, setSlug] = useState('');
    const [allowedModules, setAllowedModules] = useState<string[]>([]);

    const openModal = (plan?: any) => {
        if (plan) {
            setEditingPlan(plan);
            setName(plan.name);
            setPrice(plan.price);
            setDuration(plan.duration_days);
            setDescription(plan.description);
            setFeatures(Array.isArray(plan.features) ? plan.features.join('\n') : plan.features);
            setSlug(plan.slug);
            setAllowedModules(plan.allowed_modules || []);
        } else {
            setEditingPlan(null);
            setName('');
            setPrice('');
            setDuration('30');
            setDescription('');
            setFeatures('');
            setSlug('');
            setAllowedModules([]);
        }
        setModalOpen(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsProcessing(true);

        const payload = {
            name,
            slug: slug || name.toLowerCase().replace(/ /g, '-'),
            price: parseFloat(price),
            duration_days: parseInt(duration),
            description,
            features: features.split('\n').filter(f => f.trim() !== ''),
            allowed_modules: allowedModules
        };

        try {
            if (editingPlan) {
                await apiClient.put(`/schools/plans/manage/${editingPlan.id}/`, payload);
            } else {
                await apiClient.post('/schools/plans/manage/', payload);
            }
            window.location.reload();
        } catch (error) {
            alert('Failed to save plan');
        } finally {
            setIsProcessing(false);
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm("Delete this plan?")) return;
        try {
            await apiClient.delete(`/schools/plans/manage/${id}/`);
            window.location.reload();
        } catch (e) { alert("Failed to delete"); }
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex justify-between items-center">
                <h2 className="text-3xl font-bold text-gray-900">Subscription Plans</h2>
                <button
                    onClick={() => openModal()}
                    className="px-4 py-2 bg-brand-600 text-white rounded-lg flex items-center gap-2 hover:bg-brand-700"
                >
                    <Plus size={18} /> Create Plan
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {plans.map((plan: any) => (
                    <div key={plan.id} className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm hover:shadow-md transition-all relative group">
                        <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                            <button onClick={() => openModal(plan)} className="p-1 bg-blue-100 text-blue-600 rounded">Edit</button>
                            <button onClick={() => handleDelete(plan.id)} className="p-1 bg-red-100 text-red-600 rounded">Del</button>
                        </div>
                        <div className="flex justify-between items-start mb-4">
                            <h3 className="font-bold text-xl text-gray-900">{plan.name}</h3>
                            <span className="font-mono text-lg font-bold text-brand-600">₦{parseFloat(plan.price).toLocaleString()}</span>
                        </div>
                        <p className="text-gray-500 text-sm mb-4 h-10 line-clamp-2">{plan.description}</p>
                        <div className="pt-4 border-t border-gray-100 flex items-center justify-between">
                            <div>
                                <p className="text-xs font-bold text-gray-400 uppercase mb-2">Modules</p>
                                <div className="flex items-center gap-1.5">
                                    <Grid size={12} className="text-brand-600" />
                                    <span className="text-xs font-black text-gray-900">{plan.allowed_modules?.length || 0} Enabled</span>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="text-xs font-bold text-gray-400 uppercase mb-2">Features</p>
                                <p className="text-xs font-black text-gray-900">{plan.features.length} Listed</p>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Plan Modal */}
            {modalOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 overflow-y-auto py-10">
                    <div className="bg-white p-6 rounded-2xl w-full max-w-lg shadow-2xl relative">
                        <h3 className="text-xl font-bold mb-4">{editingPlan ? 'Edit Plan' : 'Create New Plan'}</h3>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase">Plan Name</label>
                                    <input value={name} onChange={e => setName(e.target.value)} className="w-full border p-2 rounded" required />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase">Slug (Unique)</label>
                                    <input value={slug} onChange={e => setSlug(e.target.value)} className="w-full border p-2 rounded" placeholder="auto-generated" />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase">Price (NGN)</label>
                                    <input type="number" value={price} onChange={e => setPrice(e.target.value)} className="w-full border p-2 rounded" required />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase">Duration (Days)</label>
                                    <input type="number" value={duration} onChange={e => setDuration(e.target.value)} className="w-full border p-2 rounded" required />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase">Description</label>
                                <textarea value={description} onChange={e => setDescription(e.target.value)} className="w-full border p-2 rounded h-20" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-3">Include Modules</label>
                                <div className="grid grid-cols-2 gap-2 bg-gray-50 p-4 rounded-2xl border border-gray-100 max-h-48 overflow-y-auto">
                                    {modules.map((mod: any) => (
                                        <label key={mod.id} className="flex items-center gap-2 p-2 hover:bg-white rounded-lg transition-colors cursor-pointer group">
                                            <input
                                                type="checkbox"
                                                checked={allowedModules.includes(mod.id)}
                                                onChange={() => {
                                                    setAllowedModules(prev =>
                                                        prev.includes(mod.id)
                                                            ? prev.filter(id => id !== mod.id)
                                                            : [...prev, mod.id]
                                                    );
                                                }}
                                                className="w-4 h-4 rounded border-gray-300 text-brand-600 focus:ring-brand-500"
                                            />
                                            <span className="text-xs font-bold text-gray-700 group-hover:text-gray-900">{mod.name}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase">Marketing Features (One per line)</label>
                                <textarea value={features} onChange={e => setFeatures(e.target.value)} className="w-full border p-2 rounded h-24 font-mono text-sm" placeholder={"Unlimited Students\nResult Checking\n..."} />
                            </div>

                            <div className="flex justify-end gap-2 pt-4">
                                <button type="button" onClick={() => setModalOpen(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg font-bold">Cancel</button>
                                <button type="submit" disabled={isProcessing} className="px-4 py-2 bg-brand-600 text-white rounded-lg font-bold hover:bg-brand-700">Save Plan</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
