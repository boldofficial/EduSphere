'use client';
import { useMemo } from 'react';
import { useSchoolStore } from '@/lib/store';
import { AttendanceView } from '@/components/features/AttendanceView';
import { StudentAttendanceView } from '@/components/features/attendance/StudentAttendanceView';
import {
    useStudents, useClasses, useAttendance, useSettings,
    useCreateAttendance, useUpdateAttendance
} from '@/lib/hooks/use-data';
import * as Utils from '@/lib/utils';
import * as Types from '@/lib/types';

export default function AttendancePage() {
    const { currentRole, currentUser } = useSchoolStore();

    // Data Hooks
    const { data: students = [] } = useStudents();
    const { data: classes = [] } = useClasses();
    const { data: attendance = [] } = useAttendance();
    const { data: settings = Utils.INITIAL_SETTINGS } = useSettings();

    // Mutations
    const { mutate: createAttendance } = useCreateAttendance();
    const { mutate: updateAttendance } = useUpdateAttendance();

    const handleUpsertAttendance = (att: Types.Attendance) => {
        const existing = attendance.find(a => a.id === att.id);
        if (existing) {
            updateAttendance({ id: att.id, updates: att });
        } else {
            createAttendance(att);
        }
    };

    // Check if student/parent role
    const isStudentOrParent = currentRole === 'student' || currentRole === 'parent';

    // Get student for student/parent role
    const student = useMemo(() => {
        if (!isStudentOrParent) return null;
        const studentId = currentUser?.student_id || students[0]?.id;
        return students.find((s: Types.Student) => s.id === studentId) || students[0];
    }, [isStudentOrParent, currentUser, students]);

    // Render student-specific view for student/parent roles
    if (isStudentOrParent && student) {
        return (
            <StudentAttendanceView
                student={student}
                attendance={attendance}
                settings={settings}
            />
        );
    }

    return <AttendanceView students={students} classes={classes} attendance={attendance} settings={settings} onSave={handleUpsertAttendance} />;
}
