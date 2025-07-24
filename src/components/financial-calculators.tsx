'use client';

import { useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { TrendingUp } from 'lucide-react';

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(value);
};

function Rule503020Calculator() {
  const [income, setIncome] = useState<number>(0);

  const needs = income * 0.5;
  const wants = income * 0.3;
  const savings = income * 0.2;

  return (
    <Card>
      <CardHeader>
        <CardTitle>50/30/20 Rule Calculator</CardTitle>
        <CardDescription>
          Divide your after-tax income into three categories: 50% for needs, 30% for wants, and 20% for savings.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="income-503020">Monthly After-Tax Income</Label>
          <Input
            id="income-503020"
            type="number"
            placeholder="Enter your monthly income"
            value={income || ''}
            onChange={(e) => setIncome(parseFloat(e.target.value) || 0)}
          />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
          <div className="flex flex-col gap-2 p-4 border rounded-lg">
            <p className="text-sm text-muted-foreground">Needs (50%)</p>
            <p className="text-2xl font-bold text-primary">
              {formatCurrency(needs)}
            </p>
          </div>
          <div className="flex flex-col gap-2 p-4 border rounded-lg">
            <p className="text-sm text-muted-foreground">Wants (30%)</p>
            <p className="text-2xl font-bold text-accent">
              {formatCurrency(wants)}
            </p>
          </div>
          <div className="flex flex-col gap-2 p-4 border rounded-lg">
            <p className="text-sm text-muted-foreground">Savings (20%)</p>
            <p className="text-2xl font-bold text-green-500">
              {formatCurrency(savings)}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function Rule9010Calculator() {
    return (
        <Card>
        <CardHeader>
            <CardTitle>90/10 Rule Calculator</CardTitle>
            <CardDescription>
            Coming soon! A calculator for the 90/10 savings rule.
            </CardDescription>
        </CardHeader>
        <CardContent>
            <p className="text-muted-foreground">This feature is under construction.</p>
        </CardContent>
        </Card>
    );
}

function BudgetingCalculator() {
    return (
        <Card>
        <CardHeader>
            <CardTitle>Budget Calculator</CardTitle>
            <CardDescription>
            Coming soon! A tool to create and manage a detailed budget.
            </CardDescription>
        </CardHeader>
        <CardContent>
            <p className="text-muted-foreground">This feature is under construction.</p>
        </CardContent>
        </Card>
    );
}

export function FinancialCalculators() {
  return (
    <Tabs defaultValue="50-30-20" className="w-full">
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="50-30-20">50/30/20 Rule</TabsTrigger>
        <TabsTrigger value="90-10">90/10 Rule</TabsTrigger>
        <TabsTrigger value="budget">Budgeting</TabsTrigger>
      </TabsList>
      <TabsContent value="50-30-20" className="mt-4">
        <Rule503020Calculator />
      </TabsContent>
      <TabsContent value="90-10" className="mt-4">
        <Rule9010Calculator />
      </TabsContent>
      <TabsContent value="budget" className="mt-4">
        <BudgetingCalculator />
      </TabsContent>
    </Tabs>
  );
}
