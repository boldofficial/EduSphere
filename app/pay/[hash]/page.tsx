'use client';

import React, { useEffect, useState } from 'react';
import Script from 'next/script';

interface LineItem {
    purpose: string;
    amount: number;
}

interface InvoiceData {
    payment_hash: string;
    reference: string;
    status: string;
    amount: string;
    date: string;
    session: string;
    term: string;
    method: string;
    remark: string;
    student_name: string;
    student_class: string;
    category: string;
    line_items: LineItem[];
    school: {
        name: string;
        logo: string | null;
        email: string | null;
        phone: string | null;
    };
    checkout: {
        paystack_public_key: string | null;
        pass_processing_fee_to_parents: boolean;
    };
}

export default function QuickPayPage({ params }: { params: Promise<{ hash: string }> }) {
    const [invoice, setInvoice] = useState<InvoiceData | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadInvoice = async () => {
            const { hash } = await params;
            try {
                const res = await fetch(`/api/proxy/public/invoice/${hash}/`);
                if (!res.ok) {
                    setError('Invoice not found or has expired.');
                    return;
                }
                const data = await res.json();
                setInvoice(data);
            } catch {
                setError('Failed to load invoice. Please try again later.');
            } finally {
                setLoading(false);
            }
        };
        loadInvoice();
    }, [params]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto" />
                    <p className="mt-4 text-gray-500">Loading invoice...</p>
                </div>
            </div>
        );
    }

    if (error || !invoice) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center max-w-md mx-auto p-8">
                    <div className="text-6xl mb-4">📄</div>
                    <h1 className="text-2xl font-bold text-gray-800 mb-2">Invoice Not Found</h1>
                    <p className="text-gray-500">{error || 'This invoice link may have expired or is invalid.'}</p>
                </div>
            </div>
        );
    }

    const isPaid = invoice.status === 'completed';
    const amount = parseFloat(invoice.amount);
    const processingFee = invoice.checkout.pass_processing_fee_to_parents ? Math.ceil(amount * 0.015 * 100) / 100 : 0;
    const totalWithFee = amount + processingFee;

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50 py-8 px-4">
            <div className="max-w-lg mx-auto">
                {/* School Header */}
                <div className="text-center mb-6">
                    {invoice.school.logo && (
                        <img src={invoice.school.logo} alt="School Logo" className="h-16 w-16 rounded-full mx-auto mb-3 object-cover border-2 border-white shadow" />
                    )}
                    <h1 className="text-xl font-bold text-gray-900">{invoice.school.name}</h1>
                    {invoice.school.email && <p className="text-sm text-gray-500">{invoice.school.email}</p>}
                </div>

                {/* Invoice Card */}
                <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
                    {/* Status Banner */}
                    <div className={`px-6 py-3 text-center text-sm font-semibold ${isPaid ? 'bg-green-50 text-green-700' : 'bg-amber-50 text-amber-700'}`}>
                        {isPaid ? '✅ Payment Confirmed' : '⏳ Payment Pending'}
                    </div>

                    <div className="p-6 space-y-5">
                        {/* Student Info */}
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="text-xs text-gray-400 uppercase tracking-wider">Student</p>
                                <p className="text-lg font-semibold text-gray-900">{invoice.student_name}</p>
                                <p className="text-sm text-gray-500">{invoice.student_class}</p>
                            </div>
                            <div className="text-right">
                                <p className="text-xs text-gray-400 uppercase tracking-wider">Reference</p>
                                <p className="text-sm font-mono text-gray-700">{invoice.reference}</p>
                            </div>
                        </div>

                        <hr className="border-gray-100" />

                        {/* Fee Breakdown */}
                        <div>
                            <p className="text-xs text-gray-400 uppercase tracking-wider mb-2">Fee Breakdown</p>
                            {invoice.line_items.length > 0 ? (
                                <div className="space-y-2">
                                    {invoice.line_items.map((item, i) => (
                                        <div key={i} className="flex justify-between text-sm">
                                            <span className="text-gray-600">{item.purpose}</span>
                                            <span className="font-medium text-gray-800">₦{Number(item.amount).toLocaleString()}</span>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-600">{invoice.category}</span>
                                    <span className="font-medium text-gray-800">₦{amount.toLocaleString()}</span>
                                </div>
                            )}

                            {processingFee > 0 && (
                                <div className="flex justify-between text-sm mt-2 pt-2 border-t border-dashed border-gray-200">
                                    <span className="text-gray-500">Processing Fee (1.5%)</span>
                                    <span className="text-gray-600">₦{processingFee.toLocaleString()}</span>
                                </div>
                            )}

                            <div className="flex justify-between mt-3 pt-3 border-t-2 border-gray-200">
                                <span className="font-bold text-gray-900">Total</span>
                                <span className="text-xl font-bold text-indigo-600">₦{totalWithFee.toLocaleString()}</span>
                            </div>
                        </div>

                        {/* Period & Method */}
                        <div className="grid grid-cols-2 gap-3 text-sm">
                            <div className="bg-gray-50 rounded-lg p-3">
                                <p className="text-xs text-gray-400">Session</p>
                                <p className="font-medium text-gray-700">{invoice.session}</p>
                            </div>
                            <div className="bg-gray-50 rounded-lg p-3">
                                <p className="text-xs text-gray-400">Term</p>
                                <p className="font-medium text-gray-700">{invoice.term}</p>
                            </div>
                        </div>

                        {invoice.remark && (
                            <div className="bg-blue-50 rounded-lg p-3 text-sm text-blue-800">
                                <strong>Note:</strong> {invoice.remark}
                            </div>
                        )}

                        {/* Pay Button */}
                        {!isPaid && invoice.checkout.paystack_public_key && (
                            <button
                                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 px-6 rounded-xl transition-colors shadow-lg shadow-indigo-200"
                                onClick={() => {
                                    // Paystack Inline integration
                                    const handler = (window as any).PaystackPop?.setup({
                                        key: invoice.checkout.paystack_public_key,
                                        email: invoice.school.email || 'parent@school.com',
                                        amount: Math.round(totalWithFee * 100), // Paystack uses kobo
                                        ref: invoice.reference,
                                        callback: () => {
                                            window.location.reload();
                                        },
                                        onClose: () => {
                                            // Payment window closed
                                        },
                                    });
                                    handler?.openIframe();
                                }}
                            >
                                Pay ₦{totalWithFee.toLocaleString()} with Paystack
                            </button>
                        )}

                        {isPaid && (
                            <div className="text-center py-2">
                                <p className="text-sm text-green-600 font-medium">This payment has been confirmed. No action needed.</p>
                            </div>
                        )}
                    </div>
                </div>

                <p className="text-center text-xs text-gray-400 mt-6">Powered by Registra</p>
            </div>
            {/* Paystack Inline Script */}
            <Script src="https://js.paystack.co/v2/inline.js" strategy="afterInteractive" />
        </div>
    );
}
