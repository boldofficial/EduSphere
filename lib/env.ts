/**
 * Environment Variable Validation
 * 
 * Validates required environment variables at build/startup time.
 * Throws descriptive errors if critical variables are missing.
 */

type EnvConfig = {
    // Required for Supabase
    // Optional - Supabase (for migration reference)
    NEXT_PUBLIC_SUPABASE_URL?: string
    NEXT_PUBLIC_SUPABASE_ANON_KEY?: string

    // Optional - R2 Storage (only needed if file uploads are used)
    R2_ACCOUNT_ID?: string
    R2_ACCESS_KEY_ID?: string
    R2_SECRET_ACCESS_KEY?: string
    R2_BUCKET_NAME?: string
    R2_PUBLIC_URL?: string
}

function validateEnv(): EnvConfig {
    const errors: string[] = []

    // Required variables
    // Supabase variables no longer required

    // R2 variables - warn if incomplete (only required for file uploads)
    const r2Vars = [
        'R2_ACCOUNT_ID',
        'R2_ACCESS_KEY_ID',
        'R2_SECRET_ACCESS_KEY',
        'R2_BUCKET_NAME',
        'R2_PUBLIC_URL'
    ]

    const hasAnyR2 = r2Vars.some(v => process.env[v])
    const hasAllR2 = r2Vars.every(v => process.env[v])

    if (hasAnyR2 && !hasAllR2) {
        const missing = r2Vars.filter(v => !process.env[v])
        console.warn(`⚠️  Incomplete R2 configuration. Missing: ${missing.join(', ')}`)
        console.warn('   File uploads will not work until all R2 variables are set.')
    }

    // Throw if critical errors
    if (errors.length > 0) {
        throw new Error(
            `Environment validation failed:\n${errors.map(e => `  - ${e}`).join('\n')}\n\n` +
            'Please check your .env.local file or deployment environment variables.'
        )
    }

    return {
        NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
        NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        R2_ACCOUNT_ID: process.env.R2_ACCOUNT_ID,
        R2_ACCESS_KEY_ID: process.env.R2_ACCESS_KEY_ID,
        R2_SECRET_ACCESS_KEY: process.env.R2_SECRET_ACCESS_KEY,
        R2_BUCKET_NAME: process.env.R2_BUCKET_NAME,
        R2_PUBLIC_URL: process.env.R2_PUBLIC_URL,
    }
}

// Only validate in non-demo mode
let env: EnvConfig | null = null

export function getEnv(): EnvConfig {
    if (!env) {
        env = validateEnv()
    }
    return env
}

// Check if R2 is configured
export function isR2Configured(): boolean {
    return !!(
        process.env.R2_ACCOUNT_ID &&
        process.env.R2_ACCESS_KEY_ID &&
        process.env.R2_SECRET_ACCESS_KEY &&
        process.env.R2_BUCKET_NAME &&
        process.env.R2_PUBLIC_URL
    )
}

// Check if running in demo mode (no Supabase)
export function isDemoMode(): boolean {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    return !url || url.includes('your-project')
}
