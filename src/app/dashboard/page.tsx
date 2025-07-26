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
