'use client';

import { useState, useMemo, useCallback } from 'react';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Sector,
} from 'recharts';
import {
  isSameMonth,
  isSameYear,
  parseISO,
  format,
  startOfMonth,
} from 'date-fns';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { CategoryTransactionsModal } from '@/components/category-transactions-modal';

/* ─────────────────────────────── Helpers ────────────────────────────────── */

/** Formats a number as a USD currency string. */
const formatCurrency = (value: number): string =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);

/**
 * A hand-picked palette of 12 visually distinct HSL colours.
 * They degrade gracefully when there are fewer slices.
 */
const PALETTE: string[] = [
  'hsl(221, 83%, 53%)',  // blue
  'hsl(142, 71%, 45%)',  // green
  'hsl(38, 92%, 50%)',   // amber
  'hsl(280, 68%, 60%)',  // violet
  'hsl(4, 86%, 58%)',    // red-orange
  'hsl(199, 89%, 48%)',  // cyan
  'hsl(330, 80%, 55%)',  // pink
  'hsl(160, 60%, 45%)',  // teal
  'hsl(60, 80%, 50%)',   // yellow
  'hsl(250, 60%, 65%)',  // indigo
  'hsl(20, 90%, 55%)',   // orange
  'hsl(175, 55%, 45%)',  // mint
];

/* ─────────────────────────────── Types ─────────────────────────────────── */

/** Minimal transaction shape used by this component. */
interface Transaction {
  id: string;
  date: string;
  description: string;
  amount: number;
  realUsdAmount: number | null;
  type: 'income' | 'expense';
  category: string;
  currency: string;
}

/** A single data entry for the Recharts PieChart. */
interface PieSlice {
  name: string;       // category label
  value: number;      // absolute USD amount
  transactions: Transaction[];
}

/** Controls whether we look at a single month or the whole year. */
type Period = 'month' | 'year';

interface CategoryPieChartProps {
  /** Full dataset of transactions (all dates). */
  transactions: Transaction[];
  /** The transaction type this chart shows. */
  type: 'income' | 'expense';
  /**
   * The current reference month (used in monthly view).
   * Defaults to `startOfMonth(new Date())`.
   */
  currentMonth?: Date;
  /**
   * When `true`, clicking a slice only shows a compact info popover
   * (name + total) instead of opening the full transactions modal.
   * Use this on the Dashboard.
   */
  isReadOnly?: boolean;
}

/* ─────────────── Active (hovered / tapped) slice renderer ──────────────── */

/** Recharts `activeShape` prop — highlights the active slice with an outer ring. */
const renderActiveShape = (props: Record<string, unknown>) => {
  const {
    cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill, payload, percent, value,
  } = props as {
    cx: number; cy: number; innerRadius: number; outerRadius: number;
    startAngle: number; endAngle: number; fill: string;
    payload: PieSlice; percent: number; value: number;
  };

  return (
    <g>
      {/* Centre label */}
      <text x={cx} y={cy - 10} textAnchor="middle" fill={fill} className="text-sm font-semibold" fontSize={13}>
        {payload.name}
      </text>
      <text x={cx} y={cy + 12} textAnchor="middle" fill="hsl(var(--muted-foreground))" fontSize={11}>
        {formatCurrency(value)}
      </text>
      <text x={cx} y={cy + 28} textAnchor="middle" fill="hsl(var(--muted-foreground))" fontSize={10}>
        {(percent * 100).toFixed(1)}%
      </text>

      {/* Main slice */}
      <Sector
        cx={cx} cy={cy}
        innerRadius={innerRadius as number}
        outerRadius={(outerRadius as number) + 6}
        startAngle={startAngle as number}
        endAngle={endAngle as number}
        fill={fill}
      />
      {/* Outer ring */}
      <Sector
        cx={cx} cy={cy}
        innerRadius={(outerRadius as number) + 10}
        outerRadius={(outerRadius as number) + 14}
        startAngle={startAngle as number}
        endAngle={endAngle as number}
        fill={fill}
      />
    </g>
  );
};

/* ──────────────────────── Custom Tooltip ───────────────────────────────── */

interface TooltipPayloadEntry {
  name: string;
  value: number;
  payload: PieSlice;
  fill: string;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: TooltipPayloadEntry[];
}

const CustomTooltip = ({ active, payload }: CustomTooltipProps) => {
  if (!active || !payload?.length) return null;
  const { name, value, payload: slice } = payload[0];
  const total = slice.transactions.reduce(
    (s, t) => s + Math.abs(t.realUsdAmount ?? t.amount), 0
  );
  const pct = total > 0 ? ((value / total) * 100).toFixed(1) : '0.0';

  return (
    <div className="rounded-lg border bg-card px-3 py-2 shadow-md text-sm space-y-0.5 min-w-[140px]">
      <p className="font-semibold text-foreground truncate">{name}</p>
      <p className="text-muted-foreground">{formatCurrency(value)}</p>
      <p className="text-xs text-muted-foreground">{pct}% of total</p>
    </div>
  );
};

/* ─────────────────── Compact read-only popover ─────────────────────────── */

interface ReadOnlyInfoProps {
  slice: PieSlice | null;
  type: 'income' | 'expense';
  onClose: () => void;
}

const ReadOnlyInfo = ({ slice, type, onClose }: ReadOnlyInfoProps) => {
  if (!slice) return null;
  const isIncome = type === 'income';
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 sm:p-0" onClick={onClose}>
      <div
        className="relative z-50 bg-card border rounded-xl shadow-xl p-5 w-full sm:w-72 flex flex-col gap-3 animate-in slide-in-from-bottom-4 sm:slide-in-from-bottom-0 sm:zoom-in-95"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-2">
          <span className={`h-8 w-8 rounded-full flex items-center justify-center ${isIncome ? 'bg-primary/10 text-primary' : 'bg-destructive/10 text-destructive'}`}>
            {isIncome ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
          </span>
          <div>
            <p className="font-semibold text-sm">{slice.name}</p>
            <p className="text-xs text-muted-foreground">{isIncome ? 'Income' : 'Expense'} category</p>
          </div>
        </div>
        <p className={`text-2xl font-bold tabular-nums ${isIncome ? 'text-primary' : 'text-destructive'}`}>
          {formatCurrency(slice.value)}
        </p>
        <p className="text-xs text-muted-foreground">{slice.transactions.length} transaction{slice.transactions.length !== 1 ? 's' : ''}</p>
        <button
          onClick={onClose}
          className="mt-1 text-xs text-muted-foreground hover:text-foreground underline underline-offset-2 self-end"
        >
          Close
        </button>
      </div>
      {/* Backdrop */}
      <div className="fixed inset-0 -z-10 bg-black/40 sm:bg-black/20" />
    </div>
  );
};

/* ─────────────────────── Main Component ────────────────────────────────── */

/**
 * `CategoryPieChart`
 *
 * Renders an interactive Recharts donut chart showing the share of each
 * category for either income or expense transactions.
 *
 * - Supports **monthly** and **annual** period views via an internal toggle.
 * - Highlights the active slice on hover/tap with an outer ring and centre labels.
 * - In full mode (Budget page): clicking a slice opens `CategoryTransactionsModal`.
 * - In read-only mode (Dashboard): clicking a slice opens a compact info card.
 *
 * @param props - See {@link CategoryPieChartProps}.
 */
export function CategoryPieChart({
  transactions,
  type,
  currentMonth = startOfMonth(new Date()),
  isReadOnly = false,
}: CategoryPieChartProps) {
  const isIncome = type === 'income';

  /* Period toggle state */
  const [period, setPeriod] = useState<Period>('month');

  /* Recharts active index (hover / tap) */
  const [activeIndex, setActiveIndex] = useState<number | undefined>(undefined);

  /* Modal state (full mode) — stores the full slice to avoid re-filtering O(n) */
  const [selectedSlice, setSelectedSlice] = useState<PieSlice | null>(null);

  /* Compact info state (read-only mode) */
  const [readOnlySlice, setReadOnlySlice] = useState<PieSlice | null>(null);

  /* ── Derived data ── */

  /** Transactions filtered to the current period and type. */
  const periodTransactions = useMemo(() => {
    return transactions.filter((t) => {
      if (t.type !== type) return false;
      const d = parseISO(t.date);
      return period === 'month'
        ? isSameMonth(d, currentMonth)
        : isSameYear(d, currentMonth);
    });
  }, [transactions, type, period, currentMonth]);

  /**
   * Aggregated slices sorted by value descending.
   * Total is computed in the same pass (O(n)) to avoid a second reduce.
   * @complexity O(n) time, O(k) space where k = unique categories
   */
  const { slices, totalAmount } = useMemo<{ slices: PieSlice[]; totalAmount: number }>(() => {
    const map = new Map<string, PieSlice>();
    let total = 0;
    for (const t of periodTransactions) {
      const cat = t.category || 'Other';
      const usd = Math.abs(t.realUsdAmount ?? t.amount);
      if (!map.has(cat)) {
        map.set(cat, { name: cat, value: 0, transactions: [] });
      }
      const entry = map.get(cat)!;
      entry.value += usd;
      entry.transactions.push(t);
      total += usd;
    }
    return {
      slices: [...map.values()].sort((a, b) => b.value - a.value),
      totalAmount: total,
    };
  }, [periodTransactions]);

  /* ── Event handlers ── */

  const handlePieEnter = useCallback((_: unknown, index: number) => {
    setActiveIndex(index);
  }, []);

  const handlePieLeave = useCallback(() => {
    setActiveIndex(undefined);
  }, []);

  const handleSliceClick = useCallback(
    (data: PieSlice) => {
      if (isReadOnly) {
        setReadOnlySlice(data);
      } else {
        // Store full slice — transactions already aggregated, no O(n) re-filter needed
        setSelectedSlice(data);
      }
    },
    [isReadOnly]
  );

  /* ── Heading ── */

  const periodLabel =
    period === 'month'
      ? format(currentMonth, 'MMMM yyyy')
      : format(currentMonth, 'yyyy');

  return (
    <>
      <Card>
        <CardHeader className="pb-2">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0">
            <div className="flex items-center gap-2">
              <span
                className={`h-7 w-7 rounded-full flex items-center justify-center ${
                  isIncome ? 'bg-primary/10 text-primary' : 'bg-destructive/10 text-destructive'
                }`}
              >
                {isIncome ? (
                  <TrendingUp className="h-3.5 w-3.5" />
                ) : (
                  <TrendingDown className="h-3.5 w-3.5" />
                )}
              </span>
              <div>
                <CardTitle className="text-base">
                  {isIncome ? 'Income' : 'Expenses'} by Category
                </CardTitle>
                <CardDescription className="text-xs">{periodLabel}</CardDescription>
              </div>
            </div>

            {/* Period toggle */}
            <div className="flex rounded-md border overflow-hidden text-xs self-end sm:self-auto">
              {(['month', 'year'] as Period[]).map((p) => (
                <button
                  key={p}
                  onClick={() => { setPeriod(p); setActiveIndex(undefined); }}
                  className={`px-3 py-1 font-medium transition-colors capitalize ${
                    period === p
                      ? isIncome
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-destructive text-destructive-foreground'
                      : 'bg-transparent text-muted-foreground hover:bg-accent hover:text-foreground'
                  }`}
                >
                  {p === 'month' ? 'Month' : 'Year'}
                </button>
              ))}
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {slices.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 text-muted-foreground border border-dashed rounded-lg">
              <p className="text-sm">No {isIncome ? 'income' : 'expense'} data for this {period}.</p>
            </div>
          ) : (
            <>
              {/* Total KPI */}
              <p className="text-center text-xs text-muted-foreground mb-1">
                Total:{' '}
                <span className={`font-bold text-sm ${isIncome ? 'text-primary' : 'text-destructive'}`}>
                  {formatCurrency(totalAmount)}
                </span>
              </p>

              {/* Donut chart */}
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={slices}
                      cx="50%"
                      cy="50%"
                      innerRadius="52%"
                      outerRadius="72%"
                      dataKey="value"
                      activeIndex={activeIndex}
                      // eslint-disable-next-line @typescript-eslint/no-explicit-any
                      activeShape={renderActiveShape as any}
                      onMouseEnter={handlePieEnter}
                      onMouseLeave={handlePieLeave}
                      onClick={(_data, index) => handleSliceClick(slices[index])}
                      className="cursor-pointer outline-none"
                      strokeWidth={2}
                      stroke="hsl(var(--card))"
                    >
                      {slices.map((_, i) => (
                        <Cell
                          key={`cell-${i}`}
                          fill={PALETTE[i % PALETTE.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      content={<CustomTooltip />}
                      wrapperStyle={{ outline: 'none' }}
                    />
                    <Legend
                      iconType="circle"
                      iconSize={8}
                      formatter={(value: string) => (
                        <span className="text-xs text-foreground/80">{value}</span>
                      )}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* Hint */}
              {!isReadOnly && (
                <p className="text-center text-xs text-muted-foreground mt-1">
                  Click a slice to see transactions
                </p>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Full transactions modal (Budget page) */}
      {!isReadOnly && (
        <CategoryTransactionsModal
          open={selectedSlice !== null}
          onClose={() => setSelectedSlice(null)}
          category={selectedSlice?.name ?? ''}
          type={type}
          transactions={selectedSlice?.transactions ?? []}
          isAnnualView={period === 'year'}
        />
      )}

      {/* Compact read-only info (Dashboard) */}
      {isReadOnly && readOnlySlice && (
        <ReadOnlyInfo
          slice={readOnlySlice}
          type={type}
          onClose={() => setReadOnlySlice(null)}
        />
      )}
    </>
  );
}
