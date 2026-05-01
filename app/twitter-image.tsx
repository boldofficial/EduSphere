import { ImageResponse } from 'next/og'
import { headers } from 'next/headers'
import { resolveTenantFromHost } from '@/lib/tenant-host'

export const alt = 'Registra - Quality Education Management'
export const size = {
    width: 1200,
    height: 630,
}
export const contentType = 'image/png'

const DJANGO_API_URL = (process.env.DJANGO_API_URL || 'http://127.0.0.1:8000').replace(/\/$/, '');

export default async function Image() {
    const headersList = await headers();
    const host = headersList.get('host') || '';
    const rootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN || 'myregistra.net';
    const { tenantId } = resolveTenantFromHost(host, rootDomain);

    let schoolData = {
        school_name: 'Registra',
        school_tagline: 'The operating system for modern schools',
        logo_media: '/full-logo.png'
    };

    if (tenantId) {
        try {
            const res = await fetch(`${DJANGO_API_URL}/api/core/public-settings/`, {
                headers: { 'X-Tenant-ID': tenantId },
                next: { revalidate: 3600 },
                signal: AbortSignal.timeout(5000)
            });
            if (res.ok) {
                const data = await res.json();
                schoolData = {
                    school_name: data.school_name || 'Registra',
                    school_tagline: data.school_tagline || 'Quality Education Management',
                    logo_media: data.logo_media
                };
            }
        } catch (e) {
            // Fallback
        }
    }

    const protocol = host.includes('localhost') ? 'http' : 'https';
    const baseUrl = `${protocol}://${host}`;
    const logoUrl = schoolData.logo_media?.startsWith('http') 
        ? schoolData.logo_media 
        : `${baseUrl}${schoolData.logo_media || '/full-logo.png'}`;

    return new ImageResponse(
        (
            <div
                style={{
                    fontSize: 48,
                    background: 'linear-gradient(135deg, #0b1e3b 0%, #1e293b 100%)',
                    width: '100%',
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: 40,
                }}
            >
                {/* Logo Section */}
                <div
                    style={{
                        width: 180,
                        height: 180,
                        borderRadius: 32,
                        backgroundColor: 'white',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginBottom: 40,
                        boxShadow: '0 20px 50px rgba(0,0,0,0.5)',
                        overflow: 'hidden',
                        padding: 20,
                    }}
                >
                    <img
                        src={logoUrl}
                        style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                        alt="Logo"
                    />
                </div>

                {/* Content Section */}
                <div
                    style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: 15,
                    }}
                >
                    <h1
                        style={{
                            fontSize: 72,
                            fontWeight: 'bold',
                            color: 'white',
                            textAlign: 'center',
                            margin: 0,
                            letterSpacing: '-0.02em',
                        }}
                    >
                        {schoolData.school_name}
                    </h1>

                    <p
                        style={{
                            fontSize: 32,
                            color: '#94a3b8',
                            textAlign: 'center',
                            margin: 0,
                            fontStyle: 'italic',
                            maxWidth: 800,
                        }}
                    >
                        "{schoolData.school_tagline}"
                    </p>
                </div>

                {/* Badge/Platform Info */}
                <div
                    style={{
                        position: 'absolute',
                        bottom: 40,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 10,
                        backgroundColor: 'rgba(255,255,255,0.05)',
                        padding: '12px 24px',
                        borderRadius: 100,
                        border: '1px solid rgba(255,255,255,0.1)',
                    }}
                >
                    <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#3b82f6' }} />
                    <span style={{ fontSize: 20, color: 'white', fontWeight: 600 }}>Powered by Registra</span>
                </div>
            </div>
        ),
        {
            ...size,
        }
    )
}
