import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, Trash2 } from 'lucide-react';
import * as Types from '@/lib/types';
import * as Utils from '@/lib/utils';
import { useSalaryAllowances, useSalaryDeductions, useUpdateSalaryStructure } from '@/lib/hooks/use-data';

interface SalaryStructureModalProps {
    staff: Types.Teacher | Types.Staff;
    isOpen: boolean;
    onClose: () => void;
    structure?: Types.StaffSalaryStructure;
}

export const SalaryStructureModal: React.FC<SalaryStructureModalProps> = ({
    staff, isOpen, onClose, structure
}) => {
    const { data: allowancesMaster = [] } = useSalaryAllowances();
    const { data: deductionsMaster = [] } = useSalaryDeductions();
    const { mutate: updateStructure, isPending } = useUpdateSalaryStructure();

    const [allowances, setAllowances] = useState<{ id?: number; name: string; amount: number }[]>([]);
    const [deductions, setDeductions] = useState<{ id?: number; name: string; amount: number }[]>([]);

    // Initialize from existing structure or defaults
    useEffect(() => {
        if (isOpen) {
            if (structure?.structure_data) {
                setAllowances(structure.structure_data.allowances || []);
                setDeductions(structure.structure_data.deductions || []);
            } else {
                setAllowances([]);
                setDeductions([]);
            }
        }
    }, [isOpen, structure]);

    // Calculations
    const totalAllowances = allowances.reduce((sum, a) => sum + (Number(a.amount) || 0), 0);
    const totalDeductions = deductions.reduce((sum, d) => sum + (Number(d.amount) || 0), 0);
    const basicSalary = Number(staff.basic_salary) || 0;
    const netSalary = basicSalary + totalAllowances - totalDeductions;

    const handleSave = () => {
        if (!structure) return; // Should allow creating if missing, but backend usually auto-creates

        const payload = {
            structure_data: {
                allowances,
                deductions
            }
        };

        updateStructure({ id: structure.id, data: payload }, {
            onSuccess: () => {
                onClose();
            }
        });
    };

    const addAllowance = () => setAllowances([...allowances, { name: '', amount: 0 }]);
    const removeAllowance = (idx: number) => setAllowances(allowances.filter((_, i) => i !== idx));
    const updateAllowance = (idx: number, field: string, value: any) => {
        const newArr = [...allowances];
        newArr[idx] = { ...newArr[idx], [field]: value };
        // If name matches master, sync ID? (Optional)
        setAllowances(newArr);
    };

    const addDeduction = () => setDeductions([...deductions, { name: '', amount: 0 }]);
    const removeDeduction = (idx: number) => setDeductions(deductions.filter((_, i) => i !== idx));
    const updateDeduction = (idx: number, field: string, value: any) => {
        const newArr = [...deductions];
        newArr[idx] = { ...newArr[idx], [field]: value };
        setDeductions(newArr);
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Salary Structure: {staff.name}</DialogTitle>
                </DialogHeader>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 my-4">
                    {/* Basic Info */}
                    <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                        <Label>Basic Salary</Label>
                        <div className="text-2xl font-bold">{Utils.formatCurrency(basicSalary)}</div>
                        <p className="text-sm text-gray-500">Defined in Staff Profile</p>
                    </div>

                    <div className="bg-blue-50 p-4 rounded-lg space-y-2">
                        <Label>Net Salary Preview</Label>
                        <div className="text-2xl font-bold text-blue-700">{Utils.formatCurrency(netSalary)}</div>
                        <p className="text-sm text-blue-600">
                            (Basic + {Utils.formatCurrency(totalAllowances)}) - {Utils.formatCurrency(totalDeductions)}
                        </p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Allowances */}
                    <div className="space-y-4">
                        <div className="flex justify-between items-center">
                            <h3 className="font-semibold text-green-700">Allowances</h3>
                            <Button size="sm" variant="outline" onClick={addAllowance}>
                                <Plus className="h-3 w-3 mr-1" /> Add
                            </Button>
                        </div>
                        <div className="space-y-2">
                            {allowances.map((item, idx) => (
                                <div key={idx} className="flex gap-2 items-center">
                                    <Input
                                        list="allowance-master"
                                        placeholder="Type..."
                                        value={item.name}
                                        onChange={e => updateAllowance(idx, 'name', e.target.value)}
                                        className="flex-1"
                                    />
                                    <Input
                                        type="number"
                                        placeholder="0.00"
                                        value={item.amount}
                                        onChange={e => updateAllowance(idx, 'amount', Number(e.target.value))}
                                        className="w-24 text-right"
                                    />
                                    <Button variant="ghost" size="icon" onClick={() => removeAllowance(idx)}>
                                        <Trash2 className="h-4 w-4 text-red-500" />
                                    </Button>
                                </div>
                            ))}
                            {/* Datalist for auto-suggest */}
                            <datalist id="allowance-master">
                                {allowancesMaster.map(a => <option key={a.id} value={a.name} />)}
                            </datalist>
                        </div>
                        <div className="text-right font-semibold text-green-700 pt-2 border-t">
                            Total: {Utils.formatCurrency(totalAllowances)}
                        </div>
                    </div>

                    {/* Deductions */}
                    <div className="space-y-4">
                        <div className="flex justify-between items-center">
                            <h3 className="font-semibold text-red-700">Deductions</h3>
                            <Button size="sm" variant="outline" onClick={addDeduction}>
                                <Plus className="h-3 w-3 mr-1" /> Add
                            </Button>
                        </div>
                        <div className="space-y-2">
                            {deductions.map((item, idx) => (
                                <div key={idx} className="flex gap-2 items-center">
                                    <Input
                                        list="deduction-master"
                                        placeholder="Type..."
                                        value={item.name}
                                        onChange={e => updateDeduction(idx, 'name', e.target.value)}
                                        className="flex-1"
                                    />
                                    <Input
                                        type="number"
                                        placeholder="0.00"
                                        value={item.amount}
                                        onChange={e => updateDeduction(idx, 'amount', Number(e.target.value))}
                                        className="w-24 text-right"
                                    />
                                    <Button variant="ghost" size="icon" onClick={() => removeDeduction(idx)}>
                                        <Trash2 className="h-4 w-4 text-red-500" />
                                    </Button>
                                </div>
                            ))}
                            <datalist id="deduction-master">
                                {deductionsMaster.map(d => <option key={d.id} value={d.name} />)}
                            </datalist>
                        </div>
                        <div className="text-right font-semibold text-red-700 pt-2 border-t">
                            Total: {Utils.formatCurrency(totalDeductions)}
                        </div>
                    </div>
                </div>

                <DialogFooter className="mt-6">
                    <Button variant="outline" onClick={onClose}>Cancel</Button>
                    <Button onClick={handleSave} disabled={isPending}>
                        {isPending ? 'Saving...' : 'Save Structure'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};
