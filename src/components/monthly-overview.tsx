import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

type MonthData = {
  id: string;
  name: string;
  monthNumber: number;
  totalIncome: number;
  totalExpenses: number;
  net: number;
};

function StatCard({
  label,
  value,
  variant,
}: {
  label: string;
  value: number;
  variant: 'income' | 'expense' | 'net';
}) {
  const colorClass =
    variant === 'income'
      ? 'text-primary'
      : variant === 'expense'
        ? 'text-destructive'
        : value >= 0
          ? 'text-primary'
          : 'text-destructive';

  const Icon =
    variant === 'income'
      ? TrendingUp
      : variant === 'expense'
        ? TrendingDown
        : Minus;

  const prefix = variant === 'income' ? '+' : variant === 'expense' ? '-' : value >= 0 ? '+' : '';

  return (
    <div className="flex flex-col gap-1 text-center">
      <p className="text-xs text-muted-foreground uppercase tracking-wide">{label}</p>
      <p className={`text-xl font-bold flex items-center justify-center gap-1.5 ${colorClass}`}>
        <Icon className="h-4 w-4" />
        {prefix}${Math.abs(value).toFixed(2)}
      </p>
    </div>
  );
}

export function MonthlyOverview({
  monthlySavings = [],
}: {
  monthlySavings?: MonthData[];
}) {
  // ── Filter: current year only, up to the current month ──────────────────
  const now = new Date();
  const currentYear = now.getFullYear();   // e.g. 2026
  const currentMonth = now.getMonth() + 1; // 1-12, e.g. 5 for May

  const filtered = monthlySavings.filter(month => {
    // Extract the 4-digit year from the name field ("May 2026" → 2026)
    const yearMatch = month.name.match(/\d{4}/);
    const year = yearMatch ? parseInt(yearMatch[0], 10) : 0;
    return year === currentYear && month.monthNumber <= currentMonth;
  });

  if (filtered.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Monthly Overview</CardTitle>
          <CardDescription>No monthly data available yet.</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  // ── Annual totals: sum of all filtered months ────────────────────────────
  const annualIncome = filtered.reduce((s, m) => s + m.totalIncome, 0);
  const annualExpenses = filtered.reduce((s, m) => s + m.totalExpenses, 0);
  const annualNet = filtered.reduce((s, m) => s + m.net, 0);

  // Most recent month is first (sorted descending by Month Number)
  const current = filtered[0];
  const previous = filtered[1] ?? null;

  const netTrend = previous !== null ? current.net - previous.net : null;

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-0">
          <div>
            <CardTitle>Monthly Overview</CardTitle>
            <CardDescription>
              Real USD totals for <span className="font-medium text-foreground">{currentYear}</span>
            </CardDescription>
          </div>
          {netTrend !== null && (
            <Badge variant={netTrend >= 0 ? 'default' : 'destructive'} className="text-xs">
              {netTrend >= 0 ? '▲' : '▼'} {netTrend >= 0 ? '+' : ''}
              ${netTrend.toFixed(2)} vs {previous!.name}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">

        {/* ── Annual totals ──────────────────────────────── */}
        <div>
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
            Annual Summary ({currentYear})
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-4 rounded-lg border bg-muted/30 p-3 sm:p-4">
            <StatCard label="Income" value={annualIncome} variant="income" />
            <StatCard label="Expenses" value={annualExpenses} variant="expense" />
            <StatCard label="Net" value={annualNet} variant="net" />
          </div>
        </div>

        {/* ── Current month ──────────────────────────────── */}
        <div>
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
            {current.name}
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-4 rounded-lg border p-3 sm:p-4">
            <StatCard label="Income" value={current.totalIncome} variant="income" />
            <StatCard label="Expenses" value={current.totalExpenses} variant="expense" />
            <StatCard label="Net" value={current.net} variant="net" />
          </div>
        </div>

        {/* ── Historical rows ────────────────────────────── */}
        {filtered.length > 1 && (
          <div className="space-y-1">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
              Previous Months
            </p>
            {filtered.slice(1).map(month => (
              <div
                key={month.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between rounded-md px-3 py-2 text-sm hover:bg-muted/50 transition-colors gap-2 sm:gap-0"
              >
                <span className="font-medium w-full sm:w-28 shrink-0 border-b sm:border-none pb-1 sm:pb-0 mb-1 sm:mb-0">{month.name}</span>
                <div className="flex justify-between sm:justify-end sm:gap-8 w-full sm:w-auto">
                  <span className="text-primary font-mono">
                    +${month.totalIncome.toFixed(2)}
                  </span>
                  <span className="text-destructive font-mono">
                    -${month.totalExpenses.toFixed(2)}
                  </span>
                  <span
                    className={`font-mono font-semibold ${month.net >= 0 ? 'text-primary' : 'text-destructive'}`}
                  >
                    ${month.net.toFixed(2)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
