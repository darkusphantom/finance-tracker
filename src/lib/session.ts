import type { IronSessionOptions } from 'iron-session';

export interface SessionData {
  isLoggedIn: boolean;
}

if (!process.env.SECRET_COOKIE_PASSWORD) {
  throw new Error('SECRET_COOKIE_PASSWORD is not set in the environment variables.');
}

export const sessionOptions: IronSessionOptions = {
  password: process.env.SECRET_COOKIE_PASSWORD,
  cookieName: 'notion-finance-session',
  cookieOptions: {
    secure: process.env.NODE_ENV === 'production',
  },
};
