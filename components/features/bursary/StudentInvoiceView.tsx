'use client';

import React, { useMemo, useState } from 'react';
import {
    CreditCard, FileText, Printer,
    CheckCircle2, Clock, AlertCircle
} from 'lucide-react';
import * as Types from '@/lib/types';
import * as Utils from '@/lib/utils';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { InvoiceTemplate } from './InvoiceTemplate';

interface StudentInvoiceViewProps {
    student: Types.Student;
    cls?: Types.Class;
    fees: Types.FeeStructure[];
    payments: Types.Payment[];
    settings: Types.Settings;
}

export const StudentInvoiceView: React.FC<StudentInvoiceViewProps> = ({
    student,
    cls,
    fees,
    payments,
    settings
}) => {
    // Calculate totals
    const { totalBill, totalPaid, balance } = Utils.getStudentBalance(
        student, fees, payments, settings.current_session, settings.current_term
    );

    // Get student's fees
    const studentFees = fees.filter(f =>
        f.session === settings.current_session &&
        f.term === settings.current_term &&
        (f.class_id === null || f.class_id === student.class_id)
    );

    // Get student's payments
    const studentPayments = payments.filter(p =>
        p.student_id === student.id &&
        p.session === settings.current_session &&
        p.term === settings.current_term
    ).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    const handlePrint = () => {
        const printWindow = window.open('', '_blank', 'width=800,height=800');
        if (!printWindow) {
            alert('Please allow popups to print the invoice');
            return;
        }

        printWindow.document.write('<html><head><title>Print Invoice</title>');
        printWindow.document.write('<style>');
        printWindow.document.write('@page { margin: 20mm; }'); // Set print margins
        printWindow.document.write('body { margin: 0; padding: 20px 40px; }'); // Visual padding on screen + extra print padding
        printWindow.document.write('</style>');
        printWindow.document.write('</head><body>');
        printWindow.document.write('<div id="print-root"></div>');
        printWindow.document.write('</body></html>');
        printWindow.document.close();

        import('react-dom/client').then(({ createRoot }) => {
            const root = createRoot(printWindow.document.getElementById('print-root')!);
            root.render(
                <InvoiceTemplate
                    student={student}
                    cls={cls}
                    fees={studentFees}
                    payments={studentPayments}
                    settings={settings}
                />
            );

            // Wait for content to render then print
            setTimeout(() => {
                printWindow.focus();
                printWindow.print();
            }, 500);
        });
    };


    const paymentStatus = balance <= 0 ? 'paid' : balance < totalBill ? 'partial' : 'unpaid';

    // Original return with updated Print Button handler
    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Fee Statement</h1>
                    <p className="text-sm text-gray-500 mt-1">
                        {settings.current_term} • {settings.current_session}
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button onClick={handlePrint} className="flex gap-2">
                        <Printer size={16} />
                        Print
                    </Button>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="p-6">
                    <div className="flex items-center gap-4">
                        <div className="h-12 w-12 bg-blue-100 rounded-xl flex items-center justify-center">
                            <FileText className="h-6 w-6 text-blue-600" />
                        </div>
                        <div>
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Total Bill</p>
                            <p className="text-2xl font-black text-gray-900">₦{totalBill.toLocaleString()}</p>
                        </div>
                    </div>
                </Card>

                <Card className="p-6">
                    <div className="flex items-center gap-4">
                        <div className="h-12 w-12 bg-green-100 rounded-xl flex items-center justify-center">
                            <CheckCircle2 className="h-6 w-6 text-green-600" />
                        </div>
                        <div>
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Amount Paid</p>
                            <p className="text-2xl font-black text-green-600">₦{totalPaid.toLocaleString()}</p>
                        </div>
                    </div>
                </Card>

                <Card className={`p-6 ${balance > 0 ? 'bg-red-50 border-red-200' : 'bg-green-50 border-green-200'}`}>
                    <div className="flex items-center gap-4">
                        <div className={`h-12 w-12 rounded-xl flex items-center justify-center ${balance > 0 ? 'bg-red-100' : 'bg-green-100'}`}>
                            {balance > 0 ? (
                                <AlertCircle className="h-6 w-6 text-red-600" />
                            ) : (
                                <CheckCircle2 className="h-6 w-6 text-green-600" />
                            )}
                        </div>
                        <div>
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                                {balance > 0 ? 'Balance Due' : 'Status'}
                            </p>
                            <p className={`text-2xl font-black ${balance > 0 ? 'text-red-600' : 'text-green-600'}`}>
                                {balance > 0 ? `₦${balance.toLocaleString()}` : 'Fully Paid'}
                            </p>
                        </div>
                    </div>
                </Card>
            </div>

            {/* Student Info */}
            <Card className="p-6">
                <h2 className="text-lg font-bold text-gray-900 mb-4">Student Information</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                        <p className="text-gray-400 text-xs uppercase font-medium">Name</p>
                        <p className="font-semibold text-gray-900">{student.names}</p>
                    </div>
                    <div>
                        <p className="text-gray-400 text-xs uppercase font-medium">Admission No</p>
                        <p className="font-semibold text-brand-600">{student.student_no}</p>
                    </div>
                    <div>
                        <p className="text-gray-400 text-xs uppercase font-medium">Class</p>
                        <p className="font-semibold text-gray-900">{cls?.name || '-'}</p>
                    </div>
                    <div>
                        <p className="text-gray-400 text-xs uppercase font-medium">Status</p>
                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold uppercase ${paymentStatus === 'paid'
                            ? 'bg-green-100 text-green-700'
                            : paymentStatus === 'partial'
                                ? 'bg-yellow-100 text-yellow-700'
                                : 'bg-red-100 text-red-700'
                            }`}>
                            {paymentStatus === 'paid' ? <CheckCircle2 size={12} /> : <Clock size={12} />}
                            {paymentStatus === 'paid' ? 'Paid' : paymentStatus === 'partial' ? 'Partial' : 'Unpaid'}
                        </span>
                    </div>
                </div>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Fee Breakdown */}
                <Card className="p-6">
                    <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                        <FileText size={18} className="text-brand-500" />
                        Fee Breakdown
                    </h2>
                    {studentFees.length > 0 ? (
                        <div className="space-y-2">
                            {studentFees.map((fee, i) => (
                                <div key={fee.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-xl">
                                    <span className="text-sm font-medium text-gray-700">{fee.name}</span>
                                    <span className="text-sm font-bold text-gray-900">₦{fee.amount.toLocaleString()}</span>
                                </div>
                            ))}
                            <div className="flex justify-between items-center p-3 bg-brand-50 rounded-xl border border-brand-100 mt-4">
                                <span className="text-sm font-bold text-brand-700">Total</span>
                                <span className="text-lg font-black text-brand-700">₦{totalBill.toLocaleString()}</span>
                            </div>
                        </div>
                    ) : (
                        <div className="text-center py-8 text-gray-400 italic text-sm">
                            No fees set for this term.
                        </div>
                    )}
                </Card>

                {/* Payment History Timeline */}
                <Card className="p-6">
                    <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                        <CreditCard size={18} className="text-green-500" />
                        Payment History
                    </h2>

                    {/* Progress Bar */}
                    <div className="mb-6">
                        <div className="flex justify-between text-xs text-gray-500 mb-1">
                            <span>Payment Progress</span>
                            <span>{totalBill > 0 ? Math.min(100, Math.round(((Number(totalPaid) || 0) / (Number(totalBill) || 0)) * 100)) : 0}%</span>
                        </div>
                        <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                            <div
                                className={`h-full rounded-full transition-all duration-500 ${totalPaid >= totalBill ? 'bg-green-500' :
                                    totalPaid > 0 ? 'bg-yellow-500' : 'bg-gray-300'
                                    }`}
                                style={{ width: `${totalBill > 0 ? Math.min(100, ((Number(totalPaid) || 0) / (Number(totalBill) || 0)) * 100) : 0}%` }}
                            />
                        </div>
                        <div className="flex justify-between text-xs mt-1">
                            <span className="text-green-600 font-medium">₦{totalPaid.toLocaleString()}</span>
                            <span className="text-gray-400">of ₦{totalBill.toLocaleString()}</span>
                        </div>
                    </div>

                    {studentPayments.length > 0 ? (
                        <div className="relative">
                            {/* Timeline line */}
                            <div className="absolute left-3 top-2 bottom-2 w-0.5 bg-green-200" />

                            <div className="space-y-4">
                                {studentPayments.map((payment, i) => (
                                    <div key={payment.id} className="relative pl-8">
                                        {/* Timeline dot */}
                                        <div className="absolute left-1.5 top-2 w-3 h-3 bg-green-500 rounded-full border-2 border-white shadow" />

                                        <div className="p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <p className="text-sm font-bold text-gray-900">₦{payment.amount.toLocaleString()}</p>
                                                    <p className="text-xs text-gray-500 mt-0.5">
                                                        {new Date(payment.date).toLocaleDateString('en-GB', {
                                                            weekday: 'short',
                                                            day: '2-digit',
                                                            month: 'short',
                                                            year: 'numeric'
                                                        })}
                                                    </p>
                                                    {payment.lineItems && payment.lineItems.length > 0 && (
                                                        <p className="text-xs text-gray-400 mt-1">
                                                            {payment.lineItems.map(li => li.purpose).join(', ')}
                                                        </p>
                                                    )}
                                                </div>
                                                <div className="text-right">
                                                    <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-[10px] font-bold uppercase">
                                                        {payment.method}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="flex justify-between items-center p-3 bg-green-50 rounded-xl border border-green-100 mt-4 ml-8">
                                <span className="text-sm font-bold text-green-700">Total Paid</span>
                                <span className="text-lg font-black text-green-700">₦{totalPaid.toLocaleString()}</span>
                            </div>
                        </div>
                    ) : (
                        <div className="text-center py-8 text-gray-400 italic text-sm">
                            No payments recorded yet.
                        </div>
                    )}
                </Card>
            </div>

            {/* Bank Details */}
            {settings.show_bank_details && balance > 0 && (
                <Card className="p-6 bg-amber-50 border-amber-200">
                    <h2 className="text-lg font-bold text-amber-800 mb-4">Payment Information</h2>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                            <p className="text-amber-600 text-xs uppercase font-medium">Bank Name</p>
                            <p className="font-semibold text-amber-900">{settings.bank_name}</p>
                        </div>
                        <div>
                            <p className="text-amber-600 text-xs uppercase font-medium">Account Name</p>
                            <p className="font-semibold text-amber-900">{settings.bank_account_name}</p>
                        </div>
                        <div>
                            <p className="text-amber-600 text-xs uppercase font-medium">Account Number</p>
                            <p className="font-bold text-amber-900 text-lg">{settings.bank_account_number}</p>
                        </div>
                        {settings.bank_sort_code && (
                            <div>
                                <p className="text-amber-600 text-xs uppercase font-medium">Sort Code</p>
                                <p className="font-semibold text-amber-900">{settings.bank_sort_code}</p>
                            </div>
                        )}
                    </div>
                    {settings.invoice_notes && (
                        <p className="text-sm text-amber-700 mt-4 italic">{settings.invoice_notes}</p>
                    )}
                </Card>
            )}

            {/* Hidden container for PDF generation */}
            <div id="student-invoice-container" style={{ position: 'absolute', left: '-9999px', top: 0, width: '210mm', background: 'white' }}>
                <InvoiceTemplate
                    student={student}
                    cls={cls}
                    fees={studentFees}
                    payments={studentPayments}
                    settings={settings}
                />
            </div>
        </div>
    );
};
