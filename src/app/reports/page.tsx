import { requireAuth } from '@/lib/auth';
import { generateReportAction } from '@/app/actions';
import { ReportsView } from '@/components/reports/reports-view';
import type { ReportData } from '@/lib/reports-engine';

export const revalidate = 0;

export default async function ReportsPage() {
  await requireAuth();

  const defaultConfig = {
    period: 'current_month' as const,
    template: 'executive' as const,
  };

  const result = await generateReportAction(defaultConfig);

  const reportData = (result.reportData as ReportData) || {
    periodLabel: 'Mes Actual',
    startDate: '',
    endDate: '',
    totalIncome: 0,
    totalExpenses: 0,
    netSavings: 0,
    savingsRate: 0,
    dtiRatio: 0,
    totalAccountsBalance: 0,
    totalPendingDebt: 0,
    totalDebtorsCredit: 0,
    incomeCategoryBreakdown: [],
    expenseCategoryBreakdown: [],
    categoryBreakdown: [],
    microExpenses: {
      totalAmount: 0,
      transactionCount: 0,
      percentageOfTotalExpenses: 0,
      averageAmount: 0,
      annualProjection: 0,
      items: [],
    },
    topExpenses: [],
    recentTransactionsCount: 0,
    config: defaultConfig,
  };

  const markdown = result.markdown || '# INFORMES FINANCIEROS\nNo hay datos disponibles.';

  return <ReportsView initialReportData={reportData} initialMarkdown={markdown} />;
}
