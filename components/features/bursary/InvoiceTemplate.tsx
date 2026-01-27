import React from 'react';
import * as Types from '@/lib/types';
import * as Utils from '@/lib/utils';

interface InvoiceTemplateProps {
    student: Types.Student;
    cls?: Types.Class;
    fees: Types.FeeStructure[];
    payments: Types.Payment[];
    settings: Types.Settings;
    discount?: number;
    discountReason?: string;
}

export const InvoiceTemplate: React.FC<InvoiceTemplateProps> = ({
    student,
    cls,
    fees,
    payments,
    settings,
    discount = 0,
    discountReason = ''
}) => {
    const { totalBill, totalPaid } = Utils.getStudentBalance(student, fees, payments, settings.current_session, settings.current_term);

    const discountedTotal = Math.max(0, totalBill - discount);
    const balance = Math.max(0, discountedTotal - totalPaid);

    const applicableFees = fees.filter(f =>
        f.session === settings.current_session &&
        f.term === settings.current_term &&
        (f.class_id === null || f.class_id === student.class_id) &&
        (!f.is_optional || student.assigned_fees?.includes(f.id))
    );

    const studentPayments = payments.filter(p =>
        p.student_id === student.id &&
        p.session === settings.current_session &&
        p.term === settings.current_term
    );

    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + (settings.invoice_due_days || 14));
    const formattedDueDate = dueDate.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

    const invoiceNo = `INV-${settings.current_session.replace('/', '')}-${student.student_no.slice(-4)}-${Date.now().toString().slice(-6)}`;

    return (
        <div
            id="invoice-print"
            style={{
                width: '100%',
                background: '#fff',
                printColorAdjust: 'exact',
                WebkitPrintColorAdjust: 'exact'
            } as any}
        >
            <div style={{
                fontFamily: "'Inter', 'Segoe UI', Arial, sans-serif",
                fontSize: '11pt',
                color: '#1a1a1a',
                padding: '20mm 15mm', // Professional A4 margins
                lineHeight: '1.5',
                position: 'relative',
                minHeight: '290mm'
            }}>
                {/* Header: School Info & Invoice Metadata */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '40px', borderBottom: '2px solid #1A3A5C', paddingBottom: '20px' }}>
                    <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
                        {settings.logo_media ? (
                            <img src={settings.logo_media} alt="School Logo" style={{ height: '80px', width: '80px', objectFit: 'contain' }} />
                        ) : (
                            <div style={{ height: '80px', width: '80px', background: '#f3f4f6', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9ca3af', fontSize: '10px' }}>Logo</div>
                        )}
                        <div>
                            <h1 style={{ fontSize: '20pt', fontWeight: 800, color: '#1A3A5C', margin: '0 0 4px 0', textTransform: 'uppercase', letterSpacing: '-0.5px' }}>
                                {settings.school_name}
                            </h1>
                            <p style={{ color: '#4b5563', fontSize: '10pt', margin: '0', maxWidth: '300px' }}>{settings.school_address}</p>
                            <p style={{ color: '#4b5563', fontSize: '10pt', margin: '2px 0 0 0', fontWeight: 500 }}>
                                {settings.school_phone} • {settings.school_email}
                            </p>
                        </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                        <h2 style={{ fontSize: '28pt', fontWeight: 900, color: '#1A3A5C', margin: '0', lineHeight: '1' }}>INVOICE</h2>
                        <p style={{ fontSize: '11pt', color: '#6b7280', margin: '8px 0 0 0', fontWeight: 600 }}>#{invoiceNo}</p>
                    </div>
                </div>

                {/* Bill To & Invoice Details Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '40px', marginBottom: '40px' }}>
                    <div>
                        <h3 style={{ fontSize: '9pt', color: '#6b7280', textTransform: 'uppercase', margin: '0 0 8px 0', fontWeight: 700, letterSpacing: '0.05em' }}>Bill To</h3>
                        <div style={{ display: 'flex', gap: '12px' }}>
                            {student.passport_url ? (
                                <img src={student.passport_url} alt={student.names} style={{ width: '60px', height: '60px', borderRadius: '6px', objectFit: 'cover', border: '1px solid #e5e7eb' }} />
                            ) : (
                                <div style={{ width: '60px', height: '60px', borderRadius: '6px', background: '#1A3A5C', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '20pt', fontWeight: 700 }}>
                                    {student.names.charAt(0)}
                                </div>
                            )}
                            <div>
                                <p style={{ fontSize: '13pt', fontWeight: 800, color: '#1A3A5C', margin: '0', textTransform: 'uppercase' }}>{student.names}</p>
                                <p style={{ fontSize: '10pt', color: '#374151', margin: '4px 0' }}>ID: <strong>{student.student_no}</strong> | Class: <strong>{cls?.name || 'N/A'}</strong></p>
                                <p style={{ fontSize: '9pt', color: '#6b7280', margin: '0' }}>Guardian: {student.parent_name} ({student.parent_phone})</p>
                            </div>
                        </div>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                        <table style={{ borderCollapse: 'collapse', fontSize: '10pt' }}>
                            <tbody>
                                <tr>
                                    <td style={{ padding: '4px 12px 4px 0', color: '#6b7280', textAlign: 'right' }}>Invoice Date:</td>
                                    <td style={{ padding: '4px 0', fontWeight: 700, color: '#111827' }}>{new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</td>
                                </tr>
                                <tr>
                                    <td style={{ padding: '4px 12px 4px 0', color: '#6b7280', textAlign: 'right' }}>Due Date:</td>
                                    <td style={{ padding: '4px 0', fontWeight: 700, color: '#DC2626' }}>{formattedDueDate}</td>
                                </tr>
                                <tr>
                                    <td style={{ padding: '4px 12px 4px 0', color: '#6b7280', textAlign: 'right' }}>Current Term:</td>
                                    <td style={{ padding: '4px 0', fontWeight: 700, color: '#111827' }}>{settings.current_term}</td>
                                </tr>
                                <tr>
                                    <td style={{ padding: '4px 12px 4px 0', color: '#6b7280', textAlign: 'right' }}>Academic Year:</td>
                                    <td style={{ padding: '4px 0', fontWeight: 700, color: '#111827' }}>{settings.current_session}</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Fee Items Table */}
                <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '30px' }}>
                    <thead>
                        <tr style={{ backgroundColor: '#1A3A5C' }}>
                            <th style={{ color: 'white', padding: '12px 15px', textAlign: 'center', fontSize: '9pt', fontWeight: 700, textTransform: 'uppercase', width: '50px', borderTopLeftRadius: '6px' }}>S/N</th>
                            <th style={{ color: 'white', padding: '12px 15px', textAlign: 'left', fontSize: '9pt', fontWeight: 700, textTransform: 'uppercase' }}>Description</th>
                            <th style={{ color: 'white', padding: '12px 15px', textAlign: 'right', fontSize: '9pt', fontWeight: 700, textTransform: 'uppercase', width: '150px', borderTopRightRadius: '6px' }}>Amount (₦)</th>
                        </tr>
                    </thead>
                    <tbody>
                        {applicableFees.map((fee, index) => (
                            <tr key={fee.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                                <td style={{ padding: '12px 15px', textAlign: 'center', color: '#6b7280', fontSize: '10pt' }}>{index + 1}</td>
                                <td style={{ padding: '12px 15px', fontSize: '10pt', fontWeight: 600, color: '#374151' }}>{fee.name}</td>
                                <td style={{ padding: '12px 15px', textAlign: 'right', fontSize: '11pt', fontWeight: 700, color: '#111827', fontFamily: 'monospace' }}>
                                    {Utils.formatCurrency(fee.amount).replace('₦', '')}
                                </td>
                            </tr>
                        ))}
                        {applicableFees.length === 0 && (
                            <tr>
                                <td colSpan={3} style={{ padding: '30px', textAlign: 'center', color: '#9ca3af', fontStyle: 'italic', fontSize: '10pt' }}>
                                    No specific fees are listed for this student in the current term.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>

                {/* Financial Summary Area */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '40px', marginBottom: '40px' }}>
                    {/* Notes or Left Side Content */}
                    <div style={{ flex: 1 }}>
                        {settings.invoice_notes && (
                            <div style={{ backgroundColor: '#f9fafb', borderRadius: '8px', padding: '15px', borderLeft: '4px solid #1A3A5C' }}>
                                <h4 style={{ fontSize: '9pt', fontWeight: 800, color: '#1A3A5C', margin: '0 0 6px 0', textTransform: 'uppercase' }}>General Note</h4>
                                <p style={{ fontSize: '10pt', color: '#4b5563', margin: 0, lineHeight: '1.4' }}>{settings.invoice_notes}</p>
                            </div>
                        )}
                    </div>

                    {/* Totals Table */}
                    <div style={{ minWidth: '280px' }}>
                        <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '0 8px' }}>
                            <tbody>
                                <tr>
                                    <td style={{ color: '#6b7280', fontSize: '10pt', paddingRight: '20px' }}>Subtotal</td>
                                    <td style={{ textAlign: 'right', fontWeight: 600, fontSize: '11pt', color: '#374151' }}>{Utils.formatCurrency(totalBill)}</td>
                                </tr>
                                {discount > 0 && (
                                    <tr>
                                        <td style={{ color: '#059669', fontSize: '10pt' }}>
                                            Discount {discountReason && <span style={{ fontSize: '8pt', opacity: 0.8 }}>({discountReason})</span>}
                                        </td>
                                        <td style={{ textAlign: 'right', fontWeight: 700, color: '#059669', fontSize: '11pt' }}>-{Utils.formatCurrency(discount)}</td>
                                    </tr>
                                )}
                                {studentPayments.length > 0 && (
                                    <tr>
                                        <td style={{ color: '#059669', fontSize: '11pt', fontWeight: 500 }}>Total Paid</td>
                                        <td style={{ textAlign: 'right', fontWeight: 700, color: '#059669', fontSize: '11pt' }}>-{Utils.formatCurrency(totalPaid)}</td>
                                    </tr>
                                )}
                                <tr>
                                    <td style={{ backgroundColor: '#1A3A5C', color: 'white', padding: '12px 15px', fontWeight: 800, borderTopLeftRadius: '6px', borderBottomLeftRadius: '6px', fontSize: '11pt' }}>BALANCE DUE</td>
                                    <td style={{ backgroundColor: '#1A3A5C', color: 'white', padding: '12px 15px', textAlign: 'right', fontSize: '15pt', fontWeight: 900, borderTopRightRadius: '6px', borderBottomRightRadius: '6px', fontFamily: 'monospace' }}>
                                        {Utils.formatCurrency(balance)}
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Payment History Section (Optional if paid > 0) */}
                {studentPayments.length > 0 && (
                    <div style={{ marginBottom: '30px' }}>
                        <h3 style={{ fontSize: '10pt', fontWeight: 800, color: '#1A3A5C', marginBottom: '10px', borderBottom: '1px solid #e5e7eb', paddingBottom: '5px', textTransform: 'uppercase' }}>
                            Payment History
                        </h3>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '9pt' }}>
                            <thead style={{ backgroundColor: '#f9fafb' }}>
                                <tr>
                                    <th style={{ padding: '8px 12px', textAlign: 'left', color: '#6b7280', fontWeight: 600 }}>Date</th>
                                    <th style={{ padding: '8px 12px', textAlign: 'left', color: '#6b7280', fontWeight: 600 }}>Method</th>
                                    <th style={{ padding: '8px 12px', textAlign: 'right', color: '#6b7280', fontWeight: 600 }}>Amount</th>
                                </tr>
                            </thead>
                            <tbody>
                                {studentPayments.map((p) => (
                                    <tr key={p.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                                        <td style={{ padding: '8px 12px', color: '#374151' }}>{p.date}</td>
                                        <td style={{ padding: '8px 12px', color: '#374151', textTransform: 'capitalize' }}>{p.method}</td>
                                        <td style={{ padding: '8px 12px', textAlign: 'right', fontWeight: 700, color: '#059669' }}>
                                            {Utils.formatCurrency(p.amount)}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Bank Payment Instructions */}
                {settings.show_bank_details && balance > 0 && (
                    <div style={{ backgroundColor: '#fffbeb', border: '1px solid #fbbf24', borderRadius: '10px', padding: '20px', marginBottom: '40px' }}>
                        <h3 style={{ fontSize: '11pt', fontWeight: 800, color: '#92400E', margin: '0 0 15px 0', textTransform: 'uppercase' }}>Bank Payment Instructions</h3>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px' }}>
                            <div>
                                <span style={{ fontSize: '8pt', color: '#b45309', textTransform: 'uppercase', fontWeight: 700 }}>Bank Name</span>
                                <p style={{ margin: '4px 0 0 0', fontWeight: 700, color: '#92400E' }}>{settings.bank_name}</p>
                            </div>
                            <div>
                                <span style={{ fontSize: '8pt', color: '#b45309', textTransform: 'uppercase', fontWeight: 700 }}>Account Number</span>
                                <p style={{ margin: '4px 0 0 0', fontWeight: 700, color: '#92400E', fontFamily: 'monospace', fontSize: '12pt' }}>{settings.bank_account_number}</p>
                            </div>
                            <div>
                                <span style={{ fontSize: '8pt', color: '#b45309', textTransform: 'uppercase', fontWeight: 700 }}>Account Name</span>
                                <p style={{ margin: '4px 0 0 0', fontWeight: 700, color: '#92400E' }}>{settings.bank_account_name}</p>
                            </div>
                        </div>
                        <div style={{ marginTop: '15px', paddingTop: '15px', borderTop: '1px dashed #fbbf24', fontSize: '10pt', color: '#92400E' }}>
                            Please use <strong>{student.student_no}</strong> or <strong>{student.names.split(' ')[0]}</strong> as the payment reference.
                        </div>
                    </div>
                )}

                {/* Signature & Status Strip */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: '60px', paddingBottom: '20px' }}>
                    <div style={{ textAlign: 'center', minWidth: '180px' }}>
                        <div style={{ width: '100%', borderBottom: '1px solid #1a1a1a', height: '40px', marginBottom: '8px' }}></div>
                        <p style={{ fontSize: '10pt', fontWeight: 700, color: '#1a1a1a', margin: 0 }}>School Bursar</p>
                        <p style={{ fontSize: '8pt', color: '#6b7280', margin: 0 }}>Signature & Date</p>
                    </div>

                    <div style={{ textAlign: 'center' }}>
                        {balance > 0 ? (
                            <div style={{ border: '3px solid #DC2626', color: '#DC2626', padding: '10px 25px', borderRadius: '8px', fontSize: '18pt', fontWeight: 900, textTransform: 'uppercase', transform: 'rotate(-5deg)', opacity: 0.8 }}>
                                Payment Due
                            </div>
                        ) : (
                            <div style={{ border: '3px solid #059669', color: '#059669', padding: '10px 25px', borderRadius: '8px', fontSize: '18pt', fontWeight: 900, textTransform: 'uppercase', transform: 'rotate(-5deg)', opacity: 0.8 }}>
                                Paid In Full
                            </div>
                        )}
                    </div>

                    <div style={{ textAlign: 'center', minWidth: '180px' }}>
                        <div style={{ width: '100%', borderBottom: '1px solid #1a1a1a', height: '40px', marginBottom: '8px' }}></div>
                        <p style={{ fontSize: '10pt', fontWeight: 700, color: '#1a1a1a', margin: 0 }}>{settings.head_of_school_name || "Head of School"}</p>
                        <p style={{ fontSize: '8pt', color: '#6b7280', margin: 0 }}>Authorized Signature</p>
                    </div>
                </div>

                {/* Final Footer */}
                <div style={{ marginTop: '50px', paddingTop: '20px', borderTop: '1px solid #f3f4f6', textAlign: 'center' }}>
                    <p style={{ fontSize: '11pt', color: '#4b5563', fontStyle: 'italic', fontWeight: 600, margin: '0 0 8px 0' }}>
                        &quot;{settings.school_tagline || "...reaching the highest height"}&quot;
                    </p>
                    <div style={{ fontSize: '8pt', color: '#9ca3af' }}>
                        This is an official document generated by {settings.school_name} on {new Date().toLocaleString('en-GB')}
                        <br />
                        © {new Date().getFullYear()} All Rights Reserved.
                    </div>
                </div>
            </div>
        </div>
    );
};
