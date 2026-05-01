import { ImageResponse } from 'next/og'
import { headers } from 'next/headers'
import { resolveTenantFromHost } from '@/lib/tenant-host'

// Using Node.js runtime for better stability in local/Windows environments
// export const runtime = 'edge'

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
        logo_media: '/full-logo.png' // Default to platform logo
    };

    if (tenantId) {
        try {
            const res = await fetch(`${DJANGO_API_URL}/api/core/public-settings/`, {
                headers: { 'X-Tenant-ID': tenantId },
                next: { revalidate: 3600 },
                signal: AbortSignal.timeout(5000) // 5s timeout
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

    // Use the current host for absolute URLs of local assets to ensure they are reachable by the generator
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
                        width: 220,
                        height: 220,
                        borderRadius: 40,
                        backgroundColor: 'white',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginBottom: 40,
                        boxShadow: '0 25px 60px rgba(0,0,0,0.6)',
                        overflow: 'hidden',
                        padding: 30,
                    }}
                >
                    <img
                        src={logoUrl}
                        style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'contain'
                        }}
                        alt="Logo"
                    />
                </div>

                {/* Content Section */}
                <div
                    style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: 20,
                    }}
                >
                    <h1
                        style={{
                            fontSize: 84,
                            fontWeight: 'bold',
                            color: 'white',
                            textAlign: 'center',
                            margin: 0,
                            letterSpacing: '-0.03em',
                            textShadow: '0 4px 20px rgba(0,0,0,0.3)',
                        }}
                    >
                        {schoolData.school_name}
                    </h1>

                    <p
                        style={{
                            fontSize: 36,
                            color: '#cbd5e1',
                            textAlign: 'center',
                            margin: 0,
                            fontStyle: 'italic',
                            maxWidth: 900,
                            lineHeight: 1.4,
                        }}
                    >
                        {schoolData.school_tagline}
                    </p>
                </div>

                {/* Platform Badge */}
                {!tenantId && (
                    <div
                        style={{
                            position: 'absolute',
                            bottom: 50,
                            display: 'flex',
                            alignItems: 'center',
                            gap: 12,
                            backgroundColor: 'rgba(255,255,255,0.08)',
                            padding: '16px 32px',
                            borderRadius: 100,
                            border: '1px solid rgba(255,255,255,0.15)',
                            backdropFilter: 'blur(10px)',
                        }}
                    >
                        <div style={{ width: 14, height: 14, borderRadius: '50%', background: '#3b82f6', boxShadow: '0 0 15px #3b82f6' }} />
                        <span style={{ fontSize: 24, color: 'white', fontWeight: 700, letterSpacing: '0.05em' }}>SCHOOL MANAGEMENT EVOLVED</span>
                    </div>
                )}
                
                {tenantId && (
                    <div
                        style={{
                            position: 'absolute',
                            bottom: 50,
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
                )}
            </div>
        ),
        {
            ...size,
        }
    )
}
