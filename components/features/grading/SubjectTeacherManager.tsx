'use client';

import React, { useState } from 'react';
import { Plus, Trash2, UserCheck, BookOpen } from 'lucide-react';
import { useSchoolStore } from '@/lib/store';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/select';
import { useToast } from '@/components/providers/toast-provider';
import * as Utils from '@/lib/utils';
import {
    useClasses, useTeachers, useSubjectTeachers, useSettings,
    useCreateSubjectTeacher, useDeleteSubjectTeacher
} from '@/lib/hooks/use-data';

export const SubjectTeacherManager: React.FC = () => {
    // Auth
    const { addToast } = useToast();

    // Data Hooks
    const { data: classes = [] } = useClasses();
    const { data: teachers = [] } = useTeachers();
    const { data: subjectTeachers = [] } = useSubjectTeachers();
    const { data: settings = Utils.INITIAL_SETTINGS } = useSettings();

    // Mutations
    const { mutate: addSubjectTeacher } = useCreateSubjectTeacher();
    const { mutate: removeSubjectTeacher } = useDeleteSubjectTeacher();

    const [selectedClass, setSelectedClass] = useState(classes[0]?.id || '');
    const [selectedTeacher, setSelectedTeacher] = useState('');
    const [selectedSubject, setSelectedSubject] = useState('');

    const currentClass = classes.find(c => c.id === selectedClass);
    const classSubjects = Utils.getSubjectsForClass(currentClass);

    // Get assignments for current class
    const classAssignments = subjectTeachers.filter(
        st => st.class_id === selectedClass && st.session === settings.current_session
    );

    const handleAddAssignment = () => {
        if (!selectedTeacher || !selectedSubject) {
            addToast('Please select both a teacher and a subject', 'warning');
            return;
        }

        // Check if assignment already exists
        const exists = classAssignments.some(
            a => a.subject === selectedSubject
        );
        if (exists) {
            addToast('This subject is already assigned to a teacher', 'error');
            return;
        }

        addSubjectTeacher({
            id: Utils.generateId(),
            teacher_id: selectedTeacher,
            class_id: selectedClass,
            subject: selectedSubject,
            session: settings.current_session,
            created_at: Date.now(),
            updated_at: Date.now()
        });

        addToast('Subject-teacher assignment added', 'success');
        setSelectedSubject('');
        setSelectedTeacher('');
    };

    const getTeacherName = (teacherId: string) => {
        return teachers.find(t => t.id === teacherId)?.name || 'Unknown';
    };

    // Get subjects that are not yet assigned
    const unassignedSubjects = classSubjects.filter(
        subj => !classAssignments.some(a => a.subject === subj)
    );

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-xl font-bold text-gray-900">Subject-Teacher Assignments</h2>
                    <p className="text-sm text-gray-500 mt-1">Assign teachers to subjects for each class</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Panel: Assignment Form */}
                <Card className="lg:col-span-1">
                    <div className="p-4 space-y-4">
                        <h3 className="font-semibold text-gray-700 flex items-center gap-2">
                            <Plus className="h-4 w-4" />
                            New Assignment
                        </h3>

                        <Select
                            label="Class"
                            value={selectedClass}
                            onChange={e => setSelectedClass(e.target.value)}
                        >
                            {classes.map(c => (
                                <option key={c.id} value={c.id}>{c.name}</option>
                            ))}
                        </Select>

                        <Select
                            label="Subject"
                            value={selectedSubject}
                            onChange={e => setSelectedSubject(e.target.value)}
                        >
                            <option value="">-- Select Subject --</option>
                            {unassignedSubjects.map(subj => (
                                <option key={subj} value={subj}>{subj}</option>
                            ))}
                        </Select>

                        <Select
                            label="Teacher"
                            value={selectedTeacher}
                            onChange={e => setSelectedTeacher(e.target.value)}
                        >
                            <option value="">-- Select Teacher --</option>
                            {teachers.map(t => (
                                <option key={t.id} value={t.id}>{t.name}</option>
                            ))}
                        </Select>

                        <Button
                            className="w-full"
                            onClick={handleAddAssignment}
                            disabled={!selectedTeacher || !selectedSubject}
                        >
                            <Plus className="h-4 w-4 mr-2" />
                            Add Assignment
                        </Button>
                    </div>
                </Card>

                {/* Right Panel: Current Assignments */}
                <Card className="lg:col-span-2">
                    <div className="p-4">
                        <h3 className="font-semibold text-gray-700 flex items-center gap-2 mb-4">
                            <UserCheck className="h-4 w-4" />
                            Current Assignments for {currentClass?.name || 'Class'}
                        </h3>

                        {classAssignments.length === 0 ? (
                            <div className="text-center py-12 text-gray-400">
                                <BookOpen className="h-12 w-12 mx-auto mb-3 opacity-50" />
                                <p>No subject-teacher assignments yet</p>
                                <p className="text-sm mt-1">Use the form on the left to add assignments</p>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {classAssignments.map(assignment => (
                                    <div
                                        key={assignment.id}
                                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border"
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className="h-10 w-10 bg-brand-100 rounded-lg flex items-center justify-center">
                                                <BookOpen className="h-5 w-5 text-brand-600" />
                                            </div>
                                            <div>
                                                <p className="font-medium text-gray-900">{assignment.subject}</p>
                                                <p className="text-sm text-gray-500">
                                                    Taught by: {getTeacherName(assignment.teacher_id)}
                                                </p>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => {
                                                removeSubjectTeacher(assignment.id);
                                                addToast('Assignment removed', 'info');
                                            }}
                                            className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </Card>
            </div>

            {/* Summary by Class */}
            <Card>
                <div className="p-4">
                    <h3 className="font-semibold text-gray-700 mb-4">Assignment Summary by Class</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {classes.map(cls => {
                            const assignments = subjectTeachers.filter(
                                st => st.class_id === cls.id && st.session === settings.current_session
                            );
                            const subjects = Utils.getSubjectsForClass(cls);
                            const coverage = subjects.length > 0
                                ? Math.round((assignments.length / subjects.length) * 100)
                                : 0;

                            return (
                                <div
                                    key={cls.id}
                                    className={`p-3 rounded-lg border cursor-pointer transition-colors ${selectedClass === cls.id
                                        ? 'bg-brand-50 border-brand-200'
                                        : 'bg-gray-50 hover:bg-gray-100'
                                        }`}
                                    onClick={() => setSelectedClass(cls.id)}
                                >
                                    <p className="font-medium text-gray-900">{cls.name}</p>
                                    <div className="flex items-center justify-between mt-2">
                                        <span className="text-xs text-gray-500">
                                            {assignments.length}/{subjects.length} subjects
                                        </span>
                                        <span className={`text-xs font-bold ${coverage >= 80 ? 'text-green-600' :
                                            coverage >= 50 ? 'text-yellow-600' : 'text-red-600'
                                            }`}>
                                            {coverage}%
                                        </span>
                                    </div>
                                    <div className="mt-2 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                                        <div
                                            className={`h-full rounded-full ${coverage >= 80 ? 'bg-green-500' :
                                                coverage >= 50 ? 'bg-yellow-500' : 'bg-red-500'
                                                }`}
                                            style={{ width: `${coverage}%` }}
                                        />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </Card>
        </div>
    );
};
