import { AddTransactionSheet } from '@/components/add-transaction-sheet';
import { DashboardLayout } from '@/components/dashboard-layout';
import { TransactionsTable } from '@/components/transactions-table';
import { SidebarTrigger } from '@/components/ui/sidebar';

export default function TransactionsPage() {
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
        <TransactionsTable />
      </main>
    </DashboardLayout>
  );
}
