'use client';
import { useState } from 'react';
import { IDCardView } from '@/components/features/IDCardView';
import {
  useClassStudents,
  useClasses,
  useSettings,
  useStudents,
  useTeachers,
} from '@/lib/hooks/use-data';
import { useSchoolStore } from '@/lib/store';
import * as Utils from '@/lib/utils';

export default function IDCardsPage() {
  const { currentRole } = useSchoolStore();
  const isLearner = currentRole === 'student' || currentRole === 'parent';
  const { data: classes = [] } = useClasses();
  const { data: settings = Utils.INITIAL_SETTINGS } = useSettings();
  const { data: teachers = [] } = useTeachers();
  // Staff print one class at a time; students and parents only ever see their own cards.
  const [chosenClass, setChosenClass] = useState('');
  const classId = chosenClass || String(classes[0]?.id || '');
  const { data: classStudents = [] } = useClassStudents(classId, !isLearner);
  const { data: ownStudents = [] } = useStudents(isLearner);

  return isLearner ? (
    <IDCardView students={ownStudents} classes={classes} settings={settings} teachers={teachers} />
  ) : (
    <IDCardView
      students={classStudents}
      classes={classes}
      settings={settings}
      teachers={teachers}
      selectedClass={classId}
      onSelectClass={setChosenClass}
    />
  );
}
