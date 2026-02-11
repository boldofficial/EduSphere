'use client';

import React from 'react';
import { Activity, CreditCard } from 'lucide-react';
import { StatCard } from './OverviewTab';

export function FinancialsTab({ revenue }: any) {
    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <h2 className="text-3xl font-bold text-gray-900">Financial Overview</h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <StatCard
                    title="Total Revenue"
                    value={`₦${parseFloat(revenue?.total_revenue || 0).toLocaleString()}`}
                    icon={CreditCard}
                    color="bg-green-600"
                />
                <StatCard
                    title="This Month"
                    value="₦0.00"
                    icon={Activity}
                    color="bg-blue-600"
                />
            </div>

            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Recent Transactions</h3>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 border-b border-gray-200">
                            <tr>
                                <th className="px-4 py-3 font-bold text-gray-500 text-sm">School</th>
                                <th className="px-4 py-3 font-bold text-gray-500 text-sm">Amount</th>
                                <th className="px-4 py-3 font-bold text-gray-500 text-sm">Date</th>
                                <th className="px-4 py-3 font-bold text-gray-500 text-sm">Reference</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {revenue?.recent_payments?.map((payment: any, i: number) => (
                                <tr key={i}>
                                    <td className="px-4 py-3 font-medium">{payment.school__name}</td>
                                    <td className="px-4 py-3 text-green-600 font-bold">₦{parseFloat(payment.amount).toLocaleString()}</td>
                                    <td className="px-4 py-3 text-gray-500 text-sm">{new Date(payment.date).toLocaleDateString()}</td>
                                    <td className="px-4 py-3 text-gray-500 text-xs font-mono">{payment.reference}</td>
                                </tr>
                            ))}
                            {(!revenue?.recent_payments || revenue.recent_payments.length === 0) && (
                                <tr>
                                    <td colSpan={4} className="px-4 py-8 text-center text-gray-400">No recent transactions</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
