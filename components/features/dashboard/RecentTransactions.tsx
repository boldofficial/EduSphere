import React from 'react';
import { DollarSign } from 'lucide-react';
import { Card } from '@/components/ui/card';
import * as Types from '@/lib/types';
import * as Utils from '@/lib/utils';

interface RecentTransactionsProps {
    payments: Types.Payment[];
    students: Types.Student[];
}

export const RecentTransactions: React.FC<RecentTransactionsProps> = ({ payments, students }) => {
    return (
        <Card title="Recent Transactions">
            <div className="space-y-4 mt-2">
                {payments.slice(-4).reverse().map(p => {
                    const s = students.find(std => std.id === p.student_id);
                    return (
                        <div key={p.id} className="flex items-center gap-3 pb-3 border-b border-gray-100 last:border-0 last:pb-0">
                            <div className="h-10 w-10 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center flex-shrink-0 border border-emerald-100"><DollarSign className="h-5 w-5" /></div>
                            <div className="min-w-0 flex-1">
                                <p className="text-sm font-semibold text-gray-900 truncate">{s?.names || 'Unknown Student'}</p>
                                <p className="text-xs text-gray-500">School Fees Payment</p>
                            </div>
                            <div className="text-sm font-bold text-emerald-600">+{Utils.formatCurrency(p.amount)}</div>
                        </div>
                    )
                })}
                {payments.length === 0 && <p className="text-gray-400 text-sm text-center py-4 italic">No recent payments recorded.</p>}
            </div>
        </Card>
    );
};
