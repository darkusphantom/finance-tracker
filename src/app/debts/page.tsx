import { DashboardLayout } from '@/components/dashboard-layout';
import { Debts } from '@/components/debts';
import { getDebts } from '@/lib/notion';
import { transformDebtData } from '@/lib/utils';

export const revalidate = 0;

export default async function DebtsPage() {
  const rawDebts = await getDebts(process.env.NOTION_DEBTS_DB!);
  const debts = transformDebtData(rawDebts);

  return (
    <DashboardLayout title="Debts">
      <main>
        <Debts initialDebts={debts}/>
      </main>
    </DashboardLayout>
  );
}
