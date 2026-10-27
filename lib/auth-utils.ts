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
  const options: CookieOptionsType = {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? 'strict' : 'lax',
    path: '/',
    maxAge: type === 'access' ? 60 * 60 : 60 * 60 * 24 * 7,
  };

  return options;
};

export const getDeleteOptions = (): DeleteOptionsType => {
  return {
    path: '/',
  };
};
