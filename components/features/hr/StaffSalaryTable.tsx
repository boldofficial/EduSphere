import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Users, Search, Settings, Banknote } from 'lucide-react';
import { useAllStaff } from '@/lib/hooks/use-data';
import * as Types from '@/lib/types';

const formatNaira = (amount: number) => `₦${Number(amount).toLocaleString('en-NG', { minimumFractionDigits: 2 })}`;

interface StaffSalaryTableProps {
    onEditStructure: (staff: Types.Teacher | Types.Staff) => void;
}

export const StaffSalaryTable: React.FC<StaffSalaryTableProps> = ({ onEditStructure }) => {
    const { data: staffList = [], isLoading } = useAllStaff();
    const [search, setSearch] = useState('');

    const filtered = staffList.filter(s =>
        s.name.toLowerCase().includes(search.toLowerCase()) ||
        s.role?.toLowerCase().includes(search.toLowerCase()) ||
        s.staff_type?.toLowerCase().includes(search.toLowerCase())
    );

    const totalBasic = filtered.reduce((sum, s) => sum + (Number(s.basic_salary) || 0), 0);

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <h3 className="text-lg font-semibold">Staff Salary Directory</h3>
                    <p className="text-sm text-muted-foreground">{filtered.length} staff members</p>
                </div>
                <div className="relative w-full sm:w-72">
                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search by name, role, type..."
                        className="pl-9"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
            </div>

            {/* Summary */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <Card className="border-0 shadow-sm bg-blue-50/60">
                    <CardContent className="p-4 flex items-center gap-3">
                        <Users className="h-8 w-8 text-blue-600" />
                        <div>
                            <p className="text-xs text-blue-600 font-medium">Total Staff</p>
                            <p className="text-xl font-bold text-blue-800">{filtered.length}</p>
                        </div>
                    </CardContent>
                </Card>
                <Card className="border-0 shadow-sm bg-emerald-50/60">
                    <CardContent className="p-4 flex items-center gap-3">
                        <Banknote className="h-8 w-8 text-emerald-600" />
                        <div>
                            <p className="text-xs text-emerald-600 font-medium">Total Basic Salary</p>
                            <p className="text-xl font-bold text-emerald-800">{formatNaira(totalBasic)}</p>
                        </div>
                    </CardContent>
                </Card>
                <Card className="border-0 shadow-sm bg-amber-50/60">
                    <CardContent className="p-4 flex items-center gap-3">
                        <Banknote className="h-8 w-8 text-amber-600" />
                        <div>
                            <p className="text-xs text-amber-600 font-medium">Average Salary</p>
                            <p className="text-xl font-bold text-amber-800">
                                {filtered.length > 0 ? formatNaira(totalBasic / filtered.length) : '₦0.00'}
                            </p>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Staff Table */}
            <Card className="border-0 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-gray-50/80">
                                <TableHead className="text-xs font-semibold">Name</TableHead>
                                <TableHead className="text-xs font-semibold">Role / Title</TableHead>
                                <TableHead className="text-xs font-semibold">Type</TableHead>
                                <TableHead className="text-xs font-semibold">Employment</TableHead>
                                <TableHead className="text-xs font-semibold text-right">Basic Salary</TableHead>
                                <TableHead className="text-xs font-semibold">Bank Details</TableHead>
                                <TableHead className="text-xs font-semibold text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? (
                                [...Array(5)].map((_, i) => (
                                    <TableRow key={i}>
                                        <TableCell colSpan={7}><div className="h-8 bg-gray-100 rounded animate-pulse" /></TableCell>
                                    </TableRow>
                                ))
                            ) : filtered.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={7} className="text-center py-12 text-muted-foreground">
                                        No staff found matching your search.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filtered.map((staff) => (
                                    <TableRow key={staff.id} className="hover:bg-gray-50/50">
                                        <TableCell className="font-medium">{staff.name}</TableCell>
                                        <TableCell className="text-muted-foreground">{staff.role || '—'}</TableCell>
                                        <TableCell>
                                            <Badge variant={staff.staff_type === 'ACADEMIC' ? 'default' : 'secondary'} className="text-[10px]">
                                                {staff.staff_type === 'ACADEMIC' ? 'Academic' : 'Non-Academic'}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-xs text-muted-foreground">
                                            {staff.employment_type?.replace('_', ' ') || 'Full Time'}
                                        </TableCell>
                                        <TableCell className="text-right font-semibold">
                                            {formatNaira(Number(staff.basic_salary) || 0)}
                                        </TableCell>
                                        <TableCell className="text-xs text-muted-foreground">
                                            {staff.bank_name ? (
                                                <span>{staff.bank_name} • {staff.account_number}</span>
                                            ) : (
                                                <span className="text-amber-500">Not configured</span>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Button variant="outline" size="sm" onClick={() => onEditStructure(staff)}>
                                                <Settings className="h-3 w-3 mr-1" /> Structure
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>
            </Card>
        </div>
    );
};
