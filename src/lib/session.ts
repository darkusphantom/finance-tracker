import type { IronSessionOptions } from 'iron-session';

export interface SessionData {
  isLoggedIn: boolean;
  userId?: string;
  username?: string;
  email?: string;
<<<<<<< HEAD
  notionToken?: string;
  notionDatabases?: {
    transactions: string;
    income: string;
    totalSavings: string;
    accounts: string;
    debts: string;
    budget: string;
  };
=======
>>>>>>> e2e3579 (Perfecto. Vamos a crear otra página. Crea una página para los ajustes de)
}

export const sessionOptions: IronSessionOptions = {
  password: process.env.SECRET_COOKIE_PASSWORD as string,
  cookieName: 'notion-finance-session',
  cookieOptions: {
    secure: process.env.NODE_ENV === 'production',
  },
};
