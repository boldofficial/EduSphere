import React from 'react';
import { Plus, CreditCard, Calendar as CalendarIcon, BadgeCheck, Rocket } from 'lucide-react';
import { Card } from '@/components/ui/card';
import * as Types from '@/lib/types';

interface QuickActionsProps {
    onChangeView: (view: Types.ViewState) => void;
    onTabChange?: (tab: any) => void;
    userRole?: string;
    allowedModules?: string[];
}

export const QuickActions: React.FC<QuickActionsProps> = ({
    onChangeView,
    onTabChange,
    userRole,
    allowedModules = []
}) => {
    return (
        <Card title="Quick Actions">
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
                <button onClick={() => onChangeView('students')} className="group p-3 sm:p-4 bg-white border border-blue-100 hover:border-blue-300 hover:shadow-md rounded-xl flex flex-col items-center justify-center gap-2 sm:gap-3 transition-all">
                    <div className="p-2 sm:p-3 bg-blue-100 text-blue-600 rounded-full group-hover:scale-110 transition-transform"><Plus className="h-5 w-5 sm:h-6 sm:w-6" /></div>
                    <span className="font-semibold text-gray-700 group-hover:text-blue-700 text-xs sm:text-sm">New Student</span>
                </button>
                {allowedModules.includes('bursary') && (
                    <button onClick={() => onChangeView('bursary')} className="group p-3 sm:p-4 bg-white border border-emerald-100 hover:border-emerald-300 hover:shadow-md rounded-xl flex flex-col items-center justify-center gap-2 sm:gap-3 transition-all">
                        <div className="p-2 sm:p-3 bg-emerald-100 text-emerald-600 rounded-full group-hover:scale-110 transition-transform"><CreditCard className="h-5 w-5 sm:h-6 sm:w-6" /></div>
                        <span className="font-semibold text-gray-700 group-hover:text-emerald-700 text-xs sm:text-sm">Record Fee</span>
                    </button>
                )}
                {allowedModules.includes('attendance') && (
                    <button onClick={() => onChangeView('attendance')} className="group p-3 sm:p-4 bg-white border border-rose-100 hover:border-rose-300 hover:shadow-md rounded-xl flex flex-col items-center justify-center gap-2 sm:gap-3 transition-all">
                        <div className="p-2 sm:p-3 bg-rose-100 text-rose-600 rounded-full group-hover:scale-110 transition-transform"><CalendarIcon className="h-5 w-5 sm:h-6 sm:w-6" /></div>
                        <span className="font-semibold text-gray-700 group-hover:text-rose-700 text-xs sm:text-sm">Attendance</span>
                    </button>
                )}
                {allowedModules.includes('id_cards') && (
                    <button onClick={() => onChangeView('id_cards')} className="group p-3 sm:p-4 bg-white border border-orange-100 hover:border-orange-300 hover:shadow-md rounded-xl flex flex-col items-center justify-center gap-2 sm:gap-3 transition-all">
                        <div className="p-2 sm:p-3 bg-orange-100 text-orange-600 rounded-full group-hover:scale-110 transition-transform"><BadgeCheck className="h-5 w-5 sm:h-6 sm:w-6" /></div>
                        <span className="font-semibold text-gray-700 group-hover:text-orange-700 text-xs sm:text-sm">ID Cards</span>
                    </button>
                )}
                {userRole === 'super_admin' && (
                    <button onClick={() => onTabChange?.('demo_requests')} className="group p-3 sm:p-4 bg-white border border-brand-100 hover:border-brand-300 hover:shadow-md rounded-xl flex flex-col items-center justify-center gap-2 sm:gap-3 transition-all">
                        <div className="p-2 sm:p-3 bg-brand-100 text-brand-600 rounded-full group-hover:scale-110 transition-transform"><Rocket className="h-5 w-5 sm:h-6 sm:w-6" /></div>
                        <span className="font-semibold text-gray-700 group-hover:text-brand-700 text-xs sm:text-sm">Demo Requests</span>
                    </button>
                )}
            </div>
        </Card>
    );
};
