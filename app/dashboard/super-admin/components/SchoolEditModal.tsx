'use client';

import React, { useState } from 'react';
import { X } from 'lucide-react';

const ROOT_DOMAIN = process.env.NEXT_PUBLIC_ROOT_DOMAIN || 'myregistra.net';

export function SchoolEditModal({ school, plans, onClose, onSave }: { school: any; plans: any[]; onClose: () => void; onSave: (data: any) => void }) {
    const [formData, setFormData] = useState({
        name: school?.name || '',
        domain: school?.domain || '',
        email: school?.email || '',
        phone: school?.phone || '',
        address: school?.address || '',
        contact_person: school?.contact_person || '',
        plan_id: school?.subscription?.plan_id || '',
        subscription_status: school?.subscription?.status || 'active',
        subscription_end_date: school?.subscription?.end_date ? new Date(school.subscription.end_date).toISOString().split('T')[0] : '',
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(formData);
        onClose();
    };

    const inputClass = "w-full bg-gray-50 border-0 rounded-2xl px-5 py-4 text-sm font-bold focus:ring-2 focus:ring-brand-600 transition-all outline-none";
    const labelClass = "text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1";

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
            <div className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh] overflow-hidden">
                <div className="p-8 border-b border-gray-100 flex justify-between items-center bg-gray-50/50 shrink-0">
                    <div>
                        <h3 className="text-2xl font-black text-gray-900 uppercase tracking-tight">Edit School Details</h3>
                        <p className="text-sm text-gray-500 font-medium">Update core administrative information for {school?.name}.</p>
                    </div>
                    <button onClick={onClose} className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-white hover:shadow-md transition-all text-gray-400 hover:text-gray-900"><X size={20} /></button>
                </div>
                <form onSubmit={handleSubmit} className="p-8 space-y-6 overflow-y-auto">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className={labelClass}>School Name</label>
                            <input required value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} className={inputClass} />
                        </div>
                        <div className="space-y-2">
                            <label className={labelClass}>Subdomain</label>
                            <div className="relative">
                                <input required value={formData.domain} onChange={e => setFormData({ ...formData, domain: e.target.value })} className={`${inputClass} pr-32`} />
                                <div className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-black text-gray-300 uppercase">.{ROOT_DOMAIN}</div>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label className={labelClass}>Official Email</label>
                            <input type="email" required value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} className={inputClass} />
                        </div>
                        <div className="space-y-2">
                            <label className={labelClass}>Phone Number</label>
                            <input required value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} className={inputClass} />
                        </div>
                        <div className="space-y-2 md:col-span-2">
                            <label className={labelClass}>Contact Person</label>
                            <input required value={formData.contact_person} onChange={e => setFormData({ ...formData, contact_person: e.target.value })} className={inputClass} />
                        </div>
                        <div className="space-y-2 md:col-span-2">
                            <label className={labelClass}>Physical Address</label>
                            <textarea required value={formData.address} onChange={e => setFormData({ ...formData, address: e.target.value })} className={`${inputClass} min-h-[100px] resize-none`} />
                        </div>
                        <div className="md:col-span-2 pt-6 border-t border-gray-100">
                            <h4 className="text-xs font-black text-brand-600 uppercase tracking-widest mb-4">Subscription Management</h4>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div className="space-y-2">
                                    <label className={labelClass}>Subscription Plan</label>
                                    <select value={formData.plan_id} onChange={e => setFormData({ ...formData, plan_id: e.target.value })} className={inputClass}>
                                        <option value="">Select Plan</option>
                                        {plans.map((plan: any) => (<option key={plan.id} value={plan.id}>{plan.name} (₦{parseFloat(plan.price).toLocaleString()})</option>))}
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className={labelClass}>Status</label>
                                    <select value={formData.subscription_status} onChange={e => setFormData({ ...formData, subscription_status: e.target.value })} className={inputClass}>
                                        <option value="active">Active</option>
                                        <option value="pending">Pending</option>
                                        <option value="expired">Expired</option>
                                        <option value="cancelled">Cancelled</option>
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className={labelClass}>Expiry Date</label>
                                    <input type="date" value={formData.subscription_end_date} onChange={e => setFormData({ ...formData, subscription_end_date: e.target.value })} className={inputClass} />
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="flex gap-4 pt-6">
                        <button type="button" onClick={onClose} className="flex-1 py-4 text-gray-400 font-black uppercase text-xs tracking-widest hover:bg-gray-50 rounded-2xl transition-all">Cancel</button>
                        <button type="submit" className="flex-[2] py-4 bg-gray-900 text-white font-black uppercase text-xs tracking-widest rounded-2xl shadow-xl shadow-gray-900/20 hover:scale-[1.02] active:scale-[0.98] transition-all">Save Changes</button>
                    </div>
                </form>
            </div>
        </div>
    );
}
