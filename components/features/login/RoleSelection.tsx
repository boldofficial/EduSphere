'use client';

import React from 'react';
import { ArrowRight, LucideIcon } from 'lucide-react';
import { UserRole } from '@/lib/types';

interface Role {
    id: UserRole;
    name: string;
    icon: LucideIcon;
    themeColor: string;
    color: string;
    desc: string;
}

interface RoleSelectionProps {
    roles: Role[];
    onSelectRole: (role: UserRole) => void;
}

export const RoleSelection: React.FC<RoleSelectionProps> = ({ roles, onSelectRole }) => {
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 px-4 md:px-0 w-full max-w-7xl">
            {roles.map((role, idx) => (
                <button
                    key={role.id}
                    onClick={() => onSelectRole(role.id)}
                    className="group relative bg-white/5 backdrop-blur-xl rounded-[2.5rem] p-8 border transition-all duration-500 text-left hover:-translate-y-3 border-white/10 hover:bg-white/10 hover:border-accent-500/50 shadow-2xl overflow-hidden flex flex-col h-full"
                    style={{ animationDelay: `${idx * 100}ms` }}
                >
                    <div
                        className="absolute -top-24 -right-24 w-48 h-48 rounded-full opacity-0 group-hover:opacity-20 transition-opacity duration-700 blur-[80px]"
                        style={{ backgroundColor: role.themeColor }}
                    />

                    <div className="relative z-10">
                        <div
                            className="w-16 h-16 rounded-2xl flex items-center justify-center mb-8 shadow-inner transition-transform duration-500 group-hover:scale-110 group-hover:rotate-3"
                            style={{ backgroundColor: `${role.themeColor}20`, border: `1px solid ${role.themeColor}40` }}
                        >
                            <role.icon size={32} style={{ color: role.themeColor }} />
                        </div>

                        <h3 className="text-2xl font-black text-white mb-3 tracking-tight group-hover:text-accent-400 transition-colors">
                            {role.name}
                        </h3>
                        <p className="text-gray-400 text-sm font-medium mb-10 leading-relaxed min-h-[3rem]">
                            {role.desc}
                        </p>
                    </div>

                    <div className="mt-auto relative z-10 flex items-center justify-between">
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40 group-hover:text-white transition-colors">
                            Access Portal
                        </span>
                        <div className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white group-hover:bg-accent-500 group-hover:text-brand-950 transition-all duration-300">
                            <ArrowRight size={20} className="transition-transform group-hover:translate-x-1" />
                        </div>
                    </div>
                    <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-accent-500 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                </button>
            ))}
        </div>
    );
};
