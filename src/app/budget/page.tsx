import { DashboardLayout } from '@/components/dashboard-layout';
import { BudgetView } from '@/components/budget-view';
import {
  getAllTransactions,
  getScheduledPayments,
  getWishlist,
} from '@/lib/notion';
import {
  transformTransactionData,
  transformScheduledPaymentsData,
  transformWishlistData,
} from '@/lib/utils';
import { ScheduledPayments } from '@/components/scheduled-payments';
import { Wishlist } from '@/components/wishlist';
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

  const rawWishlist = await getWishlist(
    process.env.NOTION_WISHLIST_DB!
  );
  const wishlist = transformWishlistData(rawWishlist);

  return (
    <DashboardLayout title="Budget">
      <main className="space-y-6">
        <BudgetView transactions={transactions} />
        <Separator />
        <ScheduledPayments initialItems={scheduledPayments} />
        <Separator />
        <Wishlist initialItems={wishlist} />
      </main>
    </DashboardLayout>
  );
}
