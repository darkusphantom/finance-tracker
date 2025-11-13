import { AddTransactionSheet } from '@/components/add-transaction-sheet';
import { CurrencyCalculator } from '@/components/currency-calculator';
import { DashboardLayout } from '@/components/dashboard-layout';
import { FinancialCalculators } from '@/components/financial-calculators';
import { Separator } from '@/components/ui/separator';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { getAccounts } from '@/lib/notion';
import { transformAccountData } from '@/lib/utils';


export const revalidate = 0;

export default async function CalculatorPage() {
  const rawAccounts = await getAccounts(process.env.NOTION_ACCOUNTS_DB!);
  const accounts = transformAccountData(rawAccounts);

  return (
    <DashboardLayout>
      <header className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-4">
          <SidebarTrigger className="md:hidden" />
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
            Financial Tools
          </h1>
        </div>
        <AddTransactionSheet accounts={accounts} />
      </header>
      <main className="space-y-6">
        <CurrencyCalculator />
        <Separator />
        <FinancialCalculators />
      </main>
    </DashboardLayout>
  );
}
