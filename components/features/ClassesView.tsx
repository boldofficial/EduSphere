import React, { useState } from 'react';
import { BookOpen, User, Library, Search, Trash2 } from 'lucide-react';
import * as Types from '@/lib/types';
import * as Utils from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Select } from '@/components/ui/select';
import { Modal } from '@/components/ui/modal';
import { useToast } from '@/components/providers/toast-provider';

interface ClassesViewProps {
    classes: Types.Class[];
    teachers: Types.Teacher[];
    onUpdate: (c: Types.Class) => void;
    onCreate?: (c: Types.Class) => Promise<void>;
    onDelete?: (id: string) => Promise<void>;
}

export const ClassesView: React.FC<ClassesViewProps> = ({ classes, teachers, onUpdate, onCreate, onDelete }) => {
    const [editingClass, setEditingClass] = useState<Types.Class | null>(null);
    const [isCreating, setIsCreating] = useState(false);
    const [searchSubject, setSearchSubject] = useState('');
    const [newSubject, setNewSubject] = useState('');
    const { addToast } = useToast();

    // ... existing presets ...
    const allKnownSubjects = Array.from(new Set([
        ...Utils.PRESET_PRESCHOOL_SUBJECTS,
        ...Utils.PRESET_PRIMARY_SUBJECTS,
        'French', 'Music', 'Phonics', 'Handwriting', 'Diction', 'Home Economics', 'Agricultural Science',
        'History', 'Geography', 'Literature', 'Coding/Robotics'
    ])).sort();

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
            class_teacher_id: null,
            subjects: []
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
                    const newClass = { ...editingClass, id: Utils.generateId(), created_at: Date.now(), updated_at: Date.now() };
                    await onCreate(newClass);
                    addToast('Class created successfully', 'success');
                } catch (error: any) {
                    // Handle duplicate name error
                    if (error.message?.includes('duplicate key') || error.message?.includes('unique constraint')) {
                        addToast(`A class named "${editingClass.name}" already exists`, 'error');
                    } else {
                        addToast(`Failed to create class: ${error.message || 'Unknown error'}`, 'error');
                    }
                    return; // Don't close modal on error
                }
            } else {
                try {
                    onUpdate({ ...editingClass, updated_at: Date.now() });
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
            setEditingClass({ ...editingClass, subjects: current.filter(s => s !== subj) });
        } else {
            setEditingClass({ ...editingClass, subjects: [...current, subj] });
        }
    };

    const applyPreset = (type: 'nursery' | 'primary') => {
        if (!editingClass) return;
        const subjects = type === 'nursery' ? Utils.PRESET_PRESCHOOL_SUBJECTS : Utils.PRESET_PRIMARY_SUBJECTS;
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
        const filteredToAdd = filteredPool.filter(s => !current.includes(s));

        if (filteredToAdd.length === 0 && filteredPool.length > 0) {
            // If all filtered are already selected, unselect all filtered
            setEditingClass({ ...editingClass, subjects: current.filter(s => !filteredPool.includes(s)) });
        } else {
            setEditingClass({ ...editingClass, subjects: [...current, ...filteredToAdd] });
        }
    };

    const handleDelete = async (cls: Types.Class) => {
        if (!onDelete) return;
        if (confirm(`Are you sure you want to delete ${cls.name}? This will remove all students and records associated with this class.`)) {
            try {
                await onDelete(cls.id);
                addToast('Class deleted successfully', 'success');
            } catch (error: any) {
                addToast(`Failed to delete class: ${error.message || 'Unknown error'}`, 'error');
            }
        }
    };

    const activeSubjects = editingClass?.subjects || [];
    const filteredPool = allKnownSubjects.filter(s => s.toLowerCase().includes(searchSubject.toLowerCase()));

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Class & Subject Configuration</h1>
                    <p className="text-gray-500">Assign teachers and manage subjects for each class.</p>
                </div>
                {onCreate && (
                    <Button onClick={handleCreate}>Add Class</Button>
                )}
            </div>
            {classes.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-lg border border-dashed">
                    <BookOpen className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                    <h3 className="text-lg font-medium text-gray-900">No Classes Found</h3>
                    <p className="text-gray-500 mb-4">Get started by creating your first class.</p>
                    <div className="flex justify-center gap-3">
                        {onCreate && <Button onClick={handleCreate} variant="outline">Create Class</Button>}
                    </div>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {classes.map(c => {
                        const teacher = teachers.find(t => String(t.id) === String(c.class_teacher_id));
                        const subjectCount = (c.subjects ?? Utils.getSubjectsForClass(c)).length;
                        return (
                            <Card key={c.id} className="hover:border-brand-400 transition-all cursor-pointer group" >
                                <div className="flex flex-col h-full justify-between">
                                    <div>
                                        <div className="flex justify-between items-start mb-2">
                                            <h3 className="font-bold text-xl text-gray-800">{c.name}</h3>
                                            <div className="bg-gray-100 p-2 rounded-full group-hover:bg-brand-50 transition-colors"><BookOpen className="h-5 w-5 text-gray-500 group-hover:text-brand-600" /></div>
                                        </div>
                                        <div className="text-sm text-gray-600 mb-4 flex items-center gap-2">
                                            <User className="h-4 w-4 text-gray-400" />
                                            {teacher ? <span className="font-medium text-brand-700">{teacher.name}</span> : <span className="italic text-gray-400">No Class Teacher</span>}
                                        </div>
                                    </div>
                                    <div className="border-t pt-4 flex justify-between items-center">
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs font-medium bg-gray-100 px-2 py-1 rounded text-gray-600">{subjectCount} Subjects</span>
                                            {onDelete && (
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); handleDelete(c); }}
                                                    className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                                                    title="Delete Class"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </button>
                                            )}
                                        </div>
                                        <Button size="sm" variant="secondary" onClick={() => handleEdit(c)}>Configure</Button>
                                    </div>
                                </div>
                            </Card>
                        );
                    })}
                </div>
            )}

            <Modal isOpen={!!editingClass} onClose={() => setEditingClass(null)} title={isCreating ? "Create New Class" : `Configure ${editingClass?.name}`} size="lg">
                {editingClass && (
                    <form onSubmit={handleSave} className="space-y-6">
                        {isCreating && (
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Class Name</label>
                                <input
                                    className="w-full rounded-md border border-gray-300 p-2 focus:ring-brand-500 focus:outline-none"
                                    placeholder="e.g. Year 1 Gold"
                                    value={editingClass.name}
                                    onChange={e => setEditingClass({ ...editingClass, name: e.target.value })}
                                    required
                                />
                            </div>
                        )}
                        <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
                            <Select label="Class Teacher" value={editingClass.class_teacher_id || ''} onChange={e => setEditingClass({ ...editingClass, class_teacher_id: e.target.value || null })}>
                                <option value="">-- Select Teacher --</option>
                                <option value="unassigned">No Teacher</option>
                                {teachers.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                            </Select>
                        </div>
                        {/* ... subjects UI ... */}
                        <div>
                            <div className="flex justify-between items-center mb-4">
                                <h4 className="font-bold text-gray-900 flex items-center gap-2"><Library className="h-4 w-4" /> Assigned Subjects</h4>
                                <div className="flex gap-2">
                                    <button type="button" onClick={handleSelectAllFiltered} className="text-xs bg-brand-100 text-brand-700 px-2 py-1 rounded hover:bg-brand-200 font-medium">
                                        {filteredPool.every(s => activeSubjects.includes(s)) ? 'Unselect Filtered' : 'Select Filtered'}
                                    </button>
                                    <button type="button" onClick={() => applyPreset('nursery')} className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded hover:bg-purple-200 font-medium">Nursery Preset</button>
                                    <button type="button" onClick={() => applyPreset('primary')} className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded hover:bg-blue-200 font-medium">Primary Preset</button>
                                </div>
                            </div>
                            <div className="flex gap-2 mb-4">
                                <input className="flex-1 h-9 rounded-md border border-gray-300 px-3 text-sm focus:ring-brand-500 focus:outline-none" placeholder="Add custom subject..." value={newSubject} onChange={e => setNewSubject(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addCustomSubject(); } }} />
                                <Button type="button" size="sm" onClick={addCustomSubject}>Add</Button>
                            </div>
                            <div className="mb-2 relative">
                                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
                                <input className="w-full h-9 pl-9 rounded-md border border-gray-300 text-sm focus:ring-brand-500 focus:outline-none" placeholder="Filter subjects..." value={searchSubject} onChange={e => setSearchSubject(e.target.value)} />
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-[300px] overflow-y-auto border rounded-md p-4 bg-gray-50/50">
                                {filteredPool.map(subj => {
                                    const isActive = activeSubjects.includes(subj);
                                    return (
                                        <label key={subj} className={`flex items-center gap-2 p-2 rounded cursor-pointer transition-colors text-sm ${isActive ? 'bg-brand-50 text-brand-900 font-medium border border-brand-200' : 'hover:bg-gray-100 text-gray-600 border border-transparent'}`}>
                                            <input type="checkbox" className="rounded text-brand-600 focus:ring-brand-500 h-4 w-4" checked={isActive} onChange={() => toggleSubject(subj)} />
                                            {subj}
                                        </label>
                                    );
                                })}
                                {activeSubjects.filter(s => !allKnownSubjects.includes(s) && !s.toLowerCase().includes(searchSubject.toLowerCase())).map(subj => (
                                    <label key={subj} className="flex items-center gap-2 p-2 rounded cursor-pointer transition-colors text-sm bg-brand-50 text-brand-900 font-medium border border-brand-200">
                                        <input type="checkbox" className="rounded text-brand-600 focus:ring-brand-500 h-4 w-4" checked={true} onChange={() => toggleSubject(subj)} />
                                        {subj} (Custom)
                                    </label>
                                ))}
                            </div>
                            <div className="mt-2 text-right text-xs text-gray-500">{activeSubjects.length} subjects selected</div>
                        </div>
                        <div className="flex justify-end gap-3 pt-4 border-t">
                            <Button type="button" variant="secondary" onClick={() => setEditingClass(null)}>Cancel</Button>
                            <Button type="submit">{isCreating ? "Create Class" : "Save Changes"}</Button>
                        </div>
                    </form>
                )}
            </Modal>
        </div>
    );
};
