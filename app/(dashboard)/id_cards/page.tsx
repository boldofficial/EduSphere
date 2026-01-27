'use client';
import { IDCardView } from '@/components/features/IDCardView';
import { useStudents, useClasses, useSettings, useTeachers } from '@/lib/hooks/use-data';
import * as Utils from '@/lib/utils';

export default function IDCardsPage() {
    const { data: students = [] } = useStudents();
    const { data: classes = [] } = useClasses();
    const { data: settings = Utils.INITIAL_SETTINGS } = useSettings();
    const { data: teachers = [] } = useTeachers();

    return <IDCardView students={students} classes={classes} settings={settings} teachers={teachers} />;
}
