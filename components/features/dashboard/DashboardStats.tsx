import React from 'react';
import { GraduationCap, Users, TrendingUp, TrendingDown } from 'lucide-react';
import * as Utils from '@/lib/utils';

interface DashboardStatsProps {
    studentsCount: number;
    staffCount: number;
    revenue: number;
    expenses: number;
    targetRevenue: number;
    transactionsCount: number;
    allowedModules?: string[];
}

export const DashboardStats: React.FC<DashboardStatsProps> = ({
    studentsCount, staffCount, revenue, expenses, targetRevenue, transactionsCount, allowedModules = []
}) => {
    const showBursary = allowedModules.includes('bursary');

    return (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
            <div className="relative overflow-hidden rounded-xl lg:rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 p-3 sm:p-4 lg:p-6 text-white shadow-lg transition-transform hover:scale-[1.02]">
                <div className="relative z-10 flex justify-between items-start">
                    <div className="min-w-0">
                        <p className="text-blue-100 text-[10px] sm:text-xs lg:text-sm font-medium truncate">Total Students</p>
                        <h3 className="text-xl sm:text-2xl lg:text-3xl font-bold mt-1 sm:mt-2">{studentsCount}</h3>
                        <p className="text-[10px] sm:text-xs text-blue-200 mt-1 hidden sm:block">Active Enrollment</p>
                    </div>
                    <div className="p-1.5 sm:p-2 bg-white/20 rounded-lg backdrop-blur-sm shrink-0"><GraduationCap className="h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6 text-white" /></div>
                </div>
                <div className="absolute -bottom-4 -right-4 h-16 sm:h-24 w-16 sm:w-24 rounded-full bg-white/10 blur-xl"></div>
            </div>
            <div className="relative overflow-hidden rounded-xl lg:rounded-2xl bg-gradient-to-br from-purple-500 to-purple-600 p-3 sm:p-4 lg:p-6 text-white shadow-lg transition-transform hover:scale-[1.02]">
                <div className="relative z-10 flex justify-between items-start">
                    <div className="min-w-0">
                        <p className="text-purple-100 text-[10px] sm:text-xs lg:text-sm font-medium truncate">Total Staff</p>
                        <h3 className="text-xl sm:text-2xl lg:text-3xl font-bold mt-1 sm:mt-2">{staffCount}</h3>
                        <p className="text-[10px] sm:text-xs text-purple-200 mt-1 hidden sm:block">Academic & Non-Academic</p>
                    </div>
                    <div className="p-1.5 sm:p-2 bg-white/20 rounded-lg backdrop-blur-sm shrink-0"><Users className="h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6 text-white" /></div>
                </div>
                <div className="absolute -bottom-4 -right-4 h-16 sm:h-24 w-16 sm:w-24 rounded-full bg-white/10 blur-xl"></div>
            </div>

            {showBursary && (
                <>
                    <div className="relative overflow-hidden rounded-xl lg:rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-600 p-3 sm:p-4 lg:p-6 text-white shadow-lg transition-transform hover:scale-[1.02]">
                        <div className="relative z-10 flex justify-between items-start">
                            <div className="min-w-0">
                                <p className="text-emerald-100 text-[10px] sm:text-xs lg:text-sm font-medium truncate">Revenue (Term)</p>
                                <h3 className="text-xl sm:text-2xl lg:text-3xl font-bold mt-1 sm:mt-2">{Utils.formatCurrency(revenue)}</h3>
                                <p className="text-[10px] sm:text-xs text-emerald-200 mt-1 hidden sm:block">Target: {Utils.formatCurrency(targetRevenue)}</p>
                            </div>
                            <div className="p-1.5 sm:p-2 bg-white/20 rounded-lg backdrop-blur-sm shrink-0"><TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6 text-white" /></div>
                        </div>
                        <div className="absolute -bottom-4 -right-4 h-16 sm:h-24 w-16 sm:w-24 rounded-full bg-white/10 blur-xl"></div>
                    </div>
                    <div className="relative overflow-hidden rounded-xl lg:rounded-2xl bg-gradient-to-br from-rose-500 to-rose-600 p-3 sm:p-4 lg:p-6 text-white shadow-lg transition-transform hover:scale-[1.02]">
                        <div className="relative z-10 flex justify-between items-start">
                            <div className="min-w-0">
                                <p className="text-rose-100 text-[10px] sm:text-xs lg:text-sm font-medium truncate">Expenses (Term)</p>
                                <h3 className="text-xl sm:text-2xl lg:text-3xl font-bold mt-1 sm:mt-2">{Utils.formatCurrency(expenses)}</h3>
                                <p className="text-[10px] sm:text-xs text-rose-200 mt-1 hidden sm:block">{transactionsCount} Transactions</p>
                            </div>
                            <div className="p-1.5 sm:p-2 bg-white/20 rounded-lg backdrop-blur-sm shrink-0"><TrendingDown className="h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6 text-white" /></div>
                        </div>
                        <div className="absolute -bottom-4 -right-4 h-16 sm:h-24 w-16 sm:w-24 rounded-full bg-white/10 blur-xl"></div>
                    </div>
                </>
            )}
        </div>
    );
};
