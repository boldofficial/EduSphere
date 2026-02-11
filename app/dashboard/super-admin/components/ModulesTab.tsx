'use client';

import React, { useState } from 'react';
import { Zap } from 'lucide-react';
import apiClient from '@/lib/api-client';

export function ModulesTab({ modules = [] }: { modules: any[] }) {
    const [togglingId, setTogglingId] = useState<string | null>(null);

    const handleToggle = async (moduleId: string, currentStatus: boolean) => {
        setTogglingId(moduleId);
        try {
            const action = currentStatus ? 'off' : 'on';
            await apiClient.post('/schools/modules/toggle/', { module_id: moduleId, action });
            window.location.reload();
        } catch (error) {
            alert('Failed to toggle module');
        } finally {
            setTogglingId(null);
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div>
                <h2 className="text-3xl font-black text-gray-900 uppercase">Module Library</h2>
                <p className="text-gray-500 font-medium text-sm">Global master switches. Turning a module OFF here disables it platform-wide, overriding all subscription plans.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {modules.map((mod) => (
                    <div key={mod.id} className={`bg-white p-6 rounded-3xl border transition-all group ${mod.is_active ? 'border-gray-100 shadow-sm hover:shadow-xl hover:shadow-brand-900/5' : 'border-dashed border-gray-200 opacity-60 grayscale'}`}>
                        <div className="flex items-start justify-between mb-6">
                            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-colors ${mod.is_active ? 'bg-brand-50 text-brand-600' : 'bg-gray-100 text-gray-400'}`}>
                                <Zap size={28} />
                            </div>
                            <button disabled={togglingId === mod.id} onClick={() => handleToggle(mod.id, mod.is_active)}
                                className={`relative w-12 h-6 rounded-full transition-colors duration-200 outline-none p-1 ${mod.is_active ? 'bg-brand-600' : 'bg-gray-200'} ${togglingId === mod.id ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}>
                                <div className={`w-4 h-4 rounded-full bg-white shadow-sm transform transition-transform duration-200 ${mod.is_active ? 'translate-x-6' : 'translate-x-0'}`}></div>
                            </button>
                        </div>
                        <div className="flex items-center gap-2 mb-2">
                            <h3 className="text-xl font-bold text-gray-900">{mod.name}</h3>
                            {!mod.is_active && <span className="text-[10px] font-black text-white bg-gray-400 px-1.5 py-0.5 rounded uppercase tracking-tighter">Disabled</span>}
                        </div>
                        <p className="text-sm text-gray-500 leading-relaxed min-h-[40px]">{mod.description}</p>
                        <div className="mt-6 pt-6 border-t border-gray-100 flex items-center justify-between">
                            <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-full ${mod.is_active ? 'bg-brand-50 text-brand-600' : 'bg-gray-50 text-gray-400'}`}>ID: {mod.id}</span>
                            <div className="flex -space-x-2">
                                <div className={`w-6 h-6 rounded-full border-2 border-white ${mod.is_active ? 'bg-brand-200' : 'bg-gray-200'}`}></div>
                                <div className={`w-6 h-6 rounded-full border-2 border-white ${mod.is_active ? 'bg-brand-100' : 'bg-gray-100'}`}></div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
