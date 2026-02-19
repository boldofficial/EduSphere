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
        <div className="space-y-6 lg:space-y-8 bg-white min-h-screen rounded-2xl p-6 lg:p-8 border border-gray-100 shadow-sm">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Fee Statement</h1>
                    <div className="flex items-center gap-2 mt-1">
                        <span className="px-2.5 py-0.5 rounded-lg bg-indigo-50 text-indigo-700 text-[10px] font-bold uppercase tracking-wider border border-indigo-100">{settings.current_term}</span>
                        <span className="text-xs text-gray-400 font-medium">{settings.current_session}</span>
                    </div>
                </div>
                <div className="flex gap-2">
                    <Button onClick={handlePrint} variant="outline" className="flex gap-2 border-indigo-200 text-indigo-700 hover:bg-indigo-50 rounded-xl px-4 py-2 font-semibold">
                        <Printer size={18} />
                        Print Statement
                    </Button>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="relative overflow-hidden border-none shadow-lg bg-gradient-to-br from-indigo-500 to-blue-700 text-white p-6 rounded-2xl group">
                    <div className="absolute top-[-20%] right-[-10%] h-32 w-32 bg-white/10 rounded-full blur-3xl group-hover:scale-125 transition-transform duration-700" />
                    <div className="relative z-10">
                        <div className="h-12 w-12 bg-white/20 backdrop-blur-md rounded-xl flex items-center justify-center mb-4 border border-white/30">
                            <FileText className="h-6 w-6 text-white" />
                        </div>
                        <p className="text-[10px] font-bold text-indigo-50/80 uppercase tracking-widest mb-1">Total Bill</p>
                        <p className="text-3xl font-black tracking-tight">₦{totalBill.toLocaleString()}</p>
                    </div>
                </Card>

                <Card className="relative overflow-hidden border-none shadow-lg bg-gradient-to-br from-emerald-500 to-teal-700 text-white p-6 rounded-2xl group">
                    <div className="absolute top-[-20%] right-[-10%] h-32 w-32 bg-white/10 rounded-full blur-3xl group-hover:scale-125 transition-transform duration-700" />
                    <div className="relative z-10">
                        <div className="h-12 w-12 bg-white/20 backdrop-blur-md rounded-xl flex items-center justify-center mb-4 border border-white/30">
                            <CheckCircle2 className="h-6 w-6 text-white" />
                        </div>
                        <p className="text-[10px] font-bold text-emerald-50/80 uppercase tracking-widest mb-1">Total Paid</p>
                        <p className="text-3xl font-black tracking-tight">₦{totalPaid.toLocaleString()}</p>
                    </div>
                </Card>

                <Card className={`relative overflow-hidden border-none shadow-lg p-6 rounded-2xl group text-white transition-all duration-500 ${balance > 0 ? 'bg-gradient-to-br from-rose-500 to-pink-700' : 'bg-gradient-to-br from-emerald-600 to-teal-800'}`}>
                    <div className="absolute top-[-20%] right-[-10%] h-32 w-32 bg-white/10 rounded-full blur-3xl group-hover:scale-125 transition-transform duration-700" />
                    <div className="relative z-10">
                        <div className="h-12 w-12 bg-white/20 backdrop-blur-md rounded-xl flex items-center justify-center mb-4 border border-white/30">
                            {balance > 0 ? <AlertCircle className="h-6 w-6 text-white" /> : <CheckCircle2 className="h-6 w-6 text-white" />}
                        </div>
                        <p className="text-[10px] font-bold text-white/70 uppercase tracking-widest mb-1">
                            {balance > 0 ? 'Balance Due' : 'Account Status'}
                        </p>
                        <p className="text-3xl font-black tracking-tight">
                            {balance > 0 ? `₦${balance.toLocaleString()}` : 'FULLY PAID'}
                        </p>
                    </div>
                </Card>
            </div>

            {/* Student Info */}
            <Card className="p-6 border border-gray-100 bg-white shadow-sm rounded-2xl border-l-4 border-indigo-500">
                <div className="flex flex-col md:flex-row justify-between gap-6">
                    <div className="flex gap-4">
                        <div className="h-14 w-14 rounded-xl bg-gray-50 flex items-center justify-center border border-gray-100">
                            <span className="text-xl font-bold text-indigo-600">{student.names[0].toUpperCase()}</span>
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-gray-900">{student.names}</h2>
                            <p className="text-xs font-semibold text-indigo-500 mt-0.5 tracking-tight">{student.student_no}</p>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-8 md:gap-12">
                        <div>
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Class</p>
                            <p className="text-sm font-semibold text-gray-900">{cls?.name || '---'}</p>
                        </div>
                        <div className="text-right md:text-left">
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Status</p>
                            <span className={`inline-flex items-center gap-1.5 font-bold uppercase tracking-tighter text-xs ${paymentStatus === 'paid' ? 'text-emerald-600' : paymentStatus === 'partial' ? 'text-amber-600' : 'text-rose-600'}`}>
                                {paymentStatus}
                            </span>
                        </div>
                    </div>
                </div>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Fee Breakdown */}
                <Card className="p-6 border border-gray-100 bg-white shadow-sm rounded-2xl flex flex-col">
                    <h2 className="text-base font-bold text-gray-900 flex items-center gap-2 mb-6">
                        <FileText size={18} className="text-indigo-500" />
                        Fee Breakdown
                    </h2>

                    {studentFees.length > 0 ? (
                        <div className="space-y-2 flex-grow">
                            {studentFees.map((fee, i) => (
                                <div key={fee.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-xl border border-transparent">
                                    <span className="text-sm font-medium text-gray-600">{fee.name}</span>
                                    <span className="text-sm font-bold text-gray-900">₦{fee.amount.toLocaleString()}</span>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="flex-grow flex flex-col items-center justify-center py-8 text-gray-400">
                            <p className="italic text-xs">No fees set for this term.</p>
                        </div>
                    )}

                    <div className="mt-6 pt-4 border-t border-gray-100">
                        <div className="flex justify-between items-center p-4 bg-indigo-600 rounded-xl">
                            <span className="text-xs font-bold text-white uppercase tracking-wider">Total Charges</span>
                            <span className="text-lg font-bold text-white">₦{totalBill.toLocaleString()}</span>
                        </div>
                    </div>
                </Card>

                {/* Payment History Timeline */}
                <Card className="p-6 border border-gray-100 bg-white shadow-sm rounded-2xl">
                    <h2 className="text-base font-bold text-gray-900 flex items-center gap-2 mb-6">
                        <CreditCard size={18} className="text-emerald-500" />
                        Payment Log
                    </h2>

                    {/* Progress Bar */}
                    <div className="mb-8 p-4 bg-gray-50 rounded-xl border border-gray-100">
                        <div className="flex justify-between text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">
                            <span>Payment Progress</span>
                            <span>{totalBill > 0 ? Math.min(100, Math.round(((Number(totalPaid) || 0) / (Number(totalBill) || 0)) * 100)) : 0}%</span>
                        </div>
                        <div className="h-2.5 bg-gray-200 rounded-full overflow-hidden">
                            <div
                                className={`h-full rounded-full transition-all duration-700 ${totalPaid >= totalBill ? 'bg-emerald-500' :
                                    totalPaid > 0 ? 'bg-amber-500' : 'bg-gray-300'
                                    }`}
                                style={{ width: `${totalBill > 0 ? Math.min(100, ((Number(totalPaid) || 0) / (Number(totalBill) || 0)) * 100) : 0}%` }}
                            />
                        </div>
                        <div className="flex justify-between items-center mt-3">
                            <span className="text-xs font-bold text-emerald-600">₦{totalPaid.toLocaleString()} paid</span>
                            <span className="text-[10px] text-gray-400 font-medium tracking-tight">of ₦{totalBill.toLocaleString()}</span>
                        </div>
                    </div>

                    {studentPayments.length > 0 ? (
                        <div className="relative pl-5">
                            {/* Timeline line */}
                            <div className="absolute left-1.5 top-0 bottom-0 w-0.5 bg-gray-100" />

                            <div className="space-y-4">
                                {studentPayments.map((payment, i) => (
                                    <div key={payment.id} className="relative">
                                        {/* Timeline dot */}
                                        <div className="absolute -left-[1.35rem] top-1.5 w-2.5 h-2.5 bg-white rounded-full border-2 border-emerald-500 z-10" />

                                        <div className="p-3 bg-gray-50 rounded-xl hover:bg-white border border-transparent hover:border-gray-100 transition-all">
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <p className="text-sm font-bold text-gray-900">₦{payment.amount.toLocaleString()}</p>
                                                    <p className="text-[10px] font-medium text-gray-400">
                                                        {new Date(payment.date).toLocaleDateString('en-GB', {
                                                            day: '2-digit',
                                                            month: 'short',
                                                            year: 'numeric'
                                                        })}
                                                    </p>
                                                </div>
                                                <span className="px-2 py-0.5 bg-white text-gray-600 border border-gray-100 rounded-lg text-[10px] font-bold uppercase tracking-tight">
                                                    {payment.method}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <div className="py-8 flex flex-col items-center justify-center text-gray-300">
                            <p className="italic text-xs">No payments recorded yet.</p>
                        </div>
                    )}
                </Card>
            </div>

            {/* Bank Details */}
            {settings.show_bank_details && balance > 0 && (
                <Card className="p-6 bg-slate-50 border border-slate-100 rounded-2xl">
                    <h2 className="text-base font-bold text-gray-900 mb-6 flex items-center gap-2">
                        <CreditCard size={18} className="text-slate-500" />
                        Settlement Details
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div>
                            <p className="text-gray-400 text-[10px] font-bold uppercase tracking-widest mb-0.5">Bank Name</p>
                            <p className="text-sm font-semibold text-gray-900">{settings.bank_name}</p>
                        </div>
                        <div>
                            <p className="text-gray-400 text-[10px] font-bold uppercase tracking-widest mb-0.5">Account Name</p>
                            <p className="text-sm font-semibold text-gray-900">{settings.bank_account_name}</p>
                        </div>
                        <div>
                            <p className="text-gray-400 text-[10px] font-bold uppercase tracking-widest mb-0.5">Account Number</p>
                            <p className="text-xl font-bold text-indigo-600 tracking-wider">{settings.bank_account_number}</p>
                        </div>
                    </div>
                    {settings.invoice_notes && (
                        <div className="mt-6 p-3 bg-white border border-slate-100 rounded-lg">
                            <p className="text-xs text-slate-500 italic">{settings.invoice_notes}</p>
                        </div>
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
