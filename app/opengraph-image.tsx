import { ImageResponse } from 'next/og'

export const runtime = 'edge'

export const alt = 'Fruitful Vine Heritage Schools - Quality Faith-Based Education in Badagry, Lagos'
export const size = {
    width: 1200,
    height: 630,
}
export const contentType = 'image/png'

export default async function Image() {
    return new ImageResponse(
        (
            <div
                style={{
                    fontSize: 48,
                    background: 'linear-gradient(135deg, #0c4a6e 0%, #0284c7 50%, #38bdf8 100%)',
                    width: '100%',
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: 40,
                }}
            >
                {/* Logo placeholder - using text as fallback */}
                <div
                    style={{
                        width: 150,
                        height: 150,
                        borderRadius: '50%',
                        backgroundColor: 'white',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginBottom: 30,
                        boxShadow: '0 10px 40px rgba(0,0,0,0.3)',
                    }}
                >
                    <span style={{ fontSize: 60, color: '#0c4a6e' }}>🍇</span>
                </div>
                
                {/* School Name */}
                <div
                    style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: 10,
                    }}
                >
                    <h1
                        style={{
                            fontSize: 56,
                            fontWeight: 'bold',
                            color: 'white',
                            textAlign: 'center',
                            margin: 0,
                            textShadow: '2px 2px 4px rgba(0,0,0,0.3)',
                        }}
                    >
                        Fruitful Vine Heritage Schools
                    </h1>
                    
                    {/* Tagline */}
                    <p
                        style={{
                            fontSize: 28,
                            color: '#bae6fd',
                            textAlign: 'center',
                            margin: 0,
                            fontStyle: 'italic',
                        }}
                    >
                        "Reaching the Highest Height"
                    </p>
                </div>

                {/* Description */}
                <div
                    style={{
                        marginTop: 40,
                        padding: '20px 40px',
                        backgroundColor: 'rgba(255,255,255,0.15)',
                        borderRadius: 16,
                        maxWidth: 900,
                    }}
                >
                    <p
                        style={{
                            fontSize: 24,
                            color: 'white',
                            textAlign: 'center',
                            margin: 0,
                            lineHeight: 1.4,
                        }}
                    >
                        Quality Faith-Based Education • Crèche • Pre-School • Primary
                    </p>
                    <p
                        style={{
                            fontSize: 20,
                            color: '#e0f2fe',
                            textAlign: 'center',
                            margin: '10px 0 0 0',
                        }}
                    >
                        📍 Badagry, Lagos, Nigeria
                    </p>
                </div>

                {/* Footer */}
                <div
                    style={{
                        position: 'absolute',
                        bottom: 30,
                        fontSize: 18,
                        color: '#bae6fd',
                    }}
                >
                    fruitfulvineheritageschools.org.ng
                </div>
            </div>
        ),
        {
            ...size,
        }
    )
}
