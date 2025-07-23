'use client';

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from './ui/badge';
import { useState } from 'react';
import { Button } from './ui/button';
import { Trash2 } from 'lucide-react';
import { Input } from './ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';

const categories = [
  'Income',
  'Housing',
  'Food & Drink',
  'Utilities',
  'Transport',
  'Entertainment',
  'Health',
  'Personal Care',
  'Shopping',
  'Debt Payment',
  'Other',
];

export function TransactionsTable({
  initialTransactions = [],
}: {
  initialTransactions?: any[];
}) {
  const [transactions, setTransactions] = useState(initialTransactions);

  const handleInputChange = (id: string, field: string, value: any) => {
    const newTransactions = transactions.map(transaction => {
      if (transaction.id === id) {
        if (field === 'amount') {
          return { ...transaction, [field]: parseFloat(value) || 0 };
        }
        return { ...transaction, [field]: value };
      }
      return transaction;
    });
    setTransactions(newTransactions);
  };

  const deleteRow = (id: string) => {
    setTransactions(
      transactions.filter(transaction => transaction.id !== id)
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>All Transactions</CardTitle>
        <CardDescription>
          A complete history of your income and expenses.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {transactions.map(transaction => (
              <TableRow key={transaction.id}>
                <TableCell>
                  <Input
                    type="date"
                    value={transaction.date}
                    onChange={e =>
                      handleInputChange(transaction.id, 'date', e.target.value)
                    }
                    className="font-medium border-none bg-transparent p-0 h-auto focus-visible:ring-0"
                  />
                </TableCell>
                <TableCell>
                  <Input
                    value={transaction.description}
                    onChange={e =>
                      handleInputChange(
                        transaction.id,
                        'description',
                        e.target.value
                      )
                    }
                    className="border-none bg-transparent p-0 h-auto focus-visible:ring-0"
                  />
                </TableCell>
                <TableCell>
                  <Select
                    value={transaction.category}
                    onValueChange={value =>
                      handleInputChange(transaction.id, 'category', value)
                    }
                  >
                    <SelectTrigger className="w-[150px] border-none bg-transparent p-0 h-auto focus:ring-0">
                      <Badge variant="outline">
                        <SelectValue placeholder="Select category" />
                      </Badge>
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map(category => (
                        <SelectItem key={category} value={category}>
                          {category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </TableCell>
                <TableCell>
                  <Input
                    type="number"
                    value={transaction.amount}
                    onChange={e =>
                      handleInputChange(
                        transaction.id,
                        'amount',
                        e.target.value
                      )
                    }
                    className={`font-mono border-none bg-transparent p-0 h-auto focus-visible:ring-0 ${
                      transaction.amount >= 0
                        ? 'text-primary'
                        : 'text-destructive'
                    }`}
                  />
                </TableCell>
                <TableCell className="text-right">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => deleteRow(transaction.id)}
                  >
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
