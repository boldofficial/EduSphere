'use client';

import { Suspense } from 'react';
import { SubjectChoicesView } from '@/components/features/SubjectChoicesView';

export default function StudentSubjectsPage() {
  return (
    <Suspense>
      <SubjectChoicesView />
    </Suspense>
  );
}
