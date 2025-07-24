
'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { format } from 'date-fns';

const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
    }).format(value);
};

export function FinancialChart({ summary }: { summary: any }) {
    const { currentMonthIncome, currentMonthExpenses, currentMonthNet, annualChartData } = summary || {};

    return (
        <Card>
            <CardHeader>
                <CardTitle>Financial Overview</CardTitle>
                <CardDescription>
                    Your financial performance for the current month ({format(new Date(), 'MMMM yyyy')}) and the last 12 months.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center mb-6">
                    <div className="flex flex-col gap-2">
                        <p className="text-sm text-muted-foreground">This Month's Income</p>
                        <p className="text-2xl font-bold text-primary flex items-center justify-center gap-2">
                            <TrendingUp /> {formatCurrency(currentMonthIncome || 0)}
                        </p>
                    </div>
                    <div className="flex flex-col gap-2">
                        <p className="text-sm text-muted-foreground">This Month's Expenses</p>
                        <p className="text-2xl font-bold text-destructive flex items-center justify-center gap-2">
                            <TrendingDown /> {formatCurrency(currentMonthExpenses || 0)}
                        </p>
                    </div>
                    <div className="flex flex-col gap-2">
                        <p className="text-sm text-muted-foreground">This Month's Net</p>
                        <p
                            className={`text-2xl font-bold flex items-center justify-center gap-2 ${
                                (currentMonthNet || 0) >= 0 ? 'text-primary' : 'text-destructive'
                            }`}
                        >
                            {formatCurrency(currentMonthNet || 0)}
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
                            <YAxis tickFormatter={(value) => `$${value / 1000}k`} />
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: 'hsl(var(--card))',
                                    borderColor: 'hsl(var(--border))'
                                }}
                                formatter={(value: number) => formatCurrency(value)}
                            />
                            <Legend />
                            <Bar dataKey="income" fill="hsl(var(--primary))" name="Income" />
                            <Bar dataKey="expenses" fill="hsl(var(--destructive))" name="Expenses" />
                            <Bar dataKey="net" fill="hsl(var(--accent))" name="Net Balance" />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </CardContent>
        </Card>
    );
}
