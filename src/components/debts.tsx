'use client';

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useState } from 'react';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { Trash2 } from 'lucide-react';

const initialDebts = [
  {
    id: '1',
    name: 'Student Loan',
    type: 'Debt',
    total: 25000,
    paid: 12000,
    status: 'Paying',
  },
  {
    id: '2',
    name: 'Car Loan',
    type: 'Debt',
    total: 18000,
    paid: 18000,
    status: 'Paid Off',
  },
  {
    id: '3',
    name: 'Mike (Dinner)',
    type: 'Debtor',
    total: 45,
    paid: 0,
    status: 'Pending',
  },
];

export function Debts() {
  const [debts, setDebts] = useState(initialDebts);

  const handleInputChange = (id: string, field: string, value: any) => {
    const newDebts = debts.map((debt) => {
      if (debt.id === id) {
        if (field === 'total' || field === 'paid') {
          return { ...debt, [field]: parseFloat(value) || 0 };
        }
        return { ...debt, [field]: value };
      }
      return debt;
    });
    setDebts(newDebts);
  };

  const deleteRow = (id: string) => {
    setDebts(debts.filter((debt) => debt.id !== id));
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Debts & Debtors</CardTitle>
        <CardDescription>
          Track your outstanding debts and what others owe you.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {debts.map((debt) => (
          <div key={debt.id}>
            <div className="flex justify-between items-center mb-2">
              <Input
                value={debt.name}
                onChange={(e) =>
                  handleInputChange(debt.id, 'name', e.target.value)
                }
                className="font-medium border-none bg-transparent p-0 h-auto focus-visible:ring-0 w-auto"
              />
              <Badge
                variant={debt.type === 'Debt' ? 'destructive' : 'secondary'}
              >
                {debt.type}
              </Badge>
            </div>
            <div className="flex justify-between items-baseline text-sm mb-1">
              <div className="text-muted-foreground flex items-center gap-1">
                Paid: $
                <Input
                  type="number"
                  value={debt.paid}
                  onChange={(e) =>
                    handleInputChange(debt.id, 'paid', e.target.value)
                  }
                  className="font-mono border-none bg-transparent p-0 h-auto focus-visible:ring-0 w-20"
                />
                of $
                <Input
                  type="number"
                  value={debt.total}
                  onChange={(e) =>
                    handleInputChange(debt.id, 'total', e.target.value)
                  }
                  className="font-mono border-none bg-transparent p-0 h-auto focus-visible:ring-0 w-20"
                />
              </div>
               <Button
                variant="ghost"
                size="icon"
                onClick={() => deleteRow(debt.id)}
                className="h-6 w-6"
              >
                <Trash2 className="w-4 h-4 text-destructive" />
              </Button>
            </div>
            <Progress value={(debt.paid / debt.total) * 100} />
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
