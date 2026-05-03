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
import { Landmark, Trash2, Pencil, Wallet, ArrowUpDown, PlusCircle, Loader2 } from 'lucide-react';
import { Badge } from './ui/badge';
import { useState, useEffect, useMemo } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { Checkbox } from './ui/checkbox';
import { addAccountAction, updateAccountAction, deleteAccountAction } from '@/app/actions';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { Separator } from './ui/separator';

const accountTypes = ['Corriente', 'Ahorro', 'Fisico', 'Credit', 'Investment'];
const currencies = ['USD', 'VES', 'USDT'];

type ExchangeRate = {
  promedio: number;
};

const formatCurrency = (value: number, currency: string) => {
  const displayCurrency = currency === 'USDT' ? 'USD' : currency;
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: displayCurrency,
  }).format(value);
};

function EditAccountModal({
  account,
  open,
  onOpenChange,
  onSave,
}: {
  account: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (updatedAccount: any) => void;
}) {
  const [form, setForm] = useState(account);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  useEffect(() => {
    if (open) {
      setForm(account);
    }
  }, [account, open]);

  const handleField = (field: string, value: any) => {
    setForm((prev: any) => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    const fieldsToUpdate: Array<{ field: string; value: any }> = [];

    const tracked = ['name', 'type', 'currency', 'balance', 'isActive', 'accountNumber'];
    for (const field of tracked) {
      if (form[field] !== account[field]) {
        fieldsToUpdate.push({ field, value: form[field] });
      }
    }

    let hasError = false;
    for (const { field, value } of fieldsToUpdate) {
      const result = await updateAccountAction({
        id: account.id,
        field,
        value,
      });
      if (result?.error) {
        toast({
          title: 'Update Failed',
          description: result.error,
          variant: 'destructive',
        });
        hasError = true;
        break;
      }
    }

    if (!hasError) {
      toast({ title: 'Account Updated', description: 'Changes have been saved.' });
      onSave(form);
      onOpenChange(false);
      router.refresh();
    }
    setIsSaving(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Account</DialogTitle>
          <DialogDescription>Make changes to the account here.</DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="isActive"
              checked={!form.isActive}
              onCheckedChange={(checked) => handleField('isActive', !checked)}
            />
            <Label htmlFor="isActive">Paused</Label>
          </div>

          <div className="grid gap-1.5">
            <Label htmlFor="name">Account Name</Label>
            <Input
              id="name"
              value={form.name || ''}
              onChange={e => handleField('name', e.target.value)}
            />
          </div>

          <div className="grid gap-1.5">
            <Label htmlFor="accountNumber">Account Number (Optional)</Label>
            <Input
              id="accountNumber"
              value={form.accountNumber || ''}
              onChange={e => handleField('accountNumber', e.target.value)}
            />
          </div>

          <div className="grid gap-1.5">
            <Label>Type</Label>
            <Select
              value={form.type || ''}
              onValueChange={value => handleField('type', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                {accountTypes.map(c => (
                  <SelectItem key={c} value={c}>
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-1.5">
            <Label>Currency</Label>
            <Select
              value={form.currency || ''}
              onValueChange={value => handleField('currency', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select currency" />
              </SelectTrigger>
              <SelectContent>
                {currencies.map(c => (
                  <SelectItem key={c} value={c}>
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-1.5">
            <Label htmlFor="balance">Balance</Label>
            <Input
              id="balance"
              type="number"
              step="0.01"
              value={form.balance}
              onChange={e => handleField('balance', parseFloat(e.target.value) || 0)}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function AccountBalances({
  isEditable = true,
  initialAccounts = [],
}: {
  isEditable?: boolean;
  initialAccounts?: any[];
}) {
  const [accounts, setAccounts] = useState(() => [...initialAccounts]);
  const [filter, setFilter] = useState('');
  const [sort, setSort] = useState({ key: 'name', order: 'asc' });
  const [page, setPage] = useState(1);
  const [isAdding, setIsAdding] = useState(false);
  const [officialRate, setOfficialRate] = useState<number | null>(null);
  const [rateLoading, setRateLoading] = useState(true);

  const itemsPerPage = isEditable ? 15 : 10;
  const { toast } = useToast();
  const router = useRouter();

  useEffect(() => {
    setAccounts([...initialAccounts]);
  }, [initialAccounts]);

  useEffect(() => {
    const fetchRate = async () => {
      try {
        setRateLoading(true);
        const response = await fetch('https://ve.dolarapi.com/v1/dolares/oficial');
        if (!response.ok) {
          throw new Error('Failed to fetch exchange rate.');
        }
        const data: ExchangeRate = await response.json();
        setOfficialRate(data.promedio);
      } catch (err) {
        console.error(err);
        toast({
          title: 'Error fetching rate',
          description: 'Could not fetch the official exchange rate.',
          variant: 'destructive',
        });
      } finally {
        setRateLoading(false);
      }
    };
    fetchRate();
  }, [toast]);


  const { totalBalanceUSD, totalBalanceVES } = useMemo(() => {
    if (!officialRate) return { totalBalanceUSD: 0, totalBalanceVES: 0 };

    const totalUSD = accounts.reduce((acc, account) => {
      if (!account.isActive) return acc;
      switch (account.currency) {
        case 'USD':
        case 'USDT':
          return acc + account.balance;
        case 'VES':
          return acc + (account.balance / officialRate);
        default:
          return acc;
      }
    }, 0);

    return {
      totalBalanceUSD: totalUSD,
      totalBalanceVES: totalUSD * officialRate,
    }

  }, [accounts, officialRate]);

  const handleSort = (key: string) => {
    if (!isEditable) return;
    setSort(prevSort => ({
      key,
      order: prevSort.key === key && prevSort.order === 'asc' ? 'desc' : 'asc',
    }));
  };

  const sortedAndFilteredAccounts = useMemo(() => {
    let filtered = accounts;
    if (isEditable) {
      filtered = accounts.filter(account =>
        account.name.toLowerCase().includes(filter.toLowerCase())
      );
    }

    return filtered.sort((a, b) => {
      const aValue = a[sort.key as keyof typeof a];
      const bValue = b[sort.key as keyof typeof a];
      if (aValue < bValue) return sort.order === 'asc' ? -1 : 1;
      if (aValue > bValue) return sort.order === 'asc' ? 1 : -1;
      return 0;
    });
  }, [accounts, filter, sort, isEditable]);

  const paginatedAccounts = useMemo(() => {
    if (!isEditable) {
      return sortedAndFilteredAccounts.slice(0, itemsPerPage);
    }
    const startIndex = (page - 1) * itemsPerPage;
    return sortedAndFilteredAccounts.slice(startIndex, startIndex + itemsPerPage);
  }, [sortedAndFilteredAccounts, page, itemsPerPage, isEditable]);

  const totalPages = isEditable ? Math.ceil(sortedAndFilteredAccounts.length / itemsPerPage) : 1;

  const [editingAccount, setEditingAccount] = useState<any | null>(null);

  const handleSaveAccount = (updatedAccount: any) => {
    setAccounts(prev =>
      prev.map(a => (a.id === updatedAccount.id ? updatedAccount : a))
    );
  };

  const handleDelete = async (id: string) => {
    const result = await deleteAccountAction(id);
    if (result.success) {
      toast({ title: 'Account Deleted', description: 'Account removed successfully.' });
      setAccounts(accounts.filter(account => account.id !== id));
      router.refresh();
    } else {
      toast({ title: 'Delete Failed', description: result.error, variant: 'destructive' });
    }
  };

  const handleAddNewAccount = async () => {
    setIsAdding(true);
    const result = await addAccountAction();
    if (result.success) {
      toast({
        title: 'Account Added',
        description: 'The new account has been created.',
      });
      router.refresh();
    } else {
      toast({
        title: 'Failed to Add',
        description: result.error || 'Could not save the new account.',
        variant: 'destructive',
      });
    }
    setIsAdding(false);
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
        <div className='flex flex-col sm:flex-row sm:justify-between sm:items-center'>
          <div>
            <CardTitle>Account Balances</CardTitle>
            <CardDescription>
              A live look at your connected account balances.
            </CardDescription>
          </div>
          {isEditable && (
            <Button onClick={handleAddNewAccount} disabled={isAdding} className="mt-4 sm:mt-0">
              {isAdding ? <Loader2 className='animate-spin' /> : <PlusCircle />}
              Add Account
            </Button>
          )}
        </div>
        <Separator className="my-4" />
        <div className="text-center sm:text-left">
          <p className="text-sm text-muted-foreground">Total Balance</p>
          {rateLoading ? <Loader2 className="animate-spin h-8 w-8 mx-auto sm:mx-0" /> : (
            <>
              <p className="text-3xl font-bold">{formatCurrency(totalBalanceUSD, 'USD')}</p>
              <p className="text-md text-muted-foreground">{formatCurrency(totalBalanceVES, 'VES')} (1 USD ≈ {officialRate?.toFixed(2)} VES)</p>
            </>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {isEditable && (
          <div className="mb-4">
            <Input
              placeholder="Search accounts..."
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
            />
          </div>
        )}
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>
                  <Button variant="ghost" onClick={() => handleSort('isActive')}>
                    Paused
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                  </Button>
                </TableHead>
                <TableHead>
                  <Button variant="ghost" onClick={() => handleSort('name')}>
                    Account
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                  </Button>
                </TableHead>
                <TableHead>
                  <Button variant="ghost" onClick={() => handleSort('type')}>
                    Type
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                  </Button>
                </TableHead>
                <TableHead>
                  <Button variant="ghost" onClick={() => handleSort('currency')}>
                    Currency
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                  </Button>
                </TableHead>
                <TableHead>
                  <Button variant="ghost" onClick={() => handleSort('balance')}>
                    Balance
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                  </Button>
                </TableHead>
                <TableHead>Last Tx</TableHead>
                {isEditable && <TableHead className="text-right">Actions</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedAccounts.map(account => {
                const Icon = getIcon(account.type);
                const displayCurrency = account.currency === 'USDT' ? 'USD' : account.currency;
                return (
                  <TableRow key={account.id}>
                    <TableCell>
                      <Checkbox
                        checked={!account.isActive}
                        disabled
                      />
                    </TableCell>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <Icon className="w-4 h-4 text-muted-foreground shrink-0" />
                        <div className="flex flex-col">
                          <span>{account.name}</span>
                          {account.accountNumber && (
                            <span className="text-xs text-muted-foreground font-mono">
                              #{account.accountNumber}
                            </span>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{account.type}</Badge>
                    </TableCell>
                    <TableCell>
                      <span>{account.currency}</span>
                    </TableCell>
                    <TableCell>
                      <span
                        className={`font-mono ${account.balance >= 0
                            ? 'text-foreground'
                            : 'text-destructive'
                          }`}
                      >
                        {new Intl.NumberFormat('en-US', {
                          style: 'currency',
                          currency: displayCurrency,
                        }).format(account.balance)}
                      </span>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                      {account.lastTransactionDate
                        ? (() => {
                          const [y, m, d] = account.lastTransactionDate.split('-');
                          return `${d}/${m}/${y}`;
                        })()
                        : '—'}
                    </TableCell>
                    {isEditable && (
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setEditingAccount(account)}
                          >
                            <Pencil className="w-4 h-4 text-muted-foreground" />
                          </Button>
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
                                  onClick={() => handleDelete(account.id)}
                                >
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </TableCell>
                    )}
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
        {isEditable && totalPages > 1 && (
          <div className="flex justify-between items-center mt-4">
            <Button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              variant="outline"
            >
              Previous
            </Button>
            <span>
              Page {page} of {totalPages}
            </span>
            <Button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              variant="outline"
            >
              Next
            </Button>
          </div>
        )}

        {editingAccount && (
          <EditAccountModal
            account={editingAccount}
            open={!!editingAccount}
            onOpenChange={(open) => !open && setEditingAccount(null)}
            onSave={handleSaveAccount}
          />
        )}
      </CardContent>
    </Card>
  );
}
