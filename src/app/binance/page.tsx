import { DashboardLayout } from '@/components/dashboard-layout';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { BinanceView } from '@/components/binance-view';

export const revalidate = 0;

export default function BinancePage() {

  return (
    <DashboardLayout>
      <header className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-4">
          <SidebarTrigger className="md:hidden" />
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
            Binance Dashboard
          </h1>
        </div>
      </header>
      <main>
        <BinanceView />
      </main>
    </DashboardLayout>
  );
}
