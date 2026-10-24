import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  ChevronRight,
  Edit,
  KeyRound,
  Library,
  Plus,
  Search,
  Trash2,
  Upload,
  User,
  UserCheck,
  Users,
  Zap,
} from 'lucide-react';
import * as Types from '@/lib/types';
import * as Utils from '@/lib/utils';
import apiClient from '@/lib/api-client';
import { TrendBadge } from './grading/TrendBadge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Modal } from '@/components/ui/modal';
import { PageHeader } from '@/components/ui/page-header';
import {
  IssueLoginsModal,
  type LoginSlip,
  ResetPasswordResult,
  useResetStudentPassword,
} from './students/StudentLogins';
import { EmptyState } from '@/components/ui/empty-state';
import { PhotoUpload } from '@/components/ui/photo-upload';
import { useToast } from '@/components/providers/toast-provider';
import { useConfirm } from '@/components/ui/confirm-dialog';
import { useAutoPromoteStudents, useSettings } from '@/lib/hooks/use-data';

interface StudentsViewProps {
  students: Types.Student[];
  classes: Types.Class[];
  onAdd: (s: Types.Student) => Promise<Types.Student>;
  onUpdate: (
    s: Types.Student,
    options?: { onSuccess?: () => void; onError?: (error: Error) => void }
  ) => void;
  onDelete: (id: string) => void;
  onSearchChange?: (s: string) => void;
  onFilterClassChange?: (c: string) => void;
  isLoading?: boolean;
  /** Total matching students across all pages. */
  totalCount?: number;
}

const getPassportUrl = (student: Types.Student): string | null => {
  const url = student.passport_url || student.passport_media;
  return Utils.getMediaUrl(url);
};

export const StudentsView: React.FC<StudentsViewProps> = ({
  students,
  classes,
  onAdd,
  onUpdate,
  onDelete,
  onSearchChange,
  onFilterClassChange,
  isLoading = false,
  totalCount,
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
  const confirm = useConfirm();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: settings } = useSettings();
  const schoolName = settings?.school_name || 'School';
  const [showLogins, setShowLogins] = useState(false);
  const [resetSlip, setResetSlip] = useState<LoginSlip | null>(null);
  const resetPassword = useResetStudentPassword();

  const handleResetPassword = async (student: Types.Student) => {
    const ok = await confirm({
      title: `Reset ${student.names}'s password?`,
      description:
        'A new temporary password is created and shown once. Their current password stops working.',
      confirmLabel: 'Reset password',
    });
    if (!ok) return;
    resetPassword.mutate(student.id, {
      onSuccess: (slip) => setResetSlip(slip),
      onError: (error) => {
        const detail = (error as { response?: { data?: { detail?: string } } }).response?.data
          ?.detail;
        addToast(detail || 'Could not reset the password.', 'error');
      },
    });
  };
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
      names: '',
      student_no: '',
      gender: 'Male',
      class_id: classes[0]?.id || '',
      dob: '',
      parent_name: '',
      parent_phone: '',
      address: '',
    });
    setEditingId(null);
    setShowModal(true);
  };

  // The profile page links to /students?edit=<id>; open that student's edit form.
  const editParam = searchParams.get('edit');
  React.useEffect(() => {
    if (!editParam) return;
    let cancelled = false;
    apiClient
      .get<Types.Student>(`academic/students/${editParam}/`)
      .then((res) => {
        if (!cancelled) handleEdit(res.data);
      })
      .catch(() => addToast('Could not load that student', 'error'));
    router.replace('/students');
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editParam]);

  const handleDelete = async (s: Types.Student) => {
    const ok = await confirm({
      title: `Delete ${s.names}?`,
      description:
        'This permanently removes the student and their records (results, payments, attendance). This cannot be undone.',
      tone: 'danger',
    });
    if (ok) onDelete(s.id);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      if (editingId) {
        // For updates, use callback pattern
        onUpdate(
          { ...(formData as Types.Student), id: editingId },
          {
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
            },
          }
        );
      } else {
        // For creates, use Promise (mutateAsync)
        await onAdd({
          ...(formData as Types.Student),
          id: '', // Let database generate ID
        });
        addToast('Student registered successfully', 'success');
        setShowModal(false);
        setFormData({});
        setIsSaving(false);
      }
    } catch {
      addToast('Failed to save student', 'error');
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
        term: promoteTerm,
      });
      addToast('Automated promotion engine started successfully', 'success');
      setShowPromoteModal(false);
    } catch {
      addToast('Failed to start promotion engine', 'error');
    }
  };

  const filteredStudents =
    onSearchChange || onFilterClassChange
      ? students
      : students.filter((s) => {
          const matchesClass = filterClass === 'all' || s.class_id === filterClass;
          const matchesSearch =
            s.names.toLowerCase().includes(search.toLowerCase()) ||
            s.student_no.toLowerCase().includes(search.toLowerCase());
          return matchesClass && matchesSearch;
        });

  const classNameOf = (s: Types.Student) => {
    if (!classes.length) return ''; // still loading; don't flash "No class"
    return classes.find((c) => String(c.id) === String(s.class_id))?.name || 'No class';
  };
  const hasFilters = Boolean(search) || filterClass !== 'all';

  return (
    <div className="space-y-6">
      <PageHeader
        title="Students"
        description={
          totalCount !== undefined
            ? `${totalCount.toLocaleString('en-NG')} student${totalCount === 1 ? '' : 's'}${hasFilters ? ' match your filters' : ''}`
            : 'Manage admissions, profiles and records'
        }
        actions={
          <>
            <Link
              href="/students/import"
              className="inline-flex items-center gap-1.5 rounded-control border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
            >
              <Upload className="h-4 w-4" /> Import
            </Link>
            <Button variant="secondary" onClick={() => setShowLogins(true)}>
              <KeyRound className="mr-1.5 h-4 w-4" /> Student logins
            </Button>
            <Button variant="secondary" onClick={() => setShowPromoteModal(true)}>
              <Zap className="mr-1.5 h-4 w-4" /> Auto-promote
            </Button>
            <Button onClick={handleCreate}>
              <Plus className="mr-1.5 h-4 w-4" /> Register student
            </Button>
          </>
        }
      />

      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="search"
            placeholder="Search by name or admission number"
            className="h-10 w-full rounded-control border border-gray-300 bg-white pl-9 pr-3 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30"
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
          />
        </div>
        <select
          aria-label="Filter by class"
          className="h-10 w-full rounded-control border border-gray-300 bg-white px-3 text-sm sm:w-56"
          value={filterClass}
          onChange={(e) => handleFilterClass(e.target.value)}
        >
          <option value="all">All classes</option>
          {classes.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      {filteredStudents.length === 0 ? (
        <EmptyState
          icon={Users}
          title={hasFilters ? 'No students match your search' : 'No students yet'}
          description={
            hasFilters
              ? 'Try a different name, admission number or class.'
              : 'Register your first student, or import a class list from a spreadsheet.'
          }
          action={
            !hasFilters && (
              <Button onClick={handleCreate}>
                <Plus className="mr-1.5 h-4 w-4" /> Register student
              </Button>
            )
          }
        />
      ) : (
        <div
          className={`overflow-hidden rounded-card border border-gray-200 bg-white shadow-card transition-opacity ${
            isLoading ? 'pointer-events-none opacity-60' : ''
          }`}
        >
          {/* Desktop table */}
          <table className="hidden w-full text-sm md:table">
            <thead className="bg-gray-50 text-left text-xs font-medium text-gray-500">
              <tr>
                <th className="px-5 py-3">Student</th>
                <th className="px-5 py-3">Class</th>
                <th className="px-5 py-3">Parent</th>
                <th className="px-5 py-3">Trend</th>
                <th className="px-5 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredStudents.map((s) => {
                const photo = getPassportUrl(s);
                return (
                  <tr key={s.id} className="hover:bg-gray-50">
                    <td className="px-5 py-3">
                      <Link href={`/students/${s.id}`} className="flex items-center gap-3">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-gray-100">
                          {photo ? (
                            <Image
                              src={photo}
                              alt=""
                              width={36}
                              height={36}
                              className="h-full w-full object-cover"
                              unoptimized
                            />
                          ) : (
                            <User className="h-4 w-4 text-gray-400" />
                          )}
                        </span>
                        <span className="min-w-0">
                          <span className="block truncate font-medium text-gray-900 hover:text-brand-700">
                            {s.names}
                          </span>
                          <span className="block text-xs text-gray-500">{s.student_no}</span>
                        </span>
                      </Link>
                    </td>
                    <td className="px-5 py-3 text-gray-700">{classNameOf(s)}</td>
                    <td className="px-5 py-3 text-gray-600">
                      <span className="block truncate">{s.parent_name || '—'}</span>
                      <span className="block text-xs text-gray-500">{s.parent_phone || ''}</span>
                    </td>
                    <td className="px-5 py-3">
                      <TrendBadge trend={s.performance_trend} showText />
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => handleEdit(s)}
                          className="rounded-md p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-900"
                          aria-label={`Edit ${s.names}`}
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleResetPassword(s)}
                          className="rounded-md p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-900"
                          aria-label={`Reset password for ${s.names}`}
                          title="Reset password"
                        >
                          <KeyRound className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(s)}
                          className="rounded-md p-2 text-gray-500 hover:bg-danger-50 hover:text-danger-600"
                          aria-label={`Delete ${s.names}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {/* Mobile list */}
          <ul className="divide-y divide-gray-100 md:hidden">
            {filteredStudents.map((s) => {
              const photo = getPassportUrl(s);
              return (
                <li key={s.id}>
                  <Link
                    href={`/students/${s.id}`}
                    className="flex items-center gap-3 px-4 py-3 active:bg-gray-50"
                  >
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full bg-gray-100">
                      {photo ? (
                        <Image
                          src={photo}
                          alt=""
                          width={44}
                          height={44}
                          className="h-full w-full object-cover"
                          unoptimized
                        />
                      ) : (
                        <User className="h-5 w-5 text-gray-400" />
                      )}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-medium text-gray-900">{s.names}</span>
                      <span className="block text-xs text-gray-500">
                        {s.student_no} · {classNameOf(s)}
                      </span>
                    </span>
                    <ChevronRight className="h-4 w-4 text-gray-400" />
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editingId ? 'Edit Student' : 'Register New Student'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Full Name"
              required
              value={formData.names}
              onChange={(e) => setFormData({ ...formData, names: e.target.value })}
              placeholder="Surname Firstname"
            />
            <Input
              label="Admission Number"
              required
              value={formData.student_no}
              onChange={(e) => setFormData({ ...formData, student_no: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Select
              label="Gender"
              value={formData.gender}
              onChange={(e) =>
                setFormData({ ...formData, gender: e.target.value as Types.Student['gender'] })
              }
            >
              <option value="Male">Male</option>
              <option value="Female">Female</option>
            </Select>
            <Select
              label="Class"
              value={formData.class_id}
              onChange={(e) => setFormData({ ...formData, class_id: e.target.value })}
            >
              <option value="">Select Class</option>
              {classes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </Select>
          </div>
          <Input
            label="Date of Birth"
            type="date"
            value={formData.dob}
            onChange={(e) => setFormData({ ...formData, dob: e.target.value })}
          />

          <div className="border-t pt-4 mt-2">
            <h4 className="text-sm font-bold text-gray-900 mb-3 uppercase tracking-wide">
              Passport Photo
            </h4>
            <PhotoUpload
              value={formData.passport_url}
              onChange={(photo) => setFormData({ ...formData, passport_url: photo })}
              label=""
              size="lg"
            />
          </div>

          <div className="border-t pt-4 mt-2">
            <h4 className="text-sm font-bold text-gray-900 mb-3 uppercase tracking-wide">
              Parent/Guardian Info
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Parent Name"
                value={formData.parent_name}
                onChange={(e) => setFormData({ ...formData, parent_name: e.target.value })}
              />
              <Input
                label="Phone Number"
                value={formData.parent_phone}
                onChange={(e) => setFormData({ ...formData, parent_phone: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <Input
                label="Parent Email"
                type="email"
                value={formData.parent_email || ''}
                onChange={(e) => setFormData({ ...formData, parent_email: e.target.value })}
                placeholder="For password recovery"
              />
              <Input
                label="Residential Address"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              />
            </div>
          </div>

          <div className="border-t pt-4 mt-2">
            <div className="flex justify-between items-center mb-3">
              <h4 className="text-sm font-bold text-gray-900 uppercase tracking-wide flex items-center gap-2">
                <Library className="h-4 w-4 text-brand-500" /> Subject Selection (E.g. Science/Art)
              </h4>
              <span className="text-xs text-gray-500 italic">
                Leave empty to use class defaults
              </span>
            </div>

            {formData.class_id ? (
              <div className="bg-gray-50 p-3 rounded-lg border border-gray-100 max-h-[200px] overflow-y-auto">
                <div className="grid grid-cols-2 gap-2">
                  {Utils.getSubjectsForClass(classes.find((c) => c.id === formData.class_id)).map(
                    (subj) => {
                      const isAssigned = (formData.assigned_subjects || []).includes(subj);
                      return (
                        <label
                          key={subj}
                          className={`flex items-center gap-2 p-2 rounded border cursor-pointer transition-all ${isAssigned ? 'bg-brand-50 border-brand-200 text-brand-700' : 'bg-white border-gray-200 text-gray-600 hover:border-brand-200'}`}
                        >
                          <input
                            type="checkbox"
                            className="rounded text-brand-600"
                            checked={isAssigned}
                            onChange={() => {
                              const current = formData.assigned_subjects || [];
                              if (isAssigned) {
                                setFormData({
                                  ...formData,
                                  assigned_subjects: current.filter((s) => s !== subj),
                                });
                              } else {
                                setFormData({ ...formData, assigned_subjects: [...current, subj] });
                              }
                            }}
                          />
                          <span className="text-xs font-medium truncate" title={subj}>
                            {subj}
                          </span>
                        </label>
                      );
                    }
                  )}
                </div>
              </div>
            ) : (
              <p className="text-xs text-gray-400 italic">
                Select a class first to see available subjects
              </p>
            )}
          </div>

          <div className="border-t pt-4 mt-2">
            <h4 className="text-sm font-bold text-gray-900 mb-3 uppercase tracking-wide">
              Portal Access
            </h4>
            <Input
              label="Portal Password"
              type="text"
              value={formData.password || ''}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              placeholder="Set password for student/parent portal login"
            />
            <p className="text-xs text-gray-500 mt-1">
              This password allows the student/parent to login using the Student Number + Password.
            </p>
          </div>

          <Button type="submit" className="w-full mt-4" disabled={isSaving}>
            {isSaving ? 'Saving...' : editingId ? 'Update Record' : 'Complete Registration'}
          </Button>
        </form>
      </Modal>

      <Modal
        isOpen={showPromoteModal}
        onClose={() => setShowPromoteModal(false)}
        title="Promotion Autopilot"
      >
        <div className="space-y-4">
          <div className="p-4 bg-brand-50 rounded-xl border border-brand-100 mb-4">
            <div className="flex items-center gap-3 mb-2">
              <Zap className="text-brand-600 h-5 w-5" />
              <h4 className="font-bold text-brand-900">How it works</h4>
            </div>
            <p className="text-xs text-brand-800 leading-relaxed">
              The engine will analyze all students in the selected term. Students who scored above
              the
              <span className="font-bold">
                {' '}
                pass threshold ({settings?.promotion_threshold}%)
              </span>{' '}
              will be moved to their predefined <span className="font-bold">Next Class</span>. Final
              year students will be graduated.
            </p>
          </div>

          <form onSubmit={handleAutoPromote} className="space-y-4">
            <div className="grid grid-cols-1 gap-4">
              <Input
                label="Session to Process"
                required
                value={promoteSession}
                onChange={(e) => setPromoteSession(e.target.value)}
                placeholder="e.g. 2024/2025"
              />
              <Select
                label="Term to Analyze"
                required
                value={promoteTerm}
                onChange={(e) => setPromoteTerm(e.target.value)}
              >
                <option value="">Select Term</option>
                {settings?.terms?.map((t: string) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
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
              <p className="text-xs text-amber-800">
                <span className="font-bold">Warning:</span> This action will modify multiple student
                records in the background. Ensure you have confirmed all scores for this term before
                proceeding.
              </p>
            </div>
            <Button type="submit" className="w-full" disabled={autoPromoteMutation.isPending}>
              {autoPromoteMutation.isPending ? 'Starting Engine...' : 'Initialize Autopilot'}
            </Button>
          </form>
        </div>
      </Modal>
      <IssueLoginsModal
        isOpen={showLogins}
        onClose={() => setShowLogins(false)}
        classes={classes}
        schoolName={schoolName}
      />
      <ResetPasswordResult
        slip={resetSlip}
        schoolName={schoolName}
        onClose={() => setResetSlip(null)}
      />
    </div>
  );
};
