'use client';

import { useState, useMemo } from 'react';
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
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from './ui/card';
import { TrendingUp, TrendingDown, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from './ui/button';
import { calculateFinancialSummary } from '@/lib/utils';

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(value);
};

export function FinancialChart({ transactions }: { transactions: any[] }) {
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());

  const summary = useMemo(
    () => calculateFinancialSummary(transactions, currentYear),
    [transactions, currentYear]
  );
  
  const { annualTotalIncome, annualTotalExpenses, annualNet, annualChartData } = summary || {};

  const handlePreviousYear = () => {
    setCurrentYear(year => year - 1);
  };

  const handleNextYear = () => {
    setCurrentYear(year => year + 1);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle>Financial Overview</CardTitle>
            <CardDescription>
              Your financial performance for the selected year.
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={handlePreviousYear}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="font-medium text-lg tabular-nums">{currentYear}</span>
            <Button variant="outline" size="icon" onClick={handleNextYear} disabled={currentYear === new Date().getFullYear()}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center mb-6">
          <div className="flex flex-col gap-2">
            <p className="text-sm text-muted-foreground">Annual Income</p>
            <p className="text-2xl font-bold text-primary flex items-center justify-center gap-2">
              <TrendingUp /> {formatCurrency(annualTotalIncome || 0)}
            </p>
          </div>
          <div className="flex flex-col gap-2">
            <p className="text-sm text-muted-foreground">Annual Expenses</p>
            <p className="text-2xl font-bold text-destructive flex items-center justify-center gap-2">
              <TrendingDown /> {formatCurrency(annualTotalExpenses || 0)}
            </p>
          </div>
          <div className="flex flex-col gap-2">
            <p className="text-sm text-muted-foreground">Annual Net</p>
            <p
              className={`text-2xl font-bold flex items-center justify-center gap-2 ${
                (annualNet || 0) >= 0 ? 'text-primary' : 'text-destructive'
              }`}
            >
              {formatCurrency(annualNet || 0)}
            </p>
          </div>
        </div>

        <div className="h-[350px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={annualChartData || []}
              margin={{
                top: 5,
                right: 30,
                left: 20,
                bottom: 5,
              }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis tickFormatter={value => `$${value / 1000}k`} />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  borderColor: 'hsl(var(--border))',
                }}
                formatter={(value: number) => formatCurrency(value)}
              />
              <Legend />
              <Bar
                dataKey="income"
                fill="hsl(var(--primary))"
                name="Income"
              />
              <Bar
                dataKey="expenses"
                fill="hsl(var(--destructive))"
                name="Expenses"
              />
              <Bar dataKey="net" fill="hsl(var(--accent))" name="Net Balance" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
