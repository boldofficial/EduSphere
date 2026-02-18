'use client';

import React, { useState, useEffect } from 'react';
import { CreditCard, Zap, Server, Mail } from 'lucide-react';
import { useUpdatePlatformSettings } from '@/lib/hooks/use-data';

export function PlatformSettingsTab({ settings }: { settings: any }) {
    const [editedSettings, setEditedSettings] = useState<any>(null);
    const [isSaving, setIsSaving] = useState(false);
    const updateMutation = useUpdatePlatformSettings();

    useEffect(() => {
        if (settings) setEditedSettings(settings);
    }, [settings]);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            await updateMutation.mutateAsync(editedSettings);
            alert('Settings updated successfully');
        } catch (error) {
            alert('Failed to update settings');
        } finally {
            setIsSaving(false);
        }
    };

    if (!editedSettings) return <div className="p-8 text-center text-gray-500 font-bold uppercase tracking-widest animate-pulse">Loading Platform Configurations...</div>;

    return (
        <div className="max-w-4xl space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div>
                <h2 className="text-3xl font-black text-gray-900 uppercase">Platform Settings</h2>
                <p className="text-gray-500 font-medium text-sm">Configure global payment methods, Paystack API keys, and system-wide defaults.</p>
            </div>
            <form onSubmit={handleSave} className="space-y-6">
                {/* Paystack Section */}
                <div className="bg-slate-900 rounded-3xl p-8 text-white shadow-2xl shadow-slate-900/20 border border-white/5 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity"><CreditCard size={120} /></div>
                    <div className="relative z-10">
                        <h3 className="text-xl font-bold mb-6 flex items-center gap-3">
                            <span className="w-8 h-8 bg-brand-500 rounded-lg flex items-center justify-center text-white"><Zap size={18} fill="currentColor" /></span>
                            Paystack Configuration
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Public Key (pk_test_...)</label>
                                <input value={editedSettings.paystack_public_key || ''} onChange={(e) => setEditedSettings({ ...editedSettings, paystack_public_key: e.target.value })}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm font-mono focus:ring-2 focus:ring-brand-500 transition-all outline-none" placeholder="pk_test_..." />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Secret Key (sk_test_...)</label>
                                <input type="password" value={editedSettings.paystack_secret_key || ''} onChange={(e) => setEditedSettings({ ...editedSettings, paystack_secret_key: e.target.value })}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm font-mono focus:ring-2 focus:ring-brand-500 transition-all outline-none" placeholder="sk_test_..." />
                            </div>
                        </div>
                        <p className="mt-4 text-xs text-slate-400 font-medium italic">Used for automated subscription payments and plan upgrades.</p>
                    </div>
                </div>

                {/* Bank Details */}
                <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm group">
                    <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                        <span className="w-8 h-8 bg-brand-50 rounded-lg flex items-center justify-center text-brand-600"><CreditCard size={18} /></span>
                        Master Bank Details
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {[{ key: 'bank_name', label: 'Bank Name', ph: 'e.g. GTBank' }, { key: 'account_number', label: 'Account Number', ph: '0123456789' }, { key: 'account_name', label: 'Account Name', ph: 'Registra Global' }].map(f => (
                            <div key={f.key} className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">{f.label}</label>
                                <input value={editedSettings[f.key] || ''} onChange={(e) => setEditedSettings({ ...editedSettings, [f.key]: e.target.value })}
                                    className="w-full bg-gray-50 border-0 rounded-xl px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-brand-600 transition-all outline-none" placeholder={f.ph} />
                            </div>
                        ))}
                    </div>
                </div>

                {/* Email Configuration */}
                <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm group">
                    <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                        <span className="w-8 h-8 bg-brand-50 rounded-lg flex items-center justify-center text-brand-600"><Mail size={18} /></span>
                        Email Delivery Configuration
                    </h3>
                    <div className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Email Provider</label>
                            <div className="flex gap-4">
                                {['smtp', 'brevo_api'].map((p) => (
                                    <button key={p} type="button" onClick={() => setEditedSettings({ ...editedSettings, email_provider: p })}
                                        className={`flex-1 py-3 px-4 rounded-xl border-2 transition-all flex items-center justify-center gap-2 font-bold uppercase text-xs tracking-wider ${editedSettings.email_provider === p ? 'border-brand-600 bg-brand-50 text-brand-600' : 'border-gray-100 bg-gray-50 text-gray-400 hover:border-gray-200'}`}>
                                        {p === 'smtp' ? <Server size={14} /> : <Zap size={14} />}
                                        {p === 'smtp' ? 'Standard SMTP' : 'Brevo API'}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">From Email Address</label>
                                <input type="email" value={editedSettings.email_from || ''} onChange={(e) => setEditedSettings({ ...editedSettings, email_from: e.target.value })}
                                    className="w-full bg-gray-50 border-0 rounded-xl px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-brand-600 transition-all outline-none" placeholder="noreply@myregistra.net" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Sender Display Name</label>
                                <input value={editedSettings.email_from_name || ''} onChange={(e) => setEditedSettings({ ...editedSettings, email_from_name: e.target.value })}
                                    className="w-full bg-gray-50 border-0 rounded-xl px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-brand-600 transition-all outline-none" placeholder="Registra Notifications" />
                            </div>
                        </div>

                        {editedSettings.email_provider === 'brevo_api' ? (
                            <div className="space-y-2 bg-slate-50 p-6 rounded-2xl border border-dashed border-gray-200">
                                <label className="text-[10px] font-black uppercase tracking-widest text-gray-500">Brevo API Key</label>
                                <input type="password" value={editedSettings.email_api_key || ''} onChange={(e) => setEditedSettings({ ...editedSettings, email_api_key: e.target.value })}
                                    className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm font-mono focus:ring-2 focus:ring-brand-500 transition-all outline-none" placeholder="xkeysib-..." />
                                <p className="text-[10px] text-gray-400 italic">Fetch this from your Brevo SMTP & API dashboard.</p>
                            </div>
                        ) : (
                            <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100 space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    <div className="space-y-2 md:col-span-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">SMTP Host</label>
                                        <input value={editedSettings.email_host || ''} onChange={(e) => setEditedSettings({ ...editedSettings, email_host: e.target.value })}
                                            className="w-full bg-white border-0 rounded-xl px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-brand-600 transition-all outline-none" placeholder="smtp.brevo.com" />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">SMTP Port</label>
                                        <input type="number" value={editedSettings.email_port || 587} onChange={(e) => setEditedSettings({ ...editedSettings, email_port: parseInt(e.target.value) })}
                                            className="w-full bg-white border-0 rounded-xl px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-brand-600 transition-all outline-none" />
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">SMTP Username</label>
                                        <input value={editedSettings.email_user || ''} onChange={(e) => setEditedSettings({ ...editedSettings, email_user: e.target.value })}
                                            className="w-full bg-white border-0 rounded-xl px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-brand-600 transition-all outline-none" />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">SMTP Password</label>
                                        <input type="password" value={editedSettings.email_password || ''} onChange={(e) => setEditedSettings({ ...editedSettings, email_password: e.target.value })}
                                            className="w-full bg-white border-0 rounded-xl px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-brand-600 transition-all outline-none" />
                                    </div>
                                </div>
                                <div className="flex gap-8 pt-2">
                                    {[{ key: 'email_use_tls', label: 'Use TLS' }, { key: 'email_use_ssl', label: 'Use SSL' }].map(toggle => (
                                        <label key={toggle.key} className="flex items-center gap-3 cursor-pointer group">
                                            <div className="relative">
                                                <input type="checkbox" checked={editedSettings[toggle.key]} onChange={(e) => setEditedSettings({ ...editedSettings, [toggle.key]: e.target.checked })} className="sr-only" />
                                                <div className={`w-10 h-6 bg-gray-200 rounded-full transition-colors group-hover:bg-gray-300 ${editedSettings[toggle.key] ? 'bg-brand-600 group-hover:bg-brand-700' : ''}`} />
                                                <div className={`absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-transform ${editedSettings[toggle.key] ? 'translate-x-4' : ''}`} />
                                            </div>
                                            <span className="text-xs font-bold text-gray-600 uppercase tracking-wider">{toggle.label}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* AI Configuration */}
                <div className="bg-slate-900 rounded-3xl p-8 text-white shadow-2xl shadow-slate-900/20 border border-white/5 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity"><Zap size={120} /></div>
                    <div className="relative z-10">
                        <h3 className="text-xl font-bold mb-6 flex items-center gap-3">
                            <span className="w-8 h-8 bg-brand-500 rounded-lg flex items-center justify-center text-white">✨</span>
                            AI Provider Configuration
                        </h3>
                        <div className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">AI Provider</label>
                                <div className="flex gap-4">
                                    {['gemini', 'openrouter'].map((p) => (
                                        <button key={p} type="button" onClick={() => setEditedSettings({ ...editedSettings, ai_provider: p })}
                                            className={`flex-1 py-3 px-4 rounded-xl border-2 transition-all flex items-center justify-center gap-2 font-bold uppercase text-xs tracking-wider ${editedSettings.ai_provider === p ? 'border-brand-600 bg-brand-500/20 text-brand-400' : 'border-white/5 bg-white/5 text-slate-400 hover:border-white/10'}`}>
                                            {p === 'gemini' ? 'Google Gemini' : 'OpenRouter'}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {editedSettings.ai_provider === 'gemini' ? (
                                    <div className="space-y-2 md:col-span-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Gemini API Key</label>
                                        <input type="password" value={editedSettings.gemini_api_key || ''} onChange={(e) => setEditedSettings({ ...editedSettings, gemini_api_key: e.target.value })}
                                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm font-mono focus:ring-2 focus:ring-brand-500 transition-all outline-none" placeholder="AIzaSy..." />
                                        <p className="text-[10px] text-slate-500 italic">Get from Gemini API Console.</p>
                                    </div>
                                ) : (
                                    <>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">OpenRouter API Key</label>
                                            <input type="password" value={editedSettings.openrouter_api_key || ''} onChange={(e) => setEditedSettings({ ...editedSettings, openrouter_api_key: e.target.value })}
                                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm font-mono focus:ring-2 focus:ring-brand-500 transition-all outline-none" placeholder="sk-or-..." />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Select Model</label>
                                            <select value={editedSettings.openrouter_model || 'google/gemini-2.0-flash-001'} onChange={(e) => setEditedSettings({ ...editedSettings, openrouter_model: e.target.value })}
                                                className="w-full bg-slate-800 border-white/10 border rounded-xl px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-brand-500 transition-all outline-none text-white appearance-none">
                                                <option value="google/gemini-2.0-flash-001">Gemini 2.0 Flash (Free)</option>
                                                <option value="anthropic/claude-3.5-sonnet">Claude 3.5 Sonnet</option>
                                                <option value="openai/gpt-4o">GPT-4o</option>
                                                <option value="meta-llama/llama-3.1-70b-instruct">Llama 3.1 70B</option>
                                                <option value="deepseek/deepseek-chat">DeepSeek Chat</option>
                                            </select>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex justify-end pt-4">
                    <button type="submit" disabled={isSaving}
                        className="px-8 py-4 bg-brand-600 text-white rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-brand-600/20 hover:bg-brand-700 hover:-translate-y-1 transition-all disabled:opacity-50 disabled:translate-y-0">
                        {isSaving ? 'Synchronizing...' : 'Save Configuration'}
                    </button>
                </div>
            </form>
        </div>
    );
}
