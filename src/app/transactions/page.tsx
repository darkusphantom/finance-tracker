import { AddTransactionSheet } from '@/components/add-transaction-sheet';
import { DashboardLayout } from '@/components/dashboard-layout';
import { TransactionsTable } from '@/components/transactions-table';
import { getAllTransactions } from '@/lib/notion';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { transformTransactionData } from '@/lib/utils';
import { getIronSession } from 'iron-session';
import { cookies } from 'next/headers';
import { sessionOptions, type SessionData } from '@/lib/session';

export const revalidate = 0;

export default async function TransactionsPage() {
  const session = await getIronSession<SessionData>(cookies(), sessionOptions);
  const rawTransactions = await getAllTransactions(
    session.notionDatabases?.transactions!,
    session.notionDatabases?.income!
  );
  const transactions = transformTransactionData(rawTransactions);

  return (
    <DashboardLayout>
      <header className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-4">
          <SidebarTrigger className="md:hidden" />
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
            Transactions
          </h1>
        </div>
        <AddTransactionSheet />
      </header>
      <main>
        <TransactionsTable initialTransactions={transactions} />
      </main>
    </DashboardLayout>
  );
}
