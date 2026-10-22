'use client';

import { useState } from 'react';
import { CalendarDays, ChevronDown, Quote } from 'lucide-react';
import type { Settings } from '@/lib/types';
import * as Utils from '@/lib/utils';

/** Shared heading so every built-in section has the same rhythm. */
function SectionHeading({
  eyebrow,
  title,
  intro,
}: {
  eyebrow: string;
  title: string;
  intro?: string;
}) {
  return (
    <div className="mx-auto mb-12 max-w-2xl text-center">
      <p className="mb-3 text-sm font-bold uppercase tracking-[0.2em] text-brand-600">{eyebrow}</p>
      <h2 className="text-3xl font-black tracking-tight text-gray-900 sm:text-4xl">{title}</h2>
      {intro && <p className="mt-4 text-lg text-gray-600">{intro}</p>}
    </div>
  );
}

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');
}

const STAT_COLUMNS: Record<number, string> = {
  1: 'grid-cols-1',
  2: 'grid-cols-1 sm:grid-cols-2',
  3: 'grid-cols-1 sm:grid-cols-3',
};

/** Key numbers, e.g. "25+ years", "98% WAEC pass rate". */
export function StatsSection({ settings }: { settings: Settings }) {
  const stats = (settings.landing_stats || []).filter((s) => s.value || s.label);
  if (stats.length === 0) return null;
  return (
    <section id="numbers" className="scroll-mt-20 bg-brand-900 py-14 text-white">
      <div
        className={`mx-auto grid max-w-6xl gap-8 px-4 text-center sm:px-6 ${
          stats.length >= 4 ? 'grid-cols-2 lg:grid-cols-4' : STAT_COLUMNS[stats.length]
        }`}
      >
        {stats.slice(0, stats.length >= 4 ? 4 : stats.length).map((stat, i) => (
          <div key={i}>
            <p className="text-4xl font-black text-accent-400 sm:text-5xl">{stat.value}</p>
            <p className="mt-2 text-sm font-medium uppercase tracking-wider text-white/80">
              {stat.label}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}

export function TestimonialsSection({ settings }: { settings: Settings }) {
  const items = (settings.landing_testimonials || []).filter((t) => t.quote && t.name);
  if (items.length === 0) return null;
  return (
    <section id="testimonials" className="scroll-mt-20 bg-brand-50 py-20 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeading eyebrow="Testimonials" title="What parents say" />
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {items.slice(0, 6).map((t, i) => (
            <figure
              key={i}
              className="flex flex-col rounded-3xl bg-white p-8 shadow-sm ring-1 ring-brand-100"
            >
              <Quote className="mb-4 text-accent-500" size={32} aria-hidden="true" />
              <blockquote className="flex-1 text-lg leading-8 text-gray-700">
                “{t.quote}”
              </blockquote>
              <figcaption className="mt-6 flex items-center gap-3">
                {t.image ? (
                  // eslint-disable-next-line @next/next/no-img-element -- small avatar, optimised on upload
                  <img
                    src={Utils.getMediaUrl(t.image)}
                    alt=""
                    className="h-12 w-12 rounded-full object-cover"
                  />
                ) : (
                  <span className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-600 font-bold text-white">
                    {initials(t.name)}
                  </span>
                )}
                <span>
                  <span className="block font-bold text-gray-900">{t.name}</span>
                  {t.role && <span className="block text-sm text-gray-500">{t.role}</span>}
                </span>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}

export function TeamSection({ settings }: { settings: Settings }) {
  const team = (settings.landing_team || []).filter((m) => m.name);
  if (team.length === 0) return null;
  return (
    <section id="team" className="scroll-mt-20 bg-white py-20 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeading
          eyebrow="Leadership"
          title="Meet our team"
          intro="Experienced educators committed to every child's growth."
        />
        <div className="flex flex-wrap justify-center gap-8">
          {team.map((m, i) => (
            <div
              key={i}
              className="w-full max-w-xs text-center sm:w-[calc(50%-1rem)] lg:w-[calc(25%-1.5rem)]"
            >
              <div className="mx-auto mb-5 aspect-square w-48 overflow-hidden rounded-full bg-brand-100 ring-4 ring-brand-50">
                {m.image ? (
                  // eslint-disable-next-line @next/next/no-img-element -- portrait, optimised on upload
                  <img
                    src={Utils.getMediaUrl(m.image)}
                    alt={m.name}
                    loading="lazy"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <span className="flex h-full w-full items-center justify-center text-5xl font-black text-brand-600">
                    {initials(m.name)}
                  </span>
                )}
              </div>
              <h3 className="text-lg font-bold text-gray-900">{m.name}</h3>
              {m.role && <p className="text-sm font-semibold text-brand-600">{m.role}</p>}
              {m.bio && <p className="mt-3 text-sm leading-6 text-gray-600">{m.bio}</p>}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// Fixed time zone so the server render and the browser agree (Nigerian schools).
const TZ = 'Africa/Lagos';
const dayFormat = new Intl.DateTimeFormat('en-GB', { day: 'numeric', timeZone: TZ });
const monthFormat = new Intl.DateTimeFormat('en-GB', { month: 'short', timeZone: TZ });
const timeFormat = new Intl.DateTimeFormat('en-GB', {
  weekday: 'long',
  hour: 'numeric',
  minute: '2-digit',
  timeZone: TZ,
});

export function EventsSection({ settings }: { settings: Settings }) {
  const events = settings.events || [];
  if (events.length === 0) return null;
  return (
    <section id="events" className="scroll-mt-20 bg-gray-50 py-20 sm:py-24">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <SectionHeading eyebrow="Calendar" title="Upcoming events" />
        <ul className="space-y-4">
          {events.map((event) => {
            const start = new Date(event.start_date);
            const day = dayFormat.format(start);
            const month = monthFormat.format(start);
            return (
              <li
                key={event.id}
                className="flex gap-5 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-gray-100"
              >
                <div className="flex w-16 shrink-0 flex-col items-center justify-center rounded-xl bg-brand-600 py-2 text-white">
                  <span className="text-2xl font-black leading-none">{day}</span>
                  <span className="text-xs font-bold uppercase">{month}</span>
                </div>
                <div className="min-w-0">
                  <h3 className="font-bold text-gray-900">{event.title}</h3>
                  <p className="mt-1 flex items-center gap-1.5 text-sm text-gray-500">
                    <CalendarDays size={14} aria-hidden="true" />
                    {timeFormat.format(start)}
                  </p>
                  {event.description && (
                    <p className="mt-2 text-sm leading-6 text-gray-600">{event.description}</p>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}

export function FaqSection({ settings }: { settings: Settings }) {
  const faqs = (settings.landing_faqs || []).filter((f) => f.question);
  const [open, setOpen] = useState<number | null>(0);
  if (faqs.length === 0) return null;
  return (
    <section id="faqs" className="scroll-mt-20 bg-white py-20 sm:py-24">
      <div className="mx-auto max-w-3xl px-4 sm:px-6">
        <SectionHeading eyebrow="FAQs" title="Questions parents ask" />
        <div className="divide-y divide-gray-200 rounded-2xl border border-gray-200">
          {faqs.map((faq, i) => {
            const isOpen = open === i;
            return (
              <div key={i}>
                <h3>
                  <button
                    type="button"
                    aria-expanded={isOpen}
                    aria-controls={`faq-${i}`}
                    onClick={() => setOpen(isOpen ? null : i)}
                    className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left font-bold text-gray-900 hover:bg-gray-50 focus:outline-none focus-visible:bg-gray-50"
                  >
                    {faq.question}
                    <ChevronDown
                      size={20}
                      aria-hidden="true"
                      className={`shrink-0 text-brand-600 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                    />
                  </button>
                </h3>
                <div
                  id={`faq-${i}`}
                  hidden={!isOpen}
                  className="whitespace-pre-line px-6 pb-6 leading-7 text-gray-600"
                >
                  {faq.answer}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
