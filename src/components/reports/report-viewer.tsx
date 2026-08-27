'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  TrendingUp,
  TrendingDown,
  PiggyBank,
  CreditCard,
  FileText,
  AlertCircle,
  CheckCircle2,
  Info,
  Bug,
  Flame,
} from 'lucide-react';
import type { ReportData } from '@/lib/reports-engine';
import { AiExportButton } from './ai-export-button';

interface ReportViewerProps {
  data: ReportData;
  markdown: string;
}

const formatCurrency = (val: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val);

export function ReportViewer({ data, markdown }: ReportViewerProps) {
  const isCurrentMonth = data.config.period === 'current_month';

  return (
    <div className="space-y-6">
      {/* Header Bar con Botón de Exportación */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">
            {data.periodLabel} ({data.startDate} ~ {data.endDate})
          </h2>
          <p className="text-sm text-muted-foreground">
            Resumen consolidado y análisis financiero listo para exportación.
          </p>
        </div>
        <AiExportButton markdown={markdown} periodLabel={data.periodLabel} />
      </div>

      {/* KPI Cards Principal */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="border-l-4 border-l-emerald-500">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Ingresos Totales
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
              {formatCurrency(data.totalIncome)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Período {data.periodLabel}
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-rose-500">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Gastos Totales
            </CardTitle>
            <TrendingDown className="h-4 w-4 text-rose-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-rose-600 dark:text-rose-400">
              {formatCurrency(data.totalExpenses)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {data.recentTransactionsCount} transacciones evaluadas
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-sky-500">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Ahorro Neto y Tasa
            </CardTitle>
            <PiggyBank className="h-4 w-4 text-sky-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-sky-600 dark:text-sky-400">
              {formatCurrency(data.netSavings)}
            </div>
            <div className="mt-1 flex items-center gap-1.5">
              <Badge variant={data.savingsRate >= 20 ? 'default' : 'secondary'}>
                {data.savingsRate.toFixed(1)}% tasa ahorro
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Tarjeta de Deuda Viva Actual con Aclaración Clara de Saldo por Pagar */}
        <Card className="border-l-4 border-l-amber-500">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Deuda Viva Pendiente Actual
              </CardTitle>
              <span className="text-[10px] text-amber-600 dark:text-amber-400 block font-normal">
                (Saldo por pagar al día de hoy)
              </span>
            </div>
            <CreditCard className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">
              {formatCurrency(data.totalPendingDebt)}
            </div>
            <div className="mt-1 flex items-center justify-between">
              <p className="text-xs text-muted-foreground">
                Ratio DTI: <span className="font-semibold">{data.dtiRatio.toFixed(1)}%</span>
              </p>
              <div className="group relative flex items-center cursor-help">
                <Info className="h-3.5 w-3.5 text-muted-foreground hover:text-foreground" />
                <div className="absolute right-0 bottom-full mb-1 hidden group-hover:block w-56 rounded bg-popover p-2 text-[11px] text-popover-foreground shadow-md border z-50">
                  Monto neto restante por abonar al día de hoy en deudas activas. No incluye deudas históricas ya saldadas.
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* BLOQUE ESPECIAL: Gastos Hormiga (Fugas Invisibles) */}
      <Card className="border-orange-500/30 bg-gradient-to-br from-orange-500/5 via-background to-background dark:border-orange-500/20">
        <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3">
          <div>
            <CardTitle className="text-lg flex items-center gap-2 text-orange-600 dark:text-orange-400">
              <Bug className="h-5 w-5" />
              Análisis de Gastos Hormiga (Fugas Invisibles ≤ $15 USD)
            </CardTitle>
            <CardDescription>
              Pequeños consumos diarios no planificados que acumulan un impacto financiero significativo.
            </CardDescription>
          </div>
          <Badge variant="outline" className="w-fit border-orange-500/40 text-orange-600 dark:text-orange-400 gap-1 font-mono">
            <Flame className="h-3.5 w-3.5" /> Proyección: {formatCurrency(data.microExpenses.annualProjection)}/año
          </Badge>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="rounded-lg border bg-card p-3">
              <p className="text-xs text-muted-foreground">Total Fuga en Período</p>
              <p className="text-xl font-bold text-orange-600 dark:text-orange-400 mt-0.5">
                {formatCurrency(data.microExpenses.totalAmount)}
              </p>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Representa el <span className="font-semibold">{data.microExpenses.percentageOfTotalExpenses.toFixed(1)}%</span> de tus gastos totales
              </p>
            </div>
            <div className="rounded-lg border bg-card p-3">
              <p className="text-xs text-muted-foreground">Frecuencia de Compras</p>
              <p className="text-xl font-bold mt-0.5">
                {data.microExpenses.transactionCount} <span className="text-sm font-normal text-muted-foreground">transacciones</span>
              </p>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Promedio de {formatCurrency(data.microExpenses.averageAmount)} por compra
              </p>
            </div>
            <div className="rounded-lg border bg-card p-3">
              <p className="text-xs text-muted-foreground">Impacto Anual Estimado</p>
              <p className="text-xl font-bold text-rose-600 dark:text-rose-400 mt-0.5">
                {formatCurrency(data.microExpenses.annualProjection)}
              </p>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Si este hábito se mantiene constante 12 meses
              </p>
            </div>
          </div>

          {/* Tabla de Gastos Hormiga Detectados */}
          {data.microExpenses.items.length > 0 && (
            <div className="rounded-md border overflow-x-auto bg-card">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Descripción del Gasto</TableHead>
                    <TableHead>Categoría</TableHead>
                    <TableHead className="text-right">Monto USD</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.microExpenses.items.map((item, idx) => (
                    <TableRow key={`micro-${item.description}-${idx}`}>
                      <TableCell className="font-mono text-xs text-muted-foreground">{item.date}</TableCell>
                      <TableCell className="font-medium text-sm">{item.description}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs font-normal">
                          {item.category}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-mono font-semibold text-orange-600 dark:text-orange-400">
                        {formatCurrency(item.amount)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* TABLA 1: Desglose de Ingresos por Categoría */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-emerald-500" />
            Desglose de Ingresos por Categoría
          </CardTitle>
          <CardDescription>
            Tabla de solo lectura con los ingresos recibidos agrupados por categoría
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Categoría de Ingreso</TableHead>
                  <TableHead className="text-right">Monto Recibido ($)</TableHead>
                  <TableHead className="text-right">% del Total de Ingresos</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.incomeCategoryBreakdown.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center py-6 text-muted-foreground">
                      No hay ingresos registrados en este período.
                    </TableCell>
                  </TableRow>
                ) : (
                  data.incomeCategoryBreakdown.map((cat) => (
                    <TableRow key={cat.category}>
                      <TableCell className="font-semibold">{cat.category}</TableCell>
                      <TableCell className="text-right text-emerald-600 dark:text-emerald-400 font-mono font-medium">
                        {formatCurrency(cat.income)}
                      </TableCell>
                      <TableCell className="text-right font-mono text-muted-foreground">
                        {cat.percentageOfTotal.toFixed(1)}%
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* TABLA 2: Desglose de Gastos por Categoría */}
      <Card>
        <CardHeader className="flex flex-row items-start justify-between">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              <TrendingDown className="h-5 w-5 text-rose-500" />
              Desglose de Gastos por Categoría
            </CardTitle>
            <CardDescription>
              {isCurrentMonth
                ? 'Comparación de gastos reales contra los pagos programados / borrador de /budget'
                : 'Gastos por categoría registrados en este período histórico'}
            </CardDescription>
          </div>
          {!isCurrentMonth && (
            <Badge variant="outline" className="text-xs">
              Presupuesto sólo aplica en Mes Actual
            </Badge>
          )}
        </CardHeader>
        <CardContent>
          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Categoría de Gasto</TableHead>
                  <TableHead className="text-right">Gastos Reales</TableHead>
                  <TableHead className="text-right">
                    {isCurrentMonth ? 'Presupuesto Borrador' : 'Presupuesto'}
                  </TableHead>
                  <TableHead className="text-right">Desviación ($)</TableHead>
                  <TableHead className="text-center">Estado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.expenseCategoryBreakdown.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-6 text-muted-foreground">
                      No hay gastos registrados en este período.
                    </TableCell>
                  </TableRow>
                ) : (
                  data.expenseCategoryBreakdown.map((cat) => {
                    const isExceeded = isCurrentMonth && cat.variance > 0 && cat.budgetAmount > 0;
                    return (
                      <TableRow key={cat.category}>
                        <TableCell className="font-semibold">{cat.category}</TableCell>
                        <TableCell className="text-right text-rose-600 dark:text-rose-400 font-mono font-medium">
                          {formatCurrency(cat.expenses)}
                        </TableCell>
                        <TableCell className="text-right font-mono">
                          {isCurrentMonth ? (
                            cat.budgetAmount > 0 ? (
                              formatCurrency(cat.budgetAmount)
                            ) : (
                              <span className="text-xs text-muted-foreground">Sin borrador</span>
                            )
                          ) : (
                            <span className="text-xs text-muted-foreground">N/A (Histórico)</span>
                          )}
                        </TableCell>
                        <TableCell
                          className={`text-right font-mono font-medium ${isExceeded
                            ? 'text-rose-600 dark:text-rose-400'
                            : 'text-emerald-600 dark:text-emerald-400'
                            }`}
                        >
                          {!isCurrentMonth || cat.budgetAmount === 0 ? (
                            '-'
                          ) : cat.variance > 0 ? (
                            `+${formatCurrency(cat.variance)}`
                          ) : (
                            formatCurrency(cat.variance)
                          )}
                        </TableCell>
                        <TableCell className="text-center">
                          {!isCurrentMonth ? (
                            <Badge variant="outline" className="text-xs">
                              Histórico
                            </Badge>
                          ) : cat.budgetAmount === 0 ? (
                            <Badge variant="secondary" className="text-xs">
                              Sin meta fijada
                            </Badge>
                          ) : isExceeded ? (
                            <Badge variant="destructive" className="gap-1">
                              <AlertCircle className="h-3 w-3" /> Excedido
                            </Badge>
                          ) : (
                            <Badge variant="default" className="gap-1 bg-emerald-600 hover:bg-emerald-700">
                              <CheckCircle2 className="h-3 w-3" /> En borrador
                            </Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Top Mayores Gastos */}
      {data.topExpenses.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Top 5 Mayores Gastos del Período</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Descripción</TableHead>
                    <TableHead>Categoría</TableHead>
                    <TableHead className="text-right">Monto USD</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.topExpenses.map((exp, idx) => (
                    <TableRow key={`${exp.description}-${idx}`}>
                      <TableCell className="font-mono text-xs">{exp.date}</TableCell>
                      <TableCell className="font-medium">{exp.description}</TableCell>
                      <TableCell>
                        <Badge variant="secondary">{exp.category}</Badge>
                      </TableCell>
                      <TableCell className="text-right font-mono font-semibold text-rose-600 dark:text-rose-400">
                        {formatCurrency(exp.amount)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Vista Previa de Markdown e IA */}
      <Card className="border-dashed">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg">Vista Previa de Markdown (.md)</CardTitle>
          </div>
          <AiExportButton markdown={markdown} periodLabel={data.periodLabel} />
        </CardHeader>
        <CardContent>
          <pre className="max-h-80 overflow-y-auto rounded-lg bg-muted p-4 text-xs font-mono whitespace-pre-wrap">
            {markdown}
          </pre>
        </CardContent>
      </Card>
    </div>
  );
}
