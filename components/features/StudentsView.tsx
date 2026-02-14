import React, { useState } from 'react';
import { Plus, Search, User, Edit, Trash2, UserCheck, Zap, AlertTriangle } from 'lucide-react';
import * as Types from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Modal } from '@/components/ui/modal';
import { PhotoUpload } from '@/components/ui/photo-upload';
import { useToast } from '@/components/providers/toast-provider';
import { useAutoPromoteStudents, useSettings } from '@/lib/hooks/use-data';

interface StudentsViewProps {
    students: Types.Student[];
    classes: Types.Class[];
    onAdd: (s: Types.Student) => Promise<Types.Student>;
    onUpdate: (s: Types.Student, options?: { onSuccess?: () => void; onError?: (error: Error) => void }) => void;
    onDelete: (id: string) => void;
    onSearchChange?: (s: string) => void;
    onFilterClassChange?: (c: string) => void;
    isLoading?: boolean;
    scores?: Types.Score[];
}

const getPassportUrl = (student: Types.Student | any): string | null => {
    if (student.passport_url) return student.passport_url;
    if (student.passport_media) return student.passport_media;
    return null;
};

export const StudentsView: React.FC<StudentsViewProps> = ({
    students, classes, onAdd, onUpdate, onDelete, onSearchChange, onFilterClassChange, isLoading = false, scores = []
}) => {
    const [showModal, setShowModal] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [filterClass, setFilterClass] = useState('all');
    const [search, setSearch] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [showPromoteModal, setShowPromoteModal] = useState(false);
    const [promoteSession, setPromoteSession] = useState('');
    const [promoteTerm, setPromoteTerm] = useState('');

    const [formData, setFormData] = useState<Partial<Types.Student>>({});
    const { addToast } = useToast();
    const { data: settings } = useSettings();
    const autoPromoteMutation = useAutoPromoteStudents();

    React.useEffect(() => {
        if (settings) {
            setPromoteSession(settings.current_session || '');
            setPromoteTerm(settings.current_term || '');
        }
    }, [settings]);

    const handleSearch = (val: string) => {
        setSearch(val);
        if (onSearchChange) onSearchChange(val);
    };

    const handleFilterClass = (val: string) => {
        setFilterClass(val);
        if (onFilterClassChange) onFilterClassChange(val);
    };

    const handleEdit = (s: Types.Student) => {
        setFormData(s);
        setEditingId(s.id);
        setShowModal(true);
    };

    const handleCreate = () => {
        setFormData({
            names: '', student_no: '', gender: 'Male', class_id: classes[0]?.id || '',
            dob: '', parent_name: '', parent_phone: '', address: ''
        });
        setEditingId(null);
        setShowModal(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);

        try {
            if (editingId) {
                // For updates, use callback pattern
                onUpdate({ ...formData as Types.Student, id: editingId }, {
                    onSuccess: () => {
                        addToast('Student updated successfully', 'success');
                        setShowModal(false);
                        setEditingId(null);
                        setFormData({});
                        setIsSaving(false);
                    },
                    onError: (error) => {
                        addToast(error.message || 'Failed to update student', 'error');
                        setIsSaving(false);
                    }
                });
            } else {
                // For creates, use Promise (mutateAsync)
                await onAdd({
                    ...formData as Types.Student,
                    id: '', // Let database generate ID
                });
                addToast('Student registered successfully', 'success');
                setShowModal(false);
                setFormData({});
                setIsSaving(false);
            }
        } catch (error: any) {
            addToast(error.message || 'Failed to save student', 'error');
            setIsSaving(false);
        }
    };

    const handleAutoPromote = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!promoteSession || !promoteTerm) {
            addToast('Please select session and term', 'error');
            return;
        }

        try {
            await autoPromoteMutation.mutateAsync({
                session: promoteSession,
                term: promoteTerm
            });
            addToast('Automated promotion engine started successfully', 'success');
            setShowPromoteModal(false);
        } catch (error: any) {
            addToast(error.message || 'Failed to start promotion engine', 'error');
        }
    };

    const filteredStudents = (onSearchChange || onFilterClassChange)
        ? students
        : students.filter(s => {
            const matchesClass = filterClass === 'all' || s.class_id === filterClass;
            const matchesSearch = s.names.toLowerCase().includes(search.toLowerCase()) || s.student_no.toLowerCase().includes(search.toLowerCase());
            return matchesClass && matchesSearch;
        });

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Student Directory</h1>
                    <p className="text-gray-500">Manage student admissions and records</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={() => setShowPromoteModal(true)} className="border-brand-200 text-brand-700 hover:bg-brand-50">
                        <Zap className="h-4 w-4 mr-2" /> Auto-Promote
                    </Button>
                    <Button onClick={handleCreate}><Plus className="h-4 w-4 mr-2" /> Register Student</Button>
                </div>
            </div>

            <div className="flex flex-col md:flex-row gap-4 bg-white p-4 rounded-lg border shadow-sm">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search by name or admission no..."
                        className="pl-9 w-full h-10 rounded-md border border-gray-300 text-sm focus:ring-2 focus:ring-brand-500 focus:outline-none"
                        value={search}
                        onChange={e => handleSearch(e.target.value)}
                    />
                </div>
                <div className="w-full md:w-64">
                    <select
                        className="w-full h-10 rounded-md border border-gray-300 text-sm px-3 focus:ring-2 focus:ring-brand-500 focus:outline-none"
                        value={filterClass}
                        onChange={e => handleFilterClass(e.target.value)}
                    >
                        <option value="all">All Classes</option>
                        {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                </div>
            </div>

            <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 transition-opacity ${isLoading ? 'opacity-50 pointer-events-none' : ''}`}>
                {filteredStudents.map(s => {
                    const cls = classes.find(c => c.id === s.class_id)?.name || 'Unknown';
                    const passportUrl = getPassportUrl(s);

                    // Determine at-risk status
                    const currentScore = scores.find(sc => sc.student_id === s.id && sc.session === settings?.current_session && sc.term === settings?.current_term);
                    const isAtRisk = currentScore && (currentScore.average || 0) < (settings?.promotion_threshold || 50);
                    const attendanceLow = currentScore && (currentScore.attendance_present || 0) < (currentScore.attendance_total || 0) * 0.7;

                    return (
                        <Card key={s.id} className={`hover:border-brand-300 transition-colors group relative overflow-hidden ${isAtRisk ? 'border-red-200' : ''}`}>
                            {isAtRisk && (
                                <div className="absolute top-2 right-2 z-10">
                                    <div className="bg-red-600 text-white rounded-full p-1.5 shadow-lg animate-pulse" title="Academic At-Risk">
                                        <AlertTriangle className="h-3 w-3" />
                                    </div>
                                </div>
                            )}
                            <div className="flex flex-col items-center text-center p-2 relative">
                                <div className={`h-20 w-20 rounded-full mb-4 flex items-center justify-center overflow-hidden border-4 border-white shadow-sm ${isAtRisk ? 'ring-2 ring-red-100 ring-offset-2' : ''}`}>
                                    {passportUrl ? (
                                        <img src={passportUrl} alt={s.names} className="h-full w-full object-cover" />
                                    ) : (
                                        <User className="h-10 w-10 text-gray-400" />
                                    )}
                                </div>
                                <h3 className="font-bold text-gray-900 line-clamp-1">{s.names}</h3>
                                <div className="flex items-center gap-1.5 mb-2">
                                    <span className="text-xs font-mono text-gray-500">{s.student_no}</span>
                                    {attendanceLow && (
                                        <div className="h-1.5 w-1.5 rounded-full bg-amber-500" title="Low Attendance" />
                                    )}
                                </div>
                                <span className="px-2 py-1 rounded-full bg-brand-50 text-brand-700 text-xs font-medium mb-4">{cls}</span>
                                <div className="w-full border-t pt-3 flex justify-between items-center text-xs text-gray-500">
                                    <div className="flex flex-col items-start"><span className="font-medium text-gray-700">{s.gender}</span><span>{s.dob}</span></div>
                                    <div className="flex gap-2">
                                        <button onClick={() => handleEdit(s)} className="p-1.5 hover:bg-gray-100 rounded text-gray-600"><Edit className="h-4 w-4" /></button>
                                        <button onClick={() => onDelete(s.id)} className="p-1.5 hover:bg-red-50 rounded text-red-500"><Trash2 className="h-4 w-4" /></button>
                                    </div>
                                </div>
                            </div>
                        </Card>
                    );
                })}
                {filteredStudents.length === 0 && (
                    <div className="col-span-full py-12 text-center text-gray-500 border-2 border-dashed rounded-xl">
                        <div className="mx-auto h-12 w-12 text-gray-300 mb-3"><UserCheck className="h-full w-full" /></div>
                        <p>No students found matching your criteria.</p>
                    </div>
                )}
            </div>

            <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editingId ? "Edit Student" : "Register New Student"}>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Input label="Full Name" required value={formData.names} onChange={e => setFormData({ ...formData, names: e.target.value })} placeholder="Surname Firstname" />
                        <Input label="Admission Number" required value={formData.student_no} onChange={e => setFormData({ ...formData, student_no: e.target.value })} />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Select label="Gender" value={formData.gender} onChange={e => setFormData({ ...formData, gender: e.target.value as any })}>
                            <option value="Male">Male</option>
                            <option value="Female">Female</option>
                        </Select>
                        <Select label="Class" value={formData.class_id} onChange={e => setFormData({ ...formData, class_id: e.target.value })}>
                            <option value="">Select Class</option>
                            {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </Select>
                    </div>
                    <Input label="Date of Birth" type="date" value={formData.dob} onChange={e => setFormData({ ...formData, dob: e.target.value })} />

                    <div className="border-t pt-4 mt-2">
                        <h4 className="text-sm font-bold text-gray-900 mb-3 uppercase tracking-wide">Passport Photo</h4>
                        <PhotoUpload
                            value={formData.passport_url}
                            onChange={photo => setFormData({ ...formData, passport_url: photo })}
                            label=""
                            size="lg"
                        />
                    </div>

                    <div className="border-t pt-4 mt-2">
                        <h4 className="text-sm font-bold text-gray-900 mb-3 uppercase tracking-wide">Parent/Guardian Info</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Input label="Parent Name" value={formData.parent_name} onChange={e => setFormData({ ...formData, parent_name: e.target.value })} />
                            <Input label="Phone Number" value={formData.parent_phone} onChange={e => setFormData({ ...formData, parent_phone: e.target.value })} />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                            <Input label="Parent Email" type="email" value={formData.parent_email || ''} onChange={e => setFormData({ ...formData, parent_email: e.target.value })} placeholder="For password recovery" />
                            <Input label="Residential Address" value={formData.address} onChange={e => setFormData({ ...formData, address: e.target.value })} />
                        </div>
                    </div>

                    <div className="border-t pt-4 mt-2">
                        <h4 className="text-sm font-bold text-gray-900 mb-3 uppercase tracking-wide">Portal Access</h4>
                        <Input
                            label="Portal Password"
                            type="text"
                            value={formData.password || ''}
                            onChange={e => setFormData({ ...formData, password: e.target.value })}
                            placeholder="Set password for student/parent portal login"
                        />
                        <p className="text-xs text-gray-500 mt-1">This password allows the student/parent to login using the Student Number + Password.</p>
                    </div>

                    <Button type="submit" className="w-full mt-4" disabled={isSaving}>
                        {isSaving ? 'Saving...' : (editingId ? 'Update Record' : 'Complete Registration')}
                    </Button>
                </form>
            </Modal>

            <Modal isOpen={showPromoteModal} onClose={() => setShowPromoteModal(false)} title="Promotion Autopilot">
                <div className="space-y-4">
                    <div className="p-4 bg-brand-50 rounded-xl border border-brand-100 mb-4">
                        <div className="flex items-center gap-3 mb-2">
                            <Zap className="text-brand-600 h-5 w-5" />
                            <h4 className="font-bold text-brand-900">How it works</h4>
                        </div>
                        <p className="text-xs text-brand-800 leading-relaxed">
                            The engine will analyze all students in the selected term. Students who scored above the
                            <span className="font-bold"> pass threshold ({settings?.promotion_threshold}%)</span> will be
                            moved to their predefined <span className="font-bold">Next Class</span>. Final year students will be graduated.
                        </p>
                    </div>

                    <form onSubmit={handleAutoPromote} className="space-y-4">
                        <div className="grid grid-cols-1 gap-4">
                            <Input
                                label="Session to Process"
                                required
                                value={promoteSession}
                                onChange={e => setPromoteSession(e.target.value)}
                                placeholder="e.g. 2024/2025"
                            />
                            <Select
                                label="Term to Analyze"
                                required
                                value={promoteTerm}
                                onChange={e => setPromoteTerm(e.target.value)}
                            >
                                <option value="">Select Term</option>
                                {settings?.terms?.map((t: string) => <option key={t} value={t}>{t}</option>)}
                                {!settings?.terms?.length && (
                                    <>
                                        <option value="First Term">First Term</option>
                                        <option value="Second Term">Second Term</option>
                                        <option value="Third Term">Third Term</option>
                                    </>
                                )}
                            </Select>
                        </div>
                        <div className="bg-amber-50 border border-amber-200 p-3 rounded-lg flex items-start gap-3">
                            <UserCheck className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                            <p className="text-[10px] text-amber-800">
                                <span className="font-bold">Warning:</span> This action will modify multiple student records in the background.
                                Ensure you have confirmed all scores for this term before proceeding.
                            </p>
                        </div>
                        <Button type="submit" className="w-full" disabled={autoPromoteMutation.isPending}>
                            {autoPromoteMutation.isPending ? 'Starting Engine...' : 'Initialize Autopilot'}
                        </Button>
                    </form>
                </div>
            </Modal>
        </div>
    );
};
