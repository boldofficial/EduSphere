import React from 'react';
import { useRouter } from 'next/navigation';
import { Plus, CreditCard, Calendar as CalendarIcon, BadgeCheck, Rocket, Sparkles } from 'lucide-react';
import { Card } from '@/components/ui/card';
import * as Types from '@/lib/types';

interface QuickActionsProps {
    onChangeView: (view: Types.ViewState) => void;
    onTabChange?: (tab: any) => void;
    userRole?: string;
    allowedModules?: string[];
}

export const QuickActions: React.FC<QuickActionsProps> = ({
    onTabChange,
    userRole,
    allowedModules = []
}) => {
    const router = useRouter();

    const actions = [
        {
            id: 'students',
            name: 'New Student',
            icon: Plus,
            href: '/students',
            gradient: 'from-blue-500 to-indigo-600',
            shadow: 'shadow-blue-200',
            bg: 'bg-blue-50'
        },
        {
            id: 'bursary',
            name: 'Record Fee',
            icon: CreditCard,
            href: '/bursary',
            gradient: 'from-emerald-500 to-teal-600',
            shadow: 'shadow-emerald-200',
            bg: 'bg-emerald-50',
            module: 'bursary'
        },
        {
            id: 'attendance',
            name: 'Attendance',
            icon: CalendarIcon,
            href: '/attendance',
            gradient: 'from-rose-500 to-pink-600',
            shadow: 'shadow-rose-200',
            bg: 'bg-rose-50',
            module: 'attendance'
        },
        {
            id: 'id_cards',
            name: 'ID Cards',
            icon: BadgeCheck,
            href: '/id_cards',
            gradient: 'from-orange-500 to-amber-600',
            shadow: 'shadow-orange-200',
            bg: 'bg-orange-50',
            module: 'id_cards'
        },
    ];

    const filteredActions = actions.filter(a => !a.module || allowedModules.includes(a.module));

    return (
        <Card>
            <div className="p-1">
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-2">
                        <div className="p-2 bg-brand-100 rounded-lg text-brand-600">
                            <Sparkles size={18} className="animate-pulse" />
                        </div>
                        <h3 className="text-lg font-black text-gray-900 uppercase tracking-tighter">Quick Actions</h3>
                    </div>
                </div>

                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {filteredActions.map((action) => (
                        <button
                            key={action.id}
                            onClick={() => router.push(action.href)}
                            className={`group relative overflow-hidden p-4 rounded-[24px] border border-white/50 shadow-sm hover:shadow-xl ${action.shadow} transition-all duration-500 bg-white hover:-translate-y-1`}
                        >
                            {/* Colorful Gradient Background on Hover */}
                            <div className={`absolute inset-0 bg-gradient-to-br ${action.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />

                            <div className="relative z-10 flex flex-col items-center gap-4">
                                <div className={`p-4 rounded-2xl ${action.bg} text-gray-700 group-hover:bg-white/20 group-hover:text-white transition-all duration-500 group-hover:scale-110 shadow-sm group-hover:shadow-none`}>
                                    <action.icon className="h-6 w-6" strokeWidth={2.5} />
                                </div>
                                <span className="font-black text-[11px] uppercase tracking-wider text-gray-600 group-hover:text-white transition-colors duration-500">
                                    {action.name}
                                </span>
                            </div>

                            {/* Decorative Sparkle for Premium Look */}
                            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <Sparkles size={12} className="text-white/50" />
                            </div>
                        </button>
                    ))}

                    {userRole === 'super_admin' && (
                        <button
                            onClick={() => onTabChange?.('demo_requests')}
                            className="group relative overflow-hidden p-4 rounded-[24px] border border-indigo-100 shadow-sm hover:shadow-xl shadow-indigo-100 transition-all duration-500 bg-gradient-to-br from-indigo-50 to-white hover:-translate-y-1 flex flex-col items-center gap-4"
                        >
                            <div className="p-4 rounded-2xl bg-indigo-100 text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-all duration-500 group-hover:scale-110 shadow-sm">
                                <Rocket className="h-6 w-6" strokeWidth={2.5} />
                            </div>
                            <span className="font-black text-[11px] uppercase tracking-wider text-indigo-700 transition-colors duration-500 text-center">
                                Demo Requests
                            </span>
                        </button>
                    )}
                </div>
            </div>
        </Card>
    );
};
