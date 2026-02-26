'use client';

import React, { useState, useEffect } from 'react';
import {
    X, Mail, Users, Layout,
    CheckCircle, ArrowRight, ChevronLeft,
    Filter, Send, Info, Plus
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/providers/toast-provider';
import apiClient from '@/lib/api-client';

interface CreateCampaignModalProps {
    isOpen: boolean;
    onClose: () => void;
    onCreated: () => void;
}

export const CreateCampaignModal: React.FC<CreateCampaignModalProps> = ({ isOpen, onClose, onCreated }) => {
    const [step, setStep] = useState(1);
    const [templates, setTemplates] = useState<any[]>([]);
    const [formData, setFormData] = useState({
        title: '',
        template_id: '',
        custom_subject: '',
        custom_body: '',
        audience_filter: {
            role: '',
            school_id: '',
        }
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { addToast } = useToast();

    useEffect(() => {
        if (isOpen) {
            fetchTemplates();
        }
    }, [isOpen]);

    const fetchTemplates = async () => {
        try {
            const res = await apiClient.get('emails/templates/');
            setTemplates(res.data);
        } catch (error) {
            addToast('Failed to fetch templates', 'error');
        }
    };

    const handleCreate = async () => {
        if (!formData.title) return addToast('Campaign title is required', 'error');

        setIsSubmitting(true);
        try {
            await apiClient.post('emails/campaigns/', {
                title: formData.title,
                template: formData.template_id || null,
                custom_subject: formData.custom_subject || null,
                custom_body: formData.custom_body || null,
                audience_filter: formData.audience_filter,
                status: 'draft'
            });
            addToast('Campaign created successfully', 'success');
            onCreated();
            onClose();
            setStep(1);
            setFormData({
                title: '', template_id: '', custom_subject: '', custom_body: '', audience_filter: { role: '', school_id: '' }
            });
        } catch (error) {
            addToast('Failed to create campaign', 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-brand-950/40 backdrop-blur-sm" onClick={onClose} />

            <div className="relative w-full max-w-2xl bg-white rounded-[40px] shadow-2xl shadow-brand-950/20 overflow-hidden animate-in zoom-in-95 duration-300">
                {/* Header */}
                <div className="p-8 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-brand-600 text-white flex items-center justify-center shadow-lg shadow-brand-600/20">
                            <Mail size={24} />
                        </div>
                        <div>
                            <h3 className="text-xl font-black text-gray-900 tracking-tight">Create Campaign</h3>
                            <div className="flex items-center gap-2 mt-1">
                                {[1, 2, 3].map(i => (
                                    <div key={i} className={`h-1 rounded-full transition-all duration-300 ${step >= i ? 'w-6 bg-brand-600' : 'w-2 bg-gray-200'}`} />
                                ))}
                                <span className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-2">Step {step} of 3</span>
                            </div>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-400">
                        <X size={20} />
                    </button>
                </div>

                <div className="p-10">
                    {step === 1 && (
                        <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
                            <div className="space-y-4">
                                <label className="text-xs font-black uppercase tracking-widest text-gray-500">Campaign Identity</label>
                                <Input
                                    placeholder="e.g. Q1 Newsletter, Mid-Term Updates..."
                                    className="h-14 rounded-2xl border-gray-100 bg-gray-50 text-base font-bold px-6 focus:ring-4 focus:ring-brand-500/10 transition-all"
                                    value={formData.title}
                                    onChange={e => setFormData({ ...formData, title: e.target.value })}
                                />
                            </div>

                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <label className="text-xs font-black uppercase tracking-widest text-gray-500">Select Template</label>
                                    <button className="text-[10px] font-black uppercase tracking-widest text-brand-600 hover:underline">Manage Templates</button>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    {templates.map(t => (
                                        <button
                                            key={t.id}
                                            onClick={() => setFormData({ ...formData, template_id: t.id, custom_body: '' })}
                                            className={`p-6 text-left rounded-3xl border-2 transition-all group ${formData.template_id === t.id ? 'border-brand-600 bg-brand-50/30 ring-4 ring-brand-500/5' : 'border-gray-50 bg-gray-50 hover:border-brand-200'}`}
                                        >
                                            <div className={`w-10 h-10 rounded-2xl mb-4 flex items-center justify-center transition-all ${formData.template_id === t.id ? 'bg-brand-600 text-white scale-110 shadow-lg' : 'bg-white text-gray-400 group-hover:text-brand-600'}`}>
                                                <Layout size={20} />
                                            </div>
                                            <h4 className="font-black text-sm text-gray-900 line-clamp-1">{t.name}</h4>
                                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tight mt-1 truncate">{t.subject}</p>
                                        </button>
                                    ))}
                                    <button
                                        onClick={() => setFormData({ ...formData, template_id: '', custom_subject: '', custom_body: '' })}
                                        className={`p-6 text-left rounded-3xl border-2 transition-all group ${!formData.template_id ? 'border-brand-600 bg-brand-50/30 ring-4 ring-brand-500/5' : 'border-gray-50 bg-gray-50 hover:border-brand-200'}`}
                                    >
                                        <div className={`w-10 h-10 rounded-2xl mb-4 flex items-center justify-center transition-all ${!formData.template_id ? 'bg-brand-600 text-white scale-110 shadow-lg' : 'bg-white text-gray-400 group-hover:text-brand-600'}`}>
                                            <Plus size={20} />
                                        </div>
                                        <h4 className="font-black text-sm text-gray-900">Custom Email</h4>
                                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tight mt-1">Compose from scratch</p>
                                    </button>
                                </div>
                            </div>

                            {!formData.template_id && (
                                <div className="space-y-6 animate-in fade-in slide-in-from-top-2 duration-300">
                                    <div className="space-y-4">
                                        <label className="text-xs font-black uppercase tracking-widest text-gray-500">Manual Subject</label>
                                        <Input
                                            placeholder="Subject line..."
                                            className="h-12 rounded-xl border-gray-100 bg-gray-50 font-bold"
                                            value={formData.custom_subject}
                                            onChange={e => setFormData({ ...formData, custom_subject: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-4">
                                        <label className="text-xs font-black uppercase tracking-widest text-gray-500">Email Content (HTML supported)</label>
                                        <textarea
                                            placeholder="Write your email here..."
                                            className="w-full h-40 p-6 bg-gray-50 border border-gray-100 rounded-3xl text-sm font-medium focus:ring-4 focus:ring-brand-500/10 focus:border-brand-500 transition-all resize-none shadow-inner"
                                            value={formData.custom_body}
                                            onChange={e => setFormData({ ...formData, custom_body: e.target.value })}
                                        />
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {step === 2 && (
                        <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
                            <div className="p-6 bg-brand-50 border border-brand-100 rounded-[32px] flex items-start gap-4">
                                <Users className="text-brand-600 shrink-0 mt-1" size={24} />
                                <div>
                                    <h4 className="font-black text-gray-900 text-sm">Target Audience</h4>
                                    <p className="text-xs font-medium text-brand-900 opacity-70 leading-relaxed mt-1">
                                        Filter exactly who should receive this campaign. Leaving filters empty will target all active users on the platform.
                                    </p>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-8">
                                <div className="space-y-4">
                                    <label className="text-xs font-black uppercase tracking-widest text-gray-500">Filter by Role</label>
                                    <div className="grid gap-2">
                                        {['SCHOOL_ADMIN', 'TEACHER', 'PARENT', 'SUPER_ADMIN'].map(role => (
                                            <button
                                                key={role}
                                                onClick={() => setFormData({ ...formData, audience_filter: { ...formData.audience_filter, role: formData.audience_filter.role === role ? '' : role } })}
                                                className={`flex items-center justify-between p-4 rounded-2xl border-2 transition-all ${formData.audience_filter.role === role ? 'border-brand-600 bg-brand-50 text-brand-600 shadow-sm' : 'border-gray-50 bg-gray-50 text-gray-500 hover:border-gray-200'}`}
                                            >
                                                <span className="text-[10px] font-black uppercase tracking-widest">{role.replace('_', ' ')}</span>
                                                {formData.audience_filter.role === role && <CheckCircle size={14} />}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <div className="space-y-4">
                                    <label className="text-xs font-black uppercase tracking-widest text-gray-500">School Scope</label>
                                    <select
                                        className="w-full h-12 px-4 rounded-xl border-gray-100 bg-gray-50 text-sm font-bold focus:ring-4 focus:ring-brand-500/10 transition-all outline-none"
                                        value={formData.audience_filter.school_id}
                                        onChange={e => setFormData({ ...formData, audience_filter: { ...formData.audience_filter, school_id: e.target.value } })}
                                    >
                                        <option value="">All Schools</option>
                                        {/* Ideally we'd fetch schools here too if we want granular filtering */}
                                    </select>
                                    <div className="p-5 bg-amber-50 rounded-2xl border border-amber-100 mt-4 flex gap-3">
                                        <Info className="text-amber-600 shrink-0" size={16} />
                                        <p className="text-[10px] font-bold text-amber-900/70 uppercase leading-tight tracking-tight">Selecting "All Schools" will send this to every school in the system.</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {step === 3 && (
                        <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
                            <div className="p-8 bg-gray-50 rounded-[40px] border border-gray-100 space-y-6">
                                <h4 className="text-[10px] font-black uppercase tracking-widest text-gray-400 text-center">Campaign Review</h4>
                                <div className="space-y-6">
                                    <div className="flex justify-between items-center px-4">
                                        <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Title</span>
                                        <span className="text-sm font-black text-gray-900">{formData.title}</span>
                                    </div>
                                    <div className="flex justify-between items-center px-4">
                                        <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Content Source</span>
                                        <span className="text-sm font-black text-gray-900">
                                            {formData.template_id ? templates.find(t => t.id === formData.template_id)?.name : 'Custom Professional Body'}
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center px-4">
                                        <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Audience</span>
                                        <div className="text-right">
                                            <div className="text-sm font-black text-gray-900">{formData.audience_filter.role || 'All Registered Roles'}</div>
                                            <div className="text-[10px] font-bold text-brand-600 uppercase mt-1">{formData.audience_filter.school_id ? 'Specific School' : 'Platform-Wide'}</div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="p-6 bg-blue-50 border border-blue-100 rounded-3xl flex items-start gap-4">
                                <Send className="text-blue-600 shrink-0 mt-1" size={20} />
                                <p className="text-xs font-medium text-blue-900 opacity-80 leading-relaxed">
                                    Your campaign will be created as a <strong>Draft</strong>. You can review it one last time in the list before hitting Send.
                                </p>
                            </div>
                        </div>
                    )}
                </div>

                <div className="p-8 pt-0 flex justify-between gap-4">
                    {step > 1 ? (
                        <Button
                            variant="ghost"
                            onClick={() => setStep(step - 1)}
                            className="rounded-2xl h-14 px-8 gap-2 font-black uppercase text-[11px] tracking-widest text-gray-500 hover:text-gray-900"
                        >
                            <ChevronLeft size={16} /> Back
                        </Button>
                    ) : (
                        <div />
                    )}

                    {step < 3 ? (
                        <Button
                            onClick={() => setStep(step + 1)}
                            className="rounded-2xl h-14 px-10 gap-2 bg-brand-600 hover:bg-brand-500 shadow-xl shadow-brand-500/20 font-black uppercase text-[11px] tracking-widest transition-all"
                            disabled={step === 1 && !formData.title}
                        >
                            Next <ArrowRight size={16} />
                        </Button>
                    ) : (
                        <Button
                            onClick={handleCreate}
                            disabled={isSubmitting}
                            className="rounded-2xl h-14 px-10 gap-2 bg-brand-900 hover:bg-brand-950 shadow-xl shadow-brand-900/20 font-black uppercase text-[11px] tracking-widest transition-all"
                        >
                            {isSubmitting ? 'Creating...' : 'Finalize & Save Draft'}
                        </Button>
                    )}
                </div>
            </div>
        </div>
    );
};
