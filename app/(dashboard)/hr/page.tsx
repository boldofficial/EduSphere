'use client';

import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LayoutDashboard, Banknote, Users, FileText } from 'lucide-react';
import * as Types from '@/lib/types';

import { HRDashboard } from '@/components/features/hr/HRDashboard';
import { PayrollWorkflow } from '@/components/features/hr/PayrollWorkflow';
import { StaffSalaryTable } from '@/components/features/hr/StaffSalaryTable';
import { SalaryStructureEditor } from '@/components/features/hr/SalaryStructureEditor';
import { PayslipDocument } from '@/components/features/hr/PayslipDocument';

export default function HRPage() {
    const [activeTab, setActiveTab] = useState('dashboard');

    // Salary structure modal state
    const [selectedStaff, setSelectedStaff] = useState<Types.Teacher | Types.Staff | null>(null);
    const [isStructureOpen, setIsStructureOpen] = useState(false);

    // Payslip modal state
    const [selectedPayslip, setSelectedPayslip] = useState<Types.PayrollEntry | null>(null);
    const [isPayslipOpen, setIsPayslipOpen] = useState(false);

    const openStructure = (staff: Types.Teacher | Types.Staff) => {
        setSelectedStaff(staff);
        setIsStructureOpen(true);
    };

    const openPayslip = (entry: Types.PayrollEntry) => {
        setSelectedPayslip(entry);
        setIsPayslipOpen(true);
    };

    return (
        <div className="space-y-6">
            {/* Page Header */}
            <div>
                <h1 className="text-2xl font-bold tracking-tight">HR & Payroll</h1>
                <p className="text-muted-foreground">Manage staff salaries, run payrolls, and generate professional payslips.</p>
            </div>

            {/* Tabbed Navigation */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
                <TabsList className="bg-gray-100/80 p-1 h-auto">
                    <TabsTrigger value="dashboard" className="flex items-center gap-2 px-4 py-2">
                        <LayoutDashboard className="h-4 w-4" /> Dashboard
                    </TabsTrigger>
                    <TabsTrigger value="payroll" className="flex items-center gap-2 px-4 py-2">
                        <Banknote className="h-4 w-4" /> Payroll
                    </TabsTrigger>
                    <TabsTrigger value="staff" className="flex items-center gap-2 px-4 py-2">
                        <Users className="h-4 w-4" /> Staff Salaries
                    </TabsTrigger>
                </TabsList>

                {/* Dashboard Tab */}
                <TabsContent value="dashboard">
                    <HRDashboard onNavigate={setActiveTab} />
                </TabsContent>

                {/* Payroll Tab */}
                <TabsContent value="payroll">
                    <PayrollWorkflow onViewPayslip={openPayslip} />
                </TabsContent>

                {/* Staff Salaries Tab */}
                <TabsContent value="staff">
                    <StaffSalaryTable onEditStructure={openStructure} />
                </TabsContent>
            </Tabs>

            {/* Modals */}
            {selectedStaff && (
                <SalaryStructureEditor
                    staff={selectedStaff}
                    isOpen={isStructureOpen}
                    onClose={() => setIsStructureOpen(false)}
                />
            )}

            {selectedPayslip && (
                <PayslipDocument
                    entry={selectedPayslip}
                    isOpen={isPayslipOpen}
                    onClose={() => setIsPayslipOpen(false)}
                />
            )}
        </div>
    );
}
