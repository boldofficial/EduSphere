import React from 'react';
import Link from 'next/link';
import { Menu, LogOut, ChevronDown, ChevronRight } from 'lucide-react';
import { NAVIGATION_CATEGORIES } from './navigation-config';

interface SidebarProps {
    isOpen: boolean;
    onClose: () => void;
    settings: any;
    filteredNavigation: any[];
    expandedCategories: Record<string, boolean>;
    toggleCategory: (name: string) => void;
    pathname: string;
    onLogout: () => void;
}

export function Sidebar({
    isOpen,
    onClose,
    settings,
    filteredNavigation,
    expandedCategories,
    toggleCategory,
    pathname,
    onLogout
}: SidebarProps) {
    return (
        <>
            {/* Mobile Sidebar Overlay */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-30 lg:hidden"
                    onClick={onClose}
                />
            )}

            {/* Sidebar */}
            <aside className={`
                ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'} 
                w-64 h-full bg-brand-900 transition-all duration-300 flex flex-col fixed inset-y-0 z-40 no-print
            `}>
                <div className="h-16 lg:h-20 flex items-center px-4 lg:px-6 border-b border-white/10 shrink-0 gap-3">
                    <div className="h-10 w-10 bg-white rounded-lg flex items-center justify-center text-brand-600 font-bold shrink-0 shadow-sm">
                        <img src={settings.logo_media || '/logo.png'} alt="Logo" className="h-8 w-8 object-contain" />
                    </div>
                    <span className="ml-2 text-white font-bold text-lg lg:text-xl truncate tracking-tight">
                        {settings.school_name?.split(' ')[0]}
                    </span>
                    {/* Mobile close button */}
                    <button
                        onClick={onClose}
                        className="lg:hidden ml-auto p-2 text-white/70 hover:text-white"
                    >
                        <Menu className="h-5 w-5" />
                    </button>
                </div>

                <nav className="flex-1 px-3 lg:px-4 py-4 lg:py-6 space-y-4 overflow-y-auto custom-scrollbar text-white">
                    {NAVIGATION_CATEGORIES.map((category) => {
                        const items = filteredNavigation.filter(n => n.category === category.name);
                        if (items.length === 0) return null;

                        const isExpanded = expandedCategories[category.name];

                        return (
                            <div key={category.name} className="space-y-1">
                                {category.name !== 'General' ? (
                                    <button
                                        onClick={() => toggleCategory(category.name)}
                                        className="w-full flex items-center justify-between px-2 py-1 text-[10px] font-black uppercase tracking-widest text-brand-300/50 hover:text-brand-200 transition-colors group"
                                    >
                                        <div className="flex items-center gap-2">
                                            <category.icon className={`h-3 w-3 ${category.color}`} />
                                            <span>{category.name}</span>
                                        </div>
                                        {isExpanded ? (
                                            <ChevronDown className="h-3 w-3" />
                                        ) : (
                                            <ChevronRight className="h-3 w-3" />
                                        )}
                                    </button>
                                ) : null}

                                {isExpanded && (
                                    <div className="space-y-1">
                                        {items.map((item) => (
                                            <Link
                                                key={item.id}
                                                href={item.href}
                                                onClick={() => {
                                                    if (window.innerWidth < 1024) onClose();
                                                }}
                                                className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200 group ${pathname === item.href
                                                    ? 'bg-white/10 text-white shadow-sm ring-1 ring-white/20'
                                                    : 'text-brand-100 hover:bg-white/5 hover:text-white'
                                                    }`}
                                            >
                                                <item.icon className={`h-4 w-4 shrink-0 transition-transform group-hover:scale-110 ${pathname === item.href ? 'text-white' : category.color}`} />
                                                <span className="ml-3">{item.name}</span>
                                                {pathname === item.href && (
                                                    <div className="ml-auto w-1.5 h-1.5 bg-brand-400 rounded-full animate-pulse" />
                                                )}
                                            </Link>
                                        ))}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </nav>

                <div className="p-3 lg:p-4 border-t border-white/10 shrink-0">
                    <button
                        onClick={onLogout}
                        className="w-full flex items-center px-3 lg:px-4 py-2.5 lg:py-3 text-sm font-medium text-brand-100 hover:bg-white/5 hover:text-white rounded-lg transition-colors"
                    >
                        <LogOut className="h-5 w-5 shrink-0" />
                        <span className="ml-3">Log Out</span>
                    </button>
                </div>
            </aside>
        </>
    );
}
