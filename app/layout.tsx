import type { Metadata, Viewport } from 'next'
import { headers } from 'next/headers'
import { Inter } from 'next/font/google'
import './globals.css'
import { ToastProvider } from '@/components/providers/toast-provider'
import QueryProvider from '@/components/providers/query-provider'
import { PWAProvider } from '@/components/providers/pwa-provider'
import { AuthProvider } from '@/components/providers/AuthProvider'
import { ErrorBoundary } from '@/components/providers/error-boundary'
import { resolveTenantFromHost } from '@/lib/tenant-host'

const inter = Inter({ subsets: ['latin'] })

const DJANGO_API_URL = (process.env.DJANGO_API_URL || 'http://127.0.0.1:8000').replace(/\/$/, '');

export async function generateMetadata(): Promise<Metadata> {
    const headersList = await headers();
    const host = headersList.get('host') || '';
    const rootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN || 'myregistra.net';
    const { isRootHost, tenantId } = resolveTenantFromHost(host, rootDomain);

    let schoolName = 'Registra';
    let schoolTagline = 'The operating system for modern schools';

    if (tenantId) {
        try {
            const res = await fetch(`${DJANGO_API_URL}/api/core/public-settings/`, {
                headers: { 'X-Tenant-ID': tenantId },
                next: { revalidate: 3600 }
            });
            if (res.ok) {
                const data = await res.json();
                schoolName = data.school_name || 'Registra';
                schoolTagline = data.school_tagline || 'The operating system for modern schools';
            }
        } catch (e) {
            // Fallback to defaults
        }
    }

    const title = isRootHost ? 'Registra | The operating system for modern schools' : `${schoolName} | Powered by Registra`;
    const description = isRootHost ? 'The operating system for modern schools. Unified management for students, staff, and academics.' : `${schoolName} - ${schoolTagline}. Manage academics, admissions, and school operations efficiently.`;

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
            'Registra school OS'
        ],
        metadataBase: new URL('https://myregistra.net'),
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
        manifest: '/manifest.json',
        icons: {
            icon: [
                { url: '/favicon.png', sizes: '32x32', type: 'image/png' },
                { url: '/favicon.png', sizes: '16x16', type: 'image/png' },
            ],
            apple: [
                { url: '/favicon.png', sizes: '180x180', type: 'image/png' },
            ],
            shortcut: '/favicon.png',
        },
    };
}

export const viewport: Viewport = {
    themeColor: '#0b1e3b',
    width: 'device-width',
    initialScale: 1,
}


export default function RootLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <html lang="en" suppressHydrationWarning>
            <body className={inter.className}>
                <ErrorBoundary>
                    <QueryProvider>
                        <ToastProvider>
                            <PWAProvider>
                                <AuthProvider>
                                    {children}
                                </AuthProvider>
                            </PWAProvider>
                        </ToastProvider>
                    </QueryProvider>
                </ErrorBoundary>
            </body>
        </html>
    )
}

