import { AddTransactionSheet } from '@/components/add-transaction-sheet';
import { CurrencyConverter } from '@/components/currency-converter';
import { DashboardLayout } from '@/components/dashboard-layout';
import { FinancialCalculators } from '@/components/financial-calculators';
import { Separator } from '@/components/ui/separator';
import { SidebarTrigger } from '@/components/ui/sidebar';

export default function CalculatorPage() {
  return (
    <DashboardLayout>
      <header className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-4">
          <SidebarTrigger className="md:hidden" />
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
            Financial Tools
          </h1>
        </div>
        <AddTransactionSheet />
      </header>
      <main className="space-y-6">
        <CurrencyConverter />
        <Separator />
        <FinancialCalculators />
      </main>
    </DashboardLayout>
  );
}
