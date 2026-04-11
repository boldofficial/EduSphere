'use client';
import { useMemo, useState, useEffect } from 'react';
import { useSchoolStore } from '@/lib/store';
import { AttendanceView } from '@/components/features/AttendanceView';
import { StudentAttendanceView } from '@/components/features/attendance/StudentAttendanceView';
import {
    useStudents, useClasses, useAttendance, useSettings,
    useCreateAttendance, useUpdateAttendance, usePaginatedStudents
} from '@/lib/hooks/use-data';
import * as Utils from '@/lib/utils';
import * as Types from '@/lib/types';

export default function AttendancePage() {
    const { currentRole, currentUser } = useSchoolStore();
    const isStudentOrParent = currentRole === 'student' || currentRole === 'parent';

    // Master State for Filtering
    const [selectedClass, setSelectedClass] = useState('');
    const [date, setDate] = useState(Utils.getTodayString());

    // Data Hooks
    const { data: classes = [] } = useClasses();
    const { data: settings = Utils.INITIAL_SETTINGS } = useSettings();
    const { data: linkedStudents = [] } = useStudents(isStudentOrParent);

    // Initialize selected class
    useEffect(() => {
        if (!selectedClass && classes.length > 0) {
            setSelectedClass(classes[0].id);
        }
    }, [classes, selectedClass]);

    // Scaling Optimization: Only fetch students for the selected class
    const { data: studentResponse, isLoading: studentsLoading } = usePaginatedStudents(
        1, 100, '', selectedClass, !!selectedClass
    );
    const activeStudents = studentResponse?.results || [];

    // Student/Parent gets period history. Staff/Admin gets focused register for selected class/date.
    const { data: attendance = [], isLoading: attendanceLoading } = useAttendance(
        isStudentOrParent
            ? { include_all_periods: true }
            : {
                class_id: selectedClass,
                date,
                session: settings.current_session,
                term: settings.current_term,
            },
    );

    // Mutations
    const { mutate: createAttendance } = useCreateAttendance();
    const { mutate: updateAttendance } = useUpdateAttendance();

    const handleUpsertAttendance = (att: Types.Attendance) => {
        const existing = attendance.find(a => a.id === att.id) || attendance[0];
        if (existing) {
            updateAttendance({ id: existing.id, updates: att });
        } else {
            createAttendance(att);
        }
    };

    // Get student for student/parent role
    const student = useMemo(() => {
        if (!isStudentOrParent) return null;
        const profileId = currentUser?.profile_id || currentUser?.student_id;

        if (profileId) {
            const byId = linkedStudents.find((s: Types.Student) => s.id === profileId);
            if (byId) return byId;
        }

        if (currentRole === 'parent' && currentUser?.email) {
            const byParentEmail = linkedStudents.find((s: Types.Student) => s.parent_email === currentUser.email);
            if (byParentEmail) return byParentEmail;
        }

        return linkedStudents[0] || null;
    }, [isStudentOrParent, linkedStudents, currentRole, currentUser]);

    // Render student-specific view for student/parent roles
    if (isStudentOrParent && student) {
        return <StudentAttendanceView student={student} attendance={attendance} settings={settings} />;
    }

    if (isStudentOrParent && !student) {
        return <div className="p-8 text-center text-gray-500">No linked student profile found.</div>;
    }

    return (
        <AttendanceView
            students={activeStudents}
            classes={classes}
            attendance={attendance}
            settings={settings}
            onSave={handleUpsertAttendance}
            selectedClass={selectedClass}
            setSelectedClass={setSelectedClass}
            date={date}
            setDate={setDate}
            isLoading={studentsLoading || attendanceLoading}
        />
    );
}
