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
import { Landmark, Trash2, Wallet, ArrowUpDown, PlusCircle, Loader2 } from 'lucide-react';
import { Badge } from './ui/badge';
import { useState, useEffect, useMemo } from 'react';
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
} from '@/components/ui/alert-dialog';
import { Checkbox } from './ui/checkbox';
import { addAccountAction, updateAccountAction, deleteTransactionAction } from '@/app/actions';
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
  const [isSaving, setIsSaving] = useState<string | null>(null);
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
  
    const handleUpdate = async (id: string, field: string, value: any) => {
      if (!isEditable) return;
      setIsSaving(`${id}-${field}`);
      const result = await updateAccountAction({ id, field, value });
      if (result?.error) {
        toast({
          title: 'Update Failed',
          description: result.error,
          variant: 'destructive',
        });
        setAccounts(initialAccounts); // Revert
      } else {
        router.refresh();
      }
      setIsSaving(null);
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


  const deleteRow = async (id: string) => {
    const originalAccounts = accounts;
    setAccounts(accounts.filter(a => a.id !== id));

    const result = await deleteTransactionAction(id); // Reusing delete action
    if (result.error) {
        toast({
            title: 'Delete Failed',
            description: result.error,
            variant: 'destructive',
        });
        setAccounts(originalAccounts);
    } else {
        toast({
            title: 'Account Deleted',
            description: 'The account has been removed.',
        });
        router.refresh();
    }
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
                <Button variant="ghost" onClick={() => handleSort('accountNumber')}>
                    Account #
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
               <TableHead>
                <Button variant="ghost" onClick={() => handleSort('lastTransactionDate')}>
                    Last Tx Date
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
              </TableHead>
              {isEditable && <TableHead className="text-right">Actions</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedAccounts.map(account => {
              const Icon = getIcon(account.type);
              return (
                <TableRow key={account.id}>
                  <TableCell>
                    <Checkbox
                        checked={!account.isActive}
                        onCheckedChange={value => {
                            if (isEditable) {
                                handleInputChange(account.id, 'isActive', !value);
                                handleUpdate(account.id, 'isActive', !value);
                            }
                        }}
                        disabled={!isEditable}
                    />
                  </TableCell>
                  <TableCell className="font-medium flex items-center gap-2">
                    <Icon className="w-4 h-4 text-muted-foreground" />
                    {isEditable ? (
                      <Input
                        value={account.name}
                        onChange={e =>
                          handleInputChange(account.id, 'name', e.target.value)
                        }
                        onBlur={e => handleUpdate(account.id, 'name', e.target.value)}
                        className="border-none bg-transparent p-0 h-auto focus-visible:ring-0"
                      />
                    ) : (
                      <span>{account.name}</span>
                    )}
                  </TableCell>
                   <TableCell>
                    {isEditable ? (
                      <Input
                        value={account.accountNumber}
                        onChange={e => handleInputChange(account.id, 'accountNumber', e.target.value)}
                        onBlur={e => handleUpdate(account.id, 'accountNumber', e.target.value)}
                        className="border-none bg-transparent p-0 h-auto focus-visible:ring-0"
                        placeholder="N/A"
                      />
                    ) : (
                      <span>{account.accountNumber || 'N/A'}</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {isEditable ? (
                      <Select
                        value={account.type}
                        onValueChange={value => {
                            handleInputChange(account.id, 'type', value);
                            handleUpdate(account.id, 'type', value);
                        }}
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
                      <Select
                        value={account.currency}
                        onValueChange={value => {
                            handleInputChange(account.id, 'currency', value);
                            handleUpdate(account.id, 'currency', value);
                        }}
                      >
                        <SelectTrigger className="w-[100px] border-none bg-transparent p-0 h-auto focus:ring-0">
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
                    ) : (
                      <span>{account.currency}</span>
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
                        onBlur={e => handleUpdate(account.id, 'balance', e.target.value)}
                        className={`font-mono border-none bg-transparent p-0 h-auto focus-visible:ring-0 ${
                          account.balance >= 0
                            ? 'text-foreground'
                            : 'text-destructive'
                        }`}
                      />
                    ) : (
                       <span className={`font-mono ${account.balance >= 0 ? 'text-foreground' : 'text-destructive'}`}>
                        {formatCurrency(account.balance, account.currency)}
                      </span>
                    )}
                  </TableCell>
                  <TableCell>
                    {isEditable ? (
                      <Input
                        type="date"
                        value={account.lastTransactionDate}
                        onChange={e => handleInputChange(account.id, 'lastTransactionDate', e.target.value)}
                        onBlur={e => handleUpdate(account.id, 'lastTransactionDate', e.target.value)}
                        className="border-none bg-transparent p-0 h-auto focus-visible:ring-0"
                      />
                    ) : (
                      <span>{account.lastTransactionDate ? new Date(account.lastTransactionDate).toLocaleDateString() : 'N/A'}</span>
                    )}
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
      </CardContent>
    </Card>
  );
}
