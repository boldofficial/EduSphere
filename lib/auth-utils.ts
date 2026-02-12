/**
 * Authentication Utilities
 * 
 * Shared logic for managing JWT cookies across subdomains.
 */

export const getCookieOptions = (type: 'access' | 'refresh'): {
    httpOnly: boolean;
    secure: boolean;
    sameSite: 'lax' | 'strict' | 'none';
    path: string;
    maxAge: number;
    domain?: string;
} => {
    const isProd = process.env.NODE_ENV === 'production';
    const rootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN || 'myregistra.net';

    // Standard options
    const options: any = {
        httpOnly: true,
        secure: isProd,
        sameSite: 'lax',
        path: '/',
        maxAge: type === 'access' ? 60 * 60 : 60 * 60 * 24 * 7, // 1h or 7d
    };

    // Wildcard domain for production to share cookies across subdomains
    if (isProd && rootDomain !== 'localhost') {
        // Ensure rootDomain starts with a dot for wildcard subdomains
        const domain = rootDomain.startsWith('.') ? rootDomain : `.${rootDomain}`;
        options.domain = domain;
    }

    return options;
};

export const getDeleteOptions = (): {
    path: string;
    domain?: string;
} => {
    const isProd = process.env.NODE_ENV === 'production';
    const rootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN || 'myregistra.net';

    const options: any = {
        path: '/',
    };

    if (isProd && rootDomain !== 'localhost') {
        const domain = rootDomain.startsWith('.') ? rootDomain : `.${rootDomain}`;
        options.domain = domain;
    }

    return options;
};
