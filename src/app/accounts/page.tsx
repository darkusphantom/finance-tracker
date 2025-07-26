import { AccountBalances } from '@/components/account-balances';
import { AddTransactionSheet } from '@/components/add-transaction-sheet';
import { DashboardLayout } from '@/components/dashboard-layout';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { getAccounts } from '@/lib/notion';
import { transformAccountData } from '@/lib/utils';
import { getIronSession } from 'iron-session';
import { cookies } from 'next/headers';
import { sessionOptions, type SessionData } from '@/lib/session';

export const revalidate = 0;

export default async function AccountsPage() {
    const session = await getIronSession<SessionData>(cookies(), sessionOptions);
    const rawAccounts = await getAccounts(session.notionDatabases?.accounts!);
    const accounts = transformAccountData(rawAccounts);

  return (
    <DashboardLayout>
      <header className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-4">
          <SidebarTrigger className="md:hidden" />
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
            Accounts
          </h1>
        </div>
      </header>
      <main>
        <AccountBalances initialAccounts={accounts}/>
      </main>
    </DashboardLayout>
  );
}
