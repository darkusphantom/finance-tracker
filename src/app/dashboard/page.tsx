import { AccountBalances } from '@/components/account-balances';
import { Debts } from '@/components/debts';
import { FinancialChart } from '@/components/financial-chart';
import { MonthlyOverview } from '@/components/monthly-overview';
import { getAccounts, getAllTransactions, getDebts, getMonthlySavings, getWishlist } from '@/lib/notion';
import {
  transformAccountData,
  transformDebtData,
  transformTransactionData,
  transformMonthlySavingsData,
  transformWishlistData,
} from '@/lib/utils';
import { DashboardClientLayout } from '@/components/dashboard-client-layout';
import { Wishlist } from '@/components/wishlist';

export const revalidate = 0;

export default async function DashboardPage() {
  const rawAccounts = await getAccounts(process.env.NOTION_ACCOUNTS_DB!);
  const accounts = transformAccountData(rawAccounts);

  const rawDebts = await getDebts(process.env.NOTION_DEBTS_DB!);
  const debts = transformDebtData(rawDebts);

  const rawTransactions = await getAllTransactions(
    process.env.NOTION_TRANSACTIONS_DB!,
    process.env.NOTION_INCOME_DB!
  );
  const transactions = transformTransactionData(rawTransactions);

  const rawMonthlySavings = await getMonthlySavings(process.env.NOTION_TOTAL_SAVINGS_DB!);
  const monthlySavings = transformMonthlySavingsData(rawMonthlySavings);

  const rawWishlist = await getWishlist(
    process.env.NOTION_WISHLIST_DB!
  );
  const wishlistItems = transformWishlistData(rawWishlist);


  return (
    <DashboardClientLayout accounts={accounts}>
      <main className="space-y-6">
        <MonthlyOverview monthlySavings={monthlySavings} />
        <FinancialChart transactions={transactions} />
        <div className="grid gap-6 md:grid-cols-3">
          <div className="md:col-span-2">
            <AccountBalances isEditable={false} initialAccounts={accounts} />
            <div className="mt-4">
              <Wishlist isEditable={false} initialItems={wishlistItems} />
            </div>
          </div>
          <div className="md:col-span-1">
            <Debts isEditable={false} initialDebts={debts} />
          </div>
        </div>
      </main>
    </DashboardClientLayout>
  );
}
