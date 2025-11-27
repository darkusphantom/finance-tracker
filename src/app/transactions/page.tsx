import { AddTransactionSheet } from '@/components/add-transaction-sheet';
import { DashboardLayout } from '@/components/dashboard-layout';
import { TransactionsTable } from '@/components/transactions-table';
import { getAllTransactions, getAccounts } from '@/lib/notion';
import { transformTransactionData, transformAccountData } from '@/lib/utils';

export const revalidate = 0;

export default async function TransactionsPage() {
  const rawTransactions = await getAllTransactions(
    process.env.NOTION_TRANSACTIONS_DB!,
    process.env.NOTION_INCOME_DB!
  );
  const transactions = transformTransactionData(rawTransactions);
  
  const rawAccounts = await getAccounts(process.env.NOTION_ACCOUNTS_DB!);
  const accounts = transformAccountData(rawAccounts);

  return (
    <DashboardLayout
      title="Transactions"
      headerActions={<AddTransactionSheet accounts={accounts} />}
    >
      <main>
        <TransactionsTable initialTransactions={transactions} />
      </main>
    </DashboardLayout>
  );
}
