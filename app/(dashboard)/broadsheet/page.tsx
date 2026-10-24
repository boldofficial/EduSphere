'use client';
import { useState } from 'react';
import { BroadsheetView } from '@/components/features/BroadsheetView';
import { useClassStudents, useClasses, useScores, useSettings } from '@/lib/hooks/use-data';
import * as Utils from '@/lib/utils';

export default function BroadsheetPage() {
  const { data: classes = [] } = useClasses();
  const { data: settings = Utils.INITIAL_SETTINGS, isSuccess: settingsLoaded } = useSettings();
  // One class and the current term at a time: never the whole school.
  const [chosenClass, setChosenClass] = useState('');
  const classId = chosenClass || String(classes[0]?.id || '');
  const { data: students = [] } = useClassStudents(classId);
  const { data: scores = [] } = useScores(
    { session: settings.current_session, term: settings.current_term, class: classId },
    settingsLoaded && !!classId
  );

  return (
    <BroadsheetView
      students={students}
      classes={classes}
      scores={scores}
      settings={settings}
      selectedClass={classId}
      onSelectClass={setChosenClass}
    />
  );
}
