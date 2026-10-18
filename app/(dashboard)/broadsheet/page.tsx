'use client';
import { BroadsheetView } from '@/components/features/BroadsheetView';
import { useStudents, useClasses, useScores, useSettings } from '@/lib/hooks/use-data';
import * as Utils from '@/lib/utils';

export default function BroadsheetPage() {
  const { data: students = [] } = useStudents();
  const { data: classes = [] } = useClasses();
  const { data: settings = Utils.INITIAL_SETTINGS, isSuccess: settingsLoaded } = useSettings();
  // The broadsheet shows the current term only.
  const { data: scores = [] } = useScores(
    { session: settings.current_session, term: settings.current_term },
    settingsLoaded
  );

  return (
    <BroadsheetView students={students} classes={classes} scores={scores} settings={settings} />
  );
}
