export type CookieOptionsType = {
    httpOnly: boolean;
    secure: boolean;
    sameSite: 'lax' | 'strict' | 'none';
    path: string;
    maxAge: number;
    domain?: string;
};

export type DeleteOptionsType = {
    path: string;
    domain?: string;
};

export const getCookieOptions = (type: 'access' | 'refresh'): CookieOptionsType => {
    const isProd = process.env.NODE_ENV === 'production';
    const rootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN || 'myregistra.net';

    const options: CookieOptionsType = {
        httpOnly: true,
        secure: isProd,
        sameSite: isProd ? 'strict' : 'lax',
        path: '/',
        maxAge: type === 'access' ? 60 * 60 : 60 * 60 * 24 * 7,
    };

    if (isProd && rootDomain !== 'localhost') {
        options.domain = rootDomain.startsWith('.') ? rootDomain : `.${rootDomain}`;
    }

    return options;
};

export const getDeleteOptions = (): DeleteOptionsType => {
    const isProd = process.env.NODE_ENV === 'production';
    const rootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN || 'myregistra.net';

    const options: DeleteOptionsType = {
        path: '/',
    };

    if (isProd && rootDomain !== 'localhost') {
        options.domain = rootDomain.startsWith('.') ? rootDomain : `.${rootDomain}`;
    }

    return options;
};
