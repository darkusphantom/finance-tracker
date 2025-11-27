import { DashboardLayout } from '@/components/dashboard-layout';
import { RiskProfileQuestionnaire } from '@/components/risk-profile-questionnaire';

export default function RiskAnalysisPage() {
  return (
    <DashboardLayout title="Financial Risk Analysis">
      <main>
        <RiskProfileQuestionnaire />
      </main>
    </DashboardLayout>
  );
}
