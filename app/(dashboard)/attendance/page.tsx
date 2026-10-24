'use client';
import { onlineManager } from '@tanstack/react-query';
import { isLocalId } from '@/lib/offline';
import { useMemo, useState } from 'react';
import { useSchoolStore } from '@/lib/store';
import { AttendanceView } from '@/components/features/AttendanceView';
import { StudentAttendanceView } from '@/components/features/attendance/StudentAttendanceView';
import {
  useStudents,
  useClasses,
  useAttendance,
  useSettings,
  useCreateAttendance,
  useUpdateAttendance,
  usePaginatedStudents,
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

  // Auto-select first class when classes load
  const resolvedSelectedClass = selectedClass || classes[0]?.id || '';

  // Scaling Optimization: Only fetch students for the selected class
  const { data: studentResponse, isLoading: studentsLoading } = usePaginatedStudents(
    1,
    100,
    '',
    resolvedSelectedClass,
    !!resolvedSelectedClass
  );
  const activeStudents = studentResponse?.results || [];

  // Student/Parent gets period history. Staff/Admin gets focused register for selected class/date.
  const { data: attendance = [], isLoading: attendanceLoading } = useAttendance(
    isStudentOrParent
      ? { include_all_periods: true }
      : {
          class_id: resolvedSelectedClass,
          date,
          session: settings.current_session,
          term: settings.current_term,
        }
  );

  // Mutations
  const { mutateAsync: createAttendance } = useCreateAttendance();
  const { mutateAsync: updateAttendance } = useUpdateAttendance();

  // Find the register for this class and day. Never fall back to another register: that used to
  // overwrite a different class's or day's attendance. The server also treats class + date as unique.
  const handleUpsertAttendance = async (att: Types.Attendance) => {
    const existing = attendance.find(
      (a) =>
        String(a.id) === String(att.id) ||
        (String(a.class_id) === String(att.class_id) && a.date === att.date)
    );
    const saving =
      existing && !isLocalId(existing.id)
        ? updateAttendance({ id: existing.id, updates: att })
        : createAttendance({ ...existing, ...att });
    // Offline the save waits on this device until the connection returns; don't keep the
    // teacher waiting for it.
    if (!onlineManager.isOnline()) {
      saving.catch(() => undefined);
      return 'queued' as const;
    }
    await saving;
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
      const byParentEmail = linkedStudents.find(
        (s: Types.Student) => s.parent_email === currentUser.email
      );
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
      selectedClass={String(resolvedSelectedClass)}
      setSelectedClass={setSelectedClass}
      date={date}
      setDate={setDate}
      isLoading={studentsLoading || attendanceLoading}
    />
  );
}
