import React from 'react';
import { Menu, Search } from 'lucide-react';
import { NotificationCenter } from '@/components/features/NotificationCenter';

interface TopBarProps {
    onMenuToggle: () => void;
    onSearchOpen: () => void;
    currentRole: string;
    settings: any;
}

export function TopBar({
    onMenuToggle,
    onSearchOpen,
    currentRole,
    settings
}: TopBarProps) {
    return (
        <header className="h-16 lg:h-20 bg-white border-b sticky top-0 z-20 flex items-center justify-between px-4 lg:px-6 no-print shadow-sm shrink-0">
            {/* Mobile menu button - hidden on desktop */}
            <button 
                onClick={onMenuToggle} 
                className="p-2 rounded-md transition-colors hover:bg-gray-100 lg:hidden"
            >
                <Menu className="h-5 w-5 text-gray-600" />
            </button>
            <div className="hidden lg:flex items-center gap-4">
                <button
                    onClick={onSearchOpen}
                    className="flex items-center gap-2 px-4 py-2 bg-gray-50 border border-gray-100 rounded-2xl text-gray-400 hover:text-brand-600 hover:bg-white hover:border-brand-200 transition-all group"
                >
                    <Search size={18} className="group-hover:scale-110 transition-transform" />
                    <span className="text-sm font-medium">Search anything...</span>
                    <kbd className="hidden md:inline-flex items-center gap-1 px-1.5 py-0.5 border border-gray-200 rounded text-[10px] font-black text-gray-400">⌘K</kbd>
                </button>
            </div>
            <div className="flex items-center gap-3 lg:gap-6">
                <NotificationCenter />
                <div className="flex items-center gap-2 lg:gap-4 border-l pl-3 lg:pl-6">
                    <div className="text-right hidden sm:block">
                        <p className="text-xs lg:text-sm font-bold text-gray-900 uppercase tracking-tight">{currentRole}</p>
                        <p className="text-xs text-brand-600 font-medium">{settings.current_term}</p>
                    </div>
                    <div className="h-8 w-8 lg:h-10 lg:w-10 bg-brand-50 rounded-full border-2 border-brand-100 flex items-center justify-center font-bold text-brand-700 uppercase text-xs lg:text-sm">
                        {currentRole?.substring(0, 2)}
                    </div>
                </div>
            </div>
        </header>
    );
}
