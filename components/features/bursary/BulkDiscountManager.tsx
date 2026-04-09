import React, { useState } from 'react';
import { 
    Users, Layout, Filter, Calculator, 
    Save, AlertCircle, CheckCircle2, 
    ArrowRight, Info, Search, DollarSign,
    History as HistoryIcon, Clock, User
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
    useFees, 
    usePreviewBulkDiscount, useApplyBulkDiscount 
} from '@/lib/hooks/use-bursary';
import { useClasses as useAcademicClasses, useActivityLogs } from '@/lib/hooks/use-data';
import { useToast } from '@/components/providers/toast-provider';
import { formatDateTime, formatCurrency } from '@/lib/utils';
import { 
    Dialog, DialogContent, DialogHeader, 
    DialogTitle, DialogDescription, DialogFooter 
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export const BulkDiscountManager: React.FC = () => {
    const { addToast } = useToast();
    const { data: classes = [] } = useAcademicClasses();
    const { data: fees = [] } = useFees();
    const { data: activityLogs = [], isLoading: logsLoading } = useActivityLogs('RECORDS_MUTATED');
    
    // Filter logs for relevant bulk discount actions
    const discountHistory = activityLogs.filter((log: any) => 
        log.description?.toLowerCase().includes('applied bulk') || 
        log.description?.toLowerCase().includes('discount')
    );

    const previewMutation = usePreviewBulkDiscount();
    const applyMutation = useApplyBulkDiscount();

    const [activeTab, setActiveTab] = useState('apply');
    // Form State
    const [scopeType, setScopeType] = useState<'all' | 'class'>('class');
    const [selectedClassIds, setSelectedClassIds] = useState<string[]>([]);
    const [selectedFeeId, setSelectedFeeId] = useState<string>('');
    const [discountType, setDiscountType] = useState<string>('percent');
    const [value, setValue] = useState<number>(0);
    const [reason, setReason] = useState<string>('');
    const [override, setOverride] = useState<boolean>(false);

    // Filtered Fees (only active items)
    const activeFees = fees.filter(f => f.active !== false);

    // Preview Modal State
    const [showPreview, setShowPreview] = useState(false);
    const [previewData, setPreviewData] = useState<any>(null);

    const handlePreview = async () => {
        if (!selectedFeeId) {
            addToast('Please select a fee item', 'error');
            return;
        }
        if (scopeType === 'class' && selectedClassIds.length === 0) {
            addToast('Please select at least one class', 'error');
            return;
        }

        const payload = {
            scope: {
                type: scopeType,
                ids: selectedClassIds
            },
            fee_item: selectedFeeId,
            discount_type: discountType,
            value: value
        };

        try {
            const data = await previewMutation.mutateAsync(payload);
            setPreviewData(data);
            setShowPreview(true);
        } catch (error) {
            addToast('Failed to generate preview', 'error');
        }
    };

    const handleApply = async () => {
        const payload = {
            scope: {
                type: scopeType,
                ids: selectedClassIds
            },
            fee_item: selectedFeeId,
            discount_type: discountType,
            value: value,
            reason,
            override
        };

        try {
            await applyMutation.mutateAsync(payload);
            addToast('Bulk discounts applied successfully', 'success');
            setShowPreview(false);
            resetForm();
        } catch (error) {
            addToast('Failed to apply bulk discounts', 'error');
        }
    };

    const resetForm = () => {
        setSelectedClassIds([]);
        setSelectedFeeId('');
        setValue(0);
        setReason('');
        setOverride(false);
    };

    return (
        <div className="space-y-6">
            <div className="bg-brand-600 rounded-2xl p-6 text-white overflow-hidden relative">
                <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-6">
                    <div>
                        <h2 className="text-2xl font-bold flex items-center gap-2">
                            <Calculator className="h-6 w-6" />
                            Bulk Waiver Management
                        </h2>
                        <p className="text-brand-100 mt-1 max-w-lg">
                            Apply financial scholarships, percentages, or full waivers to entire classes or the whole school at once.
                        </p>
                    </div>
                </div>
                {/* Decorative bubble */}
                <div className="absolute -bottom-12 -right-12 w-48 h-48 bg-white/10 rounded-full blur-2xl" />
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="bg-white border rounded-xl p-1 mb-6 flex w-fit gap-2">
                    <TabsTrigger value="apply" className="rounded-lg font-bold data-[state=active]:bg-brand-50 data-[state=active]:text-brand-600 px-6 py-2.5">
                        <Calculator className="h-4 w-4 mr-2" />
                        Configure Bulk Waiver
                    </TabsTrigger>
                    <TabsTrigger value="history" className="rounded-lg font-bold data-[state=active]:bg-brand-50 data-[state=active]:text-brand-600 px-6 py-2.5">
                        <HistoryIcon className="h-4 w-4 mr-2" />
                        Waiver History
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="apply">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Configuration Panel */}
                        <Card className="lg:col-span-2 p-6 space-y-6">
                            <div className="space-y-4">
                                <h3 className="text-lg font-bold text-gray-900 border-b pb-2 flex items-center gap-2">
                                    <Filter className="h-5 w-5 text-gray-400" />
                                    Step 1: Define Target Scope
                                </h3>

                                <div className="flex gap-4 p-1 bg-gray-50 rounded-xl w-fit">
                                    <button
                                        onClick={() => setScopeType('class')}
                                        className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${scopeType === 'class' ? 'bg-white shadow-sm text-brand-600' : 'text-gray-500 hover:text-gray-700'}`}
                                    >
                                        <Layout className="h-4 w-4 inline mr-2" />
                                        Selected Classes
                                    </button>
                                    <button
                                        onClick={() => {
                                            setScopeType('all');
                                            setSelectedClassIds([]);
                                        }}
                                        className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${scopeType === 'all' ? 'bg-white shadow-sm text-brand-600' : 'text-gray-500 hover:text-gray-700'}`}
                                    >
                                        <Users className="h-4 w-4 inline mr-2" />
                                        Entire School
                                    </button>
                                </div>

                                {scopeType === 'class' && (
                                    <div className="mt-4">
                                        {classes.length > 0 ? (
                                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                                                {classes.map(cls => (
                                                    <button
                                                        key={cls.id}
                                                        type="button"
                                                        onClick={() => {
                                                            if (selectedClassIds.includes(cls.id)) {
                                                                setSelectedClassIds(selectedClassIds.filter(id => id !== cls.id));
                                                            } else {
                                                                setSelectedClassIds([...selectedClassIds, cls.id]);
                                                            }
                                                        }}
                                                        className={`px-3 py-2 rounded-lg text-xs font-bold border transition-all truncate text-left ${selectedClassIds.includes(cls.id)
                                                                ? 'bg-brand-50 border-brand-200 text-brand-700 ring-2 ring-brand-100'
                                                                : 'bg-white border-gray-200 text-gray-600 hover:border-brand-200'
                                                            }`}
                                                    >
                                                        {cls.name}
                                                    </button>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="p-8 border-2 border-dashed border-gray-200 rounded-xl text-center">
                                                <p className="text-gray-500">No classes found. Please ensure you have created classes in the Academic module.</p>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>

                            <div className="space-y-4">
                                <h3 className="text-lg font-bold text-gray-900 border-b pb-2 flex items-center gap-2">
                                    <DollarSign className="h-5 w-5 text-gray-400" />
                                    Step 2: select Fee & Discount
                                </h3>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-sm font-bold text-gray-700">Target Fee Item</label>
                                        <select
                                            value={selectedFeeId}
                                            onChange={e => setSelectedFeeId(e.target.value)}
                                            className="w-full px-4 py-2 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none font-medium"
                                        >
                                            <option value="">Select Fee Item...</option>
                                            {activeFees.map(fee => (
                                                <option key={fee.id} value={fee.id}>
                                                    {fee.name} - {formatCurrency(fee.amount)}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-sm font-bold text-gray-700">Discount Type</label>
                                        <select
                                            value={discountType}
                                            onChange={e => setDiscountType(e.target.value)}
                                            className="w-full px-4 py-2 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none font-medium"
                                        >
                                            <option value="percent">Percentage (%)</option>
                                            <option value="fixed">Fixed Amount</option>
                                            <option value="full_waiver">Full Waiver (100% Free)</option>
                                            <option value="scholarship">Scholarship Fund</option>
                                        </select>
                                    </div>

                                    {discountType !== 'full_waiver' && (
                                        <div className="space-y-2">
                                            <label className="text-sm font-bold text-gray-700">
                                                Value {discountType === 'percent' ? '(%)' : ''}
                                            </label>
                                            <input
                                                type="number"
                                                value={value}
                                                onChange={e => setValue(parseFloat(e.target.value))}
                                                className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none"
                                                min="0"
                                            />
                                        </div>
                                    )}

                                    <div className="space-y-2">
                                        <label className="text-sm font-bold text-gray-700">Reason / Reference</label>
                                        <input
                                            type="text"
                                            value={reason}
                                            onChange={e => setReason(e.target.value)}
                                            placeholder="e.g. Merit-based scholarship 2025"
                                            className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none"
                                        />
                                    </div>
                                </div>

                                <label className="flex items-center gap-3 p-4 bg-amber-50 rounded-xl border border-amber-100 cursor-pointer group">
                                    <input
                                        type="checkbox"
                                        checked={override}
                                        onChange={e => setOverride(e.target.checked)}
                                        className="w-5 h-5 rounded border-amber-300 text-amber-600 focus:ring-amber-500"
                                    />
                                    <div>
                                        <span className="text-sm font-black text-amber-900 flex items-center gap-1">
                                            <AlertCircle className="h-4 w-4" />
                                            Override Existing Discounts
                                        </span>
                                        <p className="text-xs text-amber-700 mt-0.5">
                                            Check this to replace any existing individual discounts for this fee item with this new value.
                                        </p>
                                    </div>
                                </label>
                            </div>

                            <div className="flex justify-end pt-4">
                                <Button
                                    onClick={handlePreview}
                                    disabled={previewMutation.isPending}
                                    className="bg-brand-600 hover:bg-brand-700 rounded-xl h-12 px-8 flex items-center gap-2"
                                >
                                    {previewMutation.isPending ? 'Calculating...' : 'Preview Impact'}
                                    <ArrowRight className="h-4 w-4" />
                                </Button>
                            </div>
                        </Card>

                        {/* Summary / FAQ */}
                        <div className="space-y-6">
                            <Card className="p-6 bg-gray-900 border-none relative overflow-hidden">
                                <div className="relative z-10">
                                    <h4 className="text-white font-black flex items-center gap-2 mb-4">
                                        <Info className="h-5 w-5 text-brand-400" />
                                        Quick Tips
                                    </h4>
                                    <ul className="space-y-4">
                                        <li className="flex gap-3">
                                            <div className="h-5 w-5 rounded-full bg-brand-500/20 text-brand-400 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">1</div>
                                            <p className="text-sm text-gray-400">Specify reason to ensure accurate reporting in audits.</p>
                                        </li>
                                        <li className="flex gap-3">
                                            <div className="h-5 w-5 rounded-full bg-brand-500/20 text-brand-400 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">2</div>
                                            <p className="text-sm text-gray-400">Selecting 'All Students' will ignore class selections.</p>
                                        </li>
                                        <li className="flex gap-3">
                                            <div className="h-5 w-5 rounded-full bg-brand-500/20 text-brand-400 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">3</div>
                                            <p className="text-sm text-gray-400">Discounts are only applied to 'Active' students.</p>
                                        </li>
                                    </ul>
                                </div>
                            </Card>

                            {applyMutation.isSuccess && (
                                <Card className="p-6 bg-green-50 border-green-100 flex items-center gap-4">
                                    <div className="h-12 w-12 rounded-full bg-green-100 text-green-600 flex items-center justify-center">
                                        <CheckCircle2 className="h-6 w-6" />
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-green-900">Success!</h4>
                                        <p className="text-sm text-green-700">The discounts have been successfully committed to student accounts.</p>
                                    </div>
                                </Card>
                            )}
                        </div>
                    </div>
                </TabsContent>

                <TabsContent value="history">
                    <Card className="p-6">
                        <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                            <HistoryIcon className="h-5 w-5 text-brand-600" />
                            Recent Bulk Operations
                        </h3>

                        {logsLoading ? (
                            <div className="flex flex-col items-center justify-center py-12 space-y-4">
                                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-brand-600"></div>
                                <p className="text-sm text-gray-500 font-medium">Loading history...</p>
                            </div>
                        ) : discountHistory.length > 0 ? (
                            <div className="space-y-4">
                                {discountHistory.map((log: any) => (
                                    <div key={log.id} className="group p-4 rounded-2xl border hover:border-brand-200 hover:bg-brand-50/30 transition-all flex items-start gap-4">
                                        <div className="h-10 w-10 rounded-full bg-brand-100 text-brand-600 flex items-center justify-center shrink-0">
                                            <Calculator className="h-5 w-5" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-bold text-gray-900">{log.description}</p>
                                            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1">
                                                <span className="text-xs text-gray-500 flex items-center gap-1 font-medium">
                                                    <User className="h-3 w-3" />
                                                    {log.user_name}
                                                </span>
                                                <span className="text-xs text-gray-500 flex items-center gap-1 font-medium">
                                                    <Clock className="h-3 w-3" />
                                                    {formatDateTime(log.created_at)}
                                                </span>
                                                {log.metadata?.fee_item && (
                                                    <Badge variant="secondary" className="bg-gray-100 text-gray-700 text-[10px] font-bold">
                                                        {log.metadata.fee_item}
                                                    </Badge>
                                                )}
                                            </div>
                                            {log.metadata?.reason && (
                                                <p className="mt-2 text-xs text-gray-600 bg-white border rounded-lg p-2 inline-block italic font-medium">
                                                    "{log.metadata.reason}"
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-20 bg-gray-50 rounded-2xl border-2 border-dashed">
                                <div className="h-16 w-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
                                    <Calculator className="h-8 w-8 text-gray-300" />
                                </div>
                                <h4 className="text-lg font-bold text-gray-900">No History Yet</h4>
                                <p className="text-sm text-gray-500 max-w-xs mx-auto mt-2">
                                    When you apply bulk waivers, they will appear here for audit and reference.
                                </p>
                            </div>
                        )}
                    </Card>
                </TabsContent>
            </Tabs>

            {/* Preview Modal */}
            <Dialog open={showPreview} onOpenChange={setShowPreview}>
                <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col p-0">
                    <DialogHeader className="p-6 border-b">
                        <DialogTitle className="text-xl font-black text-gray-900 flex items-center gap-2">
                            Review Financial Impact
                        </DialogTitle>
                        <DialogDescription>
                            Please confirm the following changes before applying the bulk waiver.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="flex-1 overflow-y-auto p-0">
                        <div className="bg-brand-50/50 p-6 grid grid-cols-2 gap-6 border-b">
                            <div className="space-y-1">
                                <p className="text-xs font-bold text-brand-600 uppercase tracking-wider">Total Students Affected</p>
                                <p className="text-3xl font-black text-gray-900">{previewData?.count || 0}</p>
                            </div>
                            <div className="space-y-1">
                                <p className="text-xs font-bold text-brand-600 uppercase tracking-wider">Total Impact Value</p>
                                <p className="text-3xl font-black text-gray-900">{formatCurrency(previewData?.total_impact || 0)}</p>
                            </div>
                        </div>

                        <div className="p-6">
                            <h4 className="text-sm font-black text-gray-900 mb-4 flex items-center gap-2">
                                <Search className="h-4 w-4 text-gray-400" />
                                Student Breakdown (Sample)
                            </h4>
                            <div className="rounded-xl border overflow-hidden">
                                <table className="w-full text-sm">
                                    <thead className="bg-gray-50 text-left border-b">
                                        <tr>
                                            <th className="px-4 py-3 font-bold text-gray-600">Student Name</th>
                                            <th className="px-4 py-3 font-bold text-gray-600">Class</th>
                                            <th className="px-4 py-3 font-bold text-gray-600 text-right">Potential Discount</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y">
                                        {previewData?.students?.map((s: any) => (
                                            <tr key={s.id}>
                                                <td className="px-4 py-3 font-medium text-gray-900">
                                                    {s.names}
                                                    <span className="block text-xs text-gray-400 font-bold">{s.student_no}</span>
                                                </td>
                                                <td className="px-4 py-3 text-gray-600 font-medium">{s.class}</td>
                                                <td className="px-4 py-3 text-right font-black text-brand-700">
                                                    {formatCurrency(s.potential_discount)}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                            <p className="text-center text-xs text-gray-400 mt-4 font-medium italic">
                                Showing up to 100 affected students in this preview.
                            </p>
                        </div>
                    </div>

                    <DialogFooter className="p-6 border-t bg-gray-50 gap-3">
                        <Button variant="ghost" onClick={() => setShowPreview(false)} className="rounded-xl font-bold">
                            Cancel & Edit
                        </Button>
                        <Button 
                            onClick={handleApply}
                            disabled={applyMutation.isPending}
                            className="bg-brand-600 hover:bg-brand-700 px-8 rounded-xl font-black flex items-center gap-2"
                        >
                            {applyMutation.isPending ? 'Committing...' : 'Yes, Apply Now'}
                            <CheckCircle2 className="h-4 w-4" />
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};
