'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { SlidersHorizontal } from 'lucide-react';
import type { ReportConfig, ReportPeriod, ReportTemplate } from '@/lib/reports-engine';

interface ReportConfigModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  config: ReportConfig;
  onApplyConfig: (newConfig: ReportConfig) => void;
}

/**
 * Modal de configuración de reportes financieros que permite seleccionar
 * el período de análisis y el tipo de plantilla de reporte.
 */
export function ReportConfigModal({
  open,
  onOpenChange,
  config,
  onApplyConfig,
}: ReportConfigModalProps) {
  const [period, setPeriod] = useState<ReportPeriod>(config.period);
  const [template, setTemplate] = useState<ReportTemplate>(config.template);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onApplyConfig({
      period,
      template,
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl font-bold">
              <SlidersHorizontal className="h-5 w-5 text-primary" />
              Configurar Reporte Financiero
            </DialogTitle>
            <DialogDescription>
              Selecciona el rango de fechas y la plantilla de análisis que deseas visualizar.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            {/* Período */}
            <div className="grid gap-2">
              <Label htmlFor="period-select" className="text-sm font-semibold">
                Período de Análisis
              </Label>
              <Select
                value={period}
                onValueChange={(val) => setPeriod(val as ReportPeriod)}
              >
                <SelectTrigger id="period-select">
                  <SelectValue placeholder="Selecciona un período" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="current_month">Mes Actual</SelectItem>
                  <SelectItem value="previous_month">Mes Anterior</SelectItem>
                  <SelectItem value="last_3_months">Últimos 3 Meses</SelectItem>
                  <SelectItem value="all">Histórico Completo</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Plantilla */}
            <div className="grid gap-2">
              <Label htmlFor="template-select" className="text-sm font-semibold">
                Plantilla de Reporte
              </Label>
              <Select
                value={template}
                onValueChange={(val) => setTemplate(val as ReportTemplate)}
              >
                <SelectTrigger id="template-select">
                  <SelectValue placeholder="Selecciona una plantilla" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="executive">Resumen Ejecutivo</SelectItem>
                  <SelectItem value="budget_vs_real">Presupuesto vs Real</SelectItem>
                  <SelectItem value="category_breakdown">Desglose por Categorías</SelectItem>
                  <SelectItem value="ai_health">Evaluación para IA (Prompting)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button type="submit">Generar Reporte</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
