import { AddTransactionSheet } from '@/components/add-transaction-sheet';
import { DashboardLayout } from '@/components/dashboard-layout';
import { BudgetView } from '@/components/budget-view';
import { SidebarTrigger } from '@/components/ui/sidebar';
import {
  getAllTransactions,
  getScheduledPayments,
} from '@/lib/notion';
import {
  transformTransactionData,
  transformScheduledPaymentsData,
} from '@/lib/utils';
import { ScheduledPayments } from '@/components/scheduled-payments';
import { Separator } from '@/components/ui/separator';

export const revalidate = 0;

export default async function BudgetPage() {
  const rawTransactions = await getAllTransactions(
    process.env.NOTION_TRANSACTIONS_DB!,
    process.env.NOTION_INCOME_DB!
  );
  const transactions = transformTransactionData(rawTransactions);

  const rawScheduledPayments = await getScheduledPayments(
    process.env.NOTION_BUDGET_DB!
  );
  const scheduledPayments = transformScheduledPaymentsData(rawScheduledPayments);

  return (
    <DashboardLayout>
      <header className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-4">
          <SidebarTrigger className="md:hidden" />
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
            Budget
          </h1>
        </div>
      </header>
      <main className="space-y-6">
        <BudgetView transactions={transactions} />
        <Separator />
        <ScheduledPayments initialItems={scheduledPayments} />
      </main>
    </DashboardLayout>
  );
}
