'use client';

import React, { useState } from 'react';
import { Users, Wallet, CalendarCheck, AlertTriangle, BookOpen, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';
import { PageHeader } from '@/components/ui/page-header';
import { StatCard } from '@/components/ui/stat-card';
import { EmptyState } from '@/components/ui/empty-state';
import { StatusBadge } from '@/components/ui/status-badge';
import { useConfirm } from '@/components/ui/confirm-dialog';
import { useToast } from '@/components/providers/toast-provider';
import { useQueryClient } from '@tanstack/react-query';
import { AdminOverview } from '@/components/features/dashboard/AdminOverview';
import type { AdminDashboardSummary } from '@/lib/hooks/use-dashboard';

const SAMPLE_DASHBOARD: AdminDashboardSummary = {
  session: '2025/2026',
  term: 'First Term',
  counts: { students: 1248, teachers: 64, staff: 22, classes: 36 },
  finance: {
    expected: 52_000_000,
    collected: 38_400_000,
    outstanding: 13_600_000,
    expenses: 9_250_000,
    collection_rate: 73.8,
  },
  attendance_today: { records: 1140, present: 1071, rate: 93.9, classes_marked: 31 },
  action_items: { pending_admissions: 7, payments_to_verify: 12, low_stock_items: 3 },
  recent_payments: [
    {
      id: 1,
      student_name: 'Adaeze Okafor',
      amount: 185000,
      date: '2026-10-08',
      method: 'transfer',
      status: 'pending',
    },
    {
      id: 2,
      student_name: 'Tunde Bakare',
      amount: 92500,
      date: '2026-10-08',
      method: 'cash',
      status: 'completed',
    },
    {
      id: 3,
      student_name: 'Fatima Bello',
      amount: 185000,
      date: '2026-10-07',
      method: 'pos',
      status: 'completed',
    },
  ],
  upcoming_events: [
    { id: 1, title: 'Mid-term break', start_date: '2026-10-16T08:00:00Z', event_type: 'holiday' },
    { id: 2, title: 'PTA meeting', start_date: '2026-10-21T10:00:00Z', event_type: 'meeting' },
  ],
};

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-4">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500">{title}</h2>
      {children}
    </section>
  );
}

const SWATCHES = [
  {
    name: 'brand',
    shades: ['bg-brand-50', 'bg-brand-200', 'bg-brand-500', 'bg-brand-700', 'bg-brand-900'],
  },
  {
    name: 'accent',
    shades: ['bg-accent-50', 'bg-accent-200', 'bg-accent-500', 'bg-accent-700', 'bg-accent-900'],
  },
  {
    name: 'success',
    shades: ['bg-success-50', 'bg-success-200', 'bg-success-500', 'bg-success-700'],
  },
  {
    name: 'warning',
    shades: ['bg-warning-50', 'bg-warning-200', 'bg-warning-500', 'bg-warning-700'],
  },
  { name: 'danger', shades: ['bg-danger-50', 'bg-danger-200', 'bg-danger-500', 'bg-danger-700'] },
  { name: 'info', shades: ['bg-info-50', 'bg-info-200', 'bg-info-500', 'bg-info-700'] },
  {
    name: 'gray',
    shades: ['bg-gray-50', 'bg-gray-200', 'bg-gray-500', 'bg-gray-700', 'bg-gray-900'],
  },
];

export function DesignSystemGallery() {
  const confirm = useConfirm();
  const { addToast } = useToast();
  const [modalOpen, setModalOpen] = useState(false);
  const queryClient = useQueryClient();
  // Seed the admin dashboard query so the overview renders without a backend.
  useState(() => queryClient.setQueryData(['admin-dashboard'], SAMPLE_DASHBOARD));

  return (
    <main className="mx-auto max-w-6xl space-y-12 px-4 py-10 sm:px-6">
      <PageHeader
        eyebrow="Registra UI"
        title="Design system"
        description="Shared components and tokens. Every module should be built from these."
        actions={
          <>
            <Button variant="secondary">Export</Button>
            <Button>
              <Plus className="mr-1.5 h-4 w-4" /> Add student
            </Button>
          </>
        }
      />

      <Section title="Colour tokens">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {SWATCHES.map((s) => (
            <div
              key={s.name}
              className="rounded-card border border-gray-200 bg-white p-4 shadow-card"
            >
              <p className="mb-3 text-sm font-semibold text-gray-900">{s.name}</p>
              <div className="flex overflow-hidden rounded-control">
                {s.shades.map((c) => (
                  <div key={c} className={`h-10 flex-1 ${c}`} title={c} />
                ))}
              </div>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Type scale (nothing below 12px)">
        <div className="space-y-2 rounded-card border border-gray-200 bg-white p-6 shadow-card">
          <p className="text-3xl font-bold text-gray-900">30 · Page title</p>
          <p className="text-2xl font-bold text-gray-900">24 · Section title</p>
          <p className="text-lg font-semibold text-gray-900">18 · Card title</p>
          <p className="text-base text-gray-700">16 · Body text for reading</p>
          <p className="text-sm text-gray-600">14 · Default UI text, table cells, labels</p>
          <p className="text-xs text-gray-500">12 · Captions, badges, helper text (the minimum)</p>
        </div>
      </Section>

      <Section title="Stat cards">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Students" value="1,248" icon={Users} trend={4} hint="vs last term" />
          <StatCard
            label="Fees collected"
            value="₦18.4m"
            icon={Wallet}
            tone="success"
            trend={12}
            hint="this term"
          />
          <StatCard label="Attendance today" value="94%" icon={CalendarCheck} tone="info" />
          <StatCard
            label="Outstanding fees"
            value="₦3.1m"
            icon={AlertTriangle}
            tone="danger"
            trend={-6}
            hint="vs last term"
          />
        </div>
      </Section>

      <Section title="Status badges">
        <div className="flex flex-wrap gap-2 rounded-card border border-gray-200 bg-white p-6 shadow-card">
          {[
            'paid',
            'pending',
            'partial',
            'overdue',
            'draft',
            'published',
            'present',
            'absent',
            'in_progress',
            'cancelled',
          ].map((s) => (
            <StatusBadge key={s} status={s} />
          ))}
        </div>
      </Section>

      <Section title="Buttons">
        <div className="flex flex-wrap gap-3 rounded-card border border-gray-200 bg-white p-6 shadow-card">
          <Button>Primary</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="outline">Outline</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="danger">Delete</Button>
          <Button disabled>Disabled</Button>
        </div>
      </Section>

      <Section title="Empty state">
        <EmptyState
          icon={BookOpen}
          title="No books in the library yet"
          description="Add your first book or import your catalogue from a spreadsheet."
          action={
            <Button>
              <Plus className="mr-1.5 h-4 w-4" /> Add book
            </Button>
          }
        />
      </Section>

      <Section title="Admin dashboard (sample data)">
        <AdminOverview
          allowedModules={['students', 'bursary', 'attendance', 'admissions', 'inventory']}
        />
      </Section>

      <Section title="Dialogs & feedback">
        <div className="flex flex-wrap gap-3 rounded-card border border-gray-200 bg-white p-6 shadow-card">
          <Button
            variant="danger"
            onClick={async () => {
              const ok = await confirm({
                title: 'Delete JSS 1A?',
                description: 'This removes the class and its timetable. Students stay on record.',
                tone: 'danger',
              });
              addToast(ok ? 'Class deleted' : 'Cancelled', ok ? 'success' : 'info');
            }}
          >
            Confirm (danger)
          </Button>
          <Button
            variant="secondary"
            onClick={async () => {
              const ok = await confirm('Mark this ticket as resolved?');
              addToast(ok ? 'Ticket resolved' : 'Cancelled', ok ? 'success' : 'info');
            }}
          >
            Confirm (default)
          </Button>
          <Button variant="secondary" onClick={() => setModalOpen(true)}>
            Open modal
          </Button>
          <Button variant="ghost" onClick={() => addToast('Payment recorded', 'success')}>
            Toast
          </Button>
        </div>
        <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Record payment">
          <p className="text-sm text-gray-600">
            Modals close with Escape or a click outside, and become bottom sheets on phones.
          </p>
        </Modal>
      </Section>
    </main>
  );
}
