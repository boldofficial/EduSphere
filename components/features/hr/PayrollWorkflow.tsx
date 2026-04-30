import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    PlayCircle, CheckCircle, CreditCard, Trash2, FileText,
    Calendar, AlertCircle, ChevronDown, ChevronUp, Banknote
} from 'lucide-react';
import {
    usePayrolls, useGeneratePayroll, useApprovePayroll,
    useMarkPayrollPaid, useDeletePayroll
} from '@/lib/hooks/use-data';
import { useToast } from '@/components/providers/toast-provider';
import * as Types from '@/lib/types';

const formatNaira = (amount: number) => `₦${Number(amount).toLocaleString('en-NG', { minimumFractionDigits: 2 })}`;

interface PayrollWorkflowProps {
    onViewPayslip: (entry: Types.PayrollEntry) => void;
}

export const PayrollWorkflow: React.FC<PayrollWorkflowProps> = ({ onViewPayslip }) => {
    const { addToast } = useToast();
    const { data: payrolls = [], isLoading } = usePayrolls();

    const { mutate: generatePayroll, isPending: isGenerating } = useGeneratePayroll();
    const { mutate: approvePayroll, isPending: isApproving } = useApprovePayroll();
    const { mutate: markPaid, isPending: isMarking } = useMarkPayrollPaid();
    const { mutate: deletePayroll } = useDeletePayroll();

    // Month picker state
    const [selectedMonth, setSelectedMonth] = useState(() => {
        const now = new Date();
        return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    });

    // Expanded payroll for viewing entries
    const [expandedPayrollId, setExpandedPayrollId] = useState<string | number | null>(null);

    const handleGenerate = () => {
        generatePayroll(selectedMonth, {
            onSuccess: () => addToast('Draft payroll generated successfully', 'success'),
            onError: (err: any) => addToast(err.response?.data?.error || 'Failed to generate payroll', 'error'),
        });
    };

    const handleApprove = (id: string | number) => {
        approvePayroll(id, {
            onSuccess: () => addToast('Payroll approved successfully', 'success'),
        });
    };

    const handleMarkPaid = (id: string | number) => {
        markPaid({ id, createExpense: true }, {
            onSuccess: () => addToast('Payroll marked as paid. Expense recorded.', 'success'),
        });
    };

    const handleDelete = (id: string | number) => {
        if (!confirm('Delete this payroll run? This cannot be undone.')) return;
        deletePayroll(id, {
            onSuccess: () => addToast('Payroll deleted', 'success'),
        });
    };

    const statusConfig: Record<string, { color: string; badge: 'default' | 'secondary' | 'outline' | 'destructive' }> = {
        draft: { color: 'border-l-amber-400', badge: 'outline' },
        approved: { color: 'border-l-blue-500', badge: 'default' },
        paid: { color: 'border-l-emerald-500', badge: 'secondary' },
    };

    return (
        <div className="space-y-6">
            {/* Generate Payroll Card */}
            <Card className="border-0 shadow-sm bg-gradient-to-r from-brand-50 to-blue-50">
                <CardContent className="p-6">
                    <div className="flex flex-col sm:flex-row items-start sm:items-end gap-4">
                        <div className="flex-1">
                            <h3 className="text-lg font-semibold mb-1">Generate Payroll</h3>
                            <p className="text-sm text-muted-foreground mb-3">
                                Select a month and generate draft payroll for all active staff.
                            </p>
                            <div className="flex items-center gap-3">
                                <div>
                                    <Label htmlFor="payroll-month" className="text-xs">Pay Period</Label>
                                    <Input
                                        id="payroll-month"
                                        type="month"
                                        value={selectedMonth}
                                        onChange={(e) => setSelectedMonth(e.target.value)}
                                        className="w-48 bg-white"
                                    />
                                </div>
                            </div>
                        </div>
                        <Button
                            onClick={handleGenerate}
                            disabled={isGenerating}
                            size="lg"
                            className="bg-brand-600 hover:bg-brand-700"
                        >
                            <PlayCircle className="mr-2 h-5 w-5" />
                            {isGenerating ? 'Generating...' : 'Generate Draft'}
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Payroll Runs */}
            {payrolls.length === 0 ? (
                <Card className="border-0 shadow-sm">
                    <CardContent className="py-16 text-center">
                        <Banknote className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                        <h3 className="text-lg font-semibold text-gray-600">No Payroll Runs Yet</h3>
                        <p className="text-sm text-muted-foreground mt-1">Generate your first payroll using the form above.</p>
                    </CardContent>
                </Card>
            ) : (
                <div className="space-y-4">
                    {payrolls.map((payroll) => {
                        const config = statusConfig[payroll.status] || statusConfig.draft;
                        const isExpanded = expandedPayrollId === payroll.id;

                        return (
                            <Card key={payroll.id} className={`border-0 shadow-sm border-l-4 ${config.color} overflow-hidden`}>
                                <CardHeader className="pb-2">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div>
                                                <CardTitle className="text-lg">
                                                    {new Date(payroll.month).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                                                </CardTitle>
                                                <CardDescription>
                                                    {payroll.total_staff} staff • Total: {formatNaira(payroll.total_wage_bill)}
                                                    {payroll.generated_by_name && ` • Generated by ${payroll.generated_by_name}`}
                                                </CardDescription>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Badge variant={config.badge}>
                                                {payroll.status.toUpperCase()}
                                            </Badge>

                                            {payroll.status === 'draft' && (
                                                <>
                                                    <Button size="sm" onClick={() => handleApprove(payroll.id)} disabled={isApproving}>
                                                        <CheckCircle className="mr-1 h-3 w-3" /> Approve
                                                    </Button>
                                                    <Button size="sm" variant="ghost" className="text-destructive" onClick={() => handleDelete(payroll.id)}>
                                                        <Trash2 className="h-3 w-3" />
                                                    </Button>
                                                </>
                                            )}

                                            {payroll.status === 'approved' && (
                                                <Button size="sm" variant="secondary" onClick={() => handleMarkPaid(payroll.id)} disabled={isMarking}>
                                                    <CreditCard className="mr-1 h-3 w-3" /> Mark Paid
                                                </Button>
                                            )}

                                            <Button
                                                size="sm"
                                                variant="ghost"
                                                onClick={() => setExpandedPayrollId(isExpanded ? null : payroll.id)}
                                            >
                                                {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                                            </Button>
                                        </div>
                                    </div>
                                </CardHeader>

                                {/* Expanded Entries */}
                                {isExpanded && (
                                    <CardContent className="pt-0">
                                        <div className="border rounded-lg overflow-hidden mt-2">
                                            <Table>
                                                <TableHeader>
                                                    <TableRow className="bg-gray-50">
                                                        <TableHead className="text-xs">Payslip #</TableHead>
                                                        <TableHead className="text-xs">Staff Name</TableHead>
                                                        <TableHead className="text-xs">Role</TableHead>
                                                        <TableHead className="text-xs text-right">Basic</TableHead>
                                                        <TableHead className="text-xs text-right text-emerald-700">Allowances</TableHead>
                                                        <TableHead className="text-xs text-right text-red-700">Deductions</TableHead>
                                                        <TableHead className="text-xs text-right font-bold">Net Pay</TableHead>
                                                        <TableHead className="text-xs text-right">Action</TableHead>
                                                    </TableRow>
                                                </TableHeader>
                                                <TableBody>
                                                    {payroll.entries.map((entry) => (
                                                        <TableRow key={entry.id} className="hover:bg-gray-50/50">
                                                            <TableCell className="text-xs font-mono text-muted-foreground">
                                                                {entry.payslip_number || '—'}
                                                            </TableCell>
                                                            <TableCell className="font-medium text-sm">{entry.staff_name}</TableCell>
                                                            <TableCell className="text-sm text-muted-foreground">{entry.staff_role || '—'}</TableCell>
                                                            <TableCell className="text-right text-sm">{formatNaira(entry.basic_salary)}</TableCell>
                                                            <TableCell className="text-right text-sm text-emerald-600">+{formatNaira(entry.total_allowances)}</TableCell>
                                                            <TableCell className="text-right text-sm text-red-600">-{formatNaira(entry.total_deductions)}</TableCell>
                                                            <TableCell className="text-right text-sm font-bold">{formatNaira(entry.net_pay)}</TableCell>
                                                            <TableCell className="text-right">
                                                                <Button
                                                                    size="sm"
                                                                    variant="ghost"
                                                                    onClick={() => onViewPayslip(entry)}
                                                                    className="text-brand-600 hover:text-brand-700"
                                                                >
                                                                    <FileText className="h-3 w-3 mr-1" /> Payslip
                                                                </Button>
                                                            </TableCell>
                                                        </TableRow>
                                                    ))}
                                                </TableBody>
                                            </Table>
                                        </div>

                                        {/* Summary Footer */}
                                        <div className="flex justify-end mt-3 gap-6 text-sm">
                                            <span className="text-muted-foreground">Total Wage Bill:</span>
                                            <span className="font-bold text-lg">{formatNaira(payroll.total_wage_bill)}</span>
                                        </div>
                                    </CardContent>
                                )}
                            </Card>
                        );
                    })}
                </div>
            )}
        </div>
    );
};
