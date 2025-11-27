import { AccountBalances } from '@/components/account-balances';
import { DashboardLayout } from '@/components/dashboard-layout';
import { getAccounts } from '@/lib/notion';
import { transformAccountData } from '@/lib/utils';

export const revalidate = 0;

export default async function AccountsPage() {
    const rawAccounts = await getAccounts(process.env.NOTION_ACCOUNTS_DB!);
    const accounts = transformAccountData(rawAccounts);

  return (
    <DashboardLayout title="Accounts">
      <main>
        <AccountBalances initialAccounts={accounts}/>
      </main>
    </DashboardLayout>
  );
}
