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
import { Landmark, Trash2, Wallet } from 'lucide-react';
import { Badge } from './ui/badge';
import { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';

const initialAccounts = [
  {
    id: '1',
    name: 'Main Checking',
    type: 'Checking',
    balance: 4850.75,
    icon: Landmark,
  },
  {
    id: '2',
    name: 'High-Yield Savings',
    type: 'Savings',
    balance: 15300.0,
    icon: Landmark,
  },
  {
    id: '3',
    name: 'Credit Card',
    type: 'Credit',
    balance: -750.21,
    icon: Wallet,
  },
  {
    id: '4',
    name: 'Investment Portfolio',
    type: 'Investment',
    balance: 22450.0,
    icon: Wallet,
  },
];

const accountTypes = ['Checking', 'Savings', 'Credit', 'Investment'];

export function AccountBalances() {
  const [accounts, setAccounts] = useState(initialAccounts);

  const handleInputChange = (id: string, field: string, value: string) => {
    const newAccounts = accounts.map((account) => {
      if (account.id === id) {
        if (field === 'balance') {
          return { ...account, [field]: parseFloat(value) || 0 };
        }
        return { ...account, [field]: value };
      }
      return account;
    });
    setAccounts(newAccounts);
  };

  const deleteRow = (id: string) => {
    setAccounts(accounts.filter((account) => account.id !== id));
  };

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
              <TableHead>Balance</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {accounts.map((account) => (
              <TableRow key={account.id}>
                <TableCell className="font-medium flex items-center gap-2">
                  <account.icon className="w-4 h-4 text-muted-foreground" />
                  <Input
                    value={account.name}
                    onChange={(e) =>
                      handleInputChange(account.id, 'name', e.target.value)
                    }
                    className="border-none bg-transparent p-0 h-auto focus-visible:ring-0"
                  />
                </TableCell>
                <TableCell>
                  <Select
                    value={account.type}
                    onValueChange={(value) =>
                      handleInputChange(account.id, 'type', value)
                    }
                  >
                    <SelectTrigger className="w-[120px] border-none bg-transparent p-0 h-auto focus:ring-0">
                      <Badge variant="outline">
                        <SelectValue placeholder="Select type" />
                      </Badge>
                    </SelectTrigger>
                    <SelectContent>
                      {accountTypes.map((type) => (
                        <SelectItem key={type} value={type}>
                          {type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </TableCell>
                <TableCell>
                  <Input
                    type="number"
                    value={account.balance}
                    onChange={(e) =>
                      handleInputChange(account.id, 'balance', e.target.value)
                    }
                    className={`font-mono border-none bg-transparent p-0 h-auto focus-visible:ring-0 ${
                      account.balance >= 0
                        ? 'text-foreground'
                        : 'text-destructive'
                    }`}
                  />
                </TableCell>
                <TableCell className="text-right">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => deleteRow(account.id)}
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
