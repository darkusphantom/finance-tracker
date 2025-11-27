import { DashboardLayout } from '@/components/dashboard-layout';
import { FinancialChatbot } from '@/components/financial-chatbot';

export default function ChatPage() {
  return (
    <DashboardLayout title="AI Financial Advisor">
      <main>
        <FinancialChatbot />
      </main>
    </DashboardLayout>
  );
}
