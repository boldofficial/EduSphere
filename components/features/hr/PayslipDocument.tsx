import React, { useRef } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Printer, Download, X } from 'lucide-react';
import * as Types from '@/lib/types';
import { useSettings } from '@/lib/hooks/use-data';

interface PayslipDocumentProps {
    entry: Types.PayrollEntry;
    isOpen: boolean;
    onClose: () => void;
}

const formatNaira = (amount: number) => `₦${Number(amount).toLocaleString('en-NG', { minimumFractionDigits: 2 })}`;

export const PayslipDocument: React.FC<PayslipDocumentProps> = ({ entry, isOpen, onClose }) => {
    const { data: settings } = useSettings();
    const printRef = useRef<HTMLDivElement>(null);

    const handlePrint = () => {
        const content = printRef.current;
        if (!content) return;

        const printWindow = window.open('', '_blank', 'width=800,height=1100');
        if (!printWindow) return;

        printWindow.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>Payslip - ${entry.payslip_number || entry.staff_name}</title>
                <style>
                    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
                    * { margin: 0; padding: 0; box-sizing: border-box; }
                    body {
                        font-family: 'Inter', -apple-system, sans-serif;
                        color: #1a1a1a;
                        background: white;
                        padding: 24px;
                        font-size: 12px;
                        line-height: 1.5;
                    }
                    .payslip { max-width: 720px; margin: 0 auto; }
                    .header { text-align: center; border-bottom: 3px solid #1e3a5f; padding-bottom: 16px; margin-bottom: 20px; }
                    .header h1 { font-size: 20px; font-weight: 700; color: #1e3a5f; text-transform: uppercase; letter-spacing: 1px; }
                    .header .address { font-size: 11px; color: #666; margin-top: 4px; }
                    .header .contact { font-size: 10px; color: #888; margin-top: 2px; }
                    .header .payslip-title {
                        font-size: 16px; font-weight: 600; color: #1e3a5f;
                        margin-top: 12px; text-transform: uppercase; letter-spacing: 3px;
                        border-top: 1px solid #e0e0e0; padding-top: 10px;
                    }
                    .meta-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 20px; }
                    .meta-box { background: #f8f9fa; padding: 12px 16px; border-radius: 6px; border: 1px solid #e9ecef; }
                    .meta-box h3 { font-size: 9px; text-transform: uppercase; letter-spacing: 1.5px; color: #888; font-weight: 600; margin-bottom: 6px; }
                    .meta-row { display: flex; justify-content: space-between; padding: 2px 0; }
                    .meta-label { color: #555; font-size: 11px; }
                    .meta-value { font-weight: 500; font-size: 11px; }
                    .earnings-table { width: 100%; border-collapse: collapse; margin-bottom: 16px; }
                    .earnings-table th {
                        background: #1e3a5f; color: white; padding: 8px 12px;
                        text-align: left; font-size: 11px; font-weight: 600;
                        text-transform: uppercase; letter-spacing: 0.5px;
                    }
                    .earnings-table th:last-child { text-align: right; }
                    .earnings-table td { padding: 8px 12px; border-bottom: 1px solid #eee; font-size: 11px; }
                    .earnings-table td:last-child { text-align: right; font-variant-numeric: tabular-nums; }
                    .earnings-table .subtotal { background: #f0f4f8; font-weight: 600; }
                    .earnings-table .subtotal td { border-top: 2px solid #d0d5dd; }
                    .deductions-header th { background: #7f1d1d !important; }
                    .net-pay-box {
                        background: linear-gradient(135deg, #1e3a5f, #2d5f8a);
                        color: white; padding: 16px 24px;
                        border-radius: 8px; display: flex;
                        justify-content: space-between; align-items: center;
                        margin: 20px 0;
                    }
                    .net-pay-label { font-size: 14px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px; }
                    .net-pay-amount { font-size: 24px; font-weight: 700; }
                    .footer { margin-top: 40px; border-top: 1px solid #e0e0e0; padding-top: 16px; }
                    .footer-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; }
                    .signature-line { border-top: 1px solid #999; margin-top: 40px; padding-top: 4px; text-align: center; font-size: 10px; color: #666; }
                    .disclaimer { text-align: center; font-size: 9px; color: #aaa; margin-top: 20px; font-style: italic; }
                    .payslip-ref { text-align: center; font-size: 10px; color: #999; margin-top: 8px; font-family: monospace; }
                    @media print {
                        body { padding: 0; }
                        @page { size: A4; margin: 20mm; }
                    }
                </style>
            </head>
            <body>
                ${content.innerHTML}
            </body>
            </html>
        `);
        printWindow.document.close();
        setTimeout(() => { printWindow.print(); }, 300);
    };

    const grossPay = Number(entry.basic_salary) + Number(entry.total_allowances);
    const payMonth = entry.payroll_month
        ? new Date(entry.payroll_month).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
        : 'N/A';

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-3xl max-h-[95vh] overflow-y-auto p-0">
                {/* Toolbar */}
                <div className="sticky top-0 z-10 flex items-center justify-between bg-white border-b px-6 py-3">
                    <h2 className="font-semibold text-sm text-gray-700">Payslip Preview</h2>
                    <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={handlePrint}>
                            <Printer className="h-4 w-4 mr-2" /> Print
                        </Button>
                        <Button variant="ghost" size="sm" onClick={onClose}>
                            <X className="h-4 w-4" />
                        </Button>
                    </div>
                </div>

                {/* Payslip Content */}
                <div ref={printRef} className="p-8 bg-white" style={{ fontFamily: "'Inter', sans-serif" }}>
                    <div className="payslip max-w-[720px] mx-auto">
                        {/* Header */}
                        <div className="text-center border-b-[3px] border-[#1e3a5f] pb-4 mb-5">
                            {settings?.logo_media && (
                                <img
                                    src={settings.logo_media.startsWith('data:') ? settings.logo_media : `data:image/png;base64,${settings.logo_media}`}
                                    alt="School Logo"
                                    className="h-14 mx-auto mb-2"
                                    style={{ height: '56px', objectFit: 'contain' }}
                                />
                            )}
                            <h1 className="text-xl font-bold text-[#1e3a5f] uppercase tracking-wide">{settings?.school_name || 'School Name'}</h1>
                            <p className="text-[11px] text-gray-500 mt-1">{settings?.school_address || ''}</p>
                            <p className="text-[10px] text-gray-400">{settings?.school_email} • {settings?.school_phone}</p>
                            <div className="text-base font-semibold text-[#1e3a5f] mt-3 uppercase tracking-[3px] border-t border-gray-200 pt-2.5">
                                PAYSLIP
                            </div>
                        </div>

                        {/* Employee & Pay Period Info */}
                        <div className="grid grid-cols-2 gap-4 mb-5">
                            <div className="bg-gray-50 p-3 rounded-md border border-gray-100">
                                <h3 className="text-[9px] uppercase tracking-[1.5px] text-gray-400 font-semibold mb-1.5">Employee Details</h3>
                                <div className="space-y-0.5 text-[11px]">
                                    <div className="flex justify-between"><span className="text-gray-500">Name:</span><span className="font-medium">{entry.staff_name}</span></div>
                                    <div className="flex justify-between"><span className="text-gray-500">Role:</span><span className="font-medium">{entry.staff_role || '—'}</span></div>
                                    <div className="flex justify-between"><span className="text-gray-500">Staff ID:</span><span className="font-medium">#{entry.staff_id_display || entry.staff}</span></div>
                                    <div className="flex justify-between"><span className="text-gray-500">Type:</span><span className="font-medium">{entry.staff_type || '—'}</span></div>
                                </div>
                            </div>
                            <div className="bg-gray-50 p-3 rounded-md border border-gray-100">
                                <h3 className="text-[9px] uppercase tracking-[1.5px] text-gray-400 font-semibold mb-1.5">Payment Details</h3>
                                <div className="space-y-0.5 text-[11px]">
                                    <div className="flex justify-between"><span className="text-gray-500">Pay Period:</span><span className="font-medium">{payMonth}</span></div>
                                    <div className="flex justify-between"><span className="text-gray-500">Payslip No:</span><span className="font-medium font-mono">{entry.payslip_number || '—'}</span></div>
                                    <div className="flex justify-between"><span className="text-gray-500">Bank:</span><span className="font-medium">{entry.breakdown?.bank?.name || entry.bank_name || '—'}</span></div>
                                    <div className="flex justify-between"><span className="text-gray-500">Account:</span><span className="font-medium">{entry.breakdown?.bank?.account || entry.account_number || '—'}</span></div>
                                </div>
                            </div>
                        </div>

                        {/* Earnings Table */}
                        <table className="w-full border-collapse mb-4" style={{ fontSize: '11px' }}>
                            <thead>
                                <tr>
                                    <th className="bg-[#1e3a5f] text-white p-2 px-3 text-left text-[11px] font-semibold uppercase tracking-[0.5px]">Earnings</th>
                                    <th className="bg-[#1e3a5f] text-white p-2 px-3 text-right text-[11px] font-semibold uppercase tracking-[0.5px]">Amount (₦)</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td className="p-2 px-3 border-b border-gray-100">Basic Salary</td>
                                    <td className="p-2 px-3 border-b border-gray-100 text-right tabular-nums">{formatNaira(entry.basic_salary)}</td>
                                </tr>
                                {entry.breakdown?.allowances?.map((a, i) => (
                                    <tr key={`a-${i}`}>
                                        <td className="p-2 px-3 border-b border-gray-100 text-gray-600">{a.name}</td>
                                        <td className="p-2 px-3 border-b border-gray-100 text-right tabular-nums">{formatNaira(a.amount)}</td>
                                    </tr>
                                ))}
                                <tr className="bg-gray-50 font-semibold">
                                    <td className="p-2 px-3 border-t-2 border-gray-200">Gross Earnings</td>
                                    <td className="p-2 px-3 border-t-2 border-gray-200 text-right tabular-nums">{formatNaira(grossPay)}</td>
                                </tr>
                            </tbody>
                        </table>

                        {/* Deductions Table */}
                        <table className="w-full border-collapse mb-4" style={{ fontSize: '11px' }}>
                            <thead>
                                <tr>
                                    <th className="bg-[#7f1d1d] text-white p-2 px-3 text-left text-[11px] font-semibold uppercase tracking-[0.5px]">Deductions</th>
                                    <th className="bg-[#7f1d1d] text-white p-2 px-3 text-right text-[11px] font-semibold uppercase tracking-[0.5px]">Amount (₦)</th>
                                </tr>
                            </thead>
                            <tbody>
                                {entry.breakdown?.deductions?.length > 0 ? (
                                    entry.breakdown.deductions.map((d, i) => (
                                        <tr key={`d-${i}`}>
                                            <td className="p-2 px-3 border-b border-gray-100 text-gray-600">{d.name}</td>
                                            <td className="p-2 px-3 border-b border-gray-100 text-right tabular-nums text-red-600">-{formatNaira(d.amount)}</td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td className="p-2 px-3 border-b border-gray-100 text-gray-400 italic" colSpan={2}>No deductions</td>
                                    </tr>
                                )}
                                <tr className="bg-gray-50 font-semibold">
                                    <td className="p-2 px-3 border-t-2 border-gray-200 text-red-700">Total Deductions</td>
                                    <td className="p-2 px-3 border-t-2 border-gray-200 text-right tabular-nums text-red-700">-{formatNaira(entry.total_deductions)}</td>
                                </tr>
                            </tbody>
                        </table>

                        {/* Net Pay Box */}
                        <div
                            className="rounded-lg p-4 px-6 flex justify-between items-center my-5"
                            style={{ background: 'linear-gradient(135deg, #1e3a5f, #2d5f8a)', color: 'white' }}
                        >
                            <span className="text-sm font-semibold uppercase tracking-wide">Net Pay</span>
                            <span className="text-2xl font-bold">{formatNaira(entry.net_pay)}</span>
                        </div>

                        {/* Signature Section */}
                        <div className="mt-10 grid grid-cols-2 gap-6">
                            <div>
                                <div className="border-t border-gray-400 mt-10 pt-1 text-center text-[10px] text-gray-500">
                                    Authorized Signatory
                                </div>
                            </div>
                            <div>
                                <div className="border-t border-gray-400 mt-10 pt-1 text-center text-[10px] text-gray-500">
                                    Employee Signature
                                </div>
                            </div>
                        </div>

                        {/* Disclaimer */}
                        <p className="text-center text-[9px] text-gray-400 mt-6 italic">
                            This is a computer-generated payslip and does not require a physical signature.
                        </p>
                        <p className="text-center text-[10px] text-gray-400 mt-1 font-mono">
                            {entry.payslip_number || `REF-${entry.id}`}
                        </p>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
};
