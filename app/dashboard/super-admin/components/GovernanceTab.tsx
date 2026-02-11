'use client';

import React, { useState } from 'react';
import { ScrollText, Megaphone, Clock } from 'lucide-react';
import apiClient from '@/lib/api-client';

export function GovernanceTab({ activities = [] }: any) {
    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <h2 className="text-3xl font-bold text-gray-900">Global Activity Log</h2>
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                            <th className="px-6 py-4 font-bold text-gray-500 text-sm">Timestamp</th>
                            <th className="px-6 py-4 font-bold text-gray-500 text-sm">Action</th>
                            <th className="px-6 py-4 font-bold text-gray-500 text-sm">Description</th>
                            <th className="px-6 py-4 font-bold text-gray-500 text-sm">Actor</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {activities.map((log: any) => (
                            <tr key={log.id} className="hover:bg-gray-50">
                                <td className="px-6 py-4 text-sm text-gray-500">{new Date(log.created_at).toLocaleString()}</td>
                                <td className="px-6 py-4">
                                    <span className="text-[10px] font-black uppercase tracking-widest px-2 py-1 bg-slate-100 rounded text-slate-700">{log.action.replace(/_/g, ' ')}</span>
                                </td>
                                <td className="px-6 py-4 text-sm font-medium text-gray-900">{log.description}</td>
                                <td className="px-6 py-4 text-xs font-mono text-gray-500">{log.user_email}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {activities.length === 0 && (
                    <div className="py-20 flex flex-col items-center justify-center text-gray-400 text-center">
                        <ScrollText size={48} className="mb-4 opacity-10" />
                        <p className="font-bold">The activity log is currently empty.</p>
                        <p className="text-sm">Platform events will appear here as they happen.</p>
                    </div>
                )}
            </div>
        </div>
    );
}

export function BroadcastsTab({ announcements = [] }: any) {
    const [modalOpen, setModalOpen] = useState(false);
    const [title, setTitle] = useState('');
    const [message, setMessage] = useState('');
    const [priority, setPriority] = useState('low');
    const [isProcessing, setIsProcessing] = useState(false);

    const handleSubmit = async (e: any) => {
        e.preventDefault();
        setIsProcessing(true);
        try {
            await apiClient.post('/schools/governance/', { title, message, priority });
            alert("Announcement Broadcasted!");
            window.location.reload();
        } catch (error) {
            alert("Broadcast failed");
        } finally {
            setIsProcessing(false);
            setModalOpen(false);
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex justify-between items-center">
                <h2 className="text-3xl font-bold text-gray-900">Platform Broadcasts</h2>
                <button onClick={() => setModalOpen(true)} className="px-4 py-2 bg-brand-600 text-white rounded-lg flex items-center gap-2 hover:bg-brand-700">
                    <Megaphone size={18} /> New Broadcast
                </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {announcements.map((ann: any) => (
                    <div key={ann.id} className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm relative overflow-hidden">
                        <div className={`absolute top-0 right-0 px-3 py-1 text-[10px] font-black uppercase tracking-tight text-white ${ann.priority === 'high' ? 'bg-red-500' : ann.priority === 'medium' ? 'bg-orange-500' : 'bg-blue-500'}`}>{ann.priority}</div>
                        <h4 className="text-lg font-bold text-gray-900 mb-2">{ann.title}</h4>
                        <p className="text-gray-600 text-sm leading-relaxed mb-6">{ann.message}</p>
                        <div className="flex items-center gap-2 text-[10px] text-gray-400 font-bold uppercase"><Clock size={12} />{new Date(ann.created_at).toLocaleDateString()}</div>
                    </div>
                ))}
                {announcements.length === 0 && (
                    <div className="col-span-full py-20 bg-white border-2 border-dashed border-gray-100 rounded-3xl flex flex-col items-center justify-center text-gray-400">
                        <Megaphone size={40} className="mb-4 opacity-20" />
                        <p className="font-bold">No broadcasts found. Send your first announcement!</p>
                    </div>
                )}
            </div>
            {modalOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white p-8 rounded-3xl w-full max-w-lg shadow-2xl">
                        <h3 className="text-2xl font-black text-gray-900 mb-6">Create Global Broadcast</h3>
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div>
                                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Announcement Title</label>
                                <input required value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. System Maintenance Scheduled"
                                    className="w-full border-2 border-gray-100 p-4 rounded-2xl focus:border-brand-500 outline-none transition-all font-bold" />
                            </div>
                            <div>
                                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Message Content</label>
                                <textarea required rows={4} value={message} onChange={e => setMessage(e.target.value)} placeholder="Details for all school administrators..."
                                    className="w-full border-2 border-gray-100 p-4 rounded-2xl focus:border-brand-500 outline-none transition-all font-medium" />
                            </div>
                            <div>
                                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Priority Level</label>
                                <select className="w-full border-2 border-gray-100 p-4 rounded-2xl font-bold appearance-none bg-gray-50" value={priority} onChange={e => setPriority(e.target.value)}>
                                    <option value="low">Low (General Update)</option>
                                    <option value="medium">Medium (Important)</option>
                                    <option value="high">High (Urgent Action Required)</option>
                                </select>
                            </div>
                            <div className="flex gap-3 pt-4">
                                <button type="button" onClick={() => setModalOpen(false)} className="flex-1 py-4 text-gray-400 font-black uppercase text-xs tracking-widest hover:bg-gray-50 rounded-2xl transition-all">Cancel</button>
                                <button type="submit" disabled={isProcessing} className="flex-2 py-4 bg-brand-600 text-white font-black uppercase text-xs tracking-widest rounded-2xl shadow-lg shadow-brand-900/40 hover:scale-105 transition-all">Broadcast Now</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
