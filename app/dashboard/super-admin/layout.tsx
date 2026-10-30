'use client';

import React, { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useSchoolStore } from '@/lib/store';
import {
  BookOpen,
  CreditCard,
  Grid,
  LayoutDashboard,
  LogOut,
  Mail,
  Megaphone,
  Menu,
  MessageSquare,
  Radio,
  Rocket,
  School as SchoolIcon,
  ScrollText,
  Search,
  Settings,
  Shield,
  Star,
  Wallet,
  X,
} from 'lucide-react';
import { useAdminSchools, useCommandCenter, useGlobalSearch } from '@/lib/hooks/use-data';
import { CommandPalette } from '@/components/features/CommandPalette';

const ROOT = '/dashboard/super-admin';

interface NavItem {
  icon: React.ComponentType<{ size?: number; className?: string }>;
  label: string;
  href: string;
  /** Attention-queue keys whose counts show as a badge on this item. */
  badge?: string[];
}

const NAV: { label: string; items: NavItem[] }[] = [
  {
    label: 'Business',
    items: [
      { icon: LayoutDashboard, label: 'Command center', href: ROOT },
      {
        icon: SchoolIcon,
        label: 'Schools',
        href: `${ROOT}/tenants`,
        badge: ['subscriptions_pending', 'subscriptions_overdue'],
      },
      {
        icon: Wallet,
        label: 'Financials',
        href: `${ROOT}/financials`,
        badge: ['payments_pending'],
      },
      { icon: CreditCard, label: 'Plans & pricing', href: `${ROOT}/plans` },
      { icon: Grid, label: 'Modules', href: `${ROOT}/modules` },
    ],
  },
  {
    label: 'Customers',
    items: [
      {
        icon: MessageSquare,
        label: 'Support tickets',
        href: `${ROOT}/support`,
        badge: ['tickets_urgent', 'tickets_open'],
      },
      {
        icon: Rocket,
        label: 'Demo requests',
        href: `${ROOT}/demo-requests`,
        badge: ['demos_pending'],
      },
      { icon: Star, label: 'Feedback', href: `${ROOT}/feedback` },
    ],
  },
  {
    label: 'Communication',
    items: [
      { icon: Radio, label: 'Broadcasts', href: `${ROOT}/broadcasts` },
      { icon: Megaphone, label: 'Email marketing', href: `${ROOT}/email-marketing` },
      { icon: Mail, label: 'Email templates', href: `${ROOT}/templates` },
      { icon: ScrollText, label: 'Delivery logs', href: `${ROOT}/logs`, badge: ['emails_failed'] },
    ],
  },
  {
    label: 'Platform',
    items: [
      { icon: BookOpen, label: 'Blog', href: `${ROOT}/blog` },
      { icon: Settings, label: 'Blog settings', href: `${ROOT}/blog/settings` },
      { icon: Shield, label: 'Governance', href: `${ROOT}/governance` },
      { icon: Settings, label: 'Platform settings', href: `${ROOT}/settings` },
    ],
  },
];

/** The most specific nav item that matches the path is the active one. */
function activeHref(pathname: string) {
  const all = NAV.flatMap((group) => group.items.map((item) => item.href));
  return all
    .filter((href) => pathname === href || (href !== ROOT && pathname.startsWith(`${href}/`)))
    .sort((a, b) => b.length - a.length)[0];
}

function Sidebar({
  pathname,
  counts,
  onNavigate,
  onLogout,
}: {
  pathname: string;
  counts: Record<string, { count: number; severity: string }>;
  onNavigate: () => void;
  onLogout: () => void;
}) {
  const active = activeHref(pathname);
  return (
    <div className="flex h-full flex-col bg-brand-950 text-white">
      <div className="flex h-16 items-center border-b border-white/10 px-5">
        <Link href="/" className="h-9">
          <img src="/footer-logo.png" alt="Registra" className="h-full w-auto object-contain" />
        </Link>
      </div>
      <nav className="flex-1 space-y-5 overflow-y-auto px-3 py-4" aria-label="Super admin">
        {NAV.map((group) => (
          <div key={group.label}>
            <p className="px-3 pb-1.5 text-xs font-semibold uppercase tracking-wider text-white/40">
              {group.label}
            </p>
            <ul className="space-y-0.5">
              {group.items.map(({ icon: Icon, label, href, badge }) => {
                const isActive = active === href;
                const total = (badge ?? []).reduce(
                  (sum, key) => sum + (counts[key]?.count ?? 0),
                  0
                );
                const urgent = (badge ?? []).some((key) => counts[key]?.severity === 'critical');
                return (
                  <li key={href}>
                    <Link
                      href={href}
                      onClick={onNavigate}
                      aria-current={isActive ? 'page' : undefined}
                      className={`flex items-center gap-3 rounded-control px-3 py-2 text-sm transition-colors ${
                        isActive
                          ? 'bg-white/10 font-semibold text-white'
                          : 'text-white/65 hover:bg-white/5 hover:text-white'
                      }`}
                    >
                      <Icon size={17} className={isActive ? 'text-white' : 'text-white/50'} />
                      <span className="flex-1">{label}</span>
                      {total > 0 && (
                        <span
                          className={`min-w-5 rounded-full px-1.5 text-center text-xs font-bold leading-5 ${
                            urgent ? 'bg-red-500 text-white' : 'bg-white/15 text-white'
                          }`}
                        >
                          {total > 99 ? '99+' : total}
                        </span>
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>
      <div className="border-t border-white/10 p-3">
        <button
          type="button"
          onClick={onLogout}
          className="flex w-full items-center gap-3 rounded-control px-3 py-2 text-sm text-white/65 transition-colors hover:bg-white/5 hover:text-white"
        >
          <LogOut size={17} className="text-white/50" />
          Log out
        </button>
      </div>
    </div>
  );
}

function GlobalSearch({ onOpenPalette }: { onOpenPalette: () => void }) {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const { data: results, isLoading } = useGlobalSearch(query);
  const schools = (results?.schools ?? []) as { id: number; name: string; status: string }[];

  return (
    <div className="relative w-full max-w-md">
      <Search
        size={16}
        className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
      />
      <input
        type="search"
        placeholder="Search schools…"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        className="h-9 w-full rounded-control border border-gray-200 bg-gray-50 pl-9 pr-16 text-sm outline-none transition-colors focus:border-brand-500 focus:bg-white"
      />
      <button
        type="button"
        onClick={onOpenPalette}
        className="absolute right-1.5 top-1/2 hidden -translate-y-1/2 rounded border border-gray-200 bg-white px-1.5 py-0.5 text-xs font-medium text-gray-500 hover:text-gray-700 sm:block"
      >
        Ctrl K
      </button>
      {open && query.length >= 2 && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute left-0 right-0 top-full z-20 mt-1.5 overflow-hidden rounded-card border border-gray-200 bg-white shadow-raised">
            {isLoading ? (
              <p className="px-4 py-3 text-sm text-gray-500">Searching…</p>
            ) : schools.length === 0 ? (
              <p className="px-4 py-3 text-sm text-gray-500">No schools match “{query}”.</p>
            ) : (
              <ul className="max-h-80 overflow-y-auto py-1">
                {schools.map((school) => (
                  <li key={school.id}>
                    <Link
                      href={`${ROOT}/tenants`}
                      onClick={() => {
                        setOpen(false);
                        setQuery('');
                      }}
                      className="flex items-center justify-between gap-3 px-4 py-2 text-sm hover:bg-gray-50"
                    >
                      <span className="font-medium text-gray-900">{school.name}</span>
                      <span className="text-xs capitalize text-gray-500">{school.status}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </>
      )}
    </div>
  );
}

export default function SuperAdminLayout({ children }: { children: React.ReactNode }) {
  const { currentUser, currentRole, logout, hasHydrated } = useSchoolStore();
  const router = useRouter();
  const pathname = usePathname();
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const isSuperAdmin = currentRole?.toLowerCase() === 'super_admin';

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setPaletteOpen((open) => !open);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const { data: schools = [] } = useAdminSchools();
  const { data: center } = useCommandCenter();
  const counts = Object.fromEntries(
    (center?.attention ?? []).map((item) => [
      item.key,
      { count: item.count, severity: item.severity },
    ])
  );

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch {
      // Clear the local session either way.
    }
    logout();
    router.push('/login');
  };

  if (!hasHydrated) return null;

  if (!currentUser || !isSuperAdmin) {
    router.push('/dashboard');
    return null;
  }

  const name = currentUser.username || 'Admin';
  const sidebar = (
    <Sidebar
      pathname={pathname}
      counts={counts}
      onNavigate={() => setMenuOpen(false)}
      onLogout={handleLogout}
    />
  );

  return (
    <div className="min-h-screen bg-gray-50 font-primary">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 lg:block">{sidebar}</aside>

      {menuOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-gray-900/50" onClick={() => setMenuOpen(false)} />
          <aside className="relative h-full w-64 shadow-raised">
            {sidebar}
            <button
              type="button"
              onClick={() => setMenuOpen(false)}
              aria-label="Close menu"
              className="absolute right-3 top-4 rounded-control p-1.5 text-white/70 hover:bg-white/10"
            >
              <X size={18} />
            </button>
          </aside>
        </div>
      )}

      <div className="lg:pl-64">
        <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-gray-200 bg-white/95 px-4 backdrop-blur sm:px-6 lg:px-8">
          <button
            type="button"
            onClick={() => setMenuOpen(true)}
            aria-label="Open menu"
            className="rounded-control p-2 text-gray-600 hover:bg-gray-100 lg:hidden"
          >
            <Menu size={20} />
          </button>
          <GlobalSearch onOpenPalette={() => setPaletteOpen(true)} />
          <div className="ml-auto flex items-center gap-3">
            <div className="hidden text-right sm:block">
              <p className="text-sm font-semibold leading-tight text-gray-900">{name}</p>
              <p className="text-xs text-gray-500">Super admin</p>
            </div>
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-600 text-sm font-semibold text-white">
              {name[0]?.toUpperCase()}
            </span>
          </div>
        </header>

        <main className="mx-auto max-w-[1400px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">{children}</main>
      </div>

      <CommandPalette
        schools={schools}
        isOpen={paletteOpen}
        onClose={() => setPaletteOpen(false)}
      />
    </div>
  );
}
