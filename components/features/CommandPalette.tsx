'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Search, School, Zap, ArrowRight, X } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface CommandPaletteProps {
    schools: any[];
    isOpen: boolean;
    onClose: () => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({ schools, isOpen, onClose }) => {
    const [query, setQuery] = useState('');
    const router = useRouter();

    const filteredSchools = schools.filter(s =>
        s.name.toLowerCase().includes(query.toLowerCase()) ||
        s.slug.toLowerCase().includes(query.toLowerCase())
    ).slice(0, 5);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault();
                isOpen ? onClose() : null; // Handled by parent if we want it to toggle
            }
            if (e.key === 'Escape') onClose();
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh] px-4">
            <div className="fixed inset-0 bg-brand-950/40 backdrop-blur-md" onClick={onClose}></div>

            <div className="relative w-full max-w-2xl bg-white rounded-[2rem] shadow-2xl border border-gray-100 overflow-hidden animate-in zoom-in-95 duration-200">
                <div className="flex items-center px-6 py-4 border-b border-gray-50">
                    <Search className="text-gray-400 mr-4" size={24} />
                    <input
                        autoFocus
                        type="text"
                        placeholder="Type to search schools, modules, or settings..."
                        value={query}
                        onChange={e => setQuery(e.target.value)}
                        className="flex-1 bg-transparent border-none outline-none text-lg font-medium text-gray-900 placeholder-gray-400"
                    />
                    <button onClick={onClose} className="p-2 hover:bg-gray-50 rounded-xl text-gray-400">
                        <X size={20} />
                    </button>
                </div>

                <div className="p-4 max-h-[60vh] overflow-y-auto">
                    {query.length > 0 ? (
                        <div className="space-y-2">
                            <p className="px-4 py-2 text-[10px] font-black text-gray-400 uppercase tracking-widest">Institutions</p>
                            {filteredSchools.map(school => (
                                <button
                                    key={school.id}
                                    onClick={() => {
                                        // Specific action like impersonate or view detail
                                        onClose();
                                    }}
                                    className="w-full flex items-center justify-between p-4 hover:bg-brand-50 rounded-2xl group transition-all"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 bg-white border border-gray-100 rounded-xl flex items-center justify-center text-brand-600 shadow-sm overflow-hidden">
                                            {school.logo_media ? <img src={school.logo_media} alt="" /> : <School size={24} />}
                                        </div>
                                        <div className="text-left">
                                            <p className="font-bold text-gray-900">{school.name}</p>
                                            <p className="text-xs text-gray-400">{school.slug}.myregistra.net</p>
                                        </div>
                                    </div>
                                    <ArrowRight size={18} className="text-gray-300 group-hover:text-brand-600 transition-colors" />
                                </button>
                            ))}
                            {filteredSchools.length === 0 && (
                                <div className="py-12 text-center">
                                    <p className="text-gray-400 font-medium">No results found for "{query}"</p>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 gap-4">
                            <QuickLink icon={Zap} label="Platform Metrics" onClick={onClose} />
                            <QuickLink icon={School} label="New Registration" onClick={onClose} />
                        </div>
                    )}
                </div>

                <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
                    <div className="flex gap-4">
                        <div className="flex items-center gap-1">
                            <kbd className="px-2 py-1 bg-white border border-gray-200 rounded text-[10px] font-bold text-gray-400 shadow-sm">Enter</kbd>
                            <span className="text-[10px] font-medium text-gray-400 uppercase">Select</span>
                        </div>
                        <div className="flex items-center gap-1">
                            <kbd className="px-2 py-1 bg-white border border-gray-200 rounded text-[10px] font-bold text-gray-400 shadow-sm">Esc</kbd>
                            <span className="text-[10px] font-medium text-gray-400 uppercase">Close</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

function QuickLink({ icon: Icon, label, onClick }: any) {
    return (
        <button onClick={onClick} className="flex items-center gap-3 p-4 bg-gray-50/50 hover:bg-white border border-transparent hover:border-brand-100 rounded-2xl transition-all group">
            <div className="p-2 bg-white rounded-lg shadow-sm text-brand-600 group-hover:scale-110 transition-transform">
                <Icon size={18} />
            </div>
            <span className="text-sm font-bold text-gray-700">{label}</span>
        </button>
    );
}
