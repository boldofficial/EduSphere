import React, { useState } from 'react';
import { Search, Download, Printer, Phone, Mail, Filter, Bell } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import * as Types from '@/lib/types';
import * as Utils from '@/lib/utils';
import { useToast } from '@/components/providers/toast-provider';
import apiClient from '@/lib/api-client';

interface DebtorReportProps {
    students: Types.Student[];
    classes: Types.Class[];
    fees: Types.FeeStructure[];
    payments: Types.Payment[];
    settings: Types.Settings;
}

export const DebtorReport: React.FC<DebtorReportProps> = ({
    students, classes, fees, payments, settings
}) => {
    const { addToast } = useToast();
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedClass, setSelectedClass] = useState('all');
    const [sortBy, setSortBy] = useState<'balance' | 'name'>('balance');
    const [minAmount, setMinAmount] = useState('');
    const [isSending, setIsSending] = useState(false);

    // Calculate debtors
    const allDebtors = students.map(student => {
        const cls = classes.find(c => c.id === student.class_id);
        const { totalBill, totalPaid, balance } = Utils.getStudentBalance(student, fees, payments, settings.current_session, settings.current_term);
        return { student, cls, totalBill, totalPaid, balance };
    }).filter(d => d.balance > 0);

    // Apply filters
    let filteredDebtors = [...allDebtors];

    if (searchTerm) {
        filteredDebtors = filteredDebtors.filter(d =>
            d.student.names.toLowerCase().includes(searchTerm.toLowerCase()) ||
            d.student.student_no.toLowerCase().includes(searchTerm.toLowerCase()) ||
            d.student.parent_name.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }

    if (selectedClass !== 'all') {
        filteredDebtors = filteredDebtors.filter(d => String(d.student.class_id) === String(selectedClass));
    }

    if (minAmount) {
        filteredDebtors = filteredDebtors.filter(d => d.balance >= Number(minAmount));
    }

    // Sort
    if (sortBy === 'balance') {
        filteredDebtors.sort((a, b) => b.balance - a.balance);
    } else {
        filteredDebtors.sort((a, b) => a.student.names.localeCompare(b.student.names));
    }

    const totalOutstanding = filteredDebtors.reduce((sum, d) => sum + d.balance, 0);

    const handleSendReminders = async () => {
        if (!window.confirm(`Send payment reminders to ${filteredDebtors.length} debtors?`)) return;

        setIsSending(true);
        try {
            await apiClient.post('/student-fees/send-reminders/', {
                student_ids: filteredDebtors.map(d => d.student.id),
                message: `Dear Parent, this is a friendly reminder of your outstanding balance of ${Utils.formatCurrency(totalOutstanding)} for ${settings.current_term}. Please kindly settle at your earliest convenience.`
            });
            addToast(`Successfully queued ${filteredDebtors.length} reminders.`, 'success');
        } catch (error) {
            addToast('Failed to send reminders. Please try again.', 'error');
        } finally {
            setIsSending(false);
        }
    };

    const handlePrint = () => {
        // ... existing handlePrint logic ...
        const printWindow = window.open('', '_blank');
        if (!printWindow) return;

        printWindow.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>Debtor Report - ${settings.school_name}</title>
                <style>
                    * { margin: 0; padding: 0; box-sizing: border-box; }
                    body { font-family: 'Segoe UI', Arial, sans-serif; padding: 20px; }
                    .header { text-align: center; margin-bottom: 20px; padding-bottom: 15px; border-bottom: 2px solid #1A3A5C; }
                    .school-name { font-size: 20px; font-weight: 800; color: #1A3A5C; }
                    .report-title { font-size: 14px; color: #666; margin-top: 5px; }
                    .summary { display: flex; justify-content: space-between; margin-bottom: 20px; padding: 10px; background: #f5f5f5; border-radius: 4px; }
                    table { width: 100%; border-collapse: collapse; font-size: 11px; }
                    th { background: #1A3A5C; color: white; padding: 8px; text-align: left; }
                    td { padding: 8px; border-bottom: 1px solid #ddd; }
                    tr:nth-child(even) { background: #f9f9f9; }
                    .amount { text-align: right; font-weight: 600; }
                    .total-row { background: #1A3A5C !important; color: white; font-weight: bold; }
                    .footer { margin-top: 20px; text-align: center; font-size: 10px; color: #999; }
                </style>
            </head>
            <body>
                <div class="header">
                    <div class="school-name">${settings.school_name}</div>
                    <div class="report-title">DEBTOR REPORT - ${settings.current_session} (${settings.current_term})</div>
                    <div class="report-title">Generated: ${new Date().toLocaleDateString()}</div>
                </div>
                <div class="summary">
                    <span>Total Debtors: ${filteredDebtors.length}</span>
                    <span>Total Outstanding: ${Utils.formatCurrency(totalOutstanding)}</span>
                </div>
                <table>
                    <thead>
                        <tr>
                            <th>S/N</th>
                            <th>Student Name</th>
                            <th>Student ID</th>
                            <th>Class</th>
                            <th>Parent/Guardian</th>
                            <th>Phone</th>
                            <th class="amount">Total Bill</th>
                            <th class="amount">Paid</th>
                            <th class="amount">Balance</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${filteredDebtors.map((d, i) => `
                            <tr>
                                <td>${i + 1}</td>
                                <td>${d.student.names}</td>
                                <td>${d.student.student_no}</td>
                                <td>${d.cls?.name || 'N/A'}</td>
                                <td>${d.student.parent_name}</td>
                                <td>${d.student.parent_phone}</td>
                                <td class="amount">${Utils.formatCurrency(d.totalBill)}</td>
                                <td class="amount">${Utils.formatCurrency(d.totalPaid)}</td>
                                <td class="amount" style="color: #c53030;">${Utils.formatCurrency(d.balance)}</td>
                            </tr>
                        `).join('')}
                        <tr class="total-row">
                            <td colspan="6">TOTAL</td>
                            <td class="amount">${Utils.formatCurrency(filteredDebtors.reduce((s, d) => s + (Number(d.totalBill) || 0), 0))}</td>
                            <td class="amount">${Utils.formatCurrency(filteredDebtors.reduce((s, d) => s + (Number(d.totalPaid) || 0), 0))}</td>
                            <td class="amount">${Utils.formatCurrency(totalOutstanding)}</td>
                        </tr>
                    </tbody>
                </table>
                <div class="footer">${settings.school_tagline}</div>
            </body>
            </html>
        `);

        printWindow.document.close();
        printWindow.focus();
        setTimeout(() => { printWindow.print(); printWindow.close(); }, 250);
    };

    return (
        <div className="space-y-4">
            {/* Filters */}
            <Card className="p-4">
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
                    <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search by name, ID, or parent..."
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
                            />
                        </div>
                    </div>
                    <Select label="Class" value={selectedClass} onChange={e => setSelectedClass(e.target.value)}>
                        <option value="all">All Classes</option>
                        {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </Select>
                    <Input
                        label="Min Amount"
                        type="number"
                        placeholder="0"
                        value={minAmount}
                        onChange={e => setMinAmount(e.target.value)}
                    />
                    <div className="flex gap-2">
                        <Button
                            onClick={handleSendReminders}
                            disabled={isSending || filteredDebtors.length === 0}
                            className="h-10 bg-amber-600 hover:bg-amber-700 disabled:opacity-50"
                        >
                            <Bell className={`h-4 w-4 mr-2 ${isSending ? 'animate-bounce' : ''}`} />
                            {isSending ? 'Sending...' : 'Send Reminders'}
                        </Button>
                        <Button onClick={handlePrint} variant="outline" className="h-10">
                            <Printer className="h-4 w-4 mr-2" /> Print Report
                        </Button>
                    </div>
                </div>
            </Card>

            {/* Summary */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="p-4 bg-red-50 border-red-100">
                    <p className="text-sm text-red-600">Total Outstanding</p>
                    <p className="text-2xl font-bold text-red-700">{Utils.formatCurrency(totalOutstanding)}</p>
                </Card>
                <Card className="p-4 bg-amber-50 border-amber-100">
                    <p className="text-sm text-amber-600">Number of Debtors</p>
                    <p className="text-2xl font-bold text-amber-700">{filteredDebtors.length}</p>
                </Card>
                <Card className="p-4 bg-blue-50 border-blue-100">
                    <p className="text-sm text-blue-600">Average Debt</p>
                    <p className="text-2xl font-bold text-blue-700">
                        {filteredDebtors.length > 0 ? Utils.formatCurrency(totalOutstanding / filteredDebtors.length) : '₦0'}
                    </p>
                </Card>
            </div>

            {/* Debtors Table */}
            <Card>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="bg-gray-50 text-gray-700">
                            <tr>
                                <th className="px-4 py-3 text-left">S/N</th>
                                <th className="px-4 py-3 text-left">Student</th>
                                <th className="px-4 py-3 text-left">Class</th>
                                <th className="px-4 py-3 text-left">Parent/Guardian</th>
                                <th className="px-4 py-3 text-left">Contact</th>
                                <th className="px-4 py-3 text-right">Total Bill</th>
                                <th className="px-4 py-3 text-right">Paid</th>
                                <th className="px-4 py-3 text-right">Balance</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {filteredDebtors.map((d, index) => (
                                <tr key={d.student.id} className="hover:bg-gray-50">
                                    <td className="px-4 py-3 text-gray-500">{index + 1}</td>
                                    <td className="px-4 py-3">
                                        <div className="font-medium text-gray-900">{d.student.names}</div>
                                        <div className="text-xs text-gray-500">{d.student.student_no}</div>
                                    </td>
                                    <td className="px-4 py-3">
                                        <span className="px-2 py-1 bg-blue-50 text-blue-700 rounded text-xs">
                                            {d.cls?.name || 'N/A'}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-gray-700">{d.student.parent_name}</td>
                                    <td className="px-4 py-3">
                                        <div className="flex items-center gap-2">
                                            <a href={`tel:${d.student.parent_phone}`} className="text-brand-600 hover:text-brand-700">
                                                <Phone size={14} />
                                            </a>
                                            <span className="text-xs text-gray-500">{d.student.parent_phone}</span>
                                        </div>
                                    </td>
                                    <td className="px-4 py-3 text-right font-mono">{Utils.formatCurrency(d.totalBill)}</td>
                                    <td className="px-4 py-3 text-right font-mono text-green-600">{Utils.formatCurrency(d.totalPaid)}</td>
                                    <td className="px-4 py-3 text-right font-mono font-bold text-red-600">{Utils.formatCurrency(d.balance)}</td>
                                </tr>
                            ))}
                            {filteredDebtors.length === 0 && (
                                <tr>
                                    <td colSpan={8} className="px-4 py-8 text-center text-gray-500">
                                        {allDebtors.length === 0 ? '🎉 No outstanding fees - all students are up to date!' : 'No debtors match your filter criteria.'}
                                    </td>
                                </tr>
                            )}
                        </tbody>
                        {filteredDebtors.length > 0 && (
                            <tfoot className="bg-gray-100 font-bold">
                                <tr>
                                    <td colSpan={5} className="px-4 py-3 text-right">TOTAL:</td>
                                    <td className="px-4 py-3 text-right font-mono">
                                        {Utils.formatCurrency(filteredDebtors.reduce((s, d) => s + (Number(d.totalBill) || 0), 0))}
                                    </td>
                                    <td className="px-4 py-3 text-right font-mono text-green-600">
                                        {Utils.formatCurrency(filteredDebtors.reduce((s, d) => s + (Number(d.totalPaid) || 0), 0))}
                                    </td>
                                    <td className="px-4 py-3 text-right font-mono text-red-600">
                                        {Utils.formatCurrency(totalOutstanding)}
                                    </td>
                                </tr>
                            </tfoot>
                        )}
                    </table>
                </div>
            </Card>
        </div>
    );
};
