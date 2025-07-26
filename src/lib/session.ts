import type { IronSessionOptions } from 'iron-session';

export interface SessionData {
  isLoggedIn: boolean;
  userId?: string;
  username?: string;
  email?: string;
}

export const sessionOptions: IronSessionOptions = {
  password: process.env.SECRET_COOKIE_PASSWORD as string,
  cookieName: 'notion-finance-session',
  cookieOptions: {
    secure: process.env.NODE_ENV === 'production',
  },
};
