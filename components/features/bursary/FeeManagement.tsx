import React, { useState } from 'react';
import { Plus, Printer, Trash2, User, Search, FileText } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/select';
import * as Types from '@/lib/types';
import * as Utils from '@/lib/utils';

interface FeeManagementProps {
    students: Types.Student[];
    classes: Types.Class[];
    fees: Types.FeeStructure[];
    payments: Types.Payment[];
    settings: Types.Settings;
    selectedClass: string;
    setSelectedClass: (id: string) => void;
    selectedStudent: string | null;
    setSelectedStudent: (id: string | null) => void;
    onRecordPayment: () => void;
    onPrintReceipt: (p: Types.Payment) => void;
    onDeletePayment: (id: string) => void;
    onPrintInvoice?: (student: Types.Student) => void;
    onUpdateStudent?: (student: Types.Student) => void;
    onOpenDiscountModal?: () => void;
}

const RefreshIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-rotate-cw"><path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8" /><path d="M21 3v5h-5" /></svg>
);

export const FeeManagement: React.FC<FeeManagementProps> = ({
    students, classes, fees, payments, settings, selectedClass, setSelectedClass, selectedStudent, setSelectedStudent, onRecordPayment, onPrintReceipt, onDeletePayment, onPrintInvoice, onUpdateStudent, onOpenDiscountModal
}) => {
    const [searchTerm, setSearchTerm] = useState('');

    const activeStudents = students.filter(s => String(s.class_id) === String(selectedClass));

    // Apply search filter
    const filteredStudents = searchTerm
        ? activeStudents.filter(s =>
            s.names.toLowerCase().includes(searchTerm.toLowerCase()) ||
            s.student_no.toLowerCase().includes(searchTerm.toLowerCase())
        )
        : activeStudents;

    const student = students.find(s => s.id === selectedStudent);
    const studentPayments = selectedStudent
        ? payments.filter(p => String(p.student_id) === String(selectedStudent))
        : [];

    // Derived values using the new logic
    const { totalBill, totalPaid, balance, totalDiscount, applicableFees } = student
        ? Utils.getStudentBalance(student, fees, payments, settings.current_session, settings.current_term)
        : { totalBill: 0, totalPaid: 0, balance: 0, totalDiscount: 0, applicableFees: [] };

    const handleToggleFee = (feeId: string, assigned: boolean) => {
        if (!student || !onUpdateStudent) return;
        const currentAssigned = student.assigned_fees || [];
        const newAssigned = assigned
            ? [...currentAssigned, feeId]
            : currentAssigned.filter(id => id !== feeId);

        onUpdateStudent({ ...student, assigned_fees: newAssigned });
    };

    const handleRemoveDiscount = (discountId: string) => {
        if (!student || !onUpdateStudent) return;
        const newDiscounts = (student.discounts || []).filter(d => d.id !== discountId);
        onUpdateStudent({ ...student, discounts: newDiscounts });
    };

    // Get all potential optional fees for this student's class
    const potentialOptionalFees = student
        ? fees.filter(f => (f.class_id === null || f.class_id === student.class_id) && f.session === settings.current_session && f.term === settings.current_term && f.is_optional)
        : [];

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
            <div className="lg:col-span-1 space-y-4">
                <Card className="h-full">
                    <div className="mb-4">
                        <Select label="Select Class" value={selectedClass} onChange={e => setSelectedClass(e.target.value)}>
                            {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </Select>
                    </div>

                    {/* Search */}
                    <div className="mb-4">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search student..."
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
                            />
                        </div>
                    </div>

                    <div className="space-y-1 max-h-[300px] lg:h-[550px] overflow-y-auto">
                        {filteredStudents.map(s => {
                            const bal = Utils.getStudentBalance(s, fees, payments, settings.current_session, settings.current_term).balance;
                            return (
                                <div
                                    key={s.id}
                                    onClick={() => setSelectedStudent(s.id)}
                                    className={`p-2 lg:p-3 rounded-md cursor-pointer flex justify-between items-center text-sm transition-colors ${selectedStudent === s.id
                                        ? 'bg-brand-50 border-brand-200 border'
                                        : 'hover:bg-gray-50'
                                        }`}
                                >
                                    <div className="min-w-0 flex-1">
                                        <div className="font-medium truncate">{s.names}</div>
                                        <div className="text-xs text-gray-500">{s.student_no}</div>
                                    </div>
                                    <div className={`font-mono text-xs lg:text-sm shrink-0 ml-2 ${bal > 0 ? 'text-red-600' : 'text-green-600'}`}>
                                        {bal > 0 ? `-${Utils.formatCurrency(bal)}` : '✓'}
                                    </div>
                                </div>
                            );
                        })}
                        {filteredStudents.length === 0 && (
                            <div className="text-center py-8 text-gray-400 text-sm">
                                {searchTerm ? 'No students match your search' : 'No students in this class'}
                            </div>
                        )}
                    </div>
                </Card>
            </div>
            <div className="lg:col-span-2">
                {selectedStudent && student ? (
                    <div className="space-y-4 lg:space-y-6">
                        {/* Summary Cards */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 lg:gap-4">
                            <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200 p-3 lg:p-4 shadow-sm">
                                <div className="text-[10px] lg:text-xs font-bold text-blue-600 uppercase tracking-wider mb-1">Total Bill</div>
                                <div className="text-lg lg:text-2xl font-extrabold text-blue-900">{Utils.formatCurrency(totalBill)}</div>
                            </Card>
                            <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200 p-3 lg:p-4 shadow-sm">
                                <div className="text-[10px] lg:text-xs font-bold text-green-600 uppercase tracking-wider mb-1">Total Paid</div>
                                <div className="text-lg lg:text-2xl font-extrabold text-green-900">{Utils.formatCurrency(totalPaid)}</div>
                            </Card>
                            <Card className={`p-3 lg:p-4 shadow-sm border-2 ${balance > 0 ? 'bg-gradient-to-br from-rose-50 to-rose-100 border-rose-200' : 'bg-gradient-to-br from-emerald-50 to-emerald-100 border-emerald-200'}`}>
                                <div className={`text-[10px] lg:text-xs font-bold uppercase tracking-wider mb-1 ${balance > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                                    {balance > 0 ? 'Outstanding' : 'Status'}
                                </div>
                                <div className={`text-lg lg:text-2xl font-extrabold ${balance > 0 ? 'text-rose-900' : 'text-emerald-900'}`}>
                                    {balance > 0 ? Utils.formatCurrency(balance) : '✓ Fully Paid'}
                                </div>
                            </Card>
                        </div>

                        {/* Bill Breakdown */}
                        <Card title="Bill Breakdown" action={
                            <div className="flex gap-2">
                                <Button size="sm" variant="ghost" className="h-8 w-8 p-0 hover:bg-gray-100" onClick={() => window.location.reload()} title="Refresh Data">
                                    <RefreshIcon />
                                </Button>
                                {onPrintInvoice && (
                                    <Button size="sm" variant="secondary" onClick={() => onPrintInvoice(student)}>
                                        <FileText className="h-4 w-4 mr-1 lg:mr-2" /> <span className="hidden sm:inline">Print</span> Invoice
                                    </Button>
                                )}
                            </div>
                        }>
                            <div className="overflow-x-auto -mx-4 lg:mx-0">
                                <table className="w-full text-xs lg:text-sm text-left min-w-[280px]">
                                    <thead className="bg-gray-50 text-gray-700">
                                        <tr>
                                            <th className="px-3 lg:px-4 py-2">Fee Head</th>
                                            <th className="px-3 lg:px-4 py-2 text-right">Amount</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {applicableFees && applicableFees.map(fee => (
                                            <tr key={fee.id}>
                                                <td className="px-3 lg:px-4 py-2">{fee.name}</td>
                                                <td className="px-3 lg:px-4 py-2 text-right font-mono">{Utils.formatCurrency(fee.amount)}</td>
                                            </tr>
                                        ))}
                                        <tr className="bg-gray-50 font-bold">
                                            <td className="px-3 lg:px-4 py-2">Total Billed</td>
                                            <td className="px-3 lg:px-4 py-2 text-right">{Utils.formatCurrency(totalBill + totalDiscount)}</td>
                                        </tr>
                                        {totalDiscount > 0 && (
                                            <tr className="bg-green-50 text-green-700">
                                                <td className="px-3 lg:px-4 py-2">Discount/Scholarship</td>
                                                <td className="px-3 lg:px-4 py-2 text-right">-{Utils.formatCurrency(totalDiscount)}</td>
                                            </tr>
                                        )}
                                        <tr className="bg-gray-100 font-bold">
                                            <td className="px-3 lg:px-4 py-2">Net Payable</td>
                                            <td className="px-3 lg:px-4 py-2 text-right">{Utils.formatCurrency(totalBill)}</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </Card>

                        {/* Fee Adjustments (Optional Fees & Discounts) */}
                        <Card title="Fee Adjustments">
                            <div className="space-y-4">
                                {/* Optional Fees */}
                                {potentialOptionalFees.length > 0 && (
                                    <div>
                                        <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Optional Services</h4>
                                        <div className="space-y-2">
                                            {potentialOptionalFees.map(fee => {
                                                const isAssigned = student?.assigned_fees?.includes(fee.id);
                                                return (
                                                    <label key={fee.id} className="flex items-center justify-between p-2 rounded hover:bg-gray-50 border border-transparent hover:border-gray-100 cursor-pointer">
                                                        <div className="flex items-center gap-2">
                                                            <input
                                                                type="checkbox"
                                                                checked={isAssigned || false}
                                                                onChange={(e) => handleToggleFee(fee.id, e.target.checked)}
                                                                className="rounded border-gray-300 text-brand-600 focus:ring-brand-500"
                                                            />
                                                            <span className="text-sm text-gray-700">{fee.name}</span>
                                                        </div>
                                                        <span className="text-sm font-mono text-gray-600">{Utils.formatCurrency(fee.amount)}</span>
                                                    </label>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}

                                {/* Discounts & Scholarships */}
                                <div>
                                    <div className="flex items-center justify-between mb-2">
                                        <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Discounts & Scholarships</h4>
                                        <button
                                            onClick={onOpenDiscountModal}
                                            className="text-xs text-brand-600 hover:text-brand-700 font-medium"
                                        >
                                            + Add Adjustment
                                        </button>
                                    </div>

                                    {student?.discounts && student.discounts.length > 0 ? (
                                        <div className="space-y-2">
                                            {student.discounts.filter(d => d.session === settings.current_session && d.term === settings.current_term).map(d => (
                                                <div key={d.id} className="flex items-center justify-between p-2 bg-green-50 rounded border border-green-100">
                                                    <div>
                                                        <div className="text-sm font-medium text-green-900">{d.reason} <span className="text-xs opacity-75">({d.category})</span></div>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-sm font-bold text-green-700">-{Utils.formatCurrency(d.amount)}</span>
                                                        <button onClick={() => handleRemoveDiscount(d.id)} className="text-green-400 hover:text-red-500">
                                                            <Trash2 className="h-4 w-4" />
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="text-sm text-gray-400 italic">No active discounts.</p>
                                    )}
                                </div>
                            </div>
                        </Card>

                        {/* Payment History */}
                        <Card title="Payment History" action={
                            <Button size="sm" onClick={onRecordPayment}>
                                <Plus className="h-4 w-4 mr-2" /> Record Payment
                            </Button>
                        }>
                            <div className="space-y-3 mt-2">
                                {studentPayments.length === 0 && (
                                    <div className="text-center py-4 text-gray-500">No payments recorded for this term.</div>
                                )}
                                {studentPayments.map(p => {
                                    // Get line items description
                                    const lineItemsDesc = p.lineItems?.map(item => item.purpose).join(', ') || 'Payment';
                                    return (
                                        <div key={p.id} className="flex justify-between items-center p-3 bg-gray-50 rounded border border-gray-100">
                                            <div>
                                                <div className="font-medium text-gray-900">{Utils.formatCurrency(p.amount)}</div>
                                                <div className="text-xs text-gray-500">{p.date} • {p.method}</div>
                                                <div className="text-xs text-brand-600 capitalize">{lineItemsDesc}</div>
                                                {p.remark && <div className="text-xs text-gray-500 italic">"{p.remark}"</div>}
                                            </div>
                                            <div className="flex gap-2">
                                                <button onClick={() => onPrintReceipt(p)} title="Print Receipt" className="p-1 text-gray-400 hover:text-blue-600">
                                                    <Printer className="h-4 w-4" />
                                                </button>
                                                <button onClick={() => onDeletePayment(p.id)} title="Delete" className="p-1 text-gray-400 hover:text-red-600">
                                                    <Trash2 className="h-4 w-4" />
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </Card>
                    </div>
                ) : (
                    <div className="h-full flex flex-col items-center justify-center text-gray-400 border-2 border-dashed border-gray-200 rounded-lg p-12">
                        <User className="h-12 w-12 mb-4 opacity-50" />
                        <p>Select a student to view fees and payments</p>
                    </div>
                )}
            </div>
        </div>
    );
};
