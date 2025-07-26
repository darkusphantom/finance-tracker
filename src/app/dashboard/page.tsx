import { AccountBalances } from '@/components/account-balances';
import { AddTransactionSheet } from '@/components/add-transaction-sheet';
import { DashboardLayout } from '@/components/dashboard-layout';
import { Debts } from '@/components/debts';
import { FinancialChart } from '@/components/financial-chart';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { getAccounts, getAllTransactions, getDebts } from '@/lib/notion';
import {
  calculateFinancialSummary,
  transformAccountData,
  transformDebtData,
  transformTransactionData,
} from '@/lib/utils';

export const revalidate = 0;

export default async function DashboardPage() {
  const rawAccounts = await getAccounts(process.env.NOTION_ACCOUNTS_DB!);
  const accounts = transformAccountData(rawAccounts);

  const rawDebts = await getDebts(process.env.NOTION_DEBTS_DB!);
  const debts = transformDebtData(rawDebts);

  const rawTransactions = await getAllTransactions(
    process.env.NOTION_TRANSACTIONS_DB!,
    process.env.NOTION_INCOME_DB!
  );
  const transactions = transformTransactionData(rawTransactions);
  const financialSummary = calculateFinancialSummary(transactions);

  return (
    <DashboardLayout>
      <header className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-4">
          <SidebarTrigger className="md:hidden" />
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
            Dashboard
          </h1>
        </div>
      </header>
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
    </DashboardLayout>
  );
}
