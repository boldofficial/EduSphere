'use client';

import React, { useState } from 'react';
import {
    X, Send, User,
    Type, Globe, ShieldCheck,
    Zap, AlertCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/providers/toast-provider';
import apiClient from '@/lib/api-client';

interface SendIndividualEmailModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const SendIndividualEmailModal: React.FC<SendIndividualEmailModalProps> = ({ isOpen, onClose }) => {
    const [formData, setFormData] = useState({
        recipient: '',
        subject: '',
        body: '',
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { addToast } = useToast();

    const handleSend = async () => {
        if (!formData.recipient || !formData.subject || !formData.body) {
            return addToast('Please fill in all fields', 'error');
        }

        setIsSubmitting(true);
        try {
            await apiClient.post('emails/campaigns/send-individual/', formData);
            addToast('Professional email queued for delivery', 'success');
            onClose();
            setFormData({ recipient: '', subject: '', body: '' });
        } catch (error) {
            addToast('Failed to send email', 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-brand-950/40 backdrop-blur-sm" onClick={onClose} />

            <div className="relative w-full max-w-xl bg-white rounded-[40px] shadow-2xl shadow-brand-950/20 overflow-hidden animate-in zoom-in-95 duration-300">
                {/* Header */}
                <div className="p-8 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-lg shadow-indigo-600/20">
                            <Send size={24} />
                        </div>
                        <div>
                            <h3 className="text-xl font-black text-gray-900 tracking-tight">Direct Professional Message</h3>
                            <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mt-1">One-off communication</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-400">
                        <X size={20} />
                    </button>
                </div>

                <div className="p-10 space-y-8">
                    {/* Security/Branding Notice */}
                    <div className="p-4 bg-indigo-50 border border-indigo-100 rounded-2xl flex items-center gap-3">
                        <ShieldCheck className="text-indigo-600" size={20} />
                        <p className="text-[10px] font-bold text-indigo-900 uppercase tracking-tight">
                            This message will be automatically wrapped in the platform's professional header and footer.
                        </p>
                    </div>

                    <div className="space-y-6">
                        <div className="space-y-4">
                            <label className="text-xs font-black uppercase tracking-widest text-gray-500 flex items-center gap-2">
                                <User size={14} className="text-gray-400" /> Recipient Address
                            </label>
                            <Input
                                placeholder="name@school.com"
                                className="h-12 rounded-xl border-gray-100 bg-gray-50 font-bold px-4 focus:ring-4 focus:ring-indigo-500/10 transition-all"
                                value={formData.recipient}
                                onChange={e => setFormData({ ...formData, recipient: e.target.value })}
                            />
                        </div>

                        <div className="space-y-4">
                            <label className="text-xs font-black uppercase tracking-widest text-gray-500 flex items-center gap-2">
                                <Type size={14} className="text-gray-400" /> Subject Line
                            </label>
                            <Input
                                placeholder="Formal subject..."
                                className="h-12 rounded-xl border-gray-100 bg-gray-50 font-bold px-4 focus:ring-4 focus:ring-indigo-500/10 transition-all"
                                value={formData.subject}
                                onChange={e => setFormData({ ...formData, subject: e.target.value })}
                            />
                        </div>

                        <div className="space-y-4">
                            <label className="text-xs font-black uppercase tracking-widest text-gray-500 flex items-center gap-2">
                                <Globe size={14} className="text-gray-400" /> Message Body (Professional)
                            </label>
                            <textarea
                                placeholder="Compose your message here. HTML is allowed for extra styling..."
                                className="w-full h-48 p-6 bg-gray-50 border border-gray-100 rounded-3xl text-sm font-medium focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all resize-none shadow-inner"
                                value={formData.body}
                                onChange={e => setFormData({ ...formData, body: e.target.value })}
                            />
                        </div>
                    </div>

                    {/* Quick Tips */}
                    <div className="flex gap-4">
                        <div className="flex-1 p-3 bg-gray-50 rounded-xl border border-gray-100 text-[9px] font-bold text-gray-500 uppercase tracking-tight flex items-center gap-2">
                            <Zap size={12} className="text-amber-500" /> Markdown Support
                        </div>
                        <div className="flex-1 p-3 bg-gray-50 rounded-xl border border-gray-100 text-[9px] font-bold text-gray-500 uppercase tracking-tight flex items-center gap-2">
                            <AlertCircle size={12} className="text-blue-500" /> Sent via System SMTP
                        </div>
                    </div>
                </div>

                <div className="p-8 pt-0 flex justify-end gap-3">
                    <Button
                        variant="ghost"
                        onClick={onClose}
                        className="rounded-2xl h-12 px-6 font-black uppercase text-[10px] tracking-widest text-gray-400 hover:text-gray-600"
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={handleSend}
                        disabled={isSubmitting}
                        className="rounded-2xl h-12 px-8 gap-2 bg-indigo-600 hover:bg-indigo-700 shadow-xl shadow-indigo-600/20 font-black uppercase text-[10px] tracking-widest transition-all"
                    >
                        {isSubmitting ? 'Sending...' : 'Send Professional Email'}
                    </Button>
                </div>
            </div>
        </div>
    );
};
