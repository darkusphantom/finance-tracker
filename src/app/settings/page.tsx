import { DashboardLayout } from '@/components/dashboard-layout';
import { UserSettingsForm } from '@/components/user-settings-form';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { getCurrentUser } from '@/app/actions';
import { redirect } from 'next/navigation';

export default async function SettingsPage() {
    const user = await getCurrentUser();

    if (!user) {
        redirect('/login');
    }

  return (
    <DashboardLayout>
      <header className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-4">
          <SidebarTrigger className="md:hidden" />
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
            Settings
          </h1>
        </div>
      </header>
      <main>
        <UserSettingsForm currentUser={user} />
      </main>
    </DashboardLayout>
  );
}
