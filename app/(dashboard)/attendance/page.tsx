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

    // Master State for Filtering
    const [selectedClass, setSelectedClass] = useState('');
    const [date, setDate] = useState(Utils.getTodayString());

    // Data Hooks
    const { data: classes = [] } = useClasses();
    const { data: settings = Utils.INITIAL_SETTINGS } = useSettings();

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

    // Scaling Optimization: Only fetch attendance for the selected class and date
    const { data: attendance = [], isLoading: attendanceLoading } = useAttendance({
        class_id: selectedClass,
        date
    });

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

    // Check if student/parent role
    const isStudentOrParent = currentRole === 'student' || currentRole === 'parent';

    // Get student for student/parent role
    const student = useMemo(() => {
        if (!isStudentOrParent) return null;
        // In student/parent mode, we might need all students or just the linked one
        // For simplicity, we fallback to a full students fetch if needed, 
        // but here we can use currentUser info
        return null; // StudentAttendanceView handles its own fetching usually, or needs a single student
    }, [isStudentOrParent]);

    // Render student-specific view for student/parent roles
    if (isStudentOrParent) {
        // This section might need more work if the student isn't in 'activeStudents'
        // But StudentAttendanceView is supposed to show history for ONE student.
        return <div className="p-8 text-center text-gray-500">Student/Parent view loading...</div>;
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
