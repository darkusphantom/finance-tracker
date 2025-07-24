import { AddTransactionSheet } from '@/components/add-transaction-sheet';
import { DashboardLayout } from '@/components/dashboard-layout';
import { Debts } from '@/components/debts';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { getDebts } from '@/lib/notion';
import { transformDebtData } from '@/lib/utils';

export const revalidate = 0;

export default async function DebtsPage() {
  const rawDebts = await getDebts(process.env.NOTION_DEBTS_DB!);
  const debts = transformDebtData(rawDebts);

  return (
    <DashboardLayout>
      <header className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-4">
          <SidebarTrigger className="md:hidden" />
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
            Debts
          </h1>
        </div>
        <AddTransactionSheet />
      </header>
      <main>
        <Debts initialDebts={debts}/>
      </main>
    </DashboardLayout>
  );
}
