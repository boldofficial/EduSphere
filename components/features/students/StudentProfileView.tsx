'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  AlertTriangle,
  ArrowLeft,
  CalendarCheck,
  Edit,
  GraduationCap,
  MessageSquare,
  Printer,
  ShieldCheck,
  User,
  Wallet,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/ui/page-header';
import { StatCard } from '@/components/ui/stat-card';
import { StatusBadge } from '@/components/ui/status-badge';
import { EmptyState } from '@/components/ui/empty-state';
import { Skeleton } from '@/components/ui/skeleton';
import { useStudent, useStudentProfile } from '@/lib/hooks/use-student-profile';
import { useClasses } from '@/lib/hooks/use-data';
import * as Utils from '@/lib/utils';

type Tab = 'overview' | 'academics' | 'fees' | 'attendance' | 'conduct';

const TABS: { id: Tab; label: string }[] = [
  { id: 'overview', label: 'Overview' },
  { id: 'academics', label: 'Academics' },
  { id: 'fees', label: 'Fees' },
  { id: 'attendance', label: 'Attendance' },
  { id: 'conduct', label: 'Conduct' },
];

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-card border border-gray-200 bg-white shadow-card">
      <h2 className="border-b border-gray-100 px-5 py-4 text-base font-semibold text-gray-900">
        {title}
      </h2>
      <div className="p-5">{children}</div>
    </section>
  );
}

function Field({ label, value }: { label: string; value?: React.ReactNode }) {
  return (
    <div>
      <dt className="text-xs font-medium text-gray-500">{label}</dt>
      <dd className="mt-0.5 text-sm text-gray-900">{value || '—'}</dd>
    </div>
  );
}

const ordinal = (n: number) => Utils.ordinalSuffix(n);
const formatDate = (value?: string | null) =>
  value
    ? new Date(value).toLocaleDateString('en-NG', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })
    : '—';

export function StudentProfileView({ studentId }: { studentId: string }) {
  const [tab, setTab] = useState<Tab>('overview');
  const [session, setSession] = useState('');
  const [term, setTerm] = useState('');

  const { data: student, isLoading: loadingStudent, isError } = useStudent(studentId);
  const { data: profile, isFetching } = useStudentProfile(studentId, session, term);
  const { data: classes = [] } = useClasses();

  if (loadingStudent) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-20 rounded-card" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-card" />
          ))}
        </div>
      </div>
    );
  }

  if (isError || !student) {
    return (
      <EmptyState
        icon={User}
        title="Student not found"
        description="This student may have been removed, or you don't have access to their record."
        action={
          <Link href="/students">
            <Button variant="secondary">Back to students</Button>
          </Link>
        }
      />
    );
  }

  const className = classes.find((c) => String(c.id) === String(student.class_id))?.name;
  const passport = Utils.getMediaUrl(student.passport_url || student.passport_media);
  const academics = profile?.academics;
  const attendance = profile?.attendance;
  const finance = profile?.finance;

  return (
    <div className="space-y-6 pb-12">
      <Link
        href="/students"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-500 hover:text-gray-900"
      >
        <ArrowLeft className="h-4 w-4" /> All students
      </Link>

      <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
        <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-card border border-gray-200 bg-white">
          {passport ? (
            <Image
              src={passport}
              alt={student.names}
              width={80}
              height={80}
              className="h-full w-full object-cover"
              unoptimized
            />
          ) : (
            <User className="h-9 w-9 text-gray-300" />
          )}
        </div>
        <PageHeader
          className="flex-1"
          title={student.names}
          description={[student.student_no, className, student.gender].filter(Boolean).join(' · ')}
          actions={
            <>
              <Link href={`/students?edit=${student.id}`}>
                <Button variant="secondary" size="sm">
                  <Edit className="mr-1.5 h-4 w-4" /> Edit
                </Button>
              </Link>
              <Link href="/messages">
                <Button variant="secondary" size="sm">
                  <MessageSquare className="mr-1.5 h-4 w-4" /> Message parent
                </Button>
              </Link>
              <Button variant="ghost" size="sm" onClick={() => window.print()}>
                <Printer className="mr-1.5 h-4 w-4" /> Print
              </Button>
            </>
          }
        />
      </div>

      {/* Period */}
      <div className="flex flex-wrap items-center gap-2">
        <select
          aria-label="Session"
          value={session || profile?.session || ''}
          onChange={(e) => setSession(e.target.value)}
          className="h-9 rounded-control border border-gray-300 bg-white px-3 text-sm"
        >
          {(profile?.sessions || []).map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        <select
          aria-label="Term"
          value={term || profile?.term || ''}
          onChange={(e) => setTerm(e.target.value)}
          className="h-9 rounded-control border border-gray-300 bg-white px-3 text-sm"
        >
          {(profile?.terms || []).map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
        {isFetching && <span className="text-xs text-gray-500">Updating…</span>}
      </div>

      {/* Key numbers */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Average"
          value={academics ? `${academics.average}%` : '—'}
          icon={GraduationCap}
          hint={
            academics
              ? `${ordinal(academics.position)} of ${academics.class_size}`
              : 'No results this term'
          }
        />
        <StatCard
          label="Attendance"
          value={attendance?.rate != null ? `${attendance.rate}%` : '—'}
          icon={CalendarCheck}
          tone="info"
          hint={attendance?.total ? `${attendance.total} days marked` : 'No register entries'}
        />
        <StatCard
          label="Fee balance"
          value={finance ? Utils.formatCurrency(finance.balance) : '—'}
          icon={Wallet}
          tone={finance && finance.balance > 0 ? 'danger' : 'success'}
          hint={finance ? `Paid ${Utils.formatCurrency(finance.total_paid)}` : undefined}
        />
        <StatCard
          label="Record completeness"
          value={
            profile
              ? profile.warnings.length
                ? `${profile.warnings.length} gaps`
                : 'Complete'
              : '—'
          }
          icon={profile?.warnings.length ? AlertTriangle : ShieldCheck}
          tone={profile?.warnings.length ? 'warning' : 'success'}
        />
      </div>

      {/* Tabs */}
      <nav className="-mx-1 overflow-x-auto px-1" aria-label="Student sections">
        <div className="flex w-max gap-1 rounded-control bg-gray-100 p-1">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`whitespace-nowrap rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                tab === t.id
                  ? 'bg-white text-gray-900 shadow-card'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </nav>

      {tab === 'overview' && (
        <div className="grid gap-6 lg:grid-cols-2">
          <Panel title="Student">
            <dl className="grid grid-cols-2 gap-4">
              <Field label="Full name" value={student.names} />
              <Field label="Admission no." value={student.student_no} />
              <Field label="Gender" value={student.gender} />
              <Field label="Date of birth" value={formatDate(student.dob)} />
              <Field label="Class" value={className} />
              <Field
                label="Subjects"
                value={
                  student.assigned_subjects?.length
                    ? student.assigned_subjects.join(', ')
                    : 'Class defaults'
                }
              />
            </dl>
          </Panel>
          <Panel title="Parent / guardian">
            <dl className="grid grid-cols-2 gap-4">
              <Field label="Name" value={student.parent_name} />
              <Field label="Phone" value={student.parent_phone} />
              <Field label="Email" value={student.parent_email} />
              <Field label="Address" value={student.address} />
            </dl>
          </Panel>
          {!!profile?.warnings.length && (
            <div className="rounded-card border border-warning-200 bg-warning-50 p-5 lg:col-span-2">
              <p className="mb-2 flex items-center gap-2 text-sm font-semibold text-warning-700">
                <AlertTriangle className="h-4 w-4" /> Missing information
              </p>
              <ul className="list-inside list-disc space-y-1 text-sm text-gray-700">
                {profile.warnings.map((w) => (
                  <li key={w}>{w}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {tab === 'academics' && (
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <Panel title={`Results · ${profile?.term || ''}`}>
              {!academics ? (
                <p className="text-sm text-gray-500">No report card for this term yet.</p>
              ) : (
                <div className="space-y-4">
                  <div className="flex flex-wrap items-center gap-2 text-sm text-gray-600">
                    <StatusBadge status={academics.published ? 'published' : 'draft'} />
                    <span>
                      Total {academics.total_score} · {ordinal(academics.position)} of{' '}
                      {academics.class_size}
                    </span>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-gray-200 text-left text-xs font-medium text-gray-500">
                          <th className="py-2 pr-3">Subject</th>
                          <th className="px-3 py-2 text-right">CA 1</th>
                          <th className="px-3 py-2 text-right">CA 2</th>
                          <th className="px-3 py-2 text-right">Exam</th>
                          <th className="px-3 py-2 text-right">Total</th>
                          <th className="py-2 pl-3 text-right">Grade</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {academics.subjects.map((s) => (
                          <tr key={s.subject}>
                            <td className="py-2 pr-3 font-medium text-gray-900">{s.subject}</td>
                            <td className="px-3 py-2 text-right text-gray-600">{s.ca1}</td>
                            <td className="px-3 py-2 text-right text-gray-600">{s.ca2}</td>
                            <td className="px-3 py-2 text-right text-gray-600">{s.exam}</td>
                            <td
                              className={`px-3 py-2 text-right font-semibold ${
                                s.total < 50 ? 'text-danger-600' : 'text-gray-900'
                              }`}
                            >
                              {s.total}
                            </td>
                            <td className="py-2 pl-3 text-right text-gray-600">{s.grade || '—'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {(academics.teacher_remark || academics.head_teacher_remark) && (
                    <div className="space-y-2 rounded-control bg-gray-50 p-4 text-sm text-gray-700">
                      {academics.teacher_remark && (
                        <p>
                          <span className="font-semibold">Class teacher:</span>{' '}
                          {academics.teacher_remark}
                        </p>
                      )}
                      {academics.head_teacher_remark && (
                        <p>
                          <span className="font-semibold">Head teacher:</span>{' '}
                          {academics.head_teacher_remark}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              )}
            </Panel>
          </div>
          <Panel title="Progress over time">
            {!profile?.history.length ? (
              <p className="text-sm text-gray-500">No past results yet.</p>
            ) : (
              <ul className="space-y-3">
                {profile.history.map((h) => (
                  <li key={`${h.session}-${h.term}`}>
                    <div className="mb-1 flex justify-between text-xs text-gray-600">
                      <span>
                        {h.term} · {h.session}
                      </span>
                      <span className="font-semibold text-gray-900">{h.average}%</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-gray-100">
                      <div
                        className={`h-full rounded-full ${h.average < 50 ? 'bg-danger-500' : 'bg-brand-500'}`}
                        style={{ width: `${Math.min(100, Math.max(0, h.average))}%` }}
                      />
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Panel>
        </div>
      )}

      {tab === 'fees' && (
        <div className="grid gap-6 lg:grid-cols-3">
          <Panel title="This term">
            <dl className="space-y-3">
              <Field
                label="Total bill"
                value={finance && Utils.formatCurrency(finance.total_bill)}
              />
              <Field label="Paid" value={finance && Utils.formatCurrency(finance.total_paid)} />
              <Field
                label="Balance"
                value={
                  finance && (
                    <span className={finance.balance > 0 ? 'font-semibold text-danger-600' : ''}>
                      {Utils.formatCurrency(finance.balance)}
                    </span>
                  )
                }
              />
            </dl>
          </Panel>
          <div className="lg:col-span-2">
            <Panel title="Payments">
              {!finance?.payments.length ? (
                <p className="text-sm text-gray-500">No payments recorded for this term.</p>
              ) : (
                <ul className="divide-y divide-gray-100">
                  {finance.payments.map((p) => (
                    <li key={p.id} className="flex items-center justify-between gap-3 py-3">
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-900">
                          {Utils.formatCurrency(p.amount)}
                        </p>
                        <p className="text-xs text-gray-500">
                          {formatDate(p.date)} · {p.method} · {p.reference}
                        </p>
                      </div>
                      <StatusBadge status={p.status} />
                    </li>
                  ))}
                </ul>
              )}
            </Panel>
          </div>
        </div>
      )}

      {tab === 'attendance' && (
        <Panel title={`Attendance · ${profile?.term || ''}`}>
          {!attendance?.total ? (
            <p className="text-sm text-gray-500">No register entries for this term.</p>
          ) : (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              <Field label="Days marked" value={attendance.total} />
              <Field label="Present" value={attendance.present} />
              <Field label="Late" value={attendance.late} />
              <Field label="Absent" value={attendance.absent} />
              <Field label="Rate" value={attendance.rate != null ? `${attendance.rate}%` : '—'} />
              <Field label="Last marked" value={formatDate(attendance.last)} />
            </div>
          )}
        </Panel>
      )}

      {tab === 'conduct' && (
        <Panel title="Recent conduct">
          {!profile?.conduct.length ? (
            <p className="text-sm text-gray-500">No conduct entries yet.</p>
          ) : (
            <ul className="divide-y divide-gray-100">
              {profile.conduct.map((c) => (
                <li key={c.id} className="flex items-start justify-between gap-3 py-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-900">{c.trait}</p>
                    {c.remark && <p className="text-sm text-gray-600">{c.remark}</p>}
                    <p className="text-xs text-gray-500">{formatDate(c.date)}</p>
                  </div>
                  <StatusBadge
                    tone={c.score >= 4 ? 'success' : c.score >= 3 ? 'neutral' : 'warning'}
                  >
                    {c.score}/5
                  </StatusBadge>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      )}
    </div>
  );
}
