import { AccountBalances } from '@/components/account-balances';
import { Debts } from '@/components/debts';
import { FinancialChart } from '@/components/financial-chart';
import { getAccounts, getAllTransactions, getDebts } from '@/lib/notion';
import {
  calculateFinancialSummary,
  transformAccountData,
  transformDebtData,
  transformTransactionData,
} from '@/lib/utils';
import { DashboardClientLayout } from '@/components/dashboard-client-layout';
import { getIronSession } from 'iron-session';
import { cookies } from 'next/headers';
import { sessionOptions, type SessionData } from '@/lib/session';

export const revalidate = 0;

export default async function DashboardPage() {
  const session = await getIronSession<SessionData>(cookies(), sessionOptions);
  const rawAccounts = await getAccounts(session.notionDatabases?.accounts!);
  const accounts = transformAccountData(rawAccounts);

  const rawDebts = await getDebts(session.notionDatabases?.debts!);
  const debts = transformDebtData(rawDebts);

  const rawTransactions = await getAllTransactions(
    session.notionDatabases?.transactions!,
    session.notionDatabases?.income!
  );
  const transactions = transformTransactionData(rawTransactions);
  const financialSummary = calculateFinancialSummary(transactions);

  return (
    <DashboardClientLayout>
      <main className="space-y-6">
        <FinancialChart summary={financialSummary} />
        <div className="grid gap-6 md:grid-cols-3">
          <div className="md:col-span-2">
            <AccountBalances isEditable={false} initialAccounts={accounts} />
          </div>
          <div className="md:col-span-1">
            <Debts isEditable={false} initialDebts={debts} />
          </div>
        </div>
      </main>
    </DashboardClientLayout>
  );
}
