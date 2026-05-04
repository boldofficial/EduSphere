'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, GraduationCap, CalendarCheck, Wallet, Menu } from 'lucide-react';

interface BottomNavProps {
    onMenuToggle: () => void;
}

export function BottomNav({ onMenuToggle }: BottomNavProps) {
    const pathname = usePathname();

    const navItems = [
        { id: 'dashboard', name: 'Home', href: '/dashboard', icon: LayoutDashboard },
        { id: 'students', name: 'Students', href: '/students', icon: GraduationCap },
        { id: 'attendance', name: 'Attendance', href: '/attendance', icon: CalendarCheck },
        { id: 'bursary', name: 'Bursary', href: '/bursary', icon: Wallet },
    ];

    return (
        <nav className="lg:hidden fixed bottom-4 left-4 right-4 bg-white/80 backdrop-blur-xl border border-white/20 rounded-2xl px-2 py-2 z-40 shadow-[0_8px_32px_rgba(0,0,0,0.12)] flex items-center justify-around no-print ring-1 ring-black/[0.03]">
            {navItems.map((item) => {
                const isActive = pathname === item.href;
                return (
                    <Link
                        key={item.id}
                        href={item.href}
                        className={`relative flex flex-col items-center justify-center py-2 px-3 rounded-xl transition-all duration-300 group ${isActive
                            ? 'text-brand-600 scale-105'
                            : 'text-gray-400 active:scale-95'
                            }`}
                    >
                        {isActive && (
                            <span className="absolute inset-0 bg-brand-50/50 rounded-xl -z-10 animate-in fade-in zoom-in duration-300" />
                        )}
                        <item.icon className={`h-5 w-5 mb-1 transition-transform duration-300 group-hover:-translate-y-0.5 ${isActive ? 'stroke-[2.5px]' : 'stroke-[1.5px]'}`} />
                        <span className={`text-[10px] font-bold tracking-tight transition-colors ${isActive ? 'text-brand-700' : 'text-gray-500'}`}>{item.name}</span>
                    </Link>
                );
            })}
            <button
                onClick={onMenuToggle}
                className="flex flex-col items-center justify-center py-2 px-3 rounded-xl text-gray-400 active:scale-95 transition-all duration-300 group"
            >
                <Menu className="h-5 w-5 mb-1 transition-transform duration-300 group-hover:-translate-y-0.5 stroke-[1.5px]" />
                <span className="text-[10px] font-bold text-gray-500 tracking-tight">More</span>
            </button>
        </nav>
    );
}
