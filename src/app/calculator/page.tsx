import { AddTransactionSheet } from '@/components/add-transaction-sheet';
import { CurrencyCalculator } from '@/components/currency-calculator';
import { DashboardLayout } from '@/components/dashboard-layout';
import { FinancialCalculators } from '@/components/financial-calculators';
import { Separator } from '@/components/ui/separator';
import { getAccounts } from '@/lib/notion';
import { transformAccountData } from '@/lib/utils';


export const revalidate = 0;

export default async function CalculatorPage() {
  const rawAccounts = await getAccounts(process.env.NOTION_ACCOUNTS_DB!);
  const accounts = transformAccountData(rawAccounts);

  return (
    <DashboardLayout
      title="Financial Tools"
      headerActions={<AddTransactionSheet accounts={accounts} />}
    >
      <main className="space-y-6">
        <CurrencyCalculator />
        <Separator />
        <FinancialCalculators />
      </main>
    </DashboardLayout>
  );
}
