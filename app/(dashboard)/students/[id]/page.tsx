'use client';

import { use } from 'react';
import { StudentProfileView } from '@/components/features/students/StudentProfileView';

export default function StudentProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return <StudentProfileView studentId={id} />;
}
