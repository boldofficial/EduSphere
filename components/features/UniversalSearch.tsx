'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Search, GraduationCap, Users, BookOpen, Settings, Command, X, ArrowRight, Zap, Sidebar } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useAcademicGlobalSearch } from '@/lib/hooks/use-academic';

interface UniversalSearchProps {
    isOpen: boolean;
    onClose: () => void;
    navigation: { id: string, name: string, href: string, icon: any }[];
}

export const UniversalSearch: React.FC<UniversalSearchProps> = ({ isOpen, onClose, navigation }) => {
    const [query, setQuery] = useState('');
    const router = useRouter();
    const { data: searchResults, isLoading } = useAcademicGlobalSearch(query, isOpen);

    // Filter navigation based on query locally
    const filteredNav = useMemo(() => {
        if (!query) return [];
        return navigation.filter(n =>
            n.name.toLowerCase().includes(query.toLowerCase())
        ).slice(0, 5);
    }, [query, navigation]);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [onClose]);

    if (!isOpen) return null;

    const hasResults = filteredNav.length > 0 ||
        (searchResults?.students?.length > 0) ||
        (searchResults?.staff?.length > 0) ||
        (searchResults?.classes?.length > 0);

    return (
        <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh] px-4">
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-brand-950/40 backdrop-blur-md animate-in fade-in duration-300"
                onClick={onClose}
            ></div>

            {/* Modal */}
            <div className="relative w-full max-w-2xl bg-white rounded-[2.5rem] shadow-2xl border border-white/20 overflow-hidden animate-in zoom-in-95 slide-in-from-top-4 duration-300">
                {/* Search Header */}
                <div className="flex items-center px-8 py-6 border-b border-gray-100/50">
                    <Search className="text-brand-500 mr-4 shrink-0" size={24} />
                    <input
                        autoFocus
                        type="text"
                        placeholder="Global search (Students, Staff, Navigation)..."
                        value={query}
                        onChange={e => setQuery(e.target.value)}
                        className="flex-1 bg-transparent border-none outline-none text-xl font-medium text-gray-900 placeholder-gray-400"
                    />
                    <div className="flex items-center gap-2">
                        {isLoading && (
                            <div className="animate-spin rounded-full h-4 w-4 border-2 border-brand-500 border-t-transparent"></div>
                        )}
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-gray-100 rounded-2xl text-gray-400 transition-colors"
                        >
                            <X size={20} />
                        </button>
                    </div>
                </div>

                {/* Results Section */}
                <div className="p-4 max-h-[60vh] overflow-y-auto no-scrollbar">
                    {query.length > 0 ? (
                        <div className="space-y-6">
                            {/* Navigation / Modules */}
                            {filteredNav.length > 0 && (
                                <Section label="Navigation & Modules">
                                    {filteredNav.map(item => (
                                        <ResultItem
                                            key={item.id}
                                            icon={item.icon}
                                            title={item.name}
                                            subtitle={`Go to ${item.name} page`}
                                            onClick={() => { router.push(item.href); onClose(); }}
                                        />
                                    ))}
                                </Section>
                            )}

                            {/* Students */}
                            {searchResults?.students?.length > 0 && (
                                <Section label="Students">
                                    {searchResults.students.map((s: any) => (
                                        <ResultItem
                                            key={s.id}
                                            icon={GraduationCap}
                                            title={s.names}
                                            subtitle={`${s.student_no} • ${s.current_class}`}
                                            onClick={() => { router.push(`/students?id=${s.id}`); onClose(); }}
                                        />
                                    ))}
                                </Section>
                            )}

                            {/* Staff */}
                            {searchResults?.staff?.length > 0 && (
                                <Section label="Staff Members">
                                    {searchResults.staff.map((s: any) => (
                                        <ResultItem
                                            key={s.id}
                                            icon={Users}
                                            title={s.name}
                                            subtitle={s.staff_type}
                                            onClick={() => { router.push(`/staff?id=${s.id}`); onClose(); }}
                                        />
                                    ))}
                                </Section>
                            )}

                            {!hasResults && !isLoading && (
                                <div className="py-20 text-center">
                                    <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <Search className="text-gray-300" size={32} />
                                    </div>
                                    <p className="text-gray-500 font-medium">No results found for "{query}"</p>
                                    <p className="text-sm text-gray-400 mt-1">Try searching for Names, IDs or Module names.</p>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 gap-4">
                            <QuickLink
                                icon={Zap}
                                label="View Dashboard"
                                description="Switch to overview"
                                onClick={() => { router.push('/dashboard'); onClose(); }}
                            />
                            <QuickLink
                                icon={Settings}
                                label="School Settings"
                                description="Adjust preferences"
                                onClick={() => { router.push('/settings'); onClose(); }}
                            />
                        </div>
                    )}
                </div>

                {/* Footer / Shortcuts */}
                <div className="px-8 py-4 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
                    <div className="flex gap-6">
                        <Shortcut kbd="↑↓" label="Navigate" />
                        <Shortcut kbd="Enter" label="Select" />
                        <Shortcut kbd="Esc" label="Close" />
                    </div>
                    <div className="flex items-center gap-2 text-brand-600 font-bold text-[10px] uppercase tracking-wider">
                        <Command size={12} />
                        Registra Universal Search
                    </div>
                </div>
            </div>
        </div>
    );
};

function Section({ label, children }: { label: string, children: React.ReactNode }) {
    return (
        <div className="space-y-1">
            <p className="px-4 py-2 text-[10px] font-black text-gray-400 uppercase tracking-widest">{label}</p>
            {children}
        </div>
    );
}

function ResultItem({ icon: Icon, title, subtitle, onClick }: any) {
    return (
        <button
            onClick={onClick}
            className="w-full flex items-center justify-between p-4 hover:bg-brand-50 rounded-2xl group transition-all"
        >
            <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-white border border-gray-100 rounded-xl flex items-center justify-center text-brand-600 shadow-sm group-hover:scale-110 transition-transform">
                    <Icon size={24} />
                </div>
                <div className="text-left">
                    <p className="font-bold text-gray-900 group-hover:text-brand-700 transition-colors">{title}</p>
                    <p className="text-xs text-gray-400">{subtitle}</p>
                </div>
            </div>
            <ArrowRight size={18} className="text-gray-200 group-hover:text-brand-600 group-hover:translate-x-1 transition-all" />
        </button>
    );
}

function QuickLink({ icon: Icon, label, description, onClick }: any) {
    return (
        <button
            onClick={onClick}
            className="flex items-center gap-4 p-5 bg-gray-50/50 hover:bg-white border border-transparent hover:border-brand-100 rounded-3xl transition-all group text-left"
        >
            <div className="p-3 bg-white rounded-2xl shadow-sm text-brand-600 group-hover:scale-110 transition-transform">
                <Icon size={24} />
            </div>
            <div>
                <p className="text-sm font-bold text-gray-900">{label}</p>
                <p className="text-[10px] text-gray-400 uppercase font-black tracking-tight">{description}</p>
            </div>
        </button>
    );
}

function Shortcut({ kbd, label }: { kbd: string, label: string }) {
    return (
        <div className="flex items-center gap-2">
            <kbd className="px-2 py-1 bg-white border border-gray-200 rounded text-[10px] font-bold text-gray-400 shadow-sm">{kbd}</kbd>
            <span className="text-[10px] font-bold text-gray-400 uppercase">{label}</span>
        </div>
    );
}
