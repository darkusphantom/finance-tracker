import { DashboardLayout } from '@/components/dashboard-layout';
import { FinancialChatbot } from '@/components/financial-chatbot';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { AddTransactionSheet } from '@/components/add-transaction-sheet';

export default function ChatPage() {
  return (
    <DashboardLayout>
      <header className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-4">
          <SidebarTrigger className="md:hidden" />
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
            AI Financial Advisor
          </h1>
        </div>
         <AddTransactionSheet />
      </header>
      <main>
        <FinancialChatbot />
      </main>
    </DashboardLayout>
  );
}
