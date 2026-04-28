import React, { useMemo, useState } from 'react';
import {
    Plus,
    Search,
    User,
    Edit,
    Trash2,
    UserCheck,
    Zap,
    AlertTriangle,
    GraduationCap,
    Library,
    Eye,
    Wallet,
    CalendarCheck,
    MessageSquare,
    Printer,
    TrendingDown
} from 'lucide-react';
import * as Types from '@/lib/types';
import * as Utils from '@/lib/utils';
import { TrendBadge } from './grading/TrendBadge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Modal } from '@/components/ui/modal';
import { PhotoUpload } from '@/components/ui/photo-upload';
import { useToast } from '@/components/providers/toast-provider';
import { useAutoPromoteStudents, useSettings, usePayments, useFees, useAttendance } from '@/lib/hooks/use-data';
import { AcademicProgressChart } from './grading/AcademicProgressChart';

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
    const url = student.passport_url || student.passport_media;
    return Utils.getMediaUrl(url);
};

export const StudentsView: React.FC<StudentsViewProps> = ({
    students, classes, onAdd, onUpdate, onDelete, onSearchChange, onFilterClassChange, isLoading = false, scores = []
}) => {
    const [showModal, setShowModal] = useState(false);
    const [showDetailsModal, setShowDetailsModal] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [selectedStudent, setSelectedStudent] = useState<Types.Student | null>(null);
    const [detailsSession, setDetailsSession] = useState('');
    const [detailsTerm, setDetailsTerm] = useState('');
    const [filterClass, setFilterClass] = useState('all');
    const [search, setSearch] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [showPromoteModal, setShowPromoteModal] = useState(false);
    const [promoteSession, setPromoteSession] = useState('');
    const [promoteTerm, setPromoteTerm] = useState('');

    const [formData, setFormData] = useState<Partial<Types.Student>>({});
    const { addToast } = useToast();
    const { data: settings } = useSettings();
    const { data: payments = [] } = usePayments({ include_all_periods: true });
    const { data: fees = [] } = useFees({ include_all_periods: true });
    const { data: attendance = [] } = useAttendance({ include_all_periods: true });
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

    const handleViewDetails = (student: Types.Student) => {
        setSelectedStudent(student);
        setDetailsSession(settings?.current_session || '');
        setDetailsTerm(settings?.current_term || '');
        setShowDetailsModal(true);
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

    const activeDetailsSession = detailsSession || settings?.current_session || '';
    const activeDetailsTerm = detailsTerm || settings?.current_term || '';

    const availableDetailSessions = useMemo(() => {
        if (!selectedStudent) return settings?.current_session ? [settings.current_session] : [];

        const sessions = new Set<string>();
        scores.filter(sc => sc.student_id === selectedStudent.id).forEach(sc => sessions.add(sc.session));
        payments.filter(p => p.student_id === selectedStudent.id).forEach(p => sessions.add(p.session));
        attendance.filter(a => a.class_id === selectedStudent.class_id).forEach(a => sessions.add(a.session));
        if (settings?.current_session) sessions.add(settings.current_session);

        return Array.from(sessions).sort().reverse();
    }, [selectedStudent, scores, payments, attendance, settings?.current_session]);

    const availableDetailTerms = settings?.terms?.length ? settings.terms : ['First Term', 'Second Term', 'Third Term'];

    const detailScore = useMemo(() => {
        if (!selectedStudent) return undefined;
        return scores.find(
            sc =>
                sc.student_id === selectedStudent.id &&
                sc.session === activeDetailsSession &&
                sc.term === activeDetailsTerm,
        );
    }, [selectedStudent, scores, activeDetailsSession, activeDetailsTerm]);

    const detailPosition = useMemo(() => {
        if (!selectedStudent || !detailScore) return null;
        return Utils.getStudentPosition(selectedStudent.id, students, scores, activeDetailsSession, activeDetailsTerm);
    }, [selectedStudent, detailScore, students, scores, activeDetailsSession, activeDetailsTerm]);

    const detailAttendance = useMemo(() => {
        if (!selectedStudent) {
            return { total: 0, present: 0, late: 0, absent: 0, rate: 0, lastMarkedDate: '' };
        }

        const sessions = attendance.filter(
            a =>
                a.class_id === selectedStudent.class_id &&
                a.session === activeDetailsSession &&
                a.term === activeDetailsTerm,
        );

        const statuses = sessions.map(s => s.records.find(r => r.student_id === selectedStudent.id)?.status || 'absent');
        const total = statuses.length;
        const present = statuses.filter(st => st === 'present').length;
        const late = statuses.filter(st => st === 'late').length;
        const absent = statuses.filter(st => st === 'absent').length;
        const rate = total > 0 ? Math.round(((present + late) / total) * 100) : 0;
        const lastMarkedDate = sessions.length ? [...sessions].sort((a, b) => b.date.localeCompare(a.date))[0].date : '';

        return { total, present, late, absent, rate, lastMarkedDate };
    }, [selectedStudent, attendance, activeDetailsSession, activeDetailsTerm]);

    const detailFinance = useMemo(() => {
        if (!selectedStudent) return null;
        return Utils.getStudentBalance(selectedStudent, fees, payments, activeDetailsSession, activeDetailsTerm);
    }, [selectedStudent, fees, payments, activeDetailsSession, activeDetailsTerm]);

    const detailPayments = useMemo(() => {
        if (!selectedStudent) return [];
        return payments
            .filter(
                p =>
                    p.student_id === selectedStudent.id &&
                    p.session === activeDetailsSession &&
                    p.term === activeDetailsTerm,
            )
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
            .slice(0, 5);
    }, [selectedStudent, payments, activeDetailsSession, activeDetailsTerm]);

    const detailSubjectAnalysis = useMemo(() => {
        if (!detailScore?.rows?.length) return { strengths: [], risks: [] };
        const sorted = [...detailScore.rows].sort((a, b) => b.total - a.total);
        return {
            strengths: sorted.slice(0, 3),
            risks: sorted.slice(-3).filter(row => row.total < 55),
        };
    }, [detailScore]);

    const detailWarnings = useMemo(() => {
        if (!selectedStudent) return [];
        const warnings: string[] = [];
        if (!selectedStudent.dob) warnings.push('Date of birth is missing.');
        if (!selectedStudent.parent_phone) warnings.push('Parent phone is missing.');
        if (!selectedStudent.parent_email) warnings.push('Parent email is missing.');
        if (!selectedStudent.address) warnings.push('Address is missing.');
        if (!selectedStudent.passport_url) warnings.push('Passport photo is missing.');
        if (!(selectedStudent as any).password) warnings.push('Portal password has not been set.');
        if (!selectedStudent.class_id) warnings.push('Class assignment is missing.');
        return warnings;
    }, [selectedStudent]);

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

                    const accentColor = s.gender === 'Female' ? 'rose' : 'indigo';

                    return (
                        <Card key={s.id} className={`group relative overflow-hidden border border-gray-100 bg-white shadow-sm hover:shadow-md transition-all duration-300 rounded-2xl ${isAtRisk ? 'ring-2 ring-red-500' : ''}`}>
                            {/* Simple Colorful Header Strip */}
                            <div className={`h-16 w-full bg-gradient-to-r ${s.gender === 'Female' ? 'from-rose-400 to-pink-500' : 'from-indigo-400 to-blue-500'} opacity-80`} />

                            <div className="px-5 pb-5 -mt-8 relative">
                                {isAtRisk && (
                                    <div className="absolute top-10 right-4 z-10">
                                        <div className="bg-red-600 text-white rounded-full p-1.5 shadow-lg animate-pulse" title="Academic At-Risk">
                                            <AlertTriangle className="h-4 w-4" />
                                        </div>
                                    </div>
                                )}

                                {/* Profile Picture */}
                                <div className="flex flex-col items-center">
                                    <div className={`h-20 w-20 rounded-2xl bg-white p-1 shadow-md mb-3`}>
                                        <div className="h-full w-full rounded-xl overflow-hidden bg-gray-50 flex items-center justify-center border border-gray-100">
                                            {passportUrl ? (
                                                <img src={passportUrl} alt={s.names} className="h-full w-full object-cover" />
                                            ) : (
                                                <User className={`h-10 w-10 text-${accentColor}-200`} />
                                            )}
                                        </div>
                                    </div>

                                    <h3 className="font-bold text-gray-900 text-base lg:text-lg text-center w-full">{s.names}</h3>

                                    <div className="flex items-center gap-2 mt-1 mb-4">
                                        <span className={`px-2 py-0.5 rounded-lg bg-${accentColor}-100 text-${accentColor}-700 text-[11px] font-bold tracking-tight border border-${accentColor}-200`}>
                                            {s.student_no}
                                        </span>
                                        <TrendBadge trend={s.performance_trend} showText={false} />
                                        {attendanceLow && (
                                            <div className="h-2 w-2 rounded-full bg-amber-500" title="Low Attendance" />
                                        )}
                                    </div>

                                    {/* Class Badge */}
                                    <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-gray-50 border border-gray-100 mb-5 w-full justify-center`}>
                                        <GraduationCap className={`h-4 w-4 text-${accentColor}-500`} />
                                        <span className="text-xs font-semibold text-gray-700">{cls}</span>
                                    </div>

                                    {/* Footer Actions */}
                                    <div className="w-full flex items-center justify-between pt-3 border-t border-gray-100">
                                        <div className="flex flex-col px-1">
                                            <span className="text-[10px] font-bold text-gray-400 uppercase">Status</span>
                                            <span className="text-xs font-bold text-emerald-600 flex items-center gap-1">
                                                <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Active
                                            </span>
                                        </div>
                                        <div className="flex gap-1">
                                            <button
                                                onClick={() => handleViewDetails(s)}
                                                className={`p-1.5 hover:bg-${accentColor}-50 rounded-lg text-gray-400 hover:text-${accentColor}-600 transition-colors`}
                                                title="View full details"
                                            >
                                                <Eye className="h-4 w-4" />
                                            </button>
                                            <button
                                                onClick={() => handleEdit(s)}
                                                className={`p-1.5 hover:bg-${accentColor}-50 rounded-lg text-gray-400 hover:text-${accentColor}-600 transition-colors`}
                                            >
                                                <Edit className="h-4 w-4" />
                                            </button>
                                            <button
                                                onClick={() => onDelete(s.id)}
                                                className="p-1.5 hover:bg-rose-50 rounded-lg text-gray-400 hover:text-rose-600 transition-colors"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </button>
                                        </div>
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
                        <div className="flex justify-between items-center mb-3">
                            <h4 className="text-sm font-bold text-gray-900 uppercase tracking-wide flex items-center gap-2">
                                <Library className="h-4 w-4 text-brand-500" /> Subject Selection (E.g. Science/Art)
                            </h4>
                            <span className="text-[10px] text-gray-500 italic">Leave empty to use class defaults</span>
                        </div>

                        {formData.class_id ? (
                            <div className="bg-gray-50 p-3 rounded-lg border border-gray-100 max-h-[200px] overflow-y-auto">
                                <div className="grid grid-cols-2 gap-2">
                                    {Utils.getSubjectsForClass(classes.find(c => c.id === formData.class_id)).map(subj => {
                                        const isAssigned = (formData.assigned_subjects || []).includes(subj);
                                        return (
                                            <label key={subj} className={`flex items-center gap-2 p-2 rounded border cursor-pointer transition-all ${isAssigned ? 'bg-brand-50 border-brand-200 text-brand-700' : 'bg-white border-gray-200 text-gray-600 hover:border-brand-200'}`}>
                                                <input
                                                    type="checkbox"
                                                    className="rounded text-brand-600"
                                                    checked={isAssigned}
                                                    onChange={() => {
                                                        const current = formData.assigned_subjects || [];
                                                        if (isAssigned) {
                                                            setFormData({ ...formData, assigned_subjects: current.filter(s => s !== subj) });
                                                        } else {
                                                            setFormData({ ...formData, assigned_subjects: [...current, subj] });
                                                        }
                                                    }}
                                                />
                                                <span className="text-xs font-medium truncate" title={subj}>{subj}</span>
                                            </label>
                                        );
                                    })}
                                </div>
                            </div>
                        ) : (
                            <p className="text-xs text-gray-400 italic">Select a class first to see available subjects</p>
                        )}
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

            <Modal
                isOpen={showDetailsModal}
                onClose={() => setShowDetailsModal(false)}
                title="Student Full Details"
            >
                {selectedStudent && (
                    <div className="space-y-5">
                        <div className="flex flex-col gap-3 rounded-xl border border-gray-100 bg-gray-50 p-4 md:flex-row md:items-center md:justify-between">
                            <div className="flex items-center gap-4">
                                <div className="h-16 w-16 rounded-xl overflow-hidden bg-white border border-gray-200 flex items-center justify-center">
                                    {getPassportUrl(selectedStudent) ? (
                                        <img src={getPassportUrl(selectedStudent) || ''} alt={selectedStudent.names} className="h-full w-full object-cover" />
                                    ) : (
                                        <User className="h-8 w-8 text-gray-300" />
                                    )}
                                </div>
                                <div className="min-w-0">
                                    <h3 className="text-lg font-bold text-gray-900">{selectedStudent.names}</h3>
                                    <p className="text-sm text-gray-500">{selectedStudent.student_no}</p>
                                    <p className="text-xs text-gray-500">
                                        {classes.find(c => c.id === selectedStudent.class_id)?.name || 'Unknown Class'} | {selectedStudent.gender}
                                    </p>
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <Select value={activeDetailsSession} onChange={e => setDetailsSession(e.target.value)}>
                                    {availableDetailSessions.map(s => (
                                        <option key={s} value={s}>{s}</option>
                                    ))}
                                </Select>
                                <Select value={activeDetailsTerm} onChange={e => setDetailsTerm(e.target.value)}>
                                    {availableDetailTerms.map((t: string) => (
                                        <option key={t} value={t}>{t}</option>
                                    ))}
                                </Select>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 text-sm">
                            <div className="rounded-lg bg-brand-50 p-3 border border-brand-100">
                                <p className="text-[10px] uppercase font-bold text-brand-600">Average</p>
                                <p className="text-base font-bold text-brand-800">{detailScore ? `${(detailScore.average || 0).toFixed(1)}%` : '--'}</p>
                            </div>
                            <div className="rounded-lg bg-indigo-50 p-3 border border-indigo-100">
                                <p className="text-[10px] uppercase font-bold text-indigo-600">Position</p>
                                <p className="text-base font-bold text-indigo-800">{detailPosition ? Utils.ordinalSuffix(detailPosition) : '--'}</p>
                            </div>
                            <div className="rounded-lg bg-emerald-50 p-3 border border-emerald-100">
                                <p className="text-[10px] uppercase font-bold text-emerald-600">Attendance</p>
                                <p className="text-base font-bold text-emerald-800">{detailAttendance.total ? `${detailAttendance.rate}%` : '--'}</p>
                            </div>
                            <div className="rounded-lg bg-rose-50 p-3 border border-rose-100">
                                <p className="text-[10px] uppercase font-bold text-rose-600">Outstanding</p>
                                <p className="text-base font-bold text-rose-800">
                                    {detailFinance ? Utils.formatCurrency(detailFinance.balance) : '--'}
                                </p>
                            </div>
                            <div className="rounded-lg bg-amber-50 p-3 border border-amber-100">
                                <p className="text-[10px] uppercase font-bold text-amber-600">Data Alerts</p>
                                <p className="text-base font-bold text-amber-800">{detailWarnings.length}</p>
                            </div>
                        </div>

                        <div className="flex flex-wrap gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                    handleEdit(selectedStudent);
                                    setShowDetailsModal(false);
                                }}
                            >
                                <Edit className="h-4 w-4 mr-1" /> Edit Profile
                            </Button>
                            <Button variant="secondary" size="sm" onClick={() => window.location.assign('/grading')}>
                                <GraduationCap className="h-4 w-4 mr-1" /> Open Grading
                            </Button>
                            <Button variant="secondary" size="sm" onClick={() => window.location.assign('/bursary')}>
                                <Wallet className="h-4 w-4 mr-1" /> Open Bursary
                            </Button>
                            <Button variant="secondary" size="sm" onClick={() => window.location.assign('/attendance')}>
                                <CalendarCheck className="h-4 w-4 mr-1" /> Open Attendance
                            </Button>
                            <Button variant="secondary" size="sm" onClick={() => window.print()}>
                                <Printer className="h-4 w-4 mr-1" /> Print
                            </Button>
                            <Button variant="secondary" size="sm" onClick={() => window.location.assign('/messages')}>
                                <MessageSquare className="h-4 w-4 mr-1" /> Message Parent
                            </Button>
                        </div>

                        {selectedStudent && (
                            <AcademicProgressChart scores={scores} studentId={selectedStudent.id} />
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="rounded-xl border border-gray-100 p-4">
                                <p className="mb-3 text-xs font-bold uppercase tracking-wide text-gray-500">Student Profile</p>
                                <div className="space-y-2 text-sm">
                                    <p><span className="font-semibold text-gray-700">Full Name:</span> {selectedStudent.names || '-'}</p>
                                    <p><span className="font-semibold text-gray-700">Admission No:</span> {selectedStudent.student_no || '-'}</p>
                                    <p><span className="font-semibold text-gray-700">Gender:</span> {selectedStudent.gender || '-'}</p>
                                    <p><span className="font-semibold text-gray-700">Date of Birth:</span> {selectedStudent.dob || '-'}</p>
                                    <p><span className="font-semibold text-gray-700">Class:</span> {classes.find(c => c.id === selectedStudent.class_id)?.name || '-'}</p>
                                    <p><span className="font-semibold text-gray-700">Status:</span> {(selectedStudent as any).status || 'active'}</p>
                                </div>
                            </div>

                            <div className="rounded-xl border border-gray-100 p-4">
                                <p className="mb-3 text-xs font-bold uppercase tracking-wide text-gray-500">Parent / Guardian</p>
                                <div className="space-y-2 text-sm">
                                    <p><span className="font-semibold text-gray-700">Parent Name:</span> {selectedStudent.parent_name || '-'}</p>
                                    <p><span className="font-semibold text-gray-700">Parent Email:</span> {selectedStudent.parent_email || '-'}</p>
                                    <p><span className="font-semibold text-gray-700">Parent Phone:</span> {selectedStudent.parent_phone || '-'}</p>
                                    <p><span className="font-semibold text-gray-700">Address:</span> {selectedStudent.address || '-'}</p>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="rounded-xl border border-gray-100 p-4">
                                <p className="mb-3 text-xs font-bold uppercase tracking-wide text-gray-500">Subject Strengths & Risk</p>
                                <div className="space-y-2">
                                    <p className="text-xs font-semibold text-emerald-700">Top Subjects</p>
                                    {detailSubjectAnalysis.strengths.length > 0 ? detailSubjectAnalysis.strengths.map(row => (
                                        <div key={`${row.subject}-top`} className="flex items-center justify-between rounded-md bg-emerald-50 px-3 py-2 text-sm">
                                            <span>{row.subject}</span>
                                            <span className="font-bold">{row.total}%</span>
                                        </div>
                                    )) : <p className="text-xs text-gray-500">No score data for this period.</p>}

                                    <p className="text-xs font-semibold text-rose-700 mt-3">Needs Attention</p>
                                    {detailSubjectAnalysis.risks.length > 0 ? detailSubjectAnalysis.risks.map(row => (
                                        <div key={`${row.subject}-risk`} className="flex items-center justify-between rounded-md bg-rose-50 px-3 py-2 text-sm">
                                            <span>{row.subject}</span>
                                            <span className="font-bold">{row.total}%</span>
                                        </div>
                                    )) : <p className="text-xs text-gray-500">No immediate risk subjects in this period.</p>}
                                </div>
                            </div>

                            <div className="rounded-xl border border-gray-100 p-4">
                                <p className="mb-3 text-xs font-bold uppercase tracking-wide text-gray-500">Attendance Intelligence</p>
                                <div className="grid grid-cols-2 gap-2 text-sm">
                                    <div className="rounded-md bg-gray-50 p-2"><span className="text-xs text-gray-500">Days</span><p className="font-bold">{detailAttendance.total}</p></div>
                                    <div className="rounded-md bg-emerald-50 p-2"><span className="text-xs text-emerald-600">Present</span><p className="font-bold text-emerald-700">{detailAttendance.present}</p></div>
                                    <div className="rounded-md bg-amber-50 p-2"><span className="text-xs text-amber-600">Late</span><p className="font-bold text-amber-700">{detailAttendance.late}</p></div>
                                    <div className="rounded-md bg-rose-50 p-2"><span className="text-xs text-rose-600">Absent</span><p className="font-bold text-rose-700">{detailAttendance.absent}</p></div>
                                </div>
                                <div className="mt-3 text-xs text-gray-600">
                                    Rate: <span className="font-bold">{detailAttendance.rate}%</span>
                                    {detailAttendance.lastMarkedDate && (
                                        <span> | Last marked: {detailAttendance.lastMarkedDate}</span>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="rounded-xl border border-gray-100 p-4">
                                <p className="mb-3 text-xs font-bold uppercase tracking-wide text-gray-500">Finance Snapshot</p>
                                <div className="space-y-2 text-sm">
                                    <p><span className="font-semibold text-gray-700">Total Bill:</span> {detailFinance ? Utils.formatCurrency(detailFinance.totalBill) : '--'}</p>
                                    <p><span className="font-semibold text-gray-700">Total Paid:</span> {detailFinance ? Utils.formatCurrency(detailFinance.totalPaid) : '--'}</p>
                                    <p><span className="font-semibold text-gray-700">Outstanding:</span> {detailFinance ? Utils.formatCurrency(detailFinance.balance) : '--'}</p>
                                </div>
                                <div className="mt-3 space-y-1">
                                    {detailPayments.length > 0 ? detailPayments.map(p => (
                                        <div key={p.id} className="flex items-center justify-between rounded-md bg-gray-50 px-3 py-2 text-xs">
                                            <span>{p.date}</span>
                                            <span className="font-semibold">{Utils.formatCurrency(p.amount)}</span>
                                        </div>
                                    )) : <p className="text-xs text-gray-500">No payments recorded for selected period.</p>}
                                </div>
                            </div>

                            <div className="rounded-xl border border-gray-100 p-4">
                                <p className="mb-3 text-xs font-bold uppercase tracking-wide text-gray-500">Assignments & Access</p>
                                <div className="space-y-2 text-sm">
                                    <p><span className="font-semibold text-gray-700">Assigned Subjects:</span> {(selectedStudent.assigned_subjects && selectedStudent.assigned_subjects.length > 0) ? selectedStudent.assigned_subjects.join(', ') : 'Using class defaults'}</p>
                                    <p><span className="font-semibold text-gray-700">Portal Username:</span> {selectedStudent.student_no || '-'}</p>
                                    <p><span className="font-semibold text-gray-700">Portal Password:</span> {(selectedStudent as any).password ? 'Set' : 'Not set'}</p>
                                    <p><span className="font-semibold text-gray-700">Report Status:</span> {detailScore?.is_passed ? 'Published' : 'Pending'}</p>
                                </div>
                            </div>
                        </div>

                        {detailWarnings.length > 0 && (
                            <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
                                <p className="mb-2 text-xs font-bold uppercase tracking-wide text-amber-700 flex items-center gap-2">
                                    <TrendingDown className="h-4 w-4" /> Data Quality Warnings
                                </p>
                                <ul className="list-disc list-inside space-y-1 text-sm text-amber-900">
                                    {detailWarnings.map(w => (
                                        <li key={w}>{w}</li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </div>
                )}
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
