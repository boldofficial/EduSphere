import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Printer } from 'lucide-react';
import * as Types from '@/lib/types';
import * as Utils from '@/lib/utils';
import { useSettings } from '@/lib/hooks/use-data';

interface PayslipViewProps {
    entry: Types.PayrollEntry;
    isOpen: boolean;
    onClose: () => void;
}

export const PayslipView: React.FC<PayslipViewProps> = ({ entry, isOpen, onClose }) => {
    const { data: settings } = useSettings();

    const handlePrint = () => {
        window.print();
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <div className="flex justify-between items-center hide-print">
                        <DialogTitle>Payslip View</DialogTitle>
                        <Button variant="outline" size="sm" onClick={handlePrint}>
                            <Printer className="h-4 w-4 mr-2" /> Print
                        </Button>
                    </div>
                </DialogHeader>

                <div className="p-4 bg-white text-black payslip-container" id="payslip-print-area">
                    {/* Header */}
                    <div className="text-center border-b pb-4 mb-4">
                        <h1 className="text-xl font-bold uppercase">{settings?.school_name}</h1>
                        <p className="text-sm text-gray-600">{settings?.school_address}</p>
                        <h2 className="text-lg font-semibold mt-2 underline">PAYSLIP</h2>
                    </div>

                    {/* Staff & Payroll Info */}
                    <div className="flex justify-between mb-6 text-sm">
                        <div className="space-y-1">
                            <p><span className="font-semibold">Staff Name:</span> {entry.staff_name}</p>
                            <p><span className="font-semibold">Role:</span> {entry.staff_role}</p>
                            <p><span className="font-semibold">Bank:</span> {entry.bank_name}</p>
                            <p><span className="font-semibold">Account:</span> {entry.account_number}</p>
                        </div>
                        <div className="space-y-1 text-right">
                            <p><span className="font-semibold">Date:</span> {new Date().toLocaleDateString()}</p>
                            <p><span className="font-semibold">Payroll ID:</span> #{entry.payroll}</p>
                            <p><span className="font-semibold">Status:</span> {entry.is_paid ? 'PAID' : 'PENDING'}</p>
                        </div>
                    </div>

                    {/* Financials Table */}
                    <div className="border rounded-lg overflow-hidden mb-6">
                        <div className="grid grid-cols-2 bg-gray-100 font-semibold p-2 border-b">
                            <div>Earnings</div>
                            <div className="text-right">Amount</div>
                        </div>

                        {/* Basic */}
                        <div className="grid grid-cols-2 p-2 border-b">
                            <div>Basic Salary</div>
                            <div className="text-right">{Utils.formatCurrency(entry.basic_salary)}</div>
                        </div>

                        {/* Allowances */}
                        {entry.breakdown?.allowances?.map((a: any, idx: number) => (
                            <div key={`a-${idx}`} className="grid grid-cols-2 p-2 border-b text-sm">
                                <div>{a.name}</div>
                                <div className="text-right">{Utils.formatCurrency(a.amount)}</div>
                            </div>
                        ))}

                        <div className="grid grid-cols-2 bg-gray-50 font-semibold p-2 border-b">
                            <div>Gross Earnings</div>
                            <div className="text-right">
                                {Utils.formatCurrency(Number(entry.basic_salary) + Number(entry.total_allowances))}
                            </div>
                        </div>

                        {/* Deductions Header */}
                        <div className="grid grid-cols-2 bg-gray-100 font-semibold p-2 border-b border-t text-red-700">
                            <div>Deductions</div>
                            <div className="text-right">Amount</div>
                        </div>

                        {/* Deductions */}
                        {entry.breakdown?.deductions?.map((d: any, idx: number) => (
                            <div key={`d-${idx}`} className="grid grid-cols-2 p-2 border-b text-sm text-red-600">
                                <div>{d.name}</div>
                                <div className="text-right">-{Utils.formatCurrency(d.amount)}</div>
                            </div>
                        ))}

                        <div className="grid grid-cols-2 bg-gray-50 font-semibold p-2 border-b text-red-700">
                            <div>Total Deductions</div>
                            <div className="text-right">
                                -{Utils.formatCurrency(entry.total_deductions)}
                            </div>
                        </div>
                    </div>

                    {/* Net Pay */}
                    <div className="bg-blue-900 text-white p-4 rounded-lg flex justify-between items-center print:bg-gray-200 print:text-black">
                        <span className="text-lg font-bold">NET PAY</span>
                        <span className="text-2xl font-bold">{Utils.formatCurrency(entry.net_pay)}</span>
                    </div>

                    <div className="mt-8 text-center text-xs text-gray-500">
                        <p>This is a system generated payslip.</p>
                    </div>
                </div>

                {/* Print Styles Override */}
                <style jsx global>{`
                    @media print {
                        body * {
                            visibility: hidden;
                        }
                        #payslip-print-area, #payslip-print-area * {
                            visibility: visible;
                        }
                        #payslip-print-area {
                            position: fixed;
                            left: 0;
                            top: 0;
                            width: 100%;
                            padding: 20px;
                        }
                        .hide-print {
                            display: none !important;
                        }
                    }
                `}</style>

            </DialogContent>
        </Dialog>
    );
};
