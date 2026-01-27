import React from 'react';
import * as Types from '@/lib/types';
import * as Utils from '@/lib/utils';

interface ReceiptTemplateProps {
    payment: Types.Payment;
    student: Types.Student;
    cls?: Types.Class;
    settings: Types.Settings;
}

const PURPOSE_LABELS: Record<string, string> = {
    tuition: 'Tuition Fees',
    registration: 'Registration Fee',
    books: 'Books & Materials',
    uniform: 'School Uniform',
    transport: 'Transport/Bus Fee',
    exam: 'Examination Fee',
    excursion: 'Excursion/Field Trip',
    other: 'Other Payment',
};

export const ReceiptTemplate: React.FC<ReceiptTemplateProps> = ({ payment, student, cls, settings }) => {
    // Use lineItems, or fallback to a single item with the total amount
    const lineItems = payment.lineItems?.length > 0
        ? payment.lineItems
        : [{ purpose: 'payment', amount: payment.amount }];

    return (
        <div id="receipt-print" style={{ width: '100%', background: '#fff', printColorAdjust: 'exact', WebkitPrintColorAdjust: 'exact' } as any}>
            <div style={{ padding: '15mm', fontFamily: "'Segoe UI', Arial, sans-serif" }}>
                {/* Header Section - Compact Professional Layout */}
                <div style={{ textAlign: 'center', marginBottom: '10px', paddingBottom: '8px', borderBottom: '2px solid #1A3A5C' }}>
                    <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
                        {settings.logo_media && (
                            <img src={settings.logo_media} alt="Logo" style={{ height: '45px', width: '45px', objectFit: 'contain', flexShrink: 0 }} />
                        )}
                        <div style={{ textAlign: 'left', minWidth: 0 }}>
                            <div style={{ fontSize: '15px', fontWeight: 800, color: '#1A3A5C', textTransform: 'uppercase', lineHeight: 1.2, wordWrap: 'break-word' }}>
                                {settings.school_name}
                            </div>
                            <div style={{ color: '#555', fontSize: '9px', lineHeight: 1.4, wordWrap: 'break-word' }}>
                                {settings.school_address}
                            </div>
                            <div style={{ color: '#555', fontSize: '9px', lineHeight: 1.4 }}>
                                {settings.school_phone} | {settings.school_email}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Receipt Title */}
                <div style={{ background: '#1A3A5C', color: 'white', textAlign: 'center', padding: '5px', borderRadius: '4px', marginBottom: '10px' }}>
                    <h2 style={{ fontSize: '11px', letterSpacing: '2px', margin: 0 }}>PAYMENT RECEIPT</h2>
                </div>

                {/* Receipt Details Row */}
                <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', gap: '6px', marginBottom: '10px', fontSize: '10px' }}>
                    <div style={{ flex: '1 1 120px', minWidth: 0 }}>
                        <p style={{ margin: '2px 0' }}>
                            <span style={{ fontSize: '8px', color: '#888', textTransform: 'uppercase' }}>Receipt No:</span>{' '}
                            <span style={{ fontWeight: 600, color: '#1A3A5C' }}>
                                #{payment.reference || String(payment.id).substring(0, 8).toUpperCase()}
                            </span>
                        </p>
                        <p style={{ margin: '2px 0' }}><span style={{ fontSize: '8px', color: '#888', textTransform: 'uppercase' }}>Date:</span> <span style={{ fontWeight: 600, color: '#333' }}>{payment.date}</span></p>
                    </div>
                    <div style={{ flex: '1 1 120px', minWidth: 0, textAlign: 'right' }}>
                        <p style={{ margin: '2px 0' }}><span style={{ fontSize: '8px', color: '#888', textTransform: 'uppercase' }}>Session:</span> <span style={{ fontWeight: 600, color: '#333' }}>{payment.session}</span></p>
                        <p style={{ margin: '2px 0' }}><span style={{ fontSize: '8px', color: '#888', textTransform: 'uppercase' }}>Term:</span> <span style={{ fontWeight: 600, color: '#333' }}>{payment.term}</span></p>
                    </div>
                </div>

                {/* Student Info */}
                <div style={{ background: '#f5f5f5', padding: '8px', borderRadius: '4px', marginBottom: '10px' }}>
                    <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', gap: '6px' }}>
                        <div style={{ flex: '1 1 140px', minWidth: 0 }}>
                            <p style={{ fontSize: '8px', color: '#888', textTransform: 'uppercase', margin: '0 0 2px 0' }}>Received From</p>
                            <p style={{ fontWeight: 600, color: '#333', fontSize: '11px', margin: '0 0 2px 0', wordWrap: 'break-word' }}>{student.names}</p>
                            <p style={{ fontSize: '9px', color: '#666', margin: 0 }}>ID: {student.student_no}</p>
                        </div>
                        <div style={{ flex: '0 0 auto', textAlign: 'right' }}>
                            <p style={{ fontSize: '8px', color: '#888', textTransform: 'uppercase', margin: '0 0 2px 0' }}>Class</p>
                            <p style={{ fontWeight: 600, color: '#333', fontSize: '11px', margin: 0 }}>{cls?.name || 'N/A'}</p>
                        </div>
                    </div>
                </div>

                {/* Payment Table with Individual Line Items */}
                <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '10px' }}>
                    <thead>
                        <tr>
                            <th style={{ background: '#f0f4f8', color: '#1A3A5C', padding: '6px', textAlign: 'left', border: '1px solid #d9e2ec', fontSize: '9px', width: '30px' }}>S/N</th>
                            <th style={{ background: '#f0f4f8', color: '#1A3A5C', padding: '6px', textAlign: 'left', border: '1px solid #d9e2ec', fontSize: '9px' }}>Description</th>
                            <th style={{ background: '#f0f4f8', color: '#1A3A5C', padding: '6px', textAlign: 'right', border: '1px solid #d9e2ec', fontSize: '9px', width: '80px' }}>Amount</th>
                        </tr>
                    </thead>
                    <tbody>
                        {lineItems.map((item, index) => (
                            <tr key={index}>
                                <td style={{ padding: '6px', border: '1px solid #ddd', fontSize: '10px', textAlign: 'center' }}>{index + 1}</td>
                                <td style={{ padding: '6px', border: '1px solid #ddd', fontSize: '10px' }}>
                                    {PURPOSE_LABELS[item.purpose] || item.purpose}
                                </td>
                                <td style={{ padding: '6px', border: '1px solid #ddd', fontSize: '10px', textAlign: 'right', fontWeight: 600, color: '#1A3A5C' }}>
                                    {Utils.formatCurrency(item.amount)}
                                </td>
                            </tr>
                        ))}
                        {/* Total Row */}
                        <tr style={{ background: '#f0f4f8' }}>
                            <td colSpan={2} style={{ padding: '6px', border: '1px solid #d9e2ec', fontSize: '10px', fontWeight: 700, textAlign: 'right' }}>
                                TOTAL {payment.method && <span style={{ fontWeight: 400, color: '#666', fontSize: '9px' }}>(via {payment.method.toUpperCase()})</span>}
                            </td>
                            <td style={{ padding: '6px', border: '1px solid #d9e2ec', fontSize: '12px', textAlign: 'right', fontWeight: 800, color: '#1A3A5C' }}>
                                {Utils.formatCurrency(payment.amount)}
                            </td>
                        </tr>
                    </tbody>
                </table>

                {/* Remark if exists */}
                {payment.remark && (
                    <div style={{ fontSize: '9px', color: '#666', marginBottom: '10px', fontStyle: 'italic' }}>
                        Note: {payment.remark}
                    </div>
                )}

                {/* Footer with Signature */}
                <div style={{ borderTop: '2px solid #1A3A5C', paddingTop: '12px', marginTop: '16px' }}>
                    <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'flex-end', gap: '12px' }}>
                        <div style={{ textAlign: 'center', flex: '0 0 auto' }}>
                            <div style={{ width: '120px', borderBottom: '2px solid #333', height: '30px', marginBottom: '3px', display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
                                {settings.head_of_school_signature && (
                                    <img src={settings.head_of_school_signature} alt="Signature" style={{ height: '28px', objectFit: 'contain' }} />
                                )}
                            </div>
                            <p style={{ fontWeight: 600, fontSize: '10px', margin: 0 }}>{settings.head_of_school_name || 'Head of Schools'}</p>
                            <p style={{ fontSize: '8px', color: '#666', margin: 0 }}>{(settings.head_teacher_label === 'Head Teacher' ? 'Head of Schools' : settings.head_teacher_label) || 'Head of Schools'}</p>
                        </div>
                        <div style={{ textAlign: 'right', flex: '1 1 auto', minWidth: 0 }}>
                            <p style={{ color: '#8FC31F', fontStyle: 'italic', fontSize: '10px', margin: '0 0 3px 0', wordWrap: 'break-word' }}>{settings.school_tagline}</p>
                            <span style={{ fontSize: '8px', color: '#999' }}>© {new Date().getFullYear()} {settings.school_name}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
