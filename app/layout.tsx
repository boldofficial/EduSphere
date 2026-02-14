import type { Metadata, Viewport } from 'next'
import { headers } from 'next/headers'
import { Inter } from 'next/font/google'
import './globals.css'
import { ToastProvider } from '@/components/providers/toast-provider'
import QueryProvider from '@/components/providers/query-provider'
import { PWAProvider } from '@/components/providers/pwa-provider'

const inter = Inter({ subsets: ['latin'] })

const DJANGO_API_URL = (process.env.DJANGO_API_URL || 'http://127.0.0.1:8000').replace(/\/$/, '');

export async function generateMetadata(): Promise<Metadata> {
    const headersList = await headers();
    const host = headersList.get('host') || '';
    const rootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN || 'myregistra.net';

    // Derived tenant logic
    const cleanHost = host.replace(/^www\./, '').split(':')[0];
    const cleanRoot = rootDomain.replace(/^www\./, '').split(':')[0];
    const isRoot = cleanHost === cleanRoot;

    let tenantId = 'demo';
    if (!isRoot && cleanHost.endsWith(`.${cleanRoot}`)) {
        tenantId = cleanHost.replace(`.${cleanRoot}`, '');
    } else if (!isRoot && host !== 'localhost' && !host.includes('127.0.0.1')) {
        tenantId = cleanHost;
    }

    let schoolName = 'Registra';
    let schoolTagline = 'The operating system for modern schools';

    try {
        const res = await fetch(`${DJANGO_API_URL}/api/settings/`, {
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

    const title = isRoot ? 'Registra | The operating system for modern schools' : `${schoolName} | Powered by Registra`;
    const description = isRoot ? 'The operating system for modern schools. Unified management for students, staff, and academics.' : `${schoolName} - ${schoolTagline}. Manage academics, admissions, and school operations efficiently.`;

    return {
        title: {
            default: title,
            template: `%s | ${schoolName}`,
        },
        description,
        metadataBase: new URL('https://myregistra.net'),
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

import { AuthProvider } from '@/components/providers/AuthProvider'

// ...

export default function RootLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <html lang="en" suppressHydrationWarning>
            <body className={inter.className}>
                <QueryProvider>
                    <ToastProvider>
                        <PWAProvider>
                            <AuthProvider>
                                {children}
                            </AuthProvider>
                        </PWAProvider>
                    </ToastProvider>
                </QueryProvider>
            </body>
        </html>
    )
}

