import { AddTransactionSheet } from '@/components/add-transaction-sheet';
import { DashboardLayout } from '@/components/dashboard-layout';
import { BudgetView } from '@/components/budget-view';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { getAllTransactions } from '@/lib/notion';
import { transformTransactionData } from '@/lib/utils';

export const revalidate = 0;

export default async function BudgetPage() {
  const rawTransactions = await getAllTransactions(
    process.env.NOTION_TRANSACTIONS_DB!,
    process.env.NOTION_INCOME_DB!
  );
  const transactions = transformTransactionData(rawTransactions);

  return (
    <DashboardLayout>
      <header className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-4">
          <SidebarTrigger className="md:hidden" />
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
            Budget
          </h1>
        </div>
        <AddTransactionSheet />
      </header>
      <main>
        <BudgetView transactions={transactions} />
      </main>
    </DashboardLayout>
  );
}
