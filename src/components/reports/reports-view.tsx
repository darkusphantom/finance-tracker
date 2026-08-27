'use client';

import { useState, useTransition } from 'react';
import { DashboardLayout } from '@/components/dashboard-layout';
import { Button } from '@/components/ui/button';
import { SlidersHorizontal, RefreshCw } from 'lucide-react';
import { generateReportAction } from '@/app/actions';
import type { ReportConfig, ReportData } from '@/lib/reports-engine';
import { ReportConfigModal } from './report-config-modal';
import { ReportViewer } from './report-viewer';

interface ReportsViewProps {
  initialReportData: ReportData;
  initialMarkdown: string;
}

export function ReportsView({
  initialReportData,
  initialMarkdown,
}: ReportsViewProps) {
  const [config, setConfig] = useState<ReportConfig>(initialReportData.config);
  const [reportData, setReportData] = useState<ReportData>(initialReportData);
  const [markdown, setMarkdown] = useState<string>(initialMarkdown);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const handleApplyConfig = (newConfig: ReportConfig) => {
    setConfig(newConfig);
    startTransition(async () => {
      const res = await generateReportAction(newConfig);
      if (res.success && res.reportData && res.markdown) {
        setReportData(res.reportData as ReportData);
        setMarkdown(res.markdown);
      } else if (res.error) {
        console.error('Error al actualizar reporte:', res.error);
      }
    });
  };

  const headerActions = (
    <div className="flex items-center gap-2">
      <Button
        onClick={() => setIsModalOpen(true)}
        variant="outline"
        className="gap-2"
        disabled={isPending}
      >
        {isPending ? (
          <RefreshCw className="h-4 w-4 animate-spin text-primary" />
        ) : (
          <SlidersHorizontal className="h-4 w-4 text-primary" />
        )}
        <span>Filtros y Plantilla</span>
      </Button>
    </div>
  );

  return (
    <DashboardLayout title="Informes Financieros" headerActions={headerActions}>
      <div className="space-y-6">
        <ReportViewer data={reportData} markdown={markdown} />

        <ReportConfigModal
          open={isModalOpen}
          onOpenChange={setIsModalOpen}
          config={config}
          onApplyConfig={handleApplyConfig}
        />
      </div>
    </DashboardLayout>
  );
}
