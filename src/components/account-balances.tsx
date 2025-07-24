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
import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
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
import { Checkbox } from './ui/checkbox';

const accountTypes = ['Corriente', 'Ahorro', 'Fisico', 'Credit', 'Investment'];

export function AccountBalances({
  isEditable = true,
  initialAccounts = [],
}: {
  isEditable?: boolean;
  initialAccounts?: any[];
}) {
  const [accounts, setAccounts] = useState(() => initialAccounts);
  const displayAccounts = isEditable ? accounts : initialAccounts;

  useEffect(() => {
    setAccounts(initialAccounts);
  }, [initialAccounts]);

  const handleInputChange = (id: string, field: string, value: any) => {
    const newAccounts = accounts.map(account => {
      if (account.id === id) {
        if (field === 'balance') {
          return { ...account, [field]: parseFloat(value) || 0 };
        }
        if (field === 'isActive') {
          return { ...account, [field]: value };
        }
        return { ...account, [field]: value };
      }
      return account;
    });
    setAccounts(newAccounts);
  };

  const deleteRow = (id: string) => {
    setAccounts(accounts.filter(account => account.id !== id));
  };

  const getIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'corriente':
      case 'ahorro':
        return Landmark;
      case 'fisico':
      case 'credit':
      case 'investment':
      default:
        return Wallet;
    }
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
              <TableHead>Active</TableHead>
              {isEditable && <TableHead className="text-right">Actions</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {displayAccounts.map(account => {
              const Icon = getIcon(account.type);
              return (
                <TableRow key={account.id}>
                  <TableCell className="font-medium flex items-center gap-2">
                    <Icon className="w-4 h-4 text-muted-foreground" />
                    {isEditable ? (
                      <Input
                        value={account.name}
                        onChange={e =>
                          handleInputChange(account.id, 'name', e.target.value)
                        }
                        className="border-none bg-transparent p-0 h-auto focus-visible:ring-0"
                      />
                    ) : (
                      <span>{account.name}</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {isEditable ? (
                      <Select
                        value={account.type}
                        onValueChange={value =>
                          handleInputChange(account.id, 'type', value)
                        }
                      >
                        <SelectTrigger className="w-[120px] border-none bg-transparent p-0 h-auto focus:ring-0">
                          <Badge variant="outline">
                            <SelectValue placeholder="Select type" />
                          </Badge>
                        </SelectTrigger>
                        <SelectContent>
                          {accountTypes.map(type => (
                            <SelectItem key={type} value={type}>
                              {type}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <Badge variant="outline">{account.type}</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    {isEditable ? (
                      <Input
                        type="number"
                        value={account.balance}
                        onChange={e =>
                          handleInputChange(
                            account.id,
                            'balance',
                            e.target.value
                          )
                        }
                        className={`font-mono border-none bg-transparent p-0 h-auto focus-visible:ring-0 ${
                          account.balance >= 0
                            ? 'text-foreground'
                            : 'text-destructive'
                        }`}
                      />
                    ) : (
                      <span
                        className={`font-mono ${
                          account.balance >= 0
                            ? 'text-foreground'
                            : 'text-destructive'
                        }`}
                      >
                        {new Intl.NumberFormat('en-US', {
                          style: 'currency',
                          currency: 'USD',
                        }).format(account.balance)}
                      </span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Checkbox
                        checked={account.isActive}
                        onCheckedChange={value =>
                            isEditable && handleInputChange(account.id, 'isActive', value)
                        }
                        disabled={!isEditable}
                    />
                  </TableCell>
                  {isEditable && (
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
                              This action cannot be undone. This will
                              permanently delete this account.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => deleteRow(account.id)}
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </TableCell>
                  )}
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
