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
import { CategoryPieChart } from '@/components/category-pie-chart';

export const revalidate = 0;

/**
 * Dashboard principal de la aplicación.
 *
 * Todos los fetches a Notion se ejecutan en paralelo con `Promise.all`
 * para minimizar el Time To Interactive (TTI).
 * Complejidad de red: O(max latencia) en lugar de O(suma latencias).
 */
export default async function DashboardPage() {
  const [
    rawAccounts,
    rawDebts,
    rawTransactions,
    rawMonthlySavings,
    rawWishlist,
  ] = await Promise.all([
    getAccounts(process.env.NOTION_ACCOUNTS_DB!),
    getDebts(process.env.NOTION_DEBTS_DB!),
    getAllTransactions(
      process.env.NOTION_TRANSACTIONS_DB!,
      process.env.NOTION_INCOME_DB!
    ),
    getMonthlySavings(process.env.NOTION_TOTAL_SAVINGS_DB!),
    getWishlist(process.env.NOTION_WISHLIST_DB!),
  ]);

  const accounts = transformAccountData(rawAccounts);
  const debts = transformDebtData(rawDebts);
  const activeDebts = debts.filter((d: any) => d.status === 'Pendiente');
  const transactions = transformTransactionData(rawTransactions);
  const monthlySavings = transformMonthlySavingsData(rawMonthlySavings);
  const wishlistItems = transformWishlistData(rawWishlist);

  return (
    <DashboardClientLayout accounts={accounts}>
      <main className="space-y-6">
        <MonthlyOverview monthlySavings={monthlySavings} />

        <FinancialChart transactions={transactions} showLink />

        {/* Category Pie Charts — read-only */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <CategoryPieChart
            transactions={transactions}
            type="expense"
            isReadOnly={true}
          />
          <CategoryPieChart
            transactions={transactions}
            type="income"
            isReadOnly={true}
          />
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          <div className="md:col-span-2">
            <AccountBalances isEditable={false} initialAccounts={accounts} />
            <div className="mt-4">
              <Wishlist isEditable={false} initialItems={wishlistItems} />
            </div>
          </div>
          <div className="md:col-span-1">
            <Debts isEditable={false} initialDebts={activeDebts} />
          </div>
        </div>
      </main>
    </DashboardClientLayout>
  );
}
