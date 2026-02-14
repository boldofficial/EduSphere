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
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 w-full max-w-4xl mx-auto">
            {roles.map((role, idx) => (
                <button
                    key={role.id}
                    onClick={() => onSelectRole(role.id)}
                    className="group relative bg-white/[0.03] backdrop-blur-3xl rounded-[3rem] p-10 border transition-all duration-700 text-left hover:-translate-y-3 border-white/10 hover:bg-white/[0.08] hover:border-accent-500/50 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.5)] overflow-hidden flex flex-col h-full min-h-[280px]"
                    style={{ animationDelay: `${idx * 150}ms` }}
                >
                    {/* Visual Flare */}
                    <div
                        className="absolute -top-32 -right-32 w-64 h-64 rounded-full opacity-0 group-hover:opacity-10 transition-opacity duration-1000 blur-[100px]"
                        style={{ backgroundColor: role.themeColor }}
                    />

                    <div className="relative z-10 flex flex-col h-full">
                        <div
                            className="w-20 h-20 rounded-[2.5rem] flex items-center justify-center mb-10 shadow-2xl transition-all duration-700 group-hover:scale-110 group-hover:rotate-[15deg] group-hover:shadow-[0_0_50px_rgba(255,255,255,0.1)]"
                            style={{
                                backgroundColor: `${role.themeColor}15`,
                                border: `2px solid ${role.themeColor}30`,
                            }}
                        >
                            <role.icon size={44} strokeWidth={1.5} style={{ color: role.themeColor }} />
                        </div>

                        <div className="space-y-3">
                            <h3 className="text-4xl font-black text-white tracking-tighter group-hover:text-accent-400 transition-colors uppercase italic leading-none">
                                {role.name}
                            </h3>
                            <p className="text-white/40 text-sm font-medium leading-relaxed max-w-[220px]">
                                {role.desc}
                            </p>
                        </div>

                        <div className="mt-auto pt-10 flex items-center justify-between">
                            <div className="flex flex-col">
                                <span className="text-[10px] font-black uppercase tracking-[0.5em] text-white/20 group-hover:text-white/60 transition-colors">
                                    Secure
                                </span>
                                <span className="text-[10px] font-black uppercase tracking-[0.5em] text-accent-500/40 group-hover:text-accent-500 transition-colors">
                                    Terminal
                                </span>
                            </div>
                            <div className="w-14 h-14 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white group-hover:bg-accent-500 group-hover:text-brand-950 transition-all duration-500 shadow-2xl group-hover:scale-110 group-hover:rotate-[-45deg]">
                                <ArrowRight size={28} className="transition-transform group-hover:translate-x-0.5" />
                            </div>
                        </div>
                    </div>

                    {/* Hover Border Glow */}
                    <div className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-transparent via-accent-500/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                </button>
            ))}
        </div>
    );
};
