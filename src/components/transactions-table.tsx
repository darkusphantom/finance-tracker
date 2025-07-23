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
import { useToast } from '@/hooks/use-toast';
import {
  updateTransactionAction,
  deleteTransactionAction,
} from '@/app/actions';
import { useRouter } from 'next/navigation';

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
  const { toast } = useToast();
  const router = useRouter();

  const handleInputChange = async (id: string, field: string, value: any) => {
    // Optimistically update the UI
    const newTransactions = transactions.map(transaction => {
      if (transaction.id === id) {
        return { ...transaction, [field]: value };
      }
      return transaction;
    });
    setTransactions(newTransactions);

    // Call server action to update Notion
    const result = await updateTransactionAction({ id, field, value });

    if (result?.error) {
      toast({
        title: 'Update Failed',
        description: result.error,
        variant: 'destructive',
      });
      // Revert UI change if update fails
      setTransactions(initialTransactions);
    } else {
        router.refresh();
    }
  };

  const deleteRow = async (id: string) => {
    // Optimistically remove from UI
    const newTransactions = transactions.filter(
      transaction => transaction.id !== id
    );
    setTransactions(newTransactions);

    const result = await deleteTransactionAction(id);

    if (result?.error) {
      toast({
        title: 'Delete Failed',
        description: result.error,
        variant: 'destructive',
      });
      // Revert UI change if delete fails
      setTransactions(initialTransactions);
    } else {
      toast({
        title: 'Transaction Deleted',
        description: 'The transaction has been removed.',
      });
      router.refresh();
    }
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
