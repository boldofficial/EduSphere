import React from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import * as Types from '@/lib/types';
import * as Utils from '@/lib/utils';

interface FeeStructureManagementProps {
    fees: Types.FeeStructure[];
    classes: Types.Class[];
    settings: Types.Settings;
    onAddFeeHead: () => void;
    onDeleteFee: (id: string) => void;
}

export const FeeStructureManagement: React.FC<FeeStructureManagementProps> = ({
    fees, classes, settings, onAddFeeHead, onDeleteFee
}) => {
    return (
        <div className="space-y-4">
            <div className="flex justify-end"><Button onClick={onAddFeeHead}><Plus className="h-4 w-4 mr-2" /> Add Fee Head</Button></div>
            <Card title="Current Session Fee Structure">
                <table className="w-full text-sm text-left">
                    <thead className="bg-gray-50 text-gray-700"><tr><th className="px-4 py-3">Fee Name</th><th className="px-4 py-3">Class Scope</th><th className="px-4 py-3">Type</th><th className="px-4 py-3 text-right">Amount</th><th className="px-4 py-3"></th></tr></thead>
                    <tbody className="divide-y divide-gray-100">
                        {fees.filter(f => f.session === settings.current_session && f.term === settings.current_term).map(f => {
                            const clsName = f.class_id ? classes.find(c => c.id === f.class_id)?.name : 'All Classes';
                            return (
                                <tr key={f.id}>
                                    <td className="px-4 py-3 font-medium">{f.name}</td>
                                    <td className="px-4 py-3"><span className="px-2 py-1 bg-blue-50 text-blue-700 rounded text-xs">{clsName}</span></td>
                                    <td className="px-4 py-3">
                                        {f.is_optional ? (
                                            <span className="px-2 py-1 bg-amber-50 text-amber-700 rounded text-xs">Optional</span>
                                        ) : (
                                            <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs">Mandatory</span>
                                        )}
                                    </td>
                                    <td className="px-4 py-3 text-right font-mono">{Utils.formatCurrency(f.amount)}</td>
                                    <td className="px-4 py-3 text-right"><button onClick={() => onDeleteFee(f.id)} className="text-gray-400 hover:text-red-600"><Trash2 className="h-4 w-4" /></button></td>
                                </tr>
                            )
                        })}
                    </tbody>
                </table>
            </Card>
        </div>
    );
};
