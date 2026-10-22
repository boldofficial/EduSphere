import React from 'react';
import Link from 'next/link';
import {
  Clock,
  Facebook,
  Instagram,
  Linkedin,
  Mail,
  MapPin,
  MessageCircle,
  Phone,
  Twitter,
  Youtube,
} from 'lucide-react';
import * as Utils from '@/lib/utils';
import type { AcademicProgram, WebsiteSocial } from '@/lib/types';

interface SiteFooterProps {
  settings: {
    school_name?: string;
    school_email?: string;
    school_phone?: string;
    school_address?: string;
    school_tagline?: string;
    logo_media?: string | null;
    landing_academic_programs?: AcademicProgram[];
    landing_social?: WebsiteSocial;
    landing_opening_hours?: string;
    gallery?: unknown[];
  };
}

function TikTokIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M16.6 5.82A4.28 4.28 0 0 1 15.54 3h-3.09v12.4a2.59 2.59 0 0 1-2.59 2.5 2.6 2.6 0 0 1 0-5.2c.27 0 .53.04.77.12V9.66a5.7 5.7 0 0 0-.77-.05 5.69 5.69 0 1 0 5.69 5.69V9.01a7.33 7.33 0 0 0 4.29 1.38V7.31a4.28 4.28 0 0 1-3.24-1.49Z" />
    </svg>
  );
}

const SOCIAL_LINKS: {
  key: keyof WebsiteSocial;
  label: string;
  Icon: React.ComponentType<{ size?: number }>;
}[] = [
  { key: 'facebook', label: 'Facebook', Icon: Facebook },
  { key: 'instagram', label: 'Instagram', Icon: Instagram },
  { key: 'x', label: 'X (Twitter)', Icon: Twitter },
  { key: 'youtube', label: 'YouTube', Icon: Youtube },
  { key: 'tiktok', label: 'TikTok', Icon: TikTokIcon },
  { key: 'linkedin', label: 'LinkedIn', Icon: Linkedin },
];

/** Fixed footer layout; every detail in it is the school's own. */
const SiteFooter = ({ settings }: SiteFooterProps) => {
  const name = settings.school_name || 'Our School';
  const social = settings.landing_social || {};
  const programs = (settings.landing_academic_programs || [])
    .map((p) => p.title)
    .filter(Boolean)
    .slice(0, 6);
  const whatsapp = (social.whatsapp || '').replace(/[^0-9]/g, '');

  const quickLinks = [
    { href: '/#about', label: 'About Us' },
    { href: '/#programs', label: 'Programs' },
    ...(settings.gallery?.length ? [{ href: '/gallery', label: 'Gallery' }] : []),
    { href: '/admission', label: 'Admissions' },
    { href: '/#contact', label: 'Contact' },
    { href: '/dashboard', label: 'Portal Login' },
  ];

  return (
    <footer className="bg-brand-900 pb-8 pt-20 text-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-16 grid grid-cols-1 gap-12 sm:grid-cols-2 lg:grid-cols-4">
          <div className="sm:col-span-2 lg:col-span-1">
            <div className="mb-6 flex items-center gap-3">
              {settings.logo_media && (
                <div className="shrink-0 rounded-xl bg-white p-1">
                  {/* eslint-disable-next-line @next/next/no-img-element -- school logo, optimised on upload */}
                  <img
                    src={Utils.getMediaUrl(settings.logo_media)}
                    alt={`${name} logo`}
                    className="h-14 w-14 object-contain"
                  />
                </div>
              )}
              <h3 className="text-lg font-bold leading-tight text-white">{name}</h3>
            </div>
            {settings.school_tagline && (
              <p className="mb-6 text-sm font-medium italic text-accent-300">
                {settings.school_tagline}
              </p>
            )}
            {SOCIAL_LINKS.some((s) => social[s.key]) && (
              <div className="flex flex-wrap items-center gap-3">
                {SOCIAL_LINKS.filter((s) => social[s.key]).map(({ key, label, Icon }) => (
                  <a
                    key={key}
                    href={social[key]}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`${name} on ${label}`}
                    className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/10 text-white transition-all duration-300 hover:bg-accent-500"
                  >
                    <Icon size={20} />
                  </a>
                ))}
              </div>
            )}
          </div>

          <div>
            <h4 className="mb-6 text-lg font-bold text-white">Quick Links</h4>
            <ul className="space-y-3">
              {quickLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-white/90 transition-colors hover:text-accent-400"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {programs.length > 0 ? (
            <div>
              <h4 className="mb-6 text-lg font-bold text-white">Our Programs</h4>
              <ul className="space-y-3">
                {programs.map((title) => (
                  <li key={title} className="flex items-center gap-2 text-sm text-white/90">
                    <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-accent-500" />
                    {title}
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <div className="hidden lg:block" />
          )}

          <div>
            <h4 className="mb-6 text-lg font-bold text-white">Contact Info</h4>
            <ul className="space-y-4">
              {settings.school_phone && (
                <li className="flex items-center gap-3 text-sm text-white">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand-700">
                    <Phone size={14} className="text-accent-400" />
                  </span>
                  <a
                    href={`tel:${settings.school_phone.replace(/\s/g, '')}`}
                    className="hover:underline"
                  >
                    {settings.school_phone}
                  </a>
                </li>
              )}
              {settings.school_email && (
                <li className="flex items-center gap-3 text-sm text-white">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand-700">
                    <Mail size={14} className="text-accent-400" />
                  </span>
                  <a href={`mailto:${settings.school_email}`} className="break-all hover:underline">
                    {settings.school_email}
                  </a>
                </li>
              )}
              {settings.school_address && (
                <li className="flex items-start gap-3 text-sm text-white">
                  <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand-700">
                    <MapPin size={14} className="text-accent-400" />
                  </span>
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(settings.school_address)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:underline"
                  >
                    {settings.school_address}
                  </a>
                </li>
              )}
              {settings.landing_opening_hours && (
                <li className="flex items-start gap-3 text-sm text-white">
                  <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand-700">
                    <Clock size={14} className="text-accent-400" />
                  </span>
                  {settings.landing_opening_hours}
                </li>
              )}
              {whatsapp && (
                <li className="flex items-center gap-3 text-sm text-white">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand-700">
                    <MessageCircle size={14} className="text-accent-400" />
                  </span>
                  <a
                    href={`https://wa.me/${whatsapp}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:underline"
                  >
                    Chat on WhatsApp
                  </a>
                </li>
              )}
            </ul>
          </div>
        </div>

        <div className="border-t border-white/10 pt-8">
          <div className="flex flex-col items-center justify-between gap-4 text-center md:flex-row md:text-left">
            <p className="text-sm text-white">
              © {new Date().getFullYear()} {name}. All rights reserved.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-6 text-sm">
              <Link
                href="/privacy-policy"
                className="text-white/80 transition-colors hover:text-accent-400"
              >
                Privacy Policy
              </Link>
              <Link
                href="/terms-of-service"
                className="text-white/80 transition-colors hover:text-accent-400"
              >
                Terms of Service
              </Link>
              <span className="text-white/60">
                Website by{' '}
                <a
                  href="https://myregistra.net"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-white/80 hover:text-accent-400"
                >
                  Registra
                </a>
              </span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default SiteFooter;
