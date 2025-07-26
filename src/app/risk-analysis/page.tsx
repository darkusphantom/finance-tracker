import { DashboardLayout } from '@/components/dashboard-layout';
import { RiskProfileQuestionnaire } from '@/components/risk-profile-questionnaire';
import { SidebarTrigger } from '@/components/ui/sidebar';

export default function RiskAnalysisPage() {
  return (
    <DashboardLayout>
      <header className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-4">
          <SidebarTrigger className="md:hidden" />
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
            Financial Risk Analysis
          </h1>
        </div>
      </header>
      <main>
        <RiskProfileQuestionnaire />
      </main>
    </DashboardLayout>
  );
}
