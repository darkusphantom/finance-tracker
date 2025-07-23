import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { Separator } from './ui/separator';

export function MonthlyOverview() {
  const income = 5320.5;
  const expenses = 2780.25;
  const net = income - expenses;
  return (
    <Card>
      <CardHeader>
        <CardTitle>Monthly Overview</CardTitle>
        <CardDescription>
          A summary of your income and expenses for this month.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center mb-6">
          <div className="flex flex-col gap-2">
            <p className="text-sm text-muted-foreground">Income</p>
            <p className="text-2xl font-bold text-primary flex items-center justify-center gap-2">
              <TrendingUp /> ${income.toFixed(2)}
            </p>
          </div>
          <div className="flex flex-col gap-2">
            <p className="text-sm text-muted-foreground">Expenses</p>
            <p className="text-2xl font-bold text-destructive flex items-center justify-center gap-2">
              <TrendingDown /> ${expenses.toFixed(2)}
            </p>
          </div>
          <div className="flex flex-col gap-2">
            <p className="text-sm text-muted-foreground">Net Balance</p>
            <p
              className={`text-2xl font-bold flex items-center justify-center gap-2 ${
                net >= 0 ? 'text-primary' : 'text-destructive'
              }`}
            >
              ${net.toFixed(2)}
            </p>
          </div>
        </div>
        <Accordion type="single" collapsible className="w-full">
          <AccordionItem value="item-1">
            <AccordionTrigger>View Detailed Breakdown</AccordionTrigger>
            <AccordionContent>
              <div className="space-y-4 pt-4">
                <div>
                  <h4 className="font-semibold mb-2">Top Income Sources</h4>
                  <div className="flex justify-between items-center text-sm">
                    <span>Salary</span>
                    <span className="font-mono text-primary">
                      +${'5,000.00'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span>Freelance Project</span>
                    <span className="font-mono text-primary">+${'320.50'}</span>
                  </div>
                </div>
                <Separator />
                <div>
                  <h4 className="font-semibold mb-2">Top Expense Categories</h4>
                  <div className="flex justify-between items-center text-sm">
                    <span>Rent</span>
                    <span className="font-mono text-destructive">
                      -${'1,800.00'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span>Groceries</span>
                    <span className="font-mono text-destructive">
                      -${'450.75'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span>Utilities</span>
                    <span className="font-mono text-destructive">
                      -${'150.00'}
                    </span>
                  </div>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </CardContent>
    </Card>
  );
}
