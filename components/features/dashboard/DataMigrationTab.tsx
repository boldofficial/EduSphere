'use client';

import Link from 'next/link';
import { ArrowRight, FileSpreadsheet } from 'lucide-react';

/** Bulk student import now lives at /students/import (preview, admission numbers, login slips). */
export const DataMigrationTab = () => (
  <div className="space-y-6">
    <div>
      <h2 className="text-2xl font-bold text-gray-900">Data Migration</h2>
      <p className="text-gray-500">Bring your existing student records into the system.</p>
    </div>
    <div className="flex flex-col gap-4 rounded-card border border-gray-100 bg-white p-6 shadow-card sm:flex-row sm:items-center">
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-brand-50 text-brand-600">
        <FileSpreadsheet size={24} />
      </div>
      <div className="min-w-0 flex-1">
        <h3 className="font-bold text-gray-900">Import students from Excel or CSV</h3>
        <p className="text-sm text-gray-600">
          Check every row before anything is saved, give out admission numbers automatically and
          print login slips for the new students.
        </p>
      </div>
      <Link
        href="/students/import"
        className="inline-flex shrink-0 items-center justify-center gap-2 rounded-control bg-brand-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-brand-700"
      >
        Open student import <ArrowRight size={16} />
      </Link>
    </div>
  </div>
);
