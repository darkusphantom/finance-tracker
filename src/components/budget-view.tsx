'use client';

import { useState } from 'react';
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
  isSameDay,
  isSameMonth,
  startOfMonth,
  format,
  parseISO,
  isValid,
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

export function BudgetView({ transactions = [] }: { transactions: any[] }) {
  // Focus on the current month by default
  const [date, setDate] = useState<Date>(startOfMonth(new Date()));

  // You can still navigate months if needed, but the primary focus is the current month
  const handlePreviousMonth = () => {
    setDate(prev => {
      const newDate = new Date(prev);
      newDate.setMonth(newDate.getMonth() - 1);
      return newDate;
    });
  };

  const handleNextMonth = () => {
    setDate(prev => {
      const newDate = new Date(prev);
      newDate.setMonth(newDate.getMonth() + 1);
      return newDate;
    });
  };

  const monthTransactions = transactions.filter(t =>
    isSameMonth(parseISO(t.date), date)
  ).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  // Sum using realUsdAmount for accurate totals
  const monthIncome = monthTransactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + (t.realUsdAmount || 0), 0);

  const monthExpenses = Math.abs(
    monthTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + (t.realUsdAmount || 0), 0)
  );

  const monthNet = monthIncome - monthExpenses;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Monthly Budget</CardTitle>
            <CardDescription>
              Income, expenses, and transactions for{' '}
              <strong className="text-foreground">{format(date, 'MMMM yyyy')}</strong>.
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <button onClick={handlePreviousMonth} className="px-3 py-1 bg-secondary text-secondary-foreground rounded-md text-sm font-medium hover:bg-secondary/80">
              Previous
            </button>
            <button onClick={handleNextMonth} className="px-3 py-1 bg-secondary text-secondary-foreground rounded-md text-sm font-medium hover:bg-secondary/80" disabled={isSameMonth(date, new Date())}>
              Next
            </button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-8">
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
            <p
              className={`text-3xl font-bold ${monthNet >= 0 ? 'text-primary' : 'text-destructive'
                }`}
            >
              {formatCurrency(monthNet)}
            </p>
          </div>
        </div>

        <div>
          <h3 className="text-lg font-semibold mb-4">
            Transactions in {format(date, 'MMMM yyyy')}
          </h3>
          <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
            {monthTransactions.length > 0 ? (
              monthTransactions.map(t => (
                <div
                  key={t.id}
                  className="flex justify-between items-center p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                >
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-base">{t.description}</p>
                      <Badge variant="outline" className="text-xs">{t.category}</Badge>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {format(parseISO(t.date), 'MMM d, yyyy')}
                    </span>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span
                      className={`font-mono font-bold text-lg ${t.type === 'income' ? 'text-primary' : 'text-destructive'
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
                <p>No transactions found for this month.</p>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
