import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Plus, Trash2, Calculator, Percent, DollarSign } from 'lucide-react';
import * as Types from '@/lib/types';
import { useSalaryAllowances, useSalaryDeductions, useStaffSalaryStructure, useUpdateSalaryStructure } from '@/lib/hooks/use-data';
import { useToast } from '@/components/providers/toast-provider';

interface SalaryStructureEditorProps {
    staff: Types.Teacher | Types.Staff;
    isOpen: boolean;
    onClose: () => void;
}

const formatNaira = (amount: number) => `₦${Number(amount).toLocaleString('en-NG', { minimumFractionDigits: 2 })}`;

interface StructureItem {
    id?: number;
    name: string;
    amount: number;
    type: 'fixed' | 'percentage';
    value?: number;
}

export const SalaryStructureEditor: React.FC<SalaryStructureEditorProps> = ({
    staff, isOpen, onClose
}) => {
    const { addToast } = useToast();
    const { data: structure, isLoading: isLoadingStructure } = useStaffSalaryStructure(staff.id);
    const { data: allowancesMaster = [] } = useSalaryAllowances();
    const { data: deductionsMaster = [] } = useSalaryDeductions();
    const { mutate: updateStructure, isPending } = useUpdateSalaryStructure();

    const [allowances, setAllowances] = useState<StructureItem[]>([]);
    const [deductions, setDeductions] = useState<StructureItem[]>([]);

    const basicSalary = Number(staff.basic_salary) || 0;

    // Initialize from fetched structure
    useEffect(() => {
        if (isOpen && structure?.structure_data) {
            setAllowances(
                (structure.structure_data.allowances || []).map((a: any) => ({
                    ...a,
                    type: a.type || 'fixed',
                    amount: Number(a.amount) || 0,
                }))
            );
            setDeductions(
                (structure.structure_data.deductions || []).map((d: any) => ({
                    ...d,
                    type: d.type || 'fixed',
                    amount: Number(d.amount) || 0,
                }))
            );
        } else if (isOpen) {
            setAllowances([]);
            setDeductions([]);
        }
    }, [isOpen, structure]);

    // Calculate resolved amounts (handling percentages)
    const resolveAmount = (item: StructureItem): number => {
        if (item.type === 'percentage') {
            return basicSalary * (Number(item.value || 0) / 100);
        }
        return Number(item.amount) || 0;
    };

    const totalAllowances = allowances.reduce((sum, a) => sum + resolveAmount(a), 0);
    const totalDeductions = deductions.reduce((sum, d) => sum + resolveAmount(d), 0);
    const grossPay = basicSalary + totalAllowances;
    const netSalary = grossPay - totalDeductions;

    const handleSave = () => {
        if (!structure) {
            addToast('Salary structure not found. Please try again.', 'error');
            return;
        }

        const payload = {
            structure_data: {
                allowances: allowances.map(a => ({
                    name: a.name,
                    amount: a.type === 'percentage' ? resolveAmount(a) : a.amount,
                    type: a.type,
                    value: a.type === 'percentage' ? a.value : undefined,
                })),
                deductions: deductions.map(d => ({
                    name: d.name,
                    amount: d.type === 'percentage' ? resolveAmount(d) : d.amount,
                    type: d.type,
                    value: d.type === 'percentage' ? d.value : undefined,
                })),
            },
        };

        updateStructure({ id: structure.id, data: payload }, {
            onSuccess: () => {
                addToast('Salary structure updated', 'success');
                onClose();
            },
            onError: () => addToast('Failed to update structure', 'error'),
        });
    };

    const addItem = (type: 'allowance' | 'deduction') => {
        const newItem: StructureItem = { name: '', amount: 0, type: 'fixed' };
        if (type === 'allowance') setAllowances([...allowances, newItem]);
        else setDeductions([...deductions, newItem]);
    };

    const removeItem = (type: 'allowance' | 'deduction', idx: number) => {
        if (type === 'allowance') setAllowances(allowances.filter((_, i) => i !== idx));
        else setDeductions(deductions.filter((_, i) => i !== idx));
    };

    const updateItem = (type: 'allowance' | 'deduction', idx: number, field: string, value: any) => {
        const setter = type === 'allowance' ? setAllowances : setDeductions;
        const arr = type === 'allowance' ? [...allowances] : [...deductions];
        arr[idx] = { ...arr[idx], [field]: value };

        // If switching to percentage, clear amount; if switching to fixed, clear value
        if (field === 'type') {
            if (value === 'percentage') {
                arr[idx].value = 0;
                arr[idx].amount = 0;
            } else {
                arr[idx].value = undefined;
            }
        }

        setter(arr);
    };

    const renderItemRow = (
        item: StructureItem,
        idx: number,
        type: 'allowance' | 'deduction',
        masterList: Types.SalaryAllowance[] | Types.SalaryDeduction[]
    ) => (
        <div key={idx} className="flex gap-2 items-center p-2 bg-gray-50/50 rounded-lg">
            {/* Name with datalist suggestion */}
            <Input
                list={`${type}-master`}
                placeholder="Name..."
                value={item.name}
                onChange={(e) => updateItem(type, idx, 'name', e.target.value)}
                className="flex-1 text-sm h-9"
            />

            {/* Type toggle */}
            <Select
                value={item.type}
                onChange={(e) => updateItem(type, idx, 'type', e.target.value as 'fixed' | 'percentage')}
                className="w-28 h-9 text-xs"
            >
                <option value="fixed">Fixed</option>
                <option value="percentage">% Basic</option>
            </Select>

            {/* Amount / Percentage Input */}
            {item.type === 'percentage' ? (
                <div className="flex items-center gap-1">
                    <Input
                        type="number"
                        placeholder="0"
                        value={item.value || ''}
                        onChange={(e) => updateItem(type, idx, 'value', Number(e.target.value))}
                        className="w-16 text-right text-sm h-9"
                    />
                    <span className="text-xs text-muted-foreground">%</span>
                    <span className="text-xs text-muted-foreground ml-1 w-20 text-right">
                        = {formatNaira(resolveAmount(item))}
                    </span>
                </div>
            ) : (
                <Input
                    type="number"
                    placeholder="0.00"
                    value={item.amount || ''}
                    onChange={(e) => updateItem(type, idx, 'amount', Number(e.target.value))}
                    className="w-28 text-right text-sm h-9"
                />
            )}

            <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => removeItem(type, idx)}>
                <Trash2 className="h-3.5 w-3.5 text-red-500" />
            </Button>
        </div>
    );

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Calculator className="h-5 w-5 text-brand-600" />
                        Salary Structure — {staff.name}
                    </DialogTitle>
                </DialogHeader>

                {isLoadingStructure ? (
                    <div className="py-12 text-center text-muted-foreground">Loading structure...</div>
                ) : (
                    <>
                        {/* Summary Cards */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 my-4">
                            <div className="bg-gray-50 p-3 rounded-lg text-center">
                                <p className="text-[10px] text-gray-500 uppercase tracking-wider">Basic</p>
                                <p className="text-lg font-bold">{formatNaira(basicSalary)}</p>
                            </div>
                            <div className="bg-emerald-50 p-3 rounded-lg text-center">
                                <p className="text-[10px] text-emerald-600 uppercase tracking-wider">Allowances</p>
                                <p className="text-lg font-bold text-emerald-700">+{formatNaira(totalAllowances)}</p>
                            </div>
                            <div className="bg-red-50 p-3 rounded-lg text-center">
                                <p className="text-[10px] text-red-600 uppercase tracking-wider">Deductions</p>
                                <p className="text-lg font-bold text-red-700">-{formatNaira(totalDeductions)}</p>
                            </div>
                            <div className="bg-blue-50 p-3 rounded-lg text-center border-2 border-blue-200">
                                <p className="text-[10px] text-blue-600 uppercase tracking-wider">Net Salary</p>
                                <p className="text-lg font-bold text-blue-700">{formatNaira(netSalary)}</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Allowances */}
                            <div className="space-y-3">
                                <div className="flex justify-between items-center">
                                    <h3 className="font-semibold text-sm text-emerald-700">Allowances</h3>
                                    <Button size="sm" variant="outline" onClick={() => addItem('allowance')} className="h-7 text-xs">
                                        <Plus className="h-3 w-3 mr-1" /> Add
                                    </Button>
                                </div>
                                <div className="space-y-2">
                                    {allowances.length === 0 && (
                                        <p className="text-xs text-muted-foreground text-center py-4">No allowances configured</p>
                                    )}
                                    {allowances.map((item, idx) => renderItemRow(item, idx, 'allowance', allowancesMaster))}
                                    <datalist id="allowance-master">
                                        {allowancesMaster.map(a => <option key={a.id} value={a.name} />)}
                                    </datalist>
                                </div>
                                <div className="text-right text-sm font-semibold text-emerald-700 pt-2 border-t">
                                    Total: +{formatNaira(totalAllowances)}
                                </div>
                            </div>

                            {/* Deductions */}
                            <div className="space-y-3">
                                <div className="flex justify-between items-center">
                                    <h3 className="font-semibold text-sm text-red-700">Deductions</h3>
                                    <Button size="sm" variant="outline" onClick={() => addItem('deduction')} className="h-7 text-xs">
                                        <Plus className="h-3 w-3 mr-1" /> Add
                                    </Button>
                                </div>
                                <div className="space-y-2">
                                    {deductions.length === 0 && (
                                        <p className="text-xs text-muted-foreground text-center py-4">No deductions configured</p>
                                    )}
                                    {deductions.map((item, idx) => renderItemRow(item, idx, 'deduction', deductionsMaster))}
                                    <datalist id="deduction-master">
                                        {deductionsMaster.map(d => <option key={d.id} value={d.name} />)}
                                    </datalist>
                                </div>
                                <div className="text-right text-sm font-semibold text-red-700 pt-2 border-t">
                                    Total: -{formatNaira(totalDeductions)}
                                </div>
                            </div>
                        </div>
                    </>
                )}

                <DialogFooter className="mt-6">
                    <Button variant="outline" onClick={onClose}>Cancel</Button>
                    <Button onClick={handleSave} disabled={isPending || isLoadingStructure}>
                        {isPending ? 'Saving...' : 'Save Structure'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};
