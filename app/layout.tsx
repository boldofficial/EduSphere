import type { Metadata, Viewport } from 'next';
import { headers } from 'next/headers';
import { getPublicSite } from '@/lib/public-site';
import { Inter } from 'next/font/google';
import './globals.css';
import { ToastProvider } from '@/components/providers/toast-provider';
import { ConfirmProvider } from '@/components/ui/confirm-dialog';
import QueryProvider from '@/components/providers/query-provider';
import { PWAProvider } from '@/components/providers/pwa-provider';
import { AuthProvider } from '@/components/providers/AuthProvider';
import { ErrorBoundary } from '@/components/providers/error-boundary';
import { resolveTenantFromHost } from '@/lib/tenant-host';
import { FeedbackPortal } from '@/components/features/feedback/FeedbackPortal';

const inter = Inter({ subsets: ['latin'] });

export async function generateMetadata(): Promise<Metadata> {
  const headersList = await headers();
  const host = headersList.get('host') || '';
  const rootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN || 'myregistra.net';
  const { isRootHost, tenantId } = resolveTenantFromHost(host, rootDomain);

  let schoolName = 'Registra';
  let schoolTagline = 'The operating system for modern schools';
  // School sites use their own logo (or a letter icon) everywhere a browser shows an icon.
  let icons: Metadata['icons'] = {
    icon: [
      { url: '/favicon.png', sizes: '32x32', type: 'image/png' },
      { url: '/favicon.png', sizes: '16x16', type: 'image/png' },
    ],
    apple: [{ url: '/favicon.png', sizes: '180x180', type: 'image/png' }],
    shortcut: '/favicon.png',
  };

  if (tenantId) {
    const site = await getPublicSite(tenantId);
    if (site) {
      schoolName = site.school_name || 'Registra';
      schoolTagline = site.school_tagline || 'The operating system for modern schools';
    }
    // The version changes when the logo or colour changes, so browsers drop their cached icon.
    const logoKey = String(site?.logo_media || '').split('?')[0];
    const version = iconVersion(`${logoKey}|${site?.landing_primary_color || ''}`);
    const iconUrl = `/site-icon?v=${version}`;
    icons = { icon: [{ url: iconUrl }], apple: [{ url: iconUrl }], shortcut: iconUrl };
  }

  const title = isRootHost
    ? 'Registra | The operating system for modern schools'
    : `${schoolName} | Powered by Registra`;
  const description = isRootHost
    ? 'The operating system for modern schools. Unified management for students, staff, and academics.'
    : `${schoolName} - ${schoolTagline}. Manage academics, admissions, and school operations efficiently.`;

  return {
    title: {
      default: title,
      template: `%s | ${schoolName}`,
    },
    description,
    keywords: [
      'school management system',
      'school software Nigeria',
      'education ERP',
      'student information system',
      'automated report cards',
      'school fee collection software',
      'Registra school OS',
    ],
    metadataBase: new URL(`https://${host}`),
    alternates: {
      canonical: isRootHost ? 'https://myregistra.net' : `https://${host}`,
    },
    openGraph: {
      type: 'website',
      locale: 'en_NG',
      url: `https://${host}`,
      siteName: schoolName,
      title: title,
      description: description,
    },
    twitter: {
      card: 'summary_large_image',
      title: title,
      description: description,
    },
    icons,
  };
}

function iconVersion(value: string) {
  let hash = 0;
  for (let i = 0; i < value.length; i++) hash = (hash * 31 + value.charCodeAt(i)) | 0;
  return (hash >>> 0).toString(36);
}

export const viewport: Viewport = {
  themeColor: '#0b1e3b',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ErrorBoundary>
          <QueryProvider>
            <ToastProvider>
              <ConfirmProvider>
                <PWAProvider>
                  <AuthProvider>{children}</AuthProvider>
                  <FeedbackPortal />
                </PWAProvider>
              </ConfirmProvider>
            </ToastProvider>
          </QueryProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}
