import React, { useState } from 'react';
import { Plus, Trash2, Filter, Calendar } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/select';
import * as Types from '@/lib/types';
import * as Utils from '@/lib/utils';

interface ExpenseManagementProps {
    expenses: Types.Expense[];
    settings: Types.Settings;
    onAddExpense: () => void;
    onDeleteExpense?: (id: string) => void;
}

export const ExpenseManagement: React.FC<ExpenseManagementProps> = ({
    expenses,
    settings,
    onAddExpense,
    onDeleteExpense
}) => {
    const [filterCategory, setFilterCategory] = useState('all');
    const [filterSession, setFilterSession] = useState('current');

    // Filter expenses
    let filteredExpenses = [...expenses];

    if (filterSession === 'current') {
        filteredExpenses = filteredExpenses.filter(e =>
            e.session === settings.current_session && e.term === settings.current_term
        );
    }

    if (filterCategory !== 'all') {
        filteredExpenses = filteredExpenses.filter(e => e.category === filterCategory);
    }

    // Sort by date descending
    filteredExpenses.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    // Calculate totals with numeric coercion for safety
    const totalExpenses = filteredExpenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);

    // Category totals for current filter
    const categoryTotals = filteredExpenses.reduce((acc, e) => {
        const amt = Number(e.amount) || 0;
        acc[e.category] = (acc[e.category] || 0) + amt;
        return acc;
    }, {} as Record<string, number>);

    const categories = ['salary', 'maintenance', 'supplies', 'utilities', 'other'];
    const categoryColors: Record<string, string> = {
        salary: 'bg-blue-100 text-blue-700',
        maintenance: 'bg-orange-100 text-orange-700',
        supplies: 'bg-green-100 text-green-700',
        utilities: 'bg-purple-100 text-purple-700',
        other: 'bg-gray-100 text-gray-700',
    };

    return (
        <div className="space-y-4">
            {/* Summary Cards */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <Card className="p-4 bg-red-50 border-red-100 col-span-2 md:col-span-1">
                    <p className="text-sm text-red-600">Total Expenses</p>
                    <p className="text-xl font-bold text-red-700">{Utils.formatCurrency(totalExpenses)}</p>
                    <p className="text-xs text-red-500">{filteredExpenses.length} records</p>
                </Card>
                {categories.slice(0, 4).map(cat => (
                    <Card key={cat} className="p-4">
                        <p className="text-sm text-gray-600 capitalize">{cat}</p>
                        <p className="text-lg font-bold text-gray-900">{Utils.formatCurrency(categoryTotals[cat] || 0)}</p>
                    </Card>
                ))}
            </div>

            {/* Filters and Actions */}
            <Card className="p-4">
                <div className="flex flex-wrap items-end gap-4">
                    <div className="flex-1 min-w-[150px]">
                        <Select
                            label="Category"
                            value={filterCategory}
                            onChange={e => setFilterCategory(e.target.value)}
                        >
                            <option value="all">All Categories</option>
                            {categories.map(cat => (
                                <option key={cat} value={cat} className="capitalize">{cat}</option>
                            ))}
                        </Select>
                    </div>
                    <div className="flex-1 min-w-[150px]">
                        <Select
                            label="Period"
                            value={filterSession}
                            onChange={e => setFilterSession(e.target.value)}
                        >
                            <option value="current">Current Term</option>
                            <option value="all">All Time</option>
                        </Select>
                    </div>
                    <Button onClick={onAddExpense}>
                        <Plus className="h-4 w-4 mr-2" /> Record Expense
                    </Button>
                </div>
            </Card>

            {/* Expenses Table */}
            <Card>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-gray-50 text-gray-700">
                            <tr>
                                <th className="px-4 py-3">Date</th>
                                <th className="px-4 py-3">Title</th>
                                <th className="px-4 py-3">Category</th>
                                <th className="px-4 py-3">Session/Term</th>
                                <th className="px-4 py-3 text-right">Amount</th>
                                <th className="px-4 py-3 w-16"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {filteredExpenses.map(e => (
                                <tr key={e.id} className="hover:bg-gray-50">
                                    <td className="px-4 py-3">
                                        <div className="flex items-center gap-2">
                                            <Calendar className="h-4 w-4 text-gray-400" />
                                            {e.date}
                                        </div>
                                    </td>
                                    <td className="px-4 py-3 font-medium text-gray-900">
                                        {e.title}
                                        {e.description && (
                                            <p className="text-xs text-gray-500 font-normal">{e.description}</p>
                                        )}
                                    </td>
                                    <td className="px-4 py-3">
                                        <span className={`px-2 py-1 rounded text-xs capitalize ${categoryColors[e.category] || categoryColors.other}`}>
                                            {e.category}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-gray-500 text-xs">
                                        {e.session} - {e.term}
                                    </td>
                                    <td className="px-4 py-3 text-right font-mono text-red-600 font-semibold">
                                        -{Utils.formatCurrency(e.amount)}
                                    </td>
                                    <td className="px-4 py-3">
                                        {onDeleteExpense && (
                                            <button
                                                onClick={() => onDeleteExpense(e.id)}
                                                className="text-gray-400 hover:text-red-600 p-1"
                                                title="Delete expense"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                            {filteredExpenses.length === 0 && (
                                <tr>
                                    <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                                        No expenses recorded for the selected filters.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                        {filteredExpenses.length > 0 && (
                            <tfoot className="bg-red-50">
                                <tr className="font-bold">
                                    <td colSpan={4} className="px-4 py-3 text-right text-red-700">TOTAL:</td>
                                    <td className="px-4 py-3 text-right font-mono text-red-700">
                                        -{Utils.formatCurrency(totalExpenses)}
                                    </td>
                                    <td></td>
                                </tr>
                            </tfoot>
                        )}
                    </table>
                </div>
            </Card>
        </div>
    );
};
