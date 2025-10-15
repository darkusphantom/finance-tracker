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
import { useState, useEffect, useMemo } from 'react';
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

const categories = [
  'Rent/Mortgage',
  'Food & Drink (Groceries)',
  'Dining Out',
  'Health',
  'Personal Care',
  'Medicine',
  'Transportation',
  'Retail',
  'Clothes',
  'Entertainment',
  'Environment Work',
  'Technology',
  'Education',
  'Utilities',
  'Insurance',
  'Debt Payment',
  'Prestamo',
  'Gift',
  'Other',
];

export function TransactionsTable({
  initialTransactions = [],
}: {
  initialTransactions?: any[];
}) {
  const [transactions, setTransactions] = useState(initialTransactions);
  const [filter, setFilter] = useState('');
  const [page, setPage] = useState(1);
  const itemsPerPage = 15;
  const { toast } = useToast();
  const router = useRouter();

  useEffect(() => {
    setTransactions(initialTransactions);
  }, [initialTransactions]);

  const filteredTransactions = useMemo(() => {
    return transactions.filter(t => t.description.toLowerCase().includes(filter.toLowerCase()));
  }, [transactions, filter]);

  const paginatedTransactions = useMemo(() => {
    const startIndex = (page - 1) * itemsPerPage;
    return filteredTransactions.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredTransactions, page]);

  const totalPages = Math.ceil(filteredTransactions.length / itemsPerPage);

  const handleInputChange = async (id: string, field: string, value: any) => {
    // Optimistically update the UI
    const originalTransactions = transactions;
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
      setTransactions(originalTransactions);
    } else {
        router.refresh();
    }
  };

  const deleteRow = async (id: string) => {
    // Optimistically remove from UI
    const originalTransactions = transactions;
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
      setTransactions(originalTransactions);
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
         <div className="mb-4">
            <Input 
              placeholder="Search by description..."
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
            />
          </div>
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
            {paginatedTransactions.map(transaction => (
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
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This action cannot be undone. This will permanently delete this transaction.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => deleteRow(transaction.id)}
                        >
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {totalPages > 1 && (
          <div className="flex justify-between items-center mt-4">
              <Button onClick={() => setPage(p => Math.max(1, p-1))} disabled={page === 1} variant="outline">Previous</Button>
              <span>Page {page} of {totalPages}</span>
              <Button onClick={() => setPage(p => Math.min(totalPages, p+1))} disabled={page === totalPages} variant="outline">Next</Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
