'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { CalendarCheck, ChevronRight, GraduationCap, Megaphone, User, Wallet } from 'lucide-react';
import { PageHeader } from '@/components/ui/page-header';
import { EmptyState } from '@/components/ui/empty-state';
import { StatusBadge } from '@/components/ui/status-badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useSchoolStore } from '@/lib/store';
import { useAnnouncements, useClasses, useStudents } from '@/lib/hooks/use-data';
import { useStudentProfile } from '@/lib/hooks/use-student-profile';
import * as Utils from '@/lib/utils';
import type { Student } from '@/lib/types';

function Metric({
  icon: Icon,
  label,
  value,
  tone = 'text-gray-900',
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: React.ReactNode;
  tone?: string;
}) {
  return (
    <div className="rounded-control bg-gray-50 p-3">
      <p className="flex items-center gap-1.5 text-xs font-medium text-gray-500">
        <Icon className="h-3.5 w-3.5" /> {label}
      </p>
      <p className={`mt-1 text-lg font-semibold ${tone}`}>{value}</p>
    </div>
  );
}

/** One child: this term's results, attendance and fees, from the server-computed profile. */
function ChildCard({ child, className }: { child: Student; className?: string }) {
  const { data: profile, isLoading } = useStudentProfile(child.id);
  const photo = Utils.getMediaUrl(child.passport_url || child.passport_media);
  const academics = profile?.academics;
  const balance = profile?.finance.balance ?? 0;

  return (
    <article className="overflow-hidden rounded-card border border-gray-200 bg-white shadow-card">
      <div className="flex items-center gap-4 p-5">
        <span className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-full bg-gray-100">
          {photo ? (
            <Image
              src={photo}
              alt=""
              width={56}
              height={56}
              className="h-full w-full object-cover"
              unoptimized
            />
          ) : (
            <User className="h-6 w-6 text-gray-400" />
          )}
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="truncate text-lg font-semibold text-gray-900">{child.names}</h2>
          <p className="text-sm text-gray-500">
            {[className, child.student_no].filter(Boolean).join(' · ')}
          </p>
        </div>
        {profile && <span className="text-xs text-gray-500">{profile.term}</span>}
      </div>

      <div className="grid grid-cols-3 gap-2 px-5 pb-5">
        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-16 rounded-control" />
          ))
        ) : (
          <>
            <Metric
              icon={GraduationCap}
              label="Average"
              value={academics ? `${academics.average}%` : '—'}
            />
            <Metric
              icon={CalendarCheck}
              label="Attendance"
              value={profile?.attendance.rate != null ? `${profile.attendance.rate}%` : '—'}
            />
            <Metric
              icon={Wallet}
              label="Fees owed"
              value={Utils.formatCurrency(balance)}
              tone={balance > 0 ? 'text-danger-600' : 'text-success-700'}
            />
          </>
        )}
      </div>

      {academics && (
        <div className="flex flex-wrap items-center gap-2 border-t border-gray-100 px-5 py-3 text-sm text-gray-600">
          <StatusBadge status={academics.published ? 'published' : 'draft'}>
            {academics.published ? 'Report card ready' : 'Results in progress'}
          </StatusBadge>
          <span>
            {Utils.ordinalSuffix(academics.position)} of {academics.class_size} in class
          </span>
        </div>
      )}

      <div className="grid grid-cols-2 divide-x divide-gray-100 border-t border-gray-100 text-sm font-medium">
        <Link
          href={`/students/${child.id}`}
          className="flex items-center justify-center gap-1 px-4 py-3 text-gray-700 hover:bg-gray-50"
        >
          Full profile <ChevronRight className="h-4 w-4" />
        </Link>
        <Link
          href={`/bursary?child=${child.id}`}
          className={`flex items-center justify-center gap-1 px-4 py-3 hover:bg-gray-50 ${
            balance > 0 ? 'text-brand-700' : 'text-gray-700'
          }`}
        >
          {balance > 0 ? 'Pay fees' : 'Fees & receipts'} <ChevronRight className="h-4 w-4" />
        </Link>
      </div>
    </article>
  );
}

/** Parents' home: one card per child, plus school notices for parents. */
export function ParentHome() {
  const { currentUser } = useSchoolStore();
  const { data: children = [], isLoading } = useStudents(); // server scopes this to the parent's children
  const { data: classes = [] } = useClasses();
  const { data: announcements = [] } = useAnnouncements();

  const notices = announcements
    .filter((a) => a.target === 'all' || a.target === 'parents')
    .slice(0, 5);
  const firstName = (currentUser?.name || currentUser?.username || '').split(/[\s@]/)[0];

  return (
    <div className="mx-auto max-w-5xl space-y-6 pb-12">
      <PageHeader
        title={firstName ? `Welcome, ${firstName}` : 'Welcome'}
        description="Your children's results, attendance and fees for this term."
      />

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2">
          {Array.from({ length: 2 }).map((_, i) => (
            <Skeleton key={i} className="h-64 rounded-card" />
          ))}
        </div>
      ) : children.length === 0 ? (
        <EmptyState
          icon={User}
          title="No children linked to your account yet"
          description="Ask the school office to add your email address to your child's record."
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {children.map((child) => (
            <ChildCard
              key={child.id}
              child={child}
              className={classes.find((c) => String(c.id) === String(child.class_id))?.name}
            />
          ))}
        </div>
      )}

      <section className="rounded-card border border-gray-200 bg-white shadow-card">
        <h2 className="flex items-center gap-2 border-b border-gray-100 px-5 py-4 text-base font-semibold text-gray-900">
          <Megaphone className="h-4 w-4 text-brand-600" /> School notices
        </h2>
        <div className="p-5">
          {notices.length === 0 ? (
            <p className="text-sm text-gray-500">No notices right now.</p>
          ) : (
            <ul className="divide-y divide-gray-100">
              {notices.map((n) => (
                <li key={n.id} className="py-3 first:pt-0 last:pb-0">
                  <p className="text-sm font-medium text-gray-900">{n.title}</p>
                  <p className="mt-0.5 line-clamp-2 text-sm text-gray-600">{n.content}</p>
                  <p className="mt-1 text-xs text-gray-500">
                    {new Date(n.created_at).toLocaleDateString('en-NG')}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </div>
  );
}
