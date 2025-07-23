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

const transactions = [
  {
    date: '2024-07-25',
    description: 'Salary',
    amount: 5000,
    type: 'income',
    category: 'Income',
  },
  {
    date: '2024-07-24',
    description: 'Rent',
    amount: -1800,
    type: 'expense',
    category: 'Housing',
  },
  {
    date: '2024-07-23',
    description: 'Groceries',
    amount: -125.5,
    type: 'expense',
    category: 'Food & Drink',
  },
  {
    date: '2024-07-22',
    description: 'Freelance Project',
    amount: 320.5,
    type: 'income',
    category: 'Income',
  },
  {
    date: '2024-07-21',
    description: 'Coffee with a friend',
    amount: -8.75,
    type: 'expense',
    category: 'Food & Drink',
  },
  {
    date: '2024-07-20',
    description: 'Utilities',
    amount: -150,
    type: 'expense',
    category: 'Utilities',
  },
];

export function TransactionsTable() {
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
              <TableHead className="text-right">Amount</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {transactions.map((transaction, index) => (
              <TableRow key={index}>
                <TableCell className="font-medium">
                  {new Date(transaction.date).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    timeZone: 'UTC'
                  })}
                </TableCell>
                <TableCell>{transaction.description}</TableCell>
                <TableCell>
                  <Badge variant="outline">{transaction.category}</Badge>
                </TableCell>
                <TableCell
                  className={`text-right font-mono ${
                    transaction.amount >= 0 ? 'text-primary' : 'text-destructive'
                  }`}
                >
                  {transaction.amount < 0 ? '-' : ''}$
                  {Math.abs(transaction.amount).toLocaleString('en-US', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
