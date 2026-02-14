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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-4xl mx-auto">
            {roles.map((role, idx) => (
                <button
                    key={role.id}
                    onClick={() => onSelectRole(role.id)}
                    className="group relative bg-white/[0.03] backdrop-blur-2xl rounded-[3rem] p-10 border transition-all duration-500 text-left hover:-translate-y-2 border-white/10 hover:bg-white/[0.07] hover:border-accent-500/30 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.5)] overflow-hidden flex flex-col h-full min-h-[300px]"
                    style={{ animationDelay: `${idx * 100}ms` }}
                >
                    <div
                        className="absolute -top-32 -right-32 w-64 h-64 rounded-full opacity-0 group-hover:opacity-10 transition-opacity duration-700 blur-[100px]"
                        style={{ backgroundColor: role.themeColor }}
                    />

                    <div className="relative z-10">
                        <div
                            className="w-20 h-20 rounded-[2rem] flex items-center justify-center mb-10 shadow-2xl transition-all duration-500 group-hover:scale-110 group-hover:rotate-6"
                            style={{
                                backgroundColor: `${role.themeColor}15`,
                                border: `1px solid ${role.themeColor}30`,
                                boxShadow: `0 0 40px ${role.themeColor}20`
                            }}
                        >
                            <role.icon size={40} style={{ color: role.themeColor }} />
                        </div>

                        <h3 className="text-3xl font-black text-white mb-4 tracking-tighter group-hover:text-accent-400 transition-colors uppercase italic">
                            {role.name}
                        </h3>
                        <p className="text-white/50 text-base font-medium mb-12 leading-relaxed max-w-[240px]">
                            {role.desc}
                        </p>
                    </div>

                    <div className="mt-auto relative z-10 flex items-center justify-between">
                        <span className="text-[11px] font-black uppercase tracking-[0.4em] text-white/30 group-hover:text-white transition-colors">
                            Enter Portal
                        </span>
                        <div className="w-12 h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white group-hover:bg-accent-500 group-hover:text-brand-950 transition-all duration-300 shadow-xl">
                            <ArrowRight size={24} className="transition-transform group-hover:translate-x-1" />
                        </div>
                    </div>
                    <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-gradient-to-r from-transparent via-accent-500/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                </button>
            ))}
        </div>
    );
};
