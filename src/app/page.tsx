import { AccountBalances } from '@/components/account-balances';
import { AddTransactionSheet } from '@/components/add-transaction-sheet';
import { DashboardLayout } from '@/components/dashboard-layout';
import { Debts } from '@/components/debts';
import { MonthlyOverview } from '@/components/monthly-overview';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { getAccounts, getDebts } from '@/lib/notion';
import { transformAccountData, transformDebtData } from '@/lib/utils';

export const revalidate = 0;

export default async function Home() {
  const rawAccounts = await getAccounts(process.env.NOTION_ACCOUNTS_DB!);
  const accounts = transformAccountData(rawAccounts);
  
  const rawDebts = await getDebts(process.env.NOTION_DEBTS_DB!);
  const debts = transformDebtData(rawDebts);

  return (
    <DashboardLayout>
      <header className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-4">
          <SidebarTrigger className="md:hidden" />
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
            Dashboard
          </h1>
        </div>
        <AddTransactionSheet />
      </header>
      <main className="space-y-6">
        <MonthlyOverview />
        <div className="grid gap-6 md:grid-cols-3">
          <div className="md:col-span-2">
            <AccountBalances isEditable={false} initialAccounts={accounts} />
          </div>
          <div className="md:col-span-1">
            <Debts isEditable={false} initialDebts={debts}/>
          </div>
        </div>
      </main>
    </DashboardLayout>
  );
}
