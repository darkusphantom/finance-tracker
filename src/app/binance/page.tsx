import { DashboardLayout } from '@/components/dashboard-layout';
import { BinanceView } from '@/components/binance-view';

export const revalidate = 0;

export default function BinancePage() {
  return (
    <DashboardLayout title="Binance Dashboard">
      <main>
        <BinanceView />
      </main>
    </DashboardLayout>
  );
}
