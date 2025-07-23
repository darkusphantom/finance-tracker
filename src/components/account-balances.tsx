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
import { Landmark, Wallet } from 'lucide-react';
import { Badge } from './ui/badge';

const accounts = [
  {
    name: 'Main Checking',
    type: 'Checking',
    balance: 4850.75,
    icon: Landmark,
  },
  {
    name: 'High-Yield Savings',
    type: 'Savings',
    balance: 15300.0,
    icon: Landmark,
  },
  {
    name: 'Credit Card',
    type: 'Credit',
    balance: -750.21,
    icon: Wallet,
  },
  {
    name: 'Investment Portfolio',
    type: 'Investment',
    balance: 22450.0,
    icon: Wallet,
  },
];

export function AccountBalances() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Account Balances</CardTitle>
        <CardDescription>
          A live look at your connected account balances.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[200px]">Account</TableHead>
              <TableHead>Type</TableHead>
              <TableHead className="text-right">Balance</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {accounts.map((account) => (
              <TableRow key={account.name}>
                <TableCell className="font-medium flex items-center gap-2">
                  <account.icon className="w-4 h-4 text-muted-foreground" />
                  {account.name}
                </TableCell>
                <TableCell>
                  <Badge variant="outline">{account.type}</Badge>
                </TableCell>
                <TableCell
                  className={`text-right font-mono ${
                    account.balance >= 0 ? 'text-foreground' : 'text-destructive'
                  }`}
                >
                  $
                  {account.balance.toLocaleString('en-US', {
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
