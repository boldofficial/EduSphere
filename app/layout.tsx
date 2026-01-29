import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { ToastProvider } from '@/components/providers/toast-provider'
import QueryProvider from '@/components/providers/query-provider'
import { PWAProvider } from '@/components/providers/pwa-provider'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
    title: {
        default: 'Registra | The operating system for modern schools',
        template: '%s | Registra',
    },
    description: 'The operating system for modern schools. Unified management for students, staff, and academics.',
    keywords: [
        'Registra', 'school management system', 'LMS', 'school ERP', 'admissions sync',
        'academic management', 'fee collection', 'Registra.net', 'premium school software'
    ],
    authors: [{ name: 'Registra Team' }],
    creator: 'Bold Ideas Innovations Ltd',
    publisher: 'Registra',
    metadataBase: new URL('https://myregistra.net'),
    alternates: {
        canonical: '/',
    },
    category: 'Education',
    classification: 'School Management and SaaS',
    openGraph: {
        type: 'website',
        locale: 'en_NG',
        url: 'https://myregistra.net',
        siteName: 'Registra',
        title: 'Registra - All-in-One School Management Platform',
        description: 'The operating system for modern schools. Unified management for students, staff, and academics.',
        images: [
            {
                url: 'https://myregistra.net/favicon.png',
                width: 1200,
                height: 630,
                alt: 'Registra Platform',
                type: 'image/png',
            },
        ],
    },
    twitter: {
        card: 'summary_large_image',
        site: '@registra',
        creator: '@registra',
        title: 'Registra - Efficient School Management',
        description: 'The operating system for modern schools. Unified management for students, staff, and academics.',
        images: {
            url: 'https://myregistra.net/favicon.png',
            alt: 'Registra Logo',
        },
    },
    robots: {
        index: true,
        follow: true,
        googleBot: {
            index: true,
            follow: true,
            'max-video-preview': -1,
            'max-image-preview': 'large',
            'max-snippet': -1,
        },
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
    other: {
        'mobile-web-app-capable': 'yes',
        'apple-mobile-web-app-capable': 'yes',
        'apple-mobile-web-app-status-bar-style': 'black-translucent',
        'format-detection': 'telephone=yes',
    },
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

