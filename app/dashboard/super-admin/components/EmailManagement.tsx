'use client';

import React, { useState } from 'react';
import { Mail, X } from 'lucide-react';
import { useUpdateEmailTemplate } from '@/lib/hooks/use-data';

function TemplateEditModal({ template, onClose, onSave }: any) {
    const [formData, setFormData] = useState({
        subject: template?.subject || '',
        body_html: template?.body_html || '',
        body_text: template?.body_text || '',
    });

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
            <div className="bg-white rounded-3xl w-full max-w-4xl shadow-2xl animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh] overflow-hidden">
                <div className="p-8 border-b border-gray-100 flex justify-between items-center bg-gray-50/50 shrink-0">
                    <div>
                        <h3 className="text-2xl font-black text-gray-900 uppercase tracking-tight">Edit Email Template</h3>
                        <p className="text-sm text-gray-500 font-medium">Template: <span className="font-bold text-brand-600">{template?.name}</span></p>
                    </div>
                    <button onClick={onClose} className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-white hover:shadow-md transition-all text-gray-400 hover:text-gray-900"><X size={20} /></button>
                </div>
                <div className="p-8 space-y-6 overflow-y-auto">
                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Email Subject</label>
                        <input value={formData.subject} onChange={e => setFormData({ ...formData, subject: e.target.value })}
                            className="w-full bg-gray-50 border-0 rounded-2xl px-5 py-4 text-sm font-bold focus:ring-2 focus:ring-brand-600 transition-all outline-none" />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">HTML Body</label>
                            <textarea value={formData.body_html} onChange={e => setFormData({ ...formData, body_html: e.target.value })}
                                className="w-full bg-gray-50 border-0 rounded-2xl px-5 py-4 text-sm font-medium focus:ring-2 focus:ring-brand-600 transition-all outline-none min-h-[400px] font-mono" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Variables Available</label>
                            <div className="bg-slate-900 rounded-2xl p-6 text-emerald-400 font-mono text-xs space-y-2">
                                {Object.entries(template?.variables || {}).map(([key, example]) => (
                                    <p key={key}>{"{{"}  <span className="text-white">{key}</span> {"}}"} <span className="text-slate-500 text-[10px] ml-2">// {String(example)}</span></p>
                                ))}
                                {Object.keys(template?.variables || {}).length === 0 && <p className="text-slate-500">No variables defined for this template.</p>}
                            </div>
                            <div className="mt-6 space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Plain Text Body (Fallback)</label>
                                <textarea value={formData.body_text} onChange={e => setFormData({ ...formData, body_text: e.target.value })}
                                    className="w-full bg-gray-50 border-0 rounded-2xl px-5 py-4 text-sm font-medium focus:ring-2 focus:ring-brand-600 transition-all outline-none min-h-[250px]" />
                            </div>
                        </div>
                    </div>
                </div>
                <div className="p-8 bg-gray-50 border-t border-gray-100 flex gap-4">
                    <button onClick={onClose} className="flex-1 py-4 text-gray-400 font-black uppercase text-xs tracking-widest hover:bg-white rounded-2xl transition-all">Cancel</button>
                    <button onClick={() => onSave(formData)} className="flex-[2] py-4 bg-gray-900 text-white font-black uppercase text-xs tracking-widest rounded-2xl shadow-xl shadow-gray-900/20 hover:scale-[1.02] active:scale-[0.98] transition-all">Update Template</button>
                </div>
            </div>
        </div>
    );
}

export function EmailTemplatesTab({ templates = [] }: { templates: any[] }) {
    const [selectedTemplate, setSelectedTemplate] = useState<any>(null);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const updateMutation = useUpdateEmailTemplate();

    const handleSave = async (data: any) => {
        try {
            await updateMutation.mutateAsync({ id: selectedTemplate.id, updates: data });
            alert('Template updated successfully');
            setIsEditModalOpen(false);
        } catch (error) {
            alert('Failed to update template');
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-3xl font-black text-gray-900 uppercase">Email Templates</h2>
                    <p className="text-gray-500 font-medium text-sm">Customize platform-wide automated emails using dynamic variables.</p>
                </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {templates.map((tpl) => (
                    <div key={tpl.id} className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm hover:shadow-xl transition-all group relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity"><Mail size={80} /></div>
                        <div className="relative z-10">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-10 h-10 bg-brand-50 text-brand-600 rounded-xl flex items-center justify-center"><Mail size={20} /></div>
                                <h3 className="font-bold text-gray-900">{tpl.name}</h3>
                            </div>
                            <p className="text-xs text-gray-400 font-black uppercase tracking-widest mb-1">Subject</p>
                            <p className="text-sm font-medium text-gray-700 line-clamp-1 mb-4">{tpl.subject}</p>
                            <div className="pt-4 border-t border-gray-50 flex items-center justify-between">
                                <span className="text-[10px] font-black text-brand-600 bg-brand-50 px-2 py-0.5 rounded-full uppercase tracking-tighter">/{tpl.slug}</span>
                                <button onClick={() => { setSelectedTemplate(tpl); setIsEditModalOpen(true); }}
                                    className="text-xs font-black text-gray-900 uppercase tracking-widest hover:text-brand-600 transition-colors">Edit Template</button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
            {isEditModalOpen && <TemplateEditModal template={selectedTemplate} onClose={() => setIsEditModalOpen(false)} onSave={handleSave} />}
        </div>
    );
}

export function EmailLogsTab({ logs = [] }: { logs: any[] }) {
    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <h2 className="text-3xl font-bold text-gray-900">Email Delivery Logs</h2>
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                            <th className="px-6 py-4 font-bold text-gray-500 text-sm">Sent At</th>
                            <th className="px-6 py-4 font-bold text-gray-500 text-sm">Recipient</th>
                            <th className="px-6 py-4 font-bold text-gray-500 text-sm">Template</th>
                            <th className="px-6 py-4 font-bold text-gray-500 text-sm">Status</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {logs.map((log: any) => (
                            <tr key={log.id} className="hover:bg-gray-50">
                                <td className="px-6 py-4 text-sm text-gray-500">{new Date(log.sent_at).toLocaleString()}</td>
                                <td className="px-6 py-4 text-sm font-bold text-gray-900">{log.recipient}</td>
                                <td className="px-6 py-4 text-xs font-black uppercase tracking-widest text-brand-600">{log.template_name || 'Manual Email'}</td>
                                <td className="px-6 py-4">
                                    <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded ${log.status === 'sent' ? 'bg-emerald-50 text-emerald-700' : log.status === 'failed' ? 'bg-rose-50 text-rose-700' : 'bg-amber-50 text-amber-700'}`}>{log.status}</span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {logs.length === 0 && (
                    <div className="py-20 flex flex-col items-center justify-center text-gray-400 text-center">
                        <Mail size={48} className="mb-4 opacity-10" />
                        <p className="font-bold">No email logs found.</p>
                        <p className="text-sm">Delivery status for automated emails will appear here.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
