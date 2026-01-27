import React, { useState } from 'react';
import { Printer, Check, Plus, Trash2 } from 'lucide-react';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { ReceiptTemplate } from './ReceiptTemplate';
import { InvoiceTemplate } from './InvoiceTemplate';
import * as Types from '@/lib/types';
import * as Utils from '@/lib/utils';
import apiClient from '@/lib/api-client';

interface BursaryModalsProps {
    settings: Types.Settings;
    classes: Types.Class[];
    students: Types.Student[];
    fees: Types.FeeStructure[];
    payments: Types.Payment[];

    showPayModal: boolean;
    setShowPayModal: (show: boolean) => void;
    showExpenseModal: boolean;
    setShowExpenseModal: (show: boolean) => void;
    showFeeModal: boolean;
    setShowFeeModal: (show: boolean) => void;
    receiptPayment: Types.Payment | null;
    setReceiptPayment: (p: Types.Payment | null) => void;
    invoiceStudent: Types.Student | null;
    setInvoiceStudent: (s: Types.Student | null) => void;

    selectedStudent: string | null;
    onAddPayment: (p: Types.Payment, options?: any) => void;
    onAddExpense: (e: Types.Expense, options?: any) => void;
    onAddFee: (f: Types.FeeStructure, options?: any) => void;

    addToast: (msg: string, type: Types.ToastType) => void;

    // Discount/Scholarship Modal Props
    showDiscountModal?: boolean;
    setShowDiscountModal?: (show: boolean) => void;
    onAddDiscount?: (discount: Types.StudentDiscount) => void;
}

const PAYMENT_PURPOSES = [
    { value: 'tuition', label: 'Tuition Fees' },
    { value: 'registration', label: 'Registration Fee' },
    { value: 'books', label: 'Books & Materials' },
    { value: 'uniform', label: 'School Uniform' },
    { value: 'transport', label: 'Transport/Bus Fee' },
    { value: 'exam', label: 'Examination Fee' },
    { value: 'excursion', label: 'Excursion/Field Trip' },
    { value: 'other', label: 'Other' },
];

interface LineItem {
    purpose: string;
    amount: string;
}

export const BursaryModals: React.FC<BursaryModalsProps> = ({
    settings, classes, students, fees, payments,
    showPayModal, setShowPayModal, showExpenseModal, setShowExpenseModal, showFeeModal, setShowFeeModal,
    receiptPayment, setReceiptPayment, invoiceStudent, setInvoiceStudent,
    selectedStudent, onAddPayment, onAddExpense, onAddFee, addToast,
    showDiscountModal, setShowDiscountModal, onAddDiscount
}) => {
    // Payment form with line items
    const [lineItems, setLineItems] = useState<LineItem[]>([{ purpose: 'tuition', amount: '' }]);
    const [payMethod, setPayMethod] = useState('cash');
    const [payRemark, setPayRemark] = useState('');

    const [expTitle, setExpTitle] = useState('');
    const [expAmount, setExpAmount] = useState('');
    const [expCat, setExpCat] = useState('supplies');
    const [expDate, setExpDate] = useState(Utils.getTodayString());
    const [expDesc, setExpDesc] = useState('');

    const [feeName, setFeeName] = useState('');
    const [feeAmount, setFeeAmount] = useState('');
    const [feeClass, setFeeClass] = useState('');
    const [feeOptional, setFeeOptional] = useState(false);

    // New Discount Form State
    const [discAmount, setDiscAmount] = useState('');
    const [discReason, setDiscReason] = useState('');
    const [discCategory, setDiscCategory] = useState<'discount' | 'scholarship'>('discount');

    // Invoice discount
    const [invoiceDiscount, setInvoiceDiscount] = useState('');
    const [discountReason, setDiscountReason] = useState('');

    const [isSubmitting, setIsSubmitting] = useState(false);

    const addLineItem = () => {
        setLineItems([...lineItems, { purpose: 'tuition', amount: '' }]);
    };

    const removeLineItem = (index: number) => {
        if (lineItems.length > 1) {
            setLineItems(lineItems.filter((_, i) => i !== index));
        }
    };

    const updateLineItem = (index: number, field: 'purpose' | 'amount', value: string) => {
        const updated = [...lineItems];
        updated[index][field] = value;
        setLineItems(updated);
    };

    const getTotalAmount = () => {
        return lineItems.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
    };

    const handlePaymentSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedStudent || isSubmitting) return;

        const validLineItems = lineItems.filter(item => item.amount && Number(item.amount) > 0);
        if (validLineItems.length === 0) {
            addToast('Please add at least one payment item with an amount', 'error');
            return;
        }

        const totalAmount = getTotalAmount();
        setIsSubmitting(true);

        onAddPayment({
            student_id: selectedStudent,
            amount: totalAmount,
            method: payMethod as any,
            lineItems: validLineItems.map(item => ({
                purpose: item.purpose,
                amount: Number(item.amount)
            })),
            remark: payRemark,
            date: Utils.getTodayString(),
            session: settings.current_session,
            term: settings.current_term,
            created_at: Date.now(),
            updated_at: Date.now()
        } as any, {
            onSuccess: () => {
                addToast('Payment recorded successfully', 'success');
                setIsSubmitting(false);
                setShowPayModal(false);
                setLineItems([{ purpose: 'tuition', amount: '' }]);
                setPayRemark('');
            },
            onError: () => {
                addToast('Failed to record payment', 'error');
                setIsSubmitting(false);
            }
        });
    };

    const handleExpenseSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (isSubmitting) return;
        setIsSubmitting(true);

        onAddExpense({
            title: expTitle,
            amount: Number(expAmount),
            category: expCat as any,
            date: expDate,
            description: expDesc || undefined,
            session: settings.current_session,
            term: settings.current_term,
            created_at: Date.now(),
            updated_at: Date.now()
        } as any, {
            onSuccess: () => {
                addToast('Expense recorded', 'success');
                setIsSubmitting(false);
                setShowExpenseModal(false);
                setExpTitle('');
                setExpAmount('');
                setExpDesc('');
            },
            onError: () => {
                addToast('Failed to record expense', 'error');
                setIsSubmitting(false);
            }
        });
    };

    const handleFeeSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (isSubmitting) return;
        setIsSubmitting(true);

        onAddFee({
            name: feeName,
            amount: Number(feeAmount),
            class_id: feeClass || null,
            session: settings.current_session,
            term: settings.current_term,
            is_optional: feeOptional,
            created_at: Date.now(),
            updated_at: Date.now()
        } as any, {
            onSuccess: () => {
                addToast('Fee structure added', 'success');
                setIsSubmitting(false);
                setShowFeeModal(false);
                setFeeName('');
                setFeeAmount('');
                setFeeClass('');
                setFeeOptional(false);
            },
            onError: () => {
                addToast('Failed to add fee structure', 'error');
                setIsSubmitting(false);
            }
        });
    };

    const handleDiscountSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (onAddDiscount) {
            onAddDiscount({
                id: Utils.generateId(),
                amount: Number(discAmount),
                reason: discReason,
                category: discCategory,
                session: settings.current_session,
                term: settings.current_term
            });
            addToast(`${discCategory === 'scholarship' ? 'Scholarship' : 'Discount'} added`, 'success');
            if (setShowDiscountModal) setShowDiscountModal(false);
            setDiscAmount('');
            setDiscReason('');
            setDiscCategory('discount');
        }
    };

    const receiptStudent = receiptPayment ? students.find(s => s.id === receiptPayment.student_id) : null;

    const handlePrintReceipt = () => {
        const printContent = document.getElementById('receipt-print');
        if (!printContent) return;

        const printWindow = window.open('', '_blank');
        if (!printWindow) return;

        const logoUrl = settings.logo_media || '';

        printWindow.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>Payment Receipt - ${settings.school_name}</title>
                <style>
                    * { margin: 0; padding: 0; box-sizing: border-box; }
                    body { font-family: 'Segoe UI', Arial, sans-serif; padding: 20px; background: white; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
                    .receipt { max-width: 600px; margin: 0 auto; border: 2px solid #1A3A5C; border-radius: 8px; padding: 24px; position: relative; overflow: hidden; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
                    .watermark { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); opacity: 0.06; width: 280px; height: 280px; pointer-events: none; z-index: 0; }
                    .watermark img { width: 100%; height: 100%; object-fit: contain; }
                    .content { position: relative; z-index: 1; }
                    @media print { body { padding: 0; } .receipt { border: none; } }
                </style>
            </head>
            <body>
                <div class="receipt">
                    ${logoUrl ? `<div class="watermark"><img src="${logoUrl}" alt="Watermark" /></div>` : ''}
                    <div class="content">
                        ${printContent.innerHTML}
                    </div>
                </div>
            </body>
            </html>
        `);

        printWindow.document.close();
        printWindow.focus();
        setTimeout(() => { printWindow.print(); printWindow.close(); }, 250);
    };

    const handlePrintInvoice = () => {
        const printContent = document.getElementById('invoice-print');
        if (!printContent) return;

        const printWindow = window.open('', '_blank');
        if (!printWindow) return;

        const logoUrl = settings.logo_media || '';

        printWindow.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>Fee Invoice - ${settings.school_name}</title>
                <style>
                    * { margin: 0; padding: 0; box-sizing: border-box; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; color-adjust: exact !important; }
                    body { font-family: 'Segoe UI', Arial, sans-serif; padding: 0; background: white; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
                    .invoice { max-width: 850px; margin: 0 auto; padding: 0; position: relative; overflow: hidden; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
                    .watermark { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); opacity: 0.05; width: 350px; height: 350px; pointer-events: none; z-index: 0; }
                    .watermark img { width: 100%; height: 100%; object-fit: contain; }
                    .content { position: relative; z-index: 1; }
                    @media print { 
                        * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; color-adjust: exact !important; }
                        body { padding: 0; } 
                        .invoice { max-width: 100%; padding: 0; margin: 0; }
                    }
                </style>
            </head>
            <body>
                <div class="invoice">
                    ${logoUrl ? `<div class="watermark"><img src="${logoUrl}" alt="Watermark" /></div>` : ''}
                    <div class="content">
                        ${printContent.innerHTML}
                    </div>
                </div>
            </body>
            </html>
        `);

        printWindow.document.close();
        printWindow.focus();
        setTimeout(() => { printWindow.print(); printWindow.close(); }, 250);
    };


    return (
        <>
            {/* Payment Modal */}
            <Modal isOpen={showPayModal} onClose={() => setShowPayModal(false)} title="Record Payment">
                <form onSubmit={handlePaymentSubmit} className="space-y-4">
                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <label className="block text-sm font-medium text-gray-700">Payment Items</label>
                            <button type="button" onClick={addLineItem} className="text-xs flex items-center gap-1 text-brand-600 hover:text-brand-700">
                                <Plus size={14} /> Add Item
                            </button>
                        </div>
                        <div className="space-y-2 max-h-48 overflow-y-auto">
                            {lineItems.map((item, index) => (
                                <div key={index} className="flex items-center gap-2 bg-gray-50 p-2 rounded-lg">
                                    <select
                                        value={item.purpose}
                                        onChange={(e) => updateLineItem(index, 'purpose', e.target.value)}
                                        className="flex-1 px-2 py-1.5 text-sm border border-gray-200 rounded-md focus:ring-1 focus:ring-brand-500 focus:border-brand-500"
                                    >
                                        {PAYMENT_PURPOSES.map(p => (
                                            <option key={p.value} value={p.value}>{p.label}</option>
                                        ))}
                                    </select>
                                    <input
                                        type="number"
                                        placeholder="Amount"
                                        value={item.amount}
                                        onChange={(e) => updateLineItem(index, 'amount', e.target.value)}
                                        className="w-28 px-2 py-1.5 text-sm border border-gray-200 rounded-md focus:ring-1 focus:ring-brand-500 focus:border-brand-500"
                                    />
                                    {lineItems.length > 1 && (
                                        <button type="button" onClick={() => removeLineItem(index)} className="p-1 text-red-500 hover:bg-red-50 rounded">
                                            <Trash2 size={16} />
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                        <div className="mt-2 text-right text-sm font-semibold text-brand-600">
                            Total: {Utils.formatCurrency(getTotalAmount())}
                        </div>
                    </div>
                    <Select label="Payment Method" value={payMethod} onChange={e => setPayMethod(e.target.value)}>
                        <option value="cash">Cash</option>
                        <option value="transfer">Bank Transfer</option>
                        <option value="pos">POS</option>
                        <option value="online_paystack">Online (Paystack)</option>
                        <option value="online_flutterwave">Online (Flutterwave)</option>
                    </Select>

                    {payMethod.startsWith('online_') ? (
                        <div className="bg-brand-50 border border-brand-200 rounded-lg p-4 space-y-3">
                            <p className="text-sm text-brand-800 font-medium">Clicking 'Pay Now' will open the secure payment gateway.</p>
                            <Button
                                type="button"
                                onClick={async () => {
                                    const total = getTotalAmount();
                                    if (total <= 0) return addToast('Please add items first', 'error');

                                    addToast('Opening payment gateway...', 'info');
                                    // Simulation delay
                                    await new Promise(r => setTimeout(r, 1500));

                                    const reference = `PAY-${Date.now()}`;
                                    const isSuccess = window.confirm(`[SIMULATED GATEWAY]\nTotal: ${Utils.formatCurrency(total)}\n\nReference: ${reference}\n\nClick OK to simulate SUCCESSFUL payment.`);

                                    if (isSuccess) {
                                        addToast('Verifying transaction...', 'info');
                                        try {
                                            // USE apiClient instead of raw fetch to inherit proxy and auth headers
                                            const response = await apiClient.post('/payments/verify-online/', {
                                                reference,
                                                student_id: selectedStudent,
                                                amount: total,
                                                session: settings.current_session,
                                                term: settings.current_term
                                            });

                                            if (response.data && response.data.id) {
                                                addToast('Payment verified and recorded!', 'success');
                                                onAddPayment(response.data);
                                                setShowPayModal(false);
                                                setLineItems([{ purpose: 'tuition', amount: '' }]);
                                            } else {
                                                addToast(response.data?.message || 'Verification failed', 'error');
                                            }
                                        } catch (e: any) {
                                            const errorMsg = e.response?.data?.message || e.response?.data?.error || 'Payment successful but verification failed locally.';
                                            addToast(errorMsg, 'error');
                                        }
                                    } else {
                                        addToast('Payment cancelled by user', 'warning');
                                    }
                                }}
                                className="w-full bg-brand-600 hover:bg-brand-700 font-bold"
                            >
                                Pay Now {Utils.formatCurrency(getTotalAmount())}
                            </Button>
                        </div>
                    ) : (
                        <>
                            <Input label="Remark/Note (Optional)" value={payRemark} onChange={e => setPayRemark(e.target.value)} disabled={isSubmitting} />
                            <Button type="submit" className="w-full" disabled={isSubmitting}>
                                {isSubmitting ? 'Processing...' : 'Save Payment'}
                            </Button>
                        </>
                    )}
                </form>
            </Modal>

            {/* Receipt Modal */}
            <Modal isOpen={!!receiptPayment} onClose={() => setReceiptPayment(null)} title="Print Receipt">
                {receiptPayment && receiptStudent && (
                    <div className="overflow-y-auto max-h-[80vh]">
                        <ReceiptTemplate
                            payment={receiptPayment}
                            student={receiptStudent}
                            cls={classes.find(c => c.id === receiptStudent.class_id)}
                            settings={settings}
                        />
                        <div className="mt-4 flex justify-end gap-2">
                            <Button variant="secondary" onClick={() => setReceiptPayment(null)}>Close</Button>
                            <Button onClick={handlePrintReceipt}>
                                <Printer className="h-4 w-4 mr-2" /> Print
                            </Button>
                        </div>
                    </div>
                )}
            </Modal>

            {/* Invoice Modal */}
            <Modal isOpen={!!invoiceStudent} onClose={() => { setInvoiceStudent(null); setInvoiceDiscount(''); setDiscountReason(''); }} title="Fee Invoice">
                {invoiceStudent && (
                    <div className="space-y-4">
                        {/* Discount Options */}
                        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                            <p className="text-sm font-medium text-amber-800 mb-3">Apply Discount (Optional)</p>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs text-amber-700 mb-1">Discount Amount (₦)</label>
                                    <input
                                        type="number"
                                        placeholder="0"
                                        value={invoiceDiscount}
                                        onChange={e => setInvoiceDiscount(e.target.value)}
                                        className="w-full px-3 py-2 text-sm border border-amber-200 rounded-md focus:ring-2 focus:ring-amber-500 focus:border-amber-500 bg-white"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs text-amber-700 mb-1">Reason</label>
                                    <select
                                        value={discountReason}
                                        onChange={e => setDiscountReason(e.target.value)}
                                        className="w-full px-3 py-2 text-sm border border-amber-200 rounded-md focus:ring-2 focus:ring-amber-500 focus:border-amber-500 bg-white"
                                    >
                                        <option value="">Select reason</option>
                                        <option value="Scholarship">Scholarship</option>
                                        <option value="Staff Ward">Staff Ward</option>
                                        <option value="Sibling Discount">Sibling Discount</option>
                                        <option value="Early Payment">Early Payment</option>
                                        <option value="Financial Aid">Financial Aid</option>
                                        <option value="Special Arrangement">Special Arrangement</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        {/* Invoice Preview */}
                        <div className="overflow-y-auto max-h-[60vh] border rounded-lg p-2 bg-gray-50">
                            <InvoiceTemplate
                                student={invoiceStudent}
                                cls={classes.find(c => c.id === invoiceStudent.class_id)}
                                fees={fees}
                                payments={payments}
                                settings={settings}
                                discount={Number(invoiceDiscount) || 0}
                                discountReason={discountReason}
                            />
                        </div>

                        <div className="flex justify-end gap-2 pt-2 border-t">
                            <Button variant="secondary" onClick={() => { setInvoiceStudent(null); setInvoiceDiscount(''); setDiscountReason(''); }}>Close</Button>
                            <Button onClick={handlePrintInvoice}>
                                <Printer className="h-4 w-4 mr-2" /> Print
                            </Button>
                        </div>
                    </div>
                )}
            </Modal>

            {/* Expense Modal */}
            <Modal isOpen={showExpenseModal} onClose={() => setShowExpenseModal(false)} title="Record Expense">
                <form onSubmit={handleExpenseSubmit} className="space-y-4">
                    <Input label="Title" required value={expTitle} onChange={e => setExpTitle(e.target.value)} placeholder="e.g. Classroom repairs" />
                    <Input label="Amount" type="number" required value={expAmount} onChange={e => setExpAmount(e.target.value)} />
                    <Select label="Category" value={expCat} onChange={e => setExpCat(e.target.value)}>
                        <option value="supplies">Supplies</option>
                        <option value="maintenance">Maintenance</option>
                        <option value="salary">Salary</option>
                        <option value="utilities">Utilities</option>
                        <option value="other">Other</option>
                    </Select>
                    <Input label="Date" type="date" value={expDate} onChange={e => setExpDate(e.target.value)} />
                    <Input label="Description (Optional)" value={expDesc} onChange={e => setExpDesc(e.target.value)} placeholder="Additional details..." disabled={isSubmitting} />
                    <Button type="submit" className="w-full" disabled={isSubmitting}>
                        {isSubmitting ? 'Processing...' : 'Save Expense'}
                    </Button>
                </form>
            </Modal>

            {/* Fee Structure Modal */}
            <Modal isOpen={showFeeModal} onClose={() => setShowFeeModal(false)} title="Add Fee Structure">
                <form onSubmit={handleFeeSubmit} className="space-y-4">
                    <Input label="Fee Name" required value={feeName} onChange={e => setFeeName(e.target.value)} placeholder="e.g. Tuition Fee" />
                    <Input label="Amount" type="number" required value={feeAmount} onChange={e => setFeeAmount(e.target.value)} />
                    <Select label="Applicable Class" value={feeClass} onChange={e => setFeeClass(e.target.value)}>
                        <option value="">All Classes</option>
                        {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </Select>
                    <div className="flex items-center gap-2">
                        <input
                            type="checkbox"
                            id="feeOptional"
                            checked={feeOptional}
                            onChange={e => setFeeOptional(e.target.checked)}
                            className="rounded border-gray-300 text-brand-600 focus:ring-brand-500"
                        />
                        <label htmlFor="feeOptional" className="text-sm text-gray-700">Optional Fee (e.g. Bus, Excursion)</label>
                    </div>
                    <Button type="submit" className="w-full" disabled={isSubmitting}>
                        {isSubmitting ? 'Creating...' : 'Create Fee'}
                    </Button>
                </form>
            </Modal>

            {/* Discount/Scholarship Modal */}
            {showDiscountModal && setShowDiscountModal && (
                <Modal isOpen={showDiscountModal} onClose={() => setShowDiscountModal(false)} title="Add Adjustment">
                    <form onSubmit={handleDiscountSubmit} className="space-y-4">
                        <Select label="Type" value={discCategory} onChange={e => setDiscCategory(e.target.value as any)}>
                            <option value="discount">Discount</option>
                            <option value="scholarship">Scholarship</option>
                        </Select>
                        <Input label="Amount (₦)" type="number" required value={discAmount} onChange={e => setDiscAmount(e.target.value)} />
                        <Input label="Reason/Description" required value={discReason} onChange={e => setDiscReason(e.target.value)} placeholder="e.g. Staff Child, Merit Award" />
                        <Button type="submit" className="w-full">Apply Adjustment</Button>
                    </form>
                </Modal>
            )}
        </>
    );
};
