'use client';

import { useState, useMemo } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown } from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Cell,
} from 'recharts';
import {
  isSameDay,
  isSameMonth,
  startOfMonth,
  getDaysInMonth,
  format,
  parseISO,
  setDate as setDateOfMonth,
} from 'date-fns';

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(value);
};

const formatLocalCurrency = (amount: number, currency: string) => {
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
    }).format(amount);
  } catch (e) {
    return `${currency} ${new Intl.NumberFormat('en-US', {
      style: 'decimal',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount)}`;
  }
};

// Custom tooltip for the chart
const ChartTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border bg-card px-3 py-2 shadow-md text-sm space-y-1">
      <p className="font-semibold text-foreground">{label}</p>
      {payload.map((entry: any) => (
        <p key={entry.name} style={{ color: entry.color }}>
          {entry.name}: {formatCurrency(entry.value)}
        </p>
      ))}
    </div>
  );
};

export function BudgetView({ transactions = [] }: { transactions: any[] }) {
  const [date, setDate] = useState<Date>(startOfMonth(new Date()));
  const [selectedDay, setSelectedDay] = useState<number | null>(null);

  const handlePreviousMonth = () => {
    setDate(prev => {
      const newDate = new Date(prev);
      newDate.setMonth(newDate.getMonth() - 1);
      return newDate;
    });
    setSelectedDay(null);
  };

  const handleNextMonth = () => {
    setDate(prev => {
      const newDate = new Date(prev);
      newDate.setMonth(newDate.getMonth() + 1);
      return newDate;
    });
    setSelectedDay(null);
  };

  const monthTransactions = useMemo(
    () =>
      transactions
        .filter(t => isSameMonth(parseISO(t.date), date))
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
    [transactions, date]
  );

  const monthIncome = monthTransactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + (t.realUsdAmount || 0), 0);

  const monthExpenses = Math.abs(
    monthTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + (t.realUsdAmount || 0), 0)
  );

  const monthNet = monthIncome - monthExpenses;

  // Build one data point per day of the month
  const chartData = useMemo(() => {
    const daysInMonth = getDaysInMonth(date);
    return Array.from({ length: daysInMonth }, (_, i) => {
      const dayNum = i + 1;
      const dayDate = setDateOfMonth(date, dayNum);
      const dayTxns = transactions.filter(t =>
        isSameDay(parseISO(t.date), dayDate)
      );
      const income = dayTxns
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + (t.realUsdAmount || 0), 0);
      const expenses = Math.abs(
        dayTxns
          .filter(t => t.type === 'expense')
          .reduce((sum, t) => sum + (t.realUsdAmount || 0), 0)
      );
      return { day: dayNum, label: `${format(date, 'MMM')} ${dayNum}`, income, expenses };
    });
  }, [transactions, date]);

  const filteredTransactions = useMemo(() => {
    if (selectedDay === null) return monthTransactions;
    const dayDate = setDateOfMonth(date, selectedDay);
    return transactions
      .filter(t => isSameDay(parseISO(t.date), dayDate))
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [selectedDay, monthTransactions, transactions, date]);

  const handleBarClick = (data: any) => {
    if (!data?.activePayload) return;
    const clickedDay: number = data.activePayload[0]?.payload?.day;
    setSelectedDay(prev => (prev === clickedDay ? null : clickedDay));
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 sm:gap-0">
          <div>
            <CardTitle>Monthly Budget</CardTitle>
            <CardDescription>
              Income, expenses, and transactions for{' '}
              <strong className="text-foreground">{format(date, 'MMMM yyyy')}</strong>.
            </CardDescription>
          </div>
          <div className="flex gap-2 self-end sm:self-auto">
            <button
              onClick={handlePreviousMonth}
              className="px-3 py-1 bg-secondary text-secondary-foreground rounded-md text-sm font-medium hover:bg-secondary/80"
            >
              Previous
            </button>
            <button
              onClick={handleNextMonth}
              className="px-3 py-1 bg-secondary text-secondary-foreground rounded-md text-sm font-medium hover:bg-secondary/80"
              disabled={isSameMonth(date, new Date())}
            >
              Next
            </button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-8">
        {/* KPI row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center border-b pb-8">
          <div className="flex flex-col gap-2">
            <p className="text-sm text-muted-foreground uppercase tracking-wide">Income (USD)</p>
            <p className="text-3xl font-bold text-primary flex items-center justify-center gap-2">
              <TrendingUp className="h-6 w-6" /> {formatCurrency(monthIncome)}
            </p>
          </div>
          <div className="flex flex-col gap-2">
            <p className="text-sm text-muted-foreground uppercase tracking-wide">Expenses (USD)</p>
            <p className="text-3xl font-bold text-destructive flex items-center justify-center gap-2">
              <TrendingDown className="h-6 w-6" /> {formatCurrency(monthExpenses)}
            </p>
          </div>
          <div className="flex flex-col gap-2">
            <p className="text-sm text-muted-foreground uppercase tracking-wide">Net Balance (USD)</p>
            <p className={`text-3xl font-bold ${monthNet >= 0 ? 'text-primary' : 'text-destructive'}`}>
              {formatCurrency(monthNet)}
            </p>
          </div>
        </div>

        {/* Daily chart */}
        <div className="space-y-2">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-0">
            <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
              Daily breakdown — {format(date, 'MMMM yyyy')}
            </h3>
            {selectedDay !== null && (
              <button
                onClick={() => setSelectedDay(null)}
                className="text-xs text-muted-foreground hover:text-foreground underline underline-offset-2 transition-colors self-end sm:self-auto"
              >
                Clear filter (day {selectedDay})
              </button>
            )}
          </div>

          <div className="w-full h-52">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartData}
                onClick={handleBarClick}
                margin={{ top: 4, right: 4, left: 0, bottom: 0 }}
                barCategoryGap="30%"
                barGap={2}
              >
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" vertical={false} />
                <XAxis
                  dataKey="day"
                  tick={{ fontSize: 10 }}
                  className="fill-muted-foreground"
                  axisLine={false}
                  tickLine={false}
                  interval={chartData.length > 20 ? 4 : 1}
                />
                <YAxis
                  tick={{ fontSize: 10 }}
                  className="fill-muted-foreground"
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={v => `$${v}`}
                  width={48}
                />
                <Tooltip content={<ChartTooltip />} cursor={{ className: 'fill-accent/40' }} />
                <Bar dataKey="income" name="Income" radius={[3, 3, 0, 0]}>
                  {chartData.map(entry => (
                    <Cell
                      key={`income-${entry.day}`}
                      fill={
                        selectedDay === null || selectedDay === entry.day
                          ? 'hsl(var(--primary))'
                          : 'hsl(var(--primary) / 0.25)'
                      }
                      className="cursor-pointer"
                    />
                  ))}
                </Bar>
                <Bar dataKey="expenses" name="Expenses" radius={[3, 3, 0, 0]}>
                  {chartData.map(entry => (
                    <Cell
                      key={`expense-${entry.day}`}
                      fill={
                        selectedDay === null || selectedDay === entry.day
                          ? 'hsl(var(--destructive))'
                          : 'hsl(var(--destructive) / 0.25)'
                      }
                      className="cursor-pointer"
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Legend */}
          <div className="flex items-center gap-4 justify-end text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <span className="inline-block w-2.5 h-2.5 rounded-sm bg-primary" />
              Income
            </span>
            <span className="flex items-center gap-1.5">
              <span className="inline-block w-2.5 h-2.5 rounded-sm bg-destructive" />
              Expenses
            </span>
          </div>
        </div>

        {/* Transactions list */}
        <div>
          <h3 className="text-lg font-semibold mb-4">
            {selectedDay !== null
              ? `Transactions on ${format(setDateOfMonth(date, selectedDay), 'MMMM d, yyyy')}`
              : `Transactions in ${format(date, 'MMMM yyyy')}`}
          </h3>
          <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
            {filteredTransactions.length > 0 ? (
              filteredTransactions.map(t => (
                <div
                  key={t.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors gap-2 sm:gap-0"
                >
                  <div className="flex flex-col gap-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-semibold text-base">{t.description}</p>
                      <Badge variant="outline" className="text-xs">{t.category}</Badge>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {format(parseISO(t.date), 'MMM d, yyyy')}
                    </span>
                  </div>
                  <div className="flex flex-row sm:flex-col items-center sm:items-end justify-between sm:justify-start gap-1 w-full sm:w-auto">
                    <span
                      className={`font-mono font-bold text-lg ${
                        t.type === 'income' ? 'text-primary' : 'text-destructive'
                      }`}
                    >
                      {t.type === 'income' ? '+' : '-'}{formatCurrency(t.realUsdAmount || 0)}
                    </span>
                    {t.currency !== 'USD' && (
                      <span className="text-xs font-mono text-muted-foreground">
                        Local: {formatLocalCurrency(t.amount, t.currency)}
                      </span>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground border rounded-lg border-dashed">
                <p>No transactions found{selectedDay !== null ? ` for day ${selectedDay}` : ' for this month'}.</p>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
