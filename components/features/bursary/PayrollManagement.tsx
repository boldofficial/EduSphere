import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Users, CreditCard, Banknote, Calendar, CheckCircle, FileText, Settings, PlayCircle, Trash2 } from 'lucide-react';

import * as Utils from '@/lib/utils';
import * as Types from '@/lib/types';
import {
    usePayrolls, useGeneratePayroll, useApprovePayroll, useMarkPayrollPaid,
    useStaff, useUpdateTeacher, useAllStaff, useDeletePayroll
} from '@/lib/hooks/use-data';
import { SalaryStructureModal } from './SalaryStructureModal';
import { PayslipView } from './PayslipView';
import { useToast } from '@/components/providers/toast-provider';

export const PayrollManagement: React.FC = () => {
    const { addToast } = useToast();
    const toast = (props: { title: string, description: string, variant?: 'default' | 'destructive' }) => {
        addToast(props.description, props.variant === 'destructive' ? 'error' : 'success');
    };
    const [activeTab, setActiveTab] = useState('dashboard');
    const { data: payrolls = [], isLoading: isLoadingPayrolls } = usePayrolls();
    const { data: staffList = [], isLoading: isLoadingStaff } = useAllStaff();

    // Mutations
    const { mutate: generatePayroll, isPending: isGenerating } = useGeneratePayroll();
    const { mutate: approvePayroll, isPending: isApproving } = useApprovePayroll();
    const { mutate: markPaid, isPending: isMarking } = useMarkPayrollPaid();
    const { mutate: deletePayroll } = useDeletePayroll();
    const { mutate: updateStaff } = useUpdateTeacher();

    // State for Modals
    const [selectedStaff, setSelectedStaff] = useState<Types.Teacher | Types.Staff | null>(null);
    const [selectedStructure, setSelectedStructure] = useState<any>(null); // Passed to modal
    const [isStructureOpen, setIsStructureOpen] = useState(false);

    const [selectedPayslip, setSelectedPayslip] = useState<Types.PayrollEntry | null>(null);
    const [isPayslipOpen, setIsPayslipOpen] = useState(false);

    // Filter staff
    const [staffSearch, setStaffSearch] = useState('');

    const handleGenerate = () => {
        const month = new Date().toISOString().split('T')[0]; // Current date YYYY-MM-DD
        // Ideally let user pick month, defaulting to current
        generatePayroll(month, {
            onSuccess: () => {
                toast({ title: 'Success', description: 'Draft payroll generated successfully' });
            },
            onError: (err: any) => {
                toast({
                    title: 'Error',
                    description: err.response?.data?.error || 'Failed to generate payroll',
                    variant: 'destructive'
                });
            }
        });
    };

    const handleApprove = (id: string | number) => {
        approvePayroll(id, {
            onSuccess: () => toast({ title: 'Approved', description: 'Payroll approved successfully' })
        });
    };

    const handleMarkPaid = (id: string | number) => {
        markPaid({ id, createExpense: true }, {
            onSuccess: () => toast({ title: 'Paid', description: 'Payroll marked as paid and expense recorded.' })
        });
    };

    const handleDelete = (id: string | number) => {
        if (!confirm('Are you sure you want to delete this payroll run? This cannot be undone.')) return;
        deletePayroll(id, {
            onSuccess: () => addToast('Payroll run deleted successfully', 'success')
        });
    };

    // Open structure modal (fetch structure first in real app, but for now we might rely on the modal to fetch)
    const openStructure = (staff: Types.Teacher | Types.Staff) => {
        setSelectedStaff(staff);
        // We rely on the modal to fetch the structure by staff ID
        // Or we could fetch here. The modal handles it via useStaffSalaryStructure(staff.id)
        setSelectedStructure(undefined); // Reset
        setIsStructureOpen(true);
    };

    const filteredStaff = staffList.filter(s =>
        s.name.toLowerCase().includes(staffSearch.toLowerCase()) ||
        s.role?.toLowerCase().includes(staffSearch.toLowerCase())
    );

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">Payroll Management</h2>
                    <p className="text-muted-foreground">Manage staff salaries, run payrolls, and generate payslips.</p>
                </div>
                <div className="flex gap-2">
                    <Button onClick={handleGenerate} disabled={isGenerating}>
                        <PlayCircle className="mr-2 h-4 w-4" />
                        {isGenerating ? 'Generating...' : 'Run Payroll (Current Month)'}
                    </Button>
                </div>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
                <TabsList>
                    <TabsTrigger value="dashboard">Payroll History</TabsTrigger>
                    <TabsTrigger value="staff">Staff Salaries</TabsTrigger>
                </TabsList>

                {/* --- DASHBOARD TAB --- */}
                <TabsContent value="dashboard" className="space-y-4">
                    {/* Active Payrolls */}
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {payrolls.map(payroll => (
                            <Card key={payroll.id} className="relative group">
                                <CardHeader className="pb-2">
                                    <div className="flex justify-between items-start">
                                        <CardTitle>{new Date(payroll.month).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</CardTitle>
                                        <Badge variant={
                                            payroll.status === 'paid' ? 'secondary' :
                                                payroll.status === 'approved' ? 'default' : 'outline'
                                        }>
                                            {payroll.status.toUpperCase()}
                                        </Badge>
                                    </div>
                                    <CardDescription>
                                        {payroll.total_staff} Staff Processed
                                    </CardDescription>
                                    {payroll.status !== 'paid' && (
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity text-destructive"
                                            onClick={() => handleDelete(payroll.id)}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    )}
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold mb-4">{Utils.formatCurrency(payroll.total_wage_bill)}</div>
                                    <div className="space-y-2">
                                        {payroll.status === 'draft' && (
                                            <Button className="w-full" onClick={() => handleApprove(payroll.id)} disabled={isApproving}>
                                                <CheckCircle className="mr-2 h-4 w-4" /> Approve Payroll
                                            </Button>
                                        )}
                                        {payroll.status === 'approved' && (
                                            <Button className="w-full" variant="secondary" onClick={() => handleMarkPaid(payroll.id)} disabled={isMarking}>
                                                <CreditCard className="mr-2 h-4 w-4" /> Mark as Paid
                                            </Button>
                                        )}

                                        {/* Payslips List (Expandable or Modal?) For now just a summary link or we expand here */}
                                        <div className="pt-4 border-t">
                                            <p className="text-xs font-semibold mb-2 text-muted-foreground">Recent Payslips</p>
                                            <div className="space-y-1 max-h-32 overflow-y-auto">
                                                {payroll.entries.slice(0, 5).map(entry => (
                                                    <div key={entry.id} className="flex justify-between text-sm py-1 hover:bg-muted p-1 rounded cursor-pointer"
                                                        onClick={() => { setSelectedPayslip(entry); setIsPayslipOpen(true); }}
                                                    >
                                                        <span>{entry.staff_name}</span>
                                                        <span>{Utils.formatCurrency(entry.net_pay)}</span>
                                                    </div>
                                                ))}
                                                {payroll.entries.length > 5 && (
                                                    <p className="text-xs text-center text-muted-foreground">+{payroll.entries.length - 5} more...</p>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}

                        {payrolls.length === 0 && (
                            <div className="col-span-full text-center py-12 text-muted-foreground bg-muted/20 rounded-lg">
                                <Banknote className="h-12 w-12 mx-auto mb-4 opacity-50" />
                                <p>No payrolls generated yet.</p>
                                <p className="text-sm">Run payroll to get started.</p>
                            </div>
                        )}
                    </div>
                </TabsContent>

                {/* --- STAFF SALARIES TAB --- */}
                <TabsContent value="staff" className="space-y-4">
                    <div className="flex items-center gap-4">
                        <div className="relative flex-1 max-w-sm">
                            <Users className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input placeholder="Search staff..." className="pl-8"
                                value={staffSearch} onChange={e => setStaffSearch(e.target.value)}
                            />
                        </div>
                    </div>

                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Name</TableHead>
                                <TableHead>Role</TableHead>
                                <TableHead>Type</TableHead>
                                <TableHead>Basic Salary</TableHead>
                                <TableHead>Bank Info</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredStaff.map(staff => (
                                <TableRow key={staff.id}>
                                    <TableCell className="font-medium">{staff.name}</TableCell>
                                    <TableCell>{staff.role || '-'}</TableCell>
                                    <TableCell>
                                        <Badge variant="outline">{staff.staff_type}</Badge>
                                    </TableCell>
                                    <TableCell>{Utils.formatCurrency(Number(staff.basic_salary) || 0)}</TableCell>
                                    <TableCell className="text-xs text-muted-foreground">
                                        {staff.bank_name ? `${staff.bank_name} - ${staff.account_number}` : 'Not Set'}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Button variant="outline" size="sm" onClick={() => openStructure(staff)}>
                                            <Settings className="h-4 w-4 mr-2" /> Structure
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TabsContent>
            </Tabs>

            {/* Modals */}
            {selectedStaff && (
                <SalaryStructureModal
                    staff={selectedStaff}
                    isOpen={isStructureOpen}
                    onClose={() => setIsStructureOpen(false)}
                />
            )}

            {selectedPayslip && (
                <PayslipView
                    entry={selectedPayslip}
                    isOpen={isPayslipOpen}
                    onClose={() => setIsPayslipOpen(false)}
                />
            )}
        </div>
    );
};
