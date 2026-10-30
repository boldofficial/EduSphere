import React, { useState } from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  BookOpen,
  GraduationCap,
  Layers,
  Library,
  Plus,
  Search,
  Settings2,
  BookOpenCheck,
  Trash2,
  User,
} from 'lucide-react';
import * as Types from '@/lib/types';
import * as Utils from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Select } from '@/components/ui/select';
import { Modal } from '@/components/ui/modal';
import { useToast } from '@/components/providers/toast-provider';
import { useConfirm } from '@/components/ui/confirm-dialog';
import { PageHeader } from '@/components/ui/page-header';
import { useSchoolStructure } from '@/lib/hooks/use-school-structure';

const REPORT_LABEL: Record<string, string> = {
  numeric: 'Scores',
  early_years: 'Early years',
  hybrid: 'Scores + narrative',
};

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');
}

function SummaryTile({
  label,
  value,
  tone = 'default',
}: {
  label: string;
  value: number;
  tone?: 'default' | 'warning' | 'success';
}) {
  const color =
    tone === 'warning'
      ? 'text-warning-700'
      : tone === 'success'
        ? 'text-success-700'
        : 'text-gray-900';
  return (
    <div className="rounded-card border border-gray-100 bg-white px-4 py-3 shadow-card">
      <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">{label}</p>
      <p className={`mt-1 text-2xl font-black ${color}`}>{value}</p>
    </div>
  );
}

interface ClassesViewProps {
  classes: Types.Class[];
  teachers: Types.Teacher[];
  onUpdate: (c: Types.Class) => Promise<void>;
  onCreate?: (c: Types.Class) => Promise<void>;
  onDelete?: (id: string) => Promise<void>;
}

export const ClassesView: React.FC<ClassesViewProps> = ({
  classes,
  teachers,
  onUpdate,
  onCreate,
  onDelete,
}) => {
  const confirm = useConfirm();
  const [editingClass, setEditingClass] = useState<Types.Class | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [searchSubject, setSearchSubject] = useState('');
  const [newSubject, setNewSubject] = useState('');
  const { addToast } = useToast();
  const { data: structure } = useSchoolStructure();

  // ... existing presets ...
  const allKnownSubjects = Array.from(
    new Set([
      ...Utils.PRESET_PRESCHOOL_SUBJECTS,
      ...Utils.PRESET_PRIMARY_SUBJECTS,
      ...Utils.PRESET_JUNIOR_SEC_SUBJECTS,
      ...Utils.PRESET_SSS_SCIENCE_SUBJECTS,
      ...Utils.PRESET_SSS_ART_SUBJECTS,
      ...Utils.PRESET_SSS_COMMERCE_SUBJECTS,
      'French',
      'Music',
      'Phonics',
      'Handwriting',
      'Diction',
      'Home Economics',
      'Agricultural Science',
    ])
  ).sort();

  const handleEdit = (cls: Types.Class) => {
    const currentSubjects = cls.subjects ?? Utils.getSubjectsForClass(cls);
    setEditingClass({ ...cls, subjects: currentSubjects });
    setIsCreating(false);
  };

  const handleCreate = () => {
    setEditingClass({
      id: '', // Will be ignored/generated
      created_at: Date.now(),
      updated_at: Date.now(),
      name: '',
      category: 'Primary',
      report_mode: 'numeric',
      class_teacher_id: null,
      subjects: [],
    } as Types.Class);
    setIsCreating(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingClass) {
      if (isCreating && onCreate) {
        if (!editingClass.name) {
          addToast('Class name is required', 'error');
          return;
        }
        try {
          const newClass = {
            ...editingClass,
            id: Utils.generateId(),
            created_at: Date.now(),
            updated_at: Date.now(),
          };
          await onCreate(newClass);
          addToast('Class created successfully', 'success');
        } catch (error: any) {
          // Handle duplicate name error
          if (
            error.message?.includes('duplicate key') ||
            error.message?.includes('unique constraint')
          ) {
            addToast(`A class named "${editingClass.name}" already exists`, 'error');
          } else {
            addToast(`Failed to create class: ${error.message || 'Unknown error'}`, 'error');
          }
          return; // Don't close modal on error
        }
      } else {
        try {
          await onUpdate({ ...editingClass, updated_at: Date.now() });
          addToast('Class configuration updated', 'success');
        } catch (error: any) {
          addToast(`Failed to update class: ${error.message || 'Unknown error'}`, 'error');
          return;
        }
      }
      setEditingClass(null);
      setIsCreating(false);
    }
  };

  // ... existing toggle/apply/add logic ...
  const toggleSubject = (subj: string) => {
    if (!editingClass) return;
    const current = editingClass.subjects || [];
    if (current.includes(subj)) {
      setEditingClass({ ...editingClass, subjects: current.filter((s) => s !== subj) });
    } else {
      setEditingClass({ ...editingClass, subjects: [...current, subj] });
    }
  };

  const applyPreset = (
    type: 'nursery' | 'primary' | 'jss' | 'sss_sci' | 'sss_art' | 'sss_comm'
  ) => {
    if (!editingClass) return;
    let subjects: string[] = [];
    switch (type) {
      case 'nursery':
        subjects = Utils.PRESET_PRESCHOOL_SUBJECTS;
        break;
      case 'primary':
        subjects = Utils.PRESET_PRIMARY_SUBJECTS;
        break;
      case 'jss':
        subjects = Utils.PRESET_JUNIOR_SEC_SUBJECTS;
        break;
      case 'sss_sci':
        subjects = Utils.PRESET_SSS_SCIENCE_SUBJECTS;
        break;
      case 'sss_art':
        subjects = Utils.PRESET_SSS_ART_SUBJECTS;
        break;
      case 'sss_comm':
        subjects = Utils.PRESET_SSS_COMMERCE_SUBJECTS;
        break;
    }
    setEditingClass({ ...editingClass, subjects: [...subjects] });
  };

  const addCustomSubject = () => {
    if (!editingClass || !newSubject.trim()) return;
    const subj = newSubject.trim();
    const current = editingClass.subjects || [];
    if (!current.includes(subj)) {
      setEditingClass({ ...editingClass, subjects: [...current, subj] });
      addToast(`Added ${subj}`, 'success');
    }
    setNewSubject('');
  };

  const handleSelectAllFiltered = () => {
    if (!editingClass) return;
    const current = editingClass.subjects || [];
    const filteredToAdd = filteredPool.filter((s) => !current.includes(s));

    if (filteredToAdd.length === 0 && filteredPool.length > 0) {
      // If all filtered are already selected, unselect all filtered
      setEditingClass({
        ...editingClass,
        subjects: current.filter((s) => !filteredPool.includes(s)),
      });
    } else {
      setEditingClass({ ...editingClass, subjects: [...current, ...filteredToAdd] });
    }
  };

  const handleDelete = async (cls: Types.Class) => {
    if (!onDelete) return;
    if (
      await confirm(
        `Are you sure you want to delete ${cls.name}? This will remove all students and records associated with this class.`
      )
    ) {
      try {
        await onDelete(cls.id);
        addToast('Class deleted successfully', 'success');
      } catch (error: any) {
        addToast(`Failed to delete class: ${error.message || 'Unknown error'}`, 'error');
      }
    }
  };

  const activeSubjects = editingClass?.subjects || [];
  const filteredPool = allKnownSubjects.filter((s) =>
    s.toLowerCase().includes(searchSubject.toLowerCase())
  );

  // Group classes by school section, in promotion order (the API sorts by level).
  const sectionNames = new Map((structure?.sections ?? []).map((sec) => [sec.id, sec.name]));
  const groups: { key: string; title: string; classes: Types.Class[] }[] = [];
  classes.forEach((cls) => {
    const sectionId = cls.section ?? null;
    const key = sectionId ? `section-${sectionId}` : 'unassigned';
    let group = groups.find((g) => g.key === key);
    if (!group) {
      group = {
        key,
        title: sectionId
          ? sectionNames.get(sectionId) || 'Section'
          : groups.length || classes.some((c) => c.section)
            ? 'Other classes'
            : 'All classes',
        classes: [],
      };
      groups.push(group);
    }
    group.classes.push(cls);
  });
  groups.sort((a, b) => (a.key === 'unassigned' ? 1 : b.key === 'unassigned' ? -1 : 0));

  const withoutTeacher = classes.filter((c) => !c.class_teacher_id).length;
  const withoutSubjects = classes.filter(
    (c) => (c.subjects ?? Utils.getSubjectsForClass(c)).length === 0
  ).length;
  const nameOf = (id?: string | number | null) =>
    classes.find((c) => String(c.id) === String(id))?.name;

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Academics"
        title="Classes & Subjects"
        description="Assign class teachers and choose the subjects each class takes."
        actions={
          <div className="flex flex-wrap gap-2">
            <Link
              href="/school-structure"
              className="inline-flex items-center gap-2 rounded-control border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
            >
              <Layers size={16} /> School structure
            </Link>
            {onCreate && (
              <Button onClick={handleCreate}>
                <Plus size={16} className="mr-1" /> Add class
              </Button>
            )}
          </div>
        }
      />

      {classes.length > 0 && (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <SummaryTile label="Classes" value={classes.length} />
          <SummaryTile
            label="Without a class teacher"
            value={withoutTeacher}
            tone={withoutTeacher ? 'warning' : 'success'}
          />
          <SummaryTile
            label="Without subjects"
            value={withoutSubjects}
            tone={withoutSubjects ? 'warning' : 'success'}
          />
        </div>
      )}

      {classes.length === 0 ? (
        <div className="rounded-card border border-dashed border-gray-300 bg-white px-6 py-14 text-center">
          <BookOpen className="mx-auto mb-3 h-10 w-10 text-gray-300" />
          <h3 className="text-lg font-bold text-gray-900">No classes yet</h3>
          <p className="mx-auto mt-1 max-w-md text-sm text-gray-500">
            Set up your school structure to create all your classes, arms and subjects in one go, or
            add a single class.
          </p>
          <div className="mt-5 flex flex-wrap justify-center gap-3">
            <Link
              href="/school-structure"
              className="inline-flex items-center gap-2 rounded-control bg-brand-600 px-4 py-2 text-sm font-bold text-white hover:bg-brand-700"
            >
              <Layers size={16} /> Set up school structure
            </Link>
            {onCreate && (
              <Button onClick={handleCreate} variant="outline">
                Add a class
              </Button>
            )}
          </div>
        </div>
      ) : (
        groups.map((group) => (
          <section key={group.key} className="space-y-3">
            <div className="flex items-baseline justify-between gap-3">
              <h2 className="text-sm font-bold uppercase tracking-wide text-gray-500">
                {group.title}
              </h2>
              <span className="text-xs text-gray-400">
                {group.classes.length} class{group.classes.length === 1 ? '' : 'es'}
              </span>
            </div>
            <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {group.classes.map((c) => {
                const teacher = teachers.find((t) => String(t.id) === String(c.class_teacher_id));
                const subjectCount = (c.subjects ?? Utils.getSubjectsForClass(c)).length;
                const nextName = nameOf(c.next_class);
                return (
                  <li key={c.id} className="min-w-0">
                    <article className="flex h-full min-w-0 flex-col rounded-card border border-gray-100 bg-white shadow-card transition hover:border-brand-200 hover:shadow-raised">
                      <div className="min-w-0 flex-1 p-4">
                        <div className="flex min-w-0 items-start justify-between gap-3">
                          <div className="min-w-0">
                            <h3
                              className="truncate text-base font-bold text-gray-900"
                              title={c.name}
                            >
                              {c.name}
                            </h3>
                            <p className="mt-0.5 truncate text-xs text-gray-500">
                              {REPORT_LABEL[c.report_mode || 'numeric']} · {subjectCount} subject
                              {subjectCount === 1 ? '' : 's'}
                            </p>
                          </div>
                          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-control bg-brand-50 text-brand-600">
                            <BookOpen size={18} />
                          </span>
                        </div>

                        <div className="mt-4 flex min-w-0 items-center gap-2.5">
                          {teacher ? (
                            <>
                              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-600 text-xs font-bold text-white">
                                {initials(teacher.name)}
                              </span>
                              <span className="min-w-0">
                                <span className="block text-xs text-gray-500">Class teacher</span>
                                <span className="block truncate text-sm font-semibold text-gray-800">
                                  {teacher.name}
                                </span>
                              </span>
                            </>
                          ) : (
                            <>
                              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-dashed border-gray-300 text-gray-400">
                                <User size={14} />
                              </span>
                              <button
                                type="button"
                                onClick={() => handleEdit(c)}
                                className="text-sm font-semibold text-brand-700 hover:underline"
                              >
                                Assign class teacher
                              </button>
                            </>
                          )}
                        </div>

                        <p className="mt-3 flex min-w-0 items-center gap-1.5 text-xs text-gray-500">
                          {c.is_graduation_class ? (
                            <>
                              <GraduationCap size={14} className="shrink-0 text-success-600" />
                              <span className="truncate">Final class: students graduate</span>
                            </>
                          ) : nextName ? (
                            <>
                              <ArrowRight size={14} className="shrink-0 text-gray-400" />
                              <span className="truncate">Promotes to {nextName}</span>
                            </>
                          ) : (
                            <>
                              <ArrowRight size={14} className="shrink-0 text-gray-300" />
                              <span className="truncate text-gray-400">No promotion set</span>
                            </>
                          )}
                        </p>
                      </div>

                      <div className="flex items-center justify-between gap-2 border-t border-gray-100 px-4 py-2.5">
                        <div className="flex min-w-0 items-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleEdit(c)}
                            className="inline-flex items-center gap-1.5 rounded-control px-2 py-1 text-sm font-semibold text-brand-700 hover:bg-brand-50"
                          >
                            <Settings2 size={15} /> Configure
                          </button>
                          <Link
                            href={`/classes/subjects?class=${c.id}`}
                            className="inline-flex items-center gap-1.5 rounded-control px-2 py-1 text-sm font-semibold text-gray-600 hover:bg-gray-50"
                          >
                            <BookOpenCheck size={15} /> Subjects
                          </Link>
                        </div>
                        {onDelete && (
                          <button
                            type="button"
                            onClick={() => handleDelete(c)}
                            aria-label={`Delete ${c.name}`}
                            title="Delete class"
                            className="rounded-control p-1.5 text-gray-400 transition-colors hover:bg-danger-50 hover:text-danger-600"
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                      </div>
                    </article>
                  </li>
                );
              })}
            </ul>
          </section>
        ))
      )}

      <Modal
        isOpen={!!editingClass}
        onClose={() => setEditingClass(null)}
        title={isCreating ? 'Create New Class' : `Configure ${editingClass?.name}`}
        size="lg"
      >
        {editingClass && (
          <form onSubmit={handleSave} className="space-y-6">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Class Name</label>
                <input
                  className="w-full rounded-md border border-gray-300 p-2 focus:ring-brand-500 focus:outline-none"
                  placeholder="e.g. Year 1 Gold"
                  value={editingClass.name}
                  onChange={(e) => setEditingClass({ ...editingClass, name: e.target.value })}
                  required
                />
              </div>
              <Select
                label="Class Category"
                value={editingClass.category || 'Primary'}
                onChange={(e) => {
                  const category = e.target.value;
                  const autoMode =
                    category === 'Nursery' ? 'early_years' : editingClass.report_mode || 'numeric';
                  setEditingClass({ ...editingClass, category, report_mode: autoMode });
                }}
              >
                <option value="Nursery">Nursery/Pre-School</option>
                <option value="Primary">Primary</option>
                <option value="JSS">Junior Secondary (JSS)</option>
                <option value="SSS_Science">Senior Secondary (Science)</option>
                <option value="SSS_Art">Senior Secondary (Art)</option>
                <option value="SSS_Commerce">Senior Secondary (Commerce)</option>
                <option value="Other">Other/General</option>
              </Select>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
              <Select
                label="Report Mode"
                value={editingClass.report_mode || 'numeric'}
                onChange={(e) =>
                  setEditingClass({
                    ...editingClass,
                    report_mode: e.target.value as Types.Class['report_mode'],
                  })
                }
              >
                <option value="numeric">Numeric Scores</option>
                <option value="early_years">Early Years Narrative</option>
                <option value="hybrid">Hybrid (Scores + Narrative)</option>
              </Select>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
              <Select
                label="Class Teacher"
                value={editingClass.class_teacher_id || ''}
                onChange={(e) =>
                  setEditingClass({ ...editingClass, class_teacher_id: e.target.value || null })
                }
              >
                <option value="">-- Select Teacher --</option>
                {teachers.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </Select>
            </div>
            {/* ... subjects UI ... */}
            <div>
              <div className="flex justify-between items-center mb-4">
                <h4 className="font-bold text-gray-900 flex items-center gap-2">
                  <Library className="h-4 w-4" /> Assigned Subjects
                </h4>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={handleSelectAllFiltered}
                    className="text-xs bg-brand-100 text-brand-700 px-2 py-1 rounded hover:bg-brand-200 font-medium"
                  >
                    {filteredPool.every((s) => activeSubjects.includes(s))
                      ? 'Unselect Filtered'
                      : 'Select Filtered'}
                  </button>
                  <button
                    type="button"
                    onClick={() => applyPreset('nursery')}
                    className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded hover:bg-purple-200 font-bold uppercase tracking-wider transition-colors"
                  >
                    Nursery
                  </button>
                  <button
                    type="button"
                    onClick={() => applyPreset('primary')}
                    className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded hover:bg-blue-200 font-bold uppercase tracking-wider transition-colors"
                  >
                    Primary
                  </button>
                  <button
                    type="button"
                    onClick={() => applyPreset('jss')}
                    className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded hover:bg-green-200 font-bold uppercase tracking-wider transition-colors"
                  >
                    JSS
                  </button>
                  <button
                    type="button"
                    onClick={() => applyPreset('sss_sci')}
                    className="text-xs bg-amber-100 text-amber-700 px-2 py-1 rounded hover:bg-amber-200 font-bold uppercase tracking-wider transition-colors"
                  >
                    SSS Science
                  </button>
                  <button
                    type="button"
                    onClick={() => applyPreset('sss_art')}
                    className="text-xs bg-indigo-100 text-indigo-700 px-2 py-1 rounded hover:bg-indigo-200 font-bold uppercase tracking-wider transition-colors"
                  >
                    SSS Art
                  </button>
                  <button
                    type="button"
                    onClick={() => applyPreset('sss_comm')}
                    className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded hover:bg-gray-200 font-bold uppercase tracking-wider transition-colors"
                  >
                    SSS Commerce
                  </button>
                </div>
              </div>
              <div className="flex gap-2 mb-4">
                <input
                  className="flex-1 h-9 rounded-md border border-gray-300 px-3 text-sm focus:ring-brand-500 focus:outline-none"
                  placeholder="Add custom subject..."
                  value={newSubject}
                  onChange={(e) => setNewSubject(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addCustomSubject();
                    }
                  }}
                />
                <Button type="button" size="sm" onClick={addCustomSubject}>
                  Add
                </Button>
              </div>
              <div className="mb-2 relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
                <input
                  className="w-full h-9 pl-9 rounded-md border border-gray-300 text-sm focus:ring-brand-500 focus:outline-none"
                  placeholder="Filter subjects..."
                  value={searchSubject}
                  onChange={(e) => setSearchSubject(e.target.value)}
                />
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-[300px] overflow-y-auto border rounded-md p-4 bg-gray-50/50">
                {filteredPool.map((subj) => {
                  const isActive = activeSubjects.includes(subj);
                  return (
                    <label
                      key={subj}
                      className={`flex items-center gap-2 p-2 rounded cursor-pointer transition-colors text-sm ${isActive ? 'bg-brand-50 text-brand-900 font-medium border border-brand-200' : 'hover:bg-gray-100 text-gray-600 border border-transparent'}`}
                    >
                      <input
                        type="checkbox"
                        className="rounded text-brand-600 focus:ring-brand-500 h-4 w-4"
                        checked={isActive}
                        onChange={() => toggleSubject(subj)}
                      />
                      {subj}
                    </label>
                  );
                })}
                {activeSubjects
                  .filter(
                    (s) =>
                      !allKnownSubjects.includes(s) &&
                      !s.toLowerCase().includes(searchSubject.toLowerCase())
                  )
                  .map((subj) => (
                    <label
                      key={subj}
                      className="flex items-center gap-2 p-2 rounded cursor-pointer transition-colors text-sm bg-brand-50 text-brand-900 font-medium border border-brand-200"
                    >
                      <input
                        type="checkbox"
                        className="rounded text-brand-600 focus:ring-brand-500 h-4 w-4"
                        checked={true}
                        onChange={() => toggleSubject(subj)}
                      />
                      {subj} (Custom)
                    </label>
                  ))}
              </div>
              <div className="mt-2 text-right text-xs text-gray-500">
                {activeSubjects.length} subjects selected
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button type="button" variant="secondary" onClick={() => setEditingClass(null)}>
                Cancel
              </Button>
              <Button type="submit">{isCreating ? 'Create Class' : 'Save Changes'}</Button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
};
