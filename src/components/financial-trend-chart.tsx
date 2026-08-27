'use client';

import { useState, useMemo } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Brush,
} from 'recharts';
import {
  format,
  parseISO,
  getDaysInMonth,
  setDate as setDateOfMonth,
  isSameDay,
  startOfYear,
  startOfMonth,
  endOfMonth,
  subDays,
  isWithinInterval,
  endOfWeek,
  eachWeekOfInterval,
  eachMonthOfInterval,
  getYear,
} from 'date-fns';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Activity, Calendar as CalendarIcon } from 'lucide-react';
import { Input } from '@/components/ui/input';

/** Formats a numeric value as a USD currency string. */
const formatCurrency = (value: number): string =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);

/** Minimal transaction shape required by this component. */
interface Transaction {
  id: string;
  date: string;
  amount: number;
  realUsdAmount: number | null;
  type: 'income' | 'expense';
}

interface FinancialTrendChartProps {
  /** Dataset of transactions. */
  transactions: Transaction[];
  /** Reference date (active month/year). */
  date: Date;
}

export type TrendPeriodMode = 'days' | 'weeks' | 'months' | 'year' | 'custom';

interface TrendDataPoint {
  label: string;
  net: number;
  cumulativeBalance: number;
}

/** Custom Tooltip component for the trend chart. */
const CustomTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null;
  const data: TrendDataPoint = payload[0].payload;

  return (
    <div className="rounded-lg border bg-card px-3 py-2 shadow-md text-sm space-y-1">
      <p className="font-semibold text-foreground">{data.label}</p>
      <div className="text-xs space-y-0.5">
        <p className="text-muted-foreground">
          Period Net:{' '}
          <span className={`font-medium ${data.net >= 0 ? 'text-primary' : 'text-destructive'}`}>
            {formatCurrency(data.net)}
          </span>
        </p>
        <p className="text-muted-foreground">
          Cumulative:{' '}
          <span className={`font-semibold ${data.cumulativeBalance >= 0 ? 'text-primary' : 'text-destructive'}`}>
            {formatCurrency(data.cumulativeBalance)}
          </span>
        </p>
      </div>
    </div>
  );
};

/**
 * `FinancialTrendChart`
 *
 * Interactive trend chart supporting 5 period granularities:
 * - **Days** (`days`): Daily breakdown for the active month.
 * - **Weeks** (`weeks`): Weekly breakdown for the active month.
 * - **Months** (`months`): Monthly breakdown for the active year.
 * - **Year / 360d** (`year`): Monthly evolution over the last 360 days.
 * - **Custom** (`custom`): Custom date range selector `[StartDate, EndDate]`.
 *
 * Includes interactive `<Brush />` slider for zooming.
 *
 * @param props - See {@link FinancialTrendChartProps}.
 */
export function FinancialTrendChart({ transactions, date }: FinancialTrendChartProps) {
  const [periodMode, setPeriodMode] = useState<TrendPeriodMode>('days');

  /* Custom date range state */
  const defaultStart = format(subDays(new Date(), 30), 'yyyy-MM-dd');
  const defaultEnd = format(new Date(), 'yyyy-MM-dd');
  const [customStart, setCustomStart] = useState<string>(defaultStart);
  const [customEnd, setCustomEnd] = useState<string>(defaultEnd);

  /**
   * Computes trend data points dynamically based on the selected periodMode.
   * @complexity O(n + p) where n = transactions, p = period intervals
   */
  const trendData = useMemo<TrendDataPoint[]>(() => {
    let points: { label: string; filterFn: (t: Transaction) => boolean }[] = [];

    if (periodMode === 'days') {
      // Days mode: Day 1 to Last Day of active month
      const daysInMonth = getDaysInMonth(date);
      points = Array.from({ length: daysInMonth }, (_, i) => {
        const dayNum = i + 1;
        const dayDate = setDateOfMonth(date, dayNum);
        return {
          label: `${format(date, 'MMM')} ${dayNum}`,
          filterFn: (t: Transaction) => isSameDay(parseISO(t.date), dayDate),
        };
      });
    } else if (periodMode === 'weeks') {
      // Weeks mode: Weekly buckets for active month
      const mStart = startOfMonth(date);
      const mEnd = endOfMonth(date);
      const weeks = eachWeekOfInterval({ start: mStart, end: mEnd }, { weekStartsOn: 1 });

      points = weeks.map((wStart, idx) => {
        const wEnd = endOfWeek(wStart, { weekStartsOn: 1 });
        return {
          label: `W${idx + 1} (${format(wStart, 'MMM d')})`,
          filterFn: (t: Transaction) => {
            const d = parseISO(t.date);
            return isWithinInterval(d, { start: wStart, end: wEnd });
          },
        };
      });
    } else if (periodMode === 'months') {
      // Months mode: 12 months for active year
      const activeYear = getYear(date);
      const yStart = startOfYear(date);
      const months = eachMonthOfInterval({ start: yStart, end: new Date(activeYear, 11, 31) });

      points = months.map((mStart) => {
        const mEnd = endOfMonth(mStart);
        return {
          label: format(mStart, 'MMM yyyy'),
          filterFn: (t: Transaction) => {
            const d = parseISO(t.date);
            return isWithinInterval(d, { start: mStart, end: mEnd });
          },
        };
      });
    } else if (periodMode === 'year') {
      // 360 days / 1 Year mode: Last 12 months from today
      const today = new Date();
      const yearAgo = subDays(today, 360);
      const months = eachMonthOfInterval({ start: yearAgo, end: today });

      points = months.map((mStart) => {
        const mEnd = endOfMonth(mStart);
        return {
          label: format(mStart, 'MMM yyyy'),
          filterFn: (t: Transaction) => {
            const d = parseISO(t.date);
            return isWithinInterval(d, { start: mStart, end: mEnd });
          },
        };
      });
    } else if (periodMode === 'custom') {
      // Custom date range mode
      const startDate = parseISO(customStart);
      const endDate = parseISO(customEnd);

      if (isNaN(startDate.getTime()) || isNaN(endDate.getTime()) || startDate > endDate) {
        return [];
      }

      // Generate daily points between startDate and endDate
      const diffDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
      const safeDiffDays = Math.min(Math.max(diffDays, 1), 365); // Cap at 365 days max for UI performance

      points = Array.from({ length: safeDiffDays }, (_, i) => {
        const currentDay = new Date(startDate);
        currentDay.setDate(currentDay.getDate() + i);
        return {
          label: format(currentDay, 'MMM d, yyyy'),
          filterFn: (t: Transaction) => isSameDay(parseISO(t.date), currentDay),
        };
      });
    }

    let runningTotal = 0;
    return points.map(({ label, filterFn }) => {
      const matchedTxns = transactions.filter(filterFn);

      const income = matchedTxns
        .filter((t) => t.type === 'income')
        .reduce((sum, t) => sum + (t.realUsdAmount ?? t.amount), 0);

      const expenses = Math.abs(
        matchedTxns
          .filter((t) => t.type === 'expense')
          .reduce((sum, t) => sum + (t.realUsdAmount ?? t.amount), 0)
      );

      const net = income - expenses;
      runningTotal += net;

      return {
        label,
        net,
        cumulativeBalance: runningTotal,
      };
    });
  }, [transactions, date, periodMode, customStart, customEnd]);

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0">
          <div className="flex items-center gap-2">
            <span className="h-7 w-7 rounded-full bg-primary/10 text-primary flex items-center justify-center">
              <Activity className="h-4 w-4" />
            </span>
            <div>
              <CardTitle className="text-base">Cumulative Financial Trend</CardTitle>
              <CardDescription className="text-xs">
                {periodMode === 'days' && `Daily breakdown for ${format(date, 'MMMM yyyy')}`}
                {periodMode === 'weeks' && `Weekly breakdown for ${format(date, 'MMMM yyyy')}`}
                {periodMode === 'months' && `Monthly breakdown for ${format(date, 'yyyy')}`}
                {periodMode === 'year' && `Rolling 360-day trend`}
                {periodMode === 'custom' && `Custom period: ${customStart} to ${customEnd}`}
              </CardDescription>
            </div>
          </div>

          {/* Period Mode Selector */}
          <div className="flex flex-wrap rounded-md border overflow-hidden text-xs self-end sm:self-auto">
            {(
              [
                { key: 'days', label: 'Días' },
                { key: 'weeks', label: 'Semanas' },
                { key: 'months', label: 'Meses' },
                { key: 'year', label: 'Año (360d)' },
                { key: 'custom', label: 'Personalizado' },
              ] as const
            ).map((m) => (
              <button
                key={m.key}
                onClick={() => setPeriodMode(m.key)}
                className={`px-3 py-1 font-medium transition-colors ${periodMode === m.key
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-transparent text-muted-foreground hover:bg-accent hover:text-foreground'
                  }`}
              >
                {m.label}
              </button>
            ))}
          </div>
        </div>

        {/* Custom date range inputs */}
        {periodMode === 'custom' && (
          <div className="flex flex-wrap items-center gap-3 pt-3 border-t mt-3 text-xs">
            <span className="flex items-center gap-1 font-medium text-muted-foreground">
              <CalendarIcon className="h-3.5 w-3.5" /> Date Range:
            </span>
            <div className="flex items-center gap-2">
              <label className="text-muted-foreground">From:</label>
              <Input
                type="date"
                value={customStart}
                onChange={(e) => setCustomStart(e.target.value)}
                className="h-7 text-xs w-36 px-2"
              />
            </div>
            <div className="flex items-center gap-2">
              <label className="text-muted-foreground">To:</label>
              <Input
                type="date"
                value={customEnd}
                onChange={(e) => setCustomEnd(e.target.value)}
                className="h-7 text-xs w-36 px-2"
              />
            </div>
          </div>
        )}
      </CardHeader>

      <CardContent>
        {trendData.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-56 text-muted-foreground border border-dashed rounded-lg">
            <p className="text-sm">No data available for the selected period.</p>
          </div>
        ) : (
          <div className="h-64 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="trendGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0.0} />
                  </linearGradient>
                </defs>

                <CartesianGrid strokeDasharray="3 3" className="stroke-border" vertical={false} />

                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 10 }}
                  className="fill-muted-foreground"
                  axisLine={false}
                  tickLine={false}
                  interval="preserveStartEnd"
                />

                <YAxis
                  tick={{ fontSize: 10 }}
                  className="fill-muted-foreground"
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) => `$${v}`}
                  width={48}
                />

                <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'hsl(var(--muted-foreground))', strokeWidth: 1 }} />

                <Area
                  type="monotone"
                  dataKey="cumulativeBalance"
                  name="Cumulative Balance"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#trendGradient)"
                />

                {/* Interactive Zoom / Pan control */}
                <Brush
                  dataKey="label"
                  height={24}
                  stroke="hsl(var(--primary))"
                  fill="hsl(var(--card))"
                  tickFormatter={() => ''}
                  startIndex={0}
                  endIndex={trendData.length - 1}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
