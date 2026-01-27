'use client';
import { BroadsheetView } from '@/components/features/BroadsheetView';
import { useStudents, useClasses, useScores, useSettings } from '@/lib/hooks/use-data';
import * as Utils from '@/lib/utils';

export default function BroadsheetPage() {
    const { data: students = [] } = useStudents();
    const { data: classes = [] } = useClasses();
    const { data: scores = [] } = useScores();
    const { data: settings = Utils.INITIAL_SETTINGS } = useSettings();

    return <BroadsheetView students={students} classes={classes} scores={scores} settings={settings} />;
}
