'use client';

import { useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Calendar } from '@/components/ui/calendar';
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

export function BudgetView({ transactions = [] }: { transactions: any[] }) {
  const [date, setDate] = useState<Date>(startOfMonth(new Date()));
  const [selectedDay, setSelectedDay] = useState<Date>(new Date());

  const handleMonthChange = (month: Date) => {
    setDate(month);
    setSelectedDay(month);
  };

  const monthTransactions = transactions.filter(t =>
    isSameMonth(parseISO(t.date), date)
  );

  const monthIncome = monthTransactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);

  const monthExpenses = Math.abs(
    monthTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0)
  );

  const monthNet = monthIncome - monthExpenses;

  const selectedDayTransactions = transactions
    .filter(t => isSameDay(parseISO(t.date), selectedDay))
    .sort((a, b) => b.amount - a.amount);

  const DayWithIndicator = ({ day, displayMonth, ...props }: any) => {
    if (!isValid(day)) {
        return <div {...props}></div>
    }

    const transactionsOnDay = transactions.filter(t =>
      isSameDay(parseISO(t.date), day)
    );
    const hasIncome = transactionsOnDay.some(t => t.type === 'income');
    const hasExpense = transactionsOnDay.some(t => t.type === 'expense');

    return (
      <div
        {...props}
        className="relative flex items-center justify-center h-full"
      >
        <span>{format(day, 'd')}</span>
        <div className="absolute bottom-1 flex space-x-0.5">
          {hasIncome && <div className="w-1 h-1 rounded-full bg-primary"></div>}
          {hasExpense && (
            <div className="w-1 h-1 rounded-full bg-destructive"></div>
          )}
        </div>
      </div>
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Monthly Budget</CardTitle>
        <CardDescription>
          Visualize your income and expenses for{' '}
          <strong>{format(date, 'MMMM yyyy')}</strong>.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
          <div className="flex flex-col gap-2">
            <p className="text-sm text-muted-foreground">Income</p>
            <p className="text-2xl font-bold text-primary flex items-center justify-center gap-2">
              <TrendingUp /> {formatCurrency(monthIncome)}
            </p>
          </div>
          <div className="flex flex-col gap-2">
            <p className="text-sm text-muted-foreground">Expenses</p>
            <p className="text-2xl font-bold text-destructive flex items-center justify-center gap-2">
              <TrendingDown /> {formatCurrency(monthExpenses)}
            </p>
          </div>
          <div className="flex flex-col gap-2">
            <p className="text-sm text-muted-foreground">Net Balance</p>
            <p
              className={`text-2xl font-bold ${
                monthNet >= 0 ? 'text-primary' : 'text-destructive'
              }`}
            >
              {formatCurrency(monthNet)}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="flex justify-center">
            <Calendar
              mode="single"
              selected={selectedDay}
              onSelect={day => setSelectedDay(day || new Date())}
              month={date}
              onMonthChange={handleMonthChange}
              className="rounded-md border"
              components={{
                Day: DayWithIndicator,
              }}
            />
          </div>
          <div>
            <h3 className="text-lg font-semibold mb-4">
              Transactions for {format(selectedDay, 'MMMM d, yyyy')}
            </h3>
            <div className="space-y-4 max-h-72 overflow-y-auto pr-2">
              {selectedDayTransactions.length > 0 ? (
                selectedDayTransactions.map(t => (
                  <div
                    key={t.id}
                    className="flex justify-between items-center"
                  >
                    <div>
                      <p className="font-medium">{t.description}</p>
                      <Badge variant="outline">{t.category}</Badge>
                    </div>
                    <span
                      className={`font-mono text-lg ${
                        t.type === 'income'
                          ? 'text-primary'
                          : 'text-destructive'
                      }`}
                    >
                      {formatCurrency(t.amount)}
                    </span>
                  </div>
                ))
              ) : (
                <p className="text-muted-foreground text-center py-8">
                  No transactions for this day.
                </p>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
