import React, { useState } from 'react';
import { 
    Users, Layout, Filter, Calculator, 
    Save, AlertCircle, CheckCircle2, 
    ArrowRight, Info, Search, DollarSign,
    History as HistoryIcon, Clock, User,
    X, Plus
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
    useFees, 
    usePreviewBulkDiscount, useApplyBulkDiscount,
    useStudentGroups, usePaginatedStudents,
    useCreateStudentGroup,
    useClasses as useAcademicClasses, useActivityLogs
} from '@/lib/hooks/use-data';
import * as Types from '@/lib/types';
import { useToast } from '@/components/providers/toast-provider';
import { formatDateTime, formatCurrency, INITIAL_SETTINGS } from '@/lib/utils';
import { 
    Dialog, DialogContent, DialogHeader, 
    DialogTitle, DialogDescription, DialogFooter,
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
    const createGroupMutation = useCreateStudentGroup();

    const [activeTab, setActiveTab] = useState('apply');
    
    // Form State
    const [scopeType, setScopeType] = useState<'all' | 'class' | 'group' | 'student'>('class');
    const [selectedClassIds, setSelectedClassIds] = useState<string[]>([]);
    const [selectedGroupIds, setSelectedGroupIds] = useState<string[]>([]);
    const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
    const [studentSearch, setStudentSearch] = useState('');
    
    // Group Creation State
    const [showCreateGroup, setShowCreateGroup] = useState(false);
    const [newGroupName, setNewGroupName] = useState('');
    const [newGroupDesc, setNewGroupDesc] = useState('');
    
    // Data Fetching
    const { data: groups = [], refetch: refetchGroups } = useStudentGroups();
    const { data: studentResults, isLoading: studentsLoading } = usePaginatedStudents(1, 25, studentSearch, '', scopeType === 'student');
    const students = studentResults?.results || [];

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
        if (scopeType === 'group' && selectedGroupIds.length === 0) {
            addToast('Please select at least one group', 'error');
            return;
        }
        if (scopeType === 'student' && selectedStudentIds.length === 0) {
            addToast('Please select at least one student', 'error');
            return;
        }

        const getIds = () => {
            if (scopeType === 'class') return selectedClassIds;
            if (scopeType === 'group') return selectedGroupIds;
            if (scopeType === 'student') return selectedStudentIds;
            return [];
        };

        const payload = {
            scope: {
                type: scopeType,
                ids: getIds()
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
        const getIds = () => {
            if (scopeType === 'class') return selectedClassIds;
            if (scopeType === 'group') return selectedGroupIds;
            if (scopeType === 'student') return selectedStudentIds;
            return [];
        };

        const payload = {
            scope: {
                type: scopeType,
                ids: getIds()
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

    const handleCreateGroup = async () => {
        if (!newGroupName.trim()) {
            addToast('Group name is required', 'error');
            return;
        }

        try {
            await createGroupMutation.mutateAsync({
                name: newGroupName,
                description: newGroupDesc,
                students: selectedStudentIds
            });
            addToast('Student group created successfully', 'success');
            setShowCreateGroup(false);
            setNewGroupName('');
            setNewGroupDesc('');
            refetchGroups();
        } catch (error) {
            addToast('Failed to create group', 'error');
        }
    };

    const resetForm = () => {
        setSelectedClassIds([]);
        setSelectedGroupIds([]);
        setSelectedStudentIds([]);
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
                            Apply financial scholarships, percentages, or full waivers to targeted groups or the entire school.
                        </p>
                    </div>
                </div>
                <div className="absolute -bottom-12 -right-12 w-48 h-48 bg-white/10 rounded-full blur-2xl" />
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="bg-white border rounded-xl p-1 mb-6 flex w-fit gap-2">
                    <TabsTrigger value="apply" className="rounded-lg font-bold data-[state=active]:bg-brand-50 data-[state=active]:text-brand-600 px-6 py-2.5">
                        <Calculator className="h-4 w-4 mr-2" />
                        Apply Waiver
                    </TabsTrigger>
                    <TabsTrigger value="history" className="rounded-lg font-bold data-[state=active]:bg-brand-50 data-[state=active]:text-brand-600 px-6 py-2.5">
                        <HistoryIcon className="h-4 w-4 mr-2" />
                        Audit History
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="apply">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <Card className="lg:col-span-2 p-6 space-y-8">
                            {/* Step 1: Selection */}
                            <div className="space-y-4">
                                <h3 className="text-lg font-bold text-gray-900 border-b pb-2 flex items-center gap-2">
                                    <Filter className="h-5 w-5 text-gray-400" />
                                    Step 1: Choose Recipients
                                </h3>

                                <div className="flex flex-wrap gap-2 p-1 bg-gray-50 rounded-xl w-fit">
                                    {[
                                        { id: 'class', label: 'Classes', icon: Layout },
                                        { id: 'group', label: 'Groups', icon: Users },
                                        { id: 'student', label: 'Students', icon: User },
                                        { id: 'all', label: 'Entire School', icon: CheckCircle2 }
                                    ].map(type => (
                                        <button
                                            key={type.id}
                                            onClick={() => setScopeType(type.id as any)}
                                            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${
                                                scopeType === type.id 
                                                ? 'bg-white shadow-sm text-brand-600' 
                                                : 'text-gray-500 hover:text-gray-700'
                                            }`}
                                        >
                                            <type.icon className="h-4 w-4" />
                                            {type.label}
                                        </button>
                                    ))}
                                </div>

                                <div className="mt-4 min-h-[160px]">
                                    {scopeType === 'class' && (
                                        classes.length > 0 ? (
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
                                                        className={`px-3 py-2 rounded-lg text-xs font-bold border transition-all truncate text-left ${
                                                            selectedClassIds.includes(cls.id)
                                                            ? 'bg-brand-50 border-brand-500 text-brand-700 ring-4 ring-brand-100'
                                                            : 'bg-white border-gray-100 text-gray-600 hover:border-brand-200 shadow-sm'
                                                        }`}
                                                    >
                                                        {cls.name}
                                                    </button>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="p-8 border-2 border-dashed border-gray-100 rounded-3xl text-center bg-gray-50/50">
                                                <Layout className="h-6 w-6 text-gray-300 mx-auto mb-2" />
                                                <p className="text-xs text-gray-500 font-bold uppercase tracking-wider">No classes available</p>
                                            </div>
                                        )
                                    )}

                                    {scopeType === 'group' && (
                                        <div className="space-y-4">
                                            <div className="flex items-center justify-between">
                                                <p className="text-xs font-black text-gray-400 uppercase tracking-widest">Saved Student Groups</p>
                                                <Button 
                                                    variant="outline" size="sm" 
                                                    onClick={() => setShowCreateGroup(true)}
                                                    className="h-8 text-[10px] font-black border-brand-200 text-brand-600 hover:bg-brand-600 hover:text-white transition-colors uppercase tracking-widest"
                                                >
                                                    <Plus className="h-3 w-3 mr-1" />
                                                    Add New Group
                                                </Button>
                                            </div>

                                            {groups.length > 0 ? (
                                                <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
                                                    {groups.map((group: Types.StudentGroup) => (
                                                        <div 
                                                            key={group.id}
                                                            onClick={() => {
                                                                if (selectedGroupIds.includes(group.id)) {
                                                                    setSelectedGroupIds(selectedGroupIds.filter(id => id !== group.id));
                                                                } else {
                                                                    setSelectedGroupIds([...selectedGroupIds, group.id]);
                                                                }
                                                            }}
                                                            className={`p-4 rounded-3xl border-2 cursor-pointer transition-all ${
                                                                selectedGroupIds.includes(group.id)
                                                                ? 'bg-brand-50 border-brand-500 shadow-md transform scale-[1.02]'
                                                                : 'bg-white border-gray-100 hover:border-brand-100'
                                                            }`}
                                                        >
                                                            <div className="flex justify-between items-start mb-2">
                                                                <div className={`p-2 rounded-2xl ${selectedGroupIds.includes(group.id) ? 'bg-brand-600 text-white shadow-lg shadow-brand-100' : 'bg-gray-100 text-gray-500'}`}>
                                                                    <Users className="h-4 w-4" />
                                                                </div>
                                                                {selectedGroupIds.includes(group.id) && <CheckCircle2 className="h-5 w-5 text-brand-600 animate-in zoom-in" />}
                                                            </div>
                                                            <p className="text-sm font-black text-gray-900 leading-tight">{group.name}</p>
                                                            <p className="text-[10px] font-bold text-gray-500 mt-1 uppercase tracking-tighter">{group.student_count} members</p>
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <div className="p-12 border-2 border-dashed border-gray-200 rounded-3xl text-center bg-gray-50/50">
                                                    <Users className="h-8 w-8 text-gray-300 mx-auto mb-3" />
                                                    <h4 className="text-sm font-black text-gray-900">No Groups Found</h4>
                                                    <p className="text-xs text-gray-500 mb-4 font-medium">Create groups to reuse student lists across different waivers.</p>
                                                    <Button onClick={() => setShowCreateGroup(true)} className="bg-white border text-brand-600 hover:bg-brand-50 h-9 px-6 text-xs font-black shadow-sm rounded-2xl">Create Your First Group</Button>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {scopeType === 'student' && (
                                        <div className="space-y-4">
                                            <div className="relative group">
                                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 group-focus-within:text-brand-500 transition-colors" />
                                                <input
                                                    type="text"
                                                    value={studentSearch}
                                                    onChange={e => setStudentSearch(e.target.value)}
                                                    placeholder="Search student by name or admission number..."
                                                    className="w-full h-12 pl-12 pr-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-brand-500 outline-none text-sm font-black placeholder:text-gray-400"
                                                />
                                            </div>

                                            <div className="max-h-64 overflow-y-auto rounded-2xl border border-gray-100 divide-y divide-gray-50 shadow-inner">
                                                {studentsLoading ? (
                                                    <div className="p-12 text-center text-gray-400 font-black text-xs uppercase tracking-widest animate-pulse">Syncing Database...</div>
                                                ) : students.length > 0 ? (
                                                    students.map((student: Types.Student) => (
                                                        <div 
                                                            key={student.id} 
                                                            onClick={() => {
                                                                if (selectedStudentIds.includes(student.id)) {
                                                                    setSelectedStudentIds(selectedStudentIds.filter(id => id !== student.id));
                                                                } else {
                                                                    setSelectedStudentIds([...selectedStudentIds, student.id]);
                                                                }
                                                            }}
                                                            className={`p-4 flex items-center justify-between cursor-pointer transition-all ${selectedStudentIds.includes(student.id) ? 'bg-brand-50/80 shadow-inner' : 'hover:bg-gray-50'}`}
                                                        >
                                                            <div className="flex items-center gap-4">
                                                                <div className={`h-6 w-6 rounded-lg border-2 flex items-center justify-center transition-all ${selectedStudentIds.includes(student.id) ? 'bg-brand-600 border-brand-600' : 'border-gray-200'}`}>
                                                                    {selectedStudentIds.includes(student.id) && <CheckCircle2 className="h-4 w-4 text-white" />}
                                                                </div>
                                                                <div>
                                                                    <p className="text-sm font-black text-gray-900 leading-none mb-1">{student.names}</p>
                                                                    <div className="flex items-center gap-2">
                                                                        <span className="text-[10px] font-black uppercase text-gray-400 border px-1.5 rounded bg-white">{student.student_no}</span>
                                                                        <span className="text-[10px] font-bold text-gray-500">{student.current_class_name || 'No Class Assigned'}</span>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ))
                                                ) : (
                                                    <div className="p-12 text-center">
                                                        <p className="text-sm text-gray-400 font-bold italic">No students found matching your criteria.</p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    {scopeType === 'all' && (
                                        <div className="p-12 border-2 border-dashed border-brand-200 rounded-3xl text-center bg-brand-50/30">
                                            <div className="h-20 w-20 bg-brand-100 text-brand-600 rounded-3xl flex items-center justify-center mx-auto mb-4 shadow-xl shadow-brand-100/50">
                                                <Users className="h-10 w-10" />
                                            </div>
                                            <h4 className="text-xl font-black text-brand-900">School-Wide Waiver</h4>
                                            <p className="text-sm text-gray-600 font-bold max-w-sm mx-auto mt-2 leading-relaxed">
                                                Warning: This policy will apply to 100% of currently active student records. Proceed with caution.
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Step 2: Logic */}
                            <div className="space-y-6 pt-4">
                                <h3 className="text-lg font-bold text-gray-900 border-b pb-2 flex items-center gap-2">
                                    <DollarSign className="h-5 w-5 text-gray-400" />
                                    Step 2: Waiver Configuration
                                </h3>
                                
                                <div className="space-y-3">
                                    <label className="text-xs font-black text-gray-500 uppercase tracking-widest">Select Target Fee</label>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                        {activeFees.map(fee => (
                                            <div 
                                                key={fee.id}
                                                onClick={() => setSelectedFeeId(fee.id)}
                                                className={`p-4 rounded-3xl border-2 cursor-pointer transition-all flex items-center justify-between ${
                                                    selectedFeeId === fee.id
                                                    ? 'bg-brand-50 border-brand-600 shadow-lg shadow-brand-50'
                                                    : 'bg-white border-gray-50 hover:border-brand-100 shadow-sm'
                                                }`}
                                            >
                                                <div className="flex items-center gap-4">
                                                    <div className={`h-10 w-10 rounded-2xl flex items-center justify-center shadow-inner ${selectedFeeId === fee.id ? 'bg-brand-600 text-white' : 'bg-gray-50 text-gray-400'}`}>
                                                        <DollarSign className="h-5 w-5" />
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-black text-gray-900 leading-none mb-1">{fee.name}</p>
                                                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{fee.category || 'Standard'}</p>
                                                    </div>
                                                </div>
                                                <span className="text-sm font-black text-brand-600">{formatCurrency(fee.amount)}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <label className="text-xs font-black text-gray-500 uppercase tracking-widest">Waiver Type</label>
                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                        {[
                                            { id: 'percent', label: 'Percentage', icon: Filter },
                                            { id: 'fixed', label: 'Fixed Sum', icon: DollarSign },
                                            { id: 'full_waiver', label: 'Full Waiver', icon: CheckCircle2 },
                                            { id: 'scholarship', label: 'Grants', icon: Info }
                                        ].map(type => (
                                            <button
                                                key={type.id}
                                                type="button"
                                                onClick={() => setDiscountType(type.id)}
                                                className={`p-4 rounded-3xl border-2 flex flex-col items-center gap-3 transition-all ${
                                                    discountType === type.id
                                                    ? 'bg-brand-600 border-brand-600 text-white shadow-xl shadow-brand-200'
                                                    : 'bg-gray-50 border-transparent text-gray-400 hover:bg-gray-100'
                                                }`}
                                            >
                                                <type.icon className="h-6 w-6" />
                                                <span className="text-[10px] font-black uppercase tracking-widest">{type.label}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    {discountType !== 'full_waiver' && (
                                        <div className="space-y-2">
                                            <label className="text-xs font-black text-gray-500 uppercase tracking-widest">
                                                Waiver Value {discountType === 'percent' ? '(%)' : `(${INITIAL_SETTINGS.currency_symbol})`}
                                            </label>
                                            <div className="relative">
                                                <input
                                                    type="number"
                                                    value={value}
                                                    onChange={e => setValue(parseFloat(e.target.value) || 0)}
                                                    className="w-full h-14 px-6 bg-gray-50 border-none rounded-3xl focus:ring-4 focus:ring-brand-100 outline-none font-black text-xl text-brand-700"
                                                    min="0"
                                                />
                                                <div className="absolute right-6 top-1/2 -translate-y-1/2 text-gray-300 font-black text-lg">
                                                    {discountType === 'percent' ? '%' : INITIAL_SETTINGS.currency_symbol}
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    <div className="space-y-2">
                                        <label className="text-xs font-black text-gray-500 uppercase tracking-widest">Internal Narrative</label>
                                        <input
                                            type="text"
                                            value={reason}
                                            onChange={e => setReason(e.target.value)}
                                            placeholder="Audit Memo: Merit Basis etc."
                                            className="w-full h-14 px-6 bg-gray-50 border-none rounded-3xl focus:ring-4 focus:ring-brand-100 outline-none font-bold placeholder:text-gray-300"
                                        />
                                    </div>
                                </div>

                                <label className="flex items-start gap-4 p-5 bg-amber-50 rounded-3xl border border-amber-100 cursor-pointer hover:bg-amber-100/50 transition-colors">
                                    <input
                                        type="checkbox"
                                        checked={override}
                                        onChange={e => setOverride(e.target.checked)}
                                        className="w-6 h-6 rounded-lg border-amber-300 text-amber-600 focus:ring-amber-500 mt-0.5"
                                    />
                                    <div className="flex-1">
                                        <span className="text-sm font-black text-amber-900 flex items-center gap-2">
                                            <AlertCircle className="h-5 w-5" />
                                            Override Individual Student Settings
                                        </span>
                                        <p className="text-xs text-amber-800 mt-1 font-bold leading-relaxed">
                                            Applying this will overwrite any unique discounts already configured for students in this scope for the selected fee item. Use for standardizing records.
                                        </p>
                                    </div>
                                </label>
                            </div>

                            <div className="flex justify-end pt-8">
                                <Button
                                    onClick={handlePreview}
                                    disabled={previewMutation.isPending}
                                    className="bg-brand-600 hover:bg-brand-700 rounded-3xl h-14 px-12 flex items-center gap-3 font-black text-white shadow-2xl shadow-brand-200 transition-all hover:scale-[1.03] active:scale-[0.98]"
                                >
                                    {previewMutation.isPending ? 'Calculating...' : 'Review Impact Analysis'}
                                    <ArrowRight className="h-5 w-5" />
                                </Button>
                            </div>
                        </Card>

                        {/* Status Panel */}
                        <div className="space-y-6">
                            <Card className="p-8 bg-gray-900 border-none relative overflow-hidden text-white rounded-3xl">
                                <div className="relative z-10">
                                    <div className="flex items-center gap-3 mb-6">
                                        <div className="h-10 w-10 rounded-2xl bg-brand-500/20 text-brand-400 flex items-center justify-center">
                                            <Info className="h-6 w-6" />
                                        </div>
                                        <h4 className="font-black text-lg uppercase tracking-widest">Admin Rules</h4>
                                    </div>
                                    <ul className="space-y-6">
                                        {[
                                            'Waivers are credited directly to student ledgers.',
                                            'All actions are logged with your user signature for audit.',
                                            'Preview generation runs a delta analysis vs current records.',
                                            'Once applied, changes can only be reversed manually per student.'
                                        ].map((tip, i) => (
                                            <li key={i} className="flex gap-4 group">
                                                <div className="h-6 w-6 rounded-xl bg-gray-800 text-brand-400 flex items-center justify-center text-[10px] font-black shrink-0 group-hover:bg-brand-600 transition-colors">{i+1}</div>
                                                <p className="text-sm text-gray-400 font-bold leading-relaxed">{tip}</p>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                                <div className="absolute -top-10 -left-10 w-32 h-32 bg-brand-600/10 rounded-full blur-3xl" />
                            </Card>
                        </div>
                    </div>
                </TabsContent>

                <TabsContent value="history">
                    <Card className="p-8 rounded-3xl">
                        <div className="flex items-center justify-between mb-8 pb-4 border-b">
                            <h3 className="text-xl font-black text-gray-900 flex items-center gap-3">
                                <HistoryIcon className="h-6 w-6 text-brand-600" />
                                Bulk Waiver Logs
                            </h3>
                            <Badge className="bg-brand-50 text-brand-700 font-black px-4 py-1.5 rounded-full border-brand-100">Audit Mode</Badge>
                        </div>

                        {logsLoading ? (
                            <div className="flex flex-col items-center justify-center py-32">
                                <div className="animate-spin rounded-full h-14 w-14 border-4 border-gray-100 border-b-brand-600 mb-6"></div>
                                <p className="text-xs text-gray-400 font-black uppercase tracking-widest">Fetching Immutable Ledger...</p>
                            </div>
                        ) : discountHistory.length > 0 ? (
                            <div className="space-y-4">
                                {discountHistory.map((log: any) => (
                                    <div key={log.id} className="p-6 rounded-3xl border border-gray-50 hover:border-brand-200 hover:bg-brand-50/20 transition-all flex items-start gap-5 shadow-sm">
                                        <div className="h-12 w-12 rounded-2xl bg-white border shadow-sm text-brand-600 flex items-center justify-center shrink-0">
                                            <Calculator className="h-6 w-6" />
                                        </div>
                                        <div className="flex-1">
                                            <p className="font-black text-gray-900 text-lg mb-1">{log.description}</p>
                                            <div className="flex flex-wrap items-center gap-x-6 gap-y-2 mt-3">
                                                <div className="flex items-center gap-2 px-3 py-1 bg-white rounded-full border text-[10px] font-black uppercase tracking-widest text-gray-500">
                                                    <User className="h-3 w-3" />
                                                    {log.user_name}
                                                </div>
                                                <div className="flex items-center gap-2 px-3 py-1 bg-white rounded-full border text-[10px] font-black uppercase tracking-widest text-gray-500">
                                                    <Clock className="h-3 w-3" />
                                                    {formatDateTime(log.created_at)}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-32 bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200">
                                <Calculator className="h-16 w-16 text-gray-300 mx-auto mb-6" />
                                <h4 className="text-xl font-black text-gray-900">Zero History Recorded</h4>
                                <p className="text-sm text-gray-500 max-w-sm mx-auto mt-2 font-medium">When you apply bulk waivers, the audit trail will be maintained here automatically.</p>
                            </div>
                        )}
                    </Card>
                </TabsContent>
            </Tabs>

            {/* Impact Analysis Dialog */}
            <Dialog open={showPreview} onOpenChange={setShowPreview}>
                <DialogContent className="max-w-3xl rounded-[40px] p-0 overflow-hidden border-none shadow-2xl">
                    <DialogHeader className="p-10 pb-6 bg-white">
                        <Tabs defaultValue="overview" className="w-full">
                            <div className="flex items-center justify-between mb-4">
                                <DialogTitle className="text-3xl font-black text-gray-900 tracking-tight">Review Impacts</DialogTitle>
                                <TabsList className="bg-gray-100 rounded-full h-10 p-1">
                                    <TabsTrigger value="overview" className="rounded-full text-[10px] font-black uppercase tracking-widest">Summary</TabsTrigger>
                                    <TabsTrigger value="members" className="rounded-full text-[10px] font-black uppercase tracking-widest">Member List</TabsTrigger>
                                </TabsList>
                            </div>
                            <DialogDescription className="font-bold text-gray-400 text-base leading-relaxed">Please verify the financial impact on student ledgers before finalizing.</DialogDescription>

                            <TabsContent value="overview" className="mt-8">
                                <div className="grid grid-cols-2 gap-6">
                                    <div className="p-8 bg-brand-600 rounded-[32px] text-white shadow-xl shadow-brand-200">
                                        <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-60 mb-2">Target Volume</p>
                                        <p className="text-6xl font-black leading-none">{previewData?.count || 0}</p>
                                        <p className="text-xs font-bold mt-4 opacity-80 uppercase tracking-widest">Students Affected</p>
                                    </div>
                                    <div className="p-8 bg-gray-900 rounded-[32px] text-white">
                                        <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-40 mb-2">Net Value Impact</p>
                                        <p className="text-5xl font-black leading-none truncate">{formatCurrency(previewData?.total_impact || 0)}</p>
                                        <div className="flex items-center gap-2 mt-4 text-brand-400 font-bold uppercase text-[10px] tracking-widest">
                                            <Calculator className="h-3 w-3" />
                                            Aggregate Credit
                                        </div>
                                    </div>
                                </div>
                            </TabsContent>

                            <TabsContent value="members" className="mt-6">
                                <div className="max-h-[40vh] overflow-y-auto rounded-3xl border border-gray-100 shadow-inner">
                                    <table className="w-full text-left">
                                        <thead className="bg-gray-50/80 sticky top-0 backdrop-blur-md">
                                            <tr>
                                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400">Student Identity</th>
                                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400 text-right">Credit Value</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-50">
                                            {previewData?.students?.map((s: any) => (
                                                <tr key={s.id} className="hover:bg-gray-50 transition-colors">
                                                    <td className="px-6 py-4">
                                                        <p className="text-sm font-black text-gray-900">{s.names}</p>
                                                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-tighter">{s.class} • {s.student_no}</p>
                                                    </td>
                                                    <td className="px-6 py-4 text-right">
                                                        <p className="text-sm font-black text-brand-600">{formatCurrency(s.potential_discount)}</p>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </TabsContent>
                        </Tabs>
                    </DialogHeader>

                    <DialogFooter className="p-10 bg-gray-50 flex gap-4">
                        <Button variant="ghost" onClick={() => setShowPreview(false)} className="flex-1 rounded-3xl h-14 font-black text-gray-400 uppercase tracking-widest hover:text-gray-900">Abort Changes</Button>
                        <Button 
                            onClick={handleApply}
                            disabled={applyMutation.isPending}
                            className="flex-1 bg-brand-600 hover:bg-brand-700 h-14 rounded-3xl font-black text-white shadow-2xl shadow-brand-200 uppercase tracking-widest"
                        >
                            {applyMutation.isPending ? 'Syncing...' : 'Confirm Execution'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Private Cohort Definition Dialog */}
            <Dialog open={showCreateGroup} onOpenChange={setShowCreateGroup}>
                <DialogContent className="sm:max-w-md rounded-[40px] border-none p-0 overflow-hidden shadow-2xl">
                    <div className="bg-brand-600 p-10 text-white relative overflow-hidden">
                        <DialogHeader>
                            <DialogTitle className="text-3xl font-black tracking-tight">New Cohort</DialogTitle>
                            <DialogDescription className="text-brand-100 font-bold opacity-80 mt-1">Define a custom student group for targeted financial aids.</DialogDescription>
                        </DialogHeader>
                        <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-3xl" />
                    </div>

                    <div className="p-10 space-y-8">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1">Identity</label>
                            <input
                                type="text"
                                value={newGroupName}
                                onChange={(e) => setNewGroupName(e.target.value)}
                                placeholder="Group Name (e.g. Merit-Scholarship-2024)"
                                className="w-full h-14 px-6 rounded-3xl bg-gray-50 border-none focus:ring-4 focus:ring-brand-100 font-black text-gray-900 placeholder:text-gray-300 transition-all shadow-inner"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1">Purpose / Logic</label>
                            <textarea
                                value={newGroupDesc}
                                onChange={(e) => setNewGroupDesc(e.target.value)}
                                placeholder="Why was this group created?"
                                className="w-full p-6 rounded-[32px] bg-gray-50 border-none focus:ring-4 focus:ring-brand-100 font-bold text-gray-900 shadow-inner h-32 resize-none transition-all placeholder:text-gray-300"
                            />
                        </div>
                        {selectedStudentIds.length > 0 && (
                            <div className="p-6 bg-brand-50 rounded-3xl border border-brand-100 flex items-center gap-4 animate-in slide-in-from-bottom-5">
                                <div className="h-10 w-10 rounded-2xl bg-white text-brand-600 shadow-sm flex items-center justify-center shrink-0">
                                    <Users className="h-5 w-5" />
                                </div>
                                <div className="flex-1">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-brand-600 mb-0.5">Initial Composition</p>
                                    <p className="text-sm font-black text-brand-900 underline decoration-brand-300 underline-offset-4">{selectedStudentIds.length} Students Selected</p>
                                </div>
                            </div>
                        )}
                    </div>

                    <DialogFooter className="p-10 pt-0 flex gap-4">
                        <Button 
                            variant="ghost" 
                            onClick={() => setShowCreateGroup(false)}
                            className="flex-1 rounded-3xl h-14 font-black text-gray-400 uppercase tracking-widest"
                        >
                            Dismiss
                        </Button>
                        <Button 
                            onClick={handleCreateGroup}
                            disabled={!newGroupName || createGroupMutation.isPending}
                            className="flex-1 rounded-3xl h-14 bg-brand-600 hover:bg-brand-700 font-black text-white shadow-xl shadow-brand-100 uppercase tracking-widest disabled:bg-gray-100 disabled:text-gray-400 disabled:shadow-none"
                        >
                            {createGroupMutation.isPending ? 'Syncing...' : 'Commit Group'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};
