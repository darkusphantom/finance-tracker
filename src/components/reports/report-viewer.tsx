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
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import {
  TrendingUp,
  TrendingDown,
  PiggyBank,
  CreditCard,
  FileText,
  AlertCircle,
  CheckCircle2,
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
  const chartData = data.categoryBreakdown.map((cat) => ({
    name: cat.category,
    Gastos: cat.expenses,
    Presupuesto: cat.budgetAmount,
  }));

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

      {/* KPI Cards */}
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

        <Card className="border-l-4 border-l-amber-500">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Deuda Pendiente (DTI)
            </CardTitle>
            <CreditCard className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">
              {formatCurrency(data.totalPendingDebt)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Ratio DTI: <span className="font-semibold">{data.dtiRatio.toFixed(1)}%</span>
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Gráfico Comparativo: Gastos vs Presupuesto por Categoría */}
      {chartData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Comparativo Gastos vs. Presupuesto</CardTitle>
            <CardDescription>
              Relación visual por categoría para detectar sobrecostos
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} interval={0} angle={-15} textAnchor="end" />
                  <YAxis tickFormatter={(val) => `$${val}`} tick={{ fontSize: 12 }} />
                  <Tooltip formatter={(value: number) => formatCurrency(value)} />
                  <Legend />
                  <Bar dataKey="Gastos" fill="hsl(var(--destructive))" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Presupuesto" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tabla de Desglose por Categoría */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Desglose Detallado por Categoría</CardTitle>
          <CardDescription>
            Tabla de solo lectura con métricas de desviación de presupuesto
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Categoría</TableHead>
                  <TableHead className="text-right">Ingresos</TableHead>
                  <TableHead className="text-right">Gastos</TableHead>
                  <TableHead className="text-right">Presupuesto</TableHead>
                  <TableHead className="text-right">Desviación ($)</TableHead>
                  <TableHead className="text-center">Estado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.categoryBreakdown.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-6 text-muted-foreground">
                      No hay transacciones registradas en este período.
                    </TableCell>
                  </TableRow>
                ) : (
                  data.categoryBreakdown.map((cat) => {
                    const isExceeded = cat.variance > 0 && cat.budgetAmount > 0;
                    return (
                      <TableRow key={cat.category}>
                        <TableCell className="font-semibold">{cat.category}</TableCell>
                        <TableCell className="text-right text-emerald-600 dark:text-emerald-400 font-mono">
                          {formatCurrency(cat.income)}
                        </TableCell>
                        <TableCell className="text-right text-rose-600 dark:text-rose-400 font-mono">
                          {formatCurrency(cat.expenses)}
                        </TableCell>
                        <TableCell className="text-right font-mono">
                          {cat.budgetAmount > 0 ? formatCurrency(cat.budgetAmount) : '-'}
                        </TableCell>
                        <TableCell
                          className={`text-right font-mono font-medium ${
                            isExceeded
                              ? 'text-rose-600 dark:text-rose-400'
                              : 'text-emerald-600 dark:text-emerald-400'
                          }`}
                        >
                          {cat.variance > 0 ? `+${formatCurrency(cat.variance)}` : formatCurrency(cat.variance)}
                        </TableCell>
                        <TableCell className="text-center">
                          {cat.budgetAmount === 0 ? (
                            <Badge variant="outline">Sin presupuesto</Badge>
                          ) : isExceeded ? (
                            <Badge variant="destructive" className="gap-1">
                              <AlertCircle className="h-3 w-3" /> Excedido
                            </Badge>
                          ) : (
                            <Badge variant="default" className="gap-1 bg-emerald-600 hover:bg-emerald-700">
                              <CheckCircle2 className="h-3 w-3" /> En límite
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
            <CardTitle className="text-lg">Top 5 Mayores Gastos</CardTitle>
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
