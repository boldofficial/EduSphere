/**
 * API Versioning
 * 
 * Provides version prefix support for backward compatibility.
 * Routes are available at /api/v1/...
 */

export const API_VERSIONS = {
    v1: 'v1',
} as const;

export type APIVersion = typeof API_VERSIONS[keyof typeof API_VERSIONS];

export const DEFAULT_VERSION: APIVersion = API_VERSIONS.v1;

export function normalizePath(path: string, version: APIVersion = DEFAULT_VERSION): string {
    // Remove any existing version prefix to avoid duplicates
    const cleaned = path.replace(/^\/api\/v\d+\//, '/api/');
    
    // Add version prefix
    return cleaned.replace('/api/', `/api/${version}/`);
}

export function getVersionFromPath(path: string): APIVersion | null {
    const match = path.match(/^\/api\/(v\d+)\//);
    if (match) return match[1] as APIVersion;
    return null;
}

export const VERSION_DEPRECATED = {
    v1: false,
} as const;

export function isVersionDeprecated(version: APIVersion): boolean {
    return VERSION_DEPRECATED[version] ?? true;
}