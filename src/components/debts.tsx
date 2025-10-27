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
import { useState, useEffect, useMemo } from 'react';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { Trash2, PlusCircle, Loader2, ArrowUpDown } from 'lucide-react';
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
import { addDebtAction, updateDebtAction, deleteTransactionAction } from '@/app/actions';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

const statusColors = {
  'Pendiente': 'border-yellow-500/50',
  'Sin pagar': 'border-red-500/50',
  'Listo': 'border-green-500/50',
};

export function Debts({
  isEditable = true,
  initialDebts = [],
}: {
  isEditable?: boolean;
  initialDebts?: any[];
}) {
  const [debts, setDebts] = useState(initialDebts);
  const [filter, setFilter] = useState('');
  const [page, setPage] = useState(1);
  const [isAdding, setIsAdding] = useState(false);
  const [isSaving, setIsSaving] = useState<string | null>(null);
  const [sort, setSort] = useState({ key: 'date', order: 'desc' });
  const itemsPerPage = isEditable ? 15 : 10;
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    setDebts(initialDebts);
  }, [initialDebts]);
  
  const handleSort = (key: string) => {
    if (!isEditable) return;
    setSort(prevSort => ({
      key,
      order: prevSort.key === key && prevSort.order === 'asc' ? 'desc' : 'asc',
    }));
  };

  const sortedAndFilteredDebts = useMemo(() => {
    let filtered = debts.filter(debt =>
      debt.name.toLowerCase().includes(filter.toLowerCase())
    );

    return filtered.sort((a, b) => {
      const aValue = a[sort.key as keyof typeof a];
      const bValue = b[sort.key as keyof typeof a];
      
      let comparison = 0;
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        comparison = aValue.localeCompare(bValue);
      } else if (aValue < bValue) {
        comparison = -1;
      } else if (aValue > bValue) {
        comparison = 1;
      }

      return sort.order === 'asc' ? comparison : -comparison;
    });
  }, [debts, filter, sort]);


  const paginatedDebts = useMemo(() => {
    if (!isEditable) {
      return sortedAndFilteredDebts.slice(0, itemsPerPage);
    }
    const startIndex = (page - 1) * itemsPerPage;
    return sortedAndFilteredDebts.slice(startIndex, startIndex + itemsPerPage);
  }, [sortedAndFilteredDebts, page, itemsPerPage, isEditable]);

  const totalPages = isEditable
    ? Math.ceil(sortedAndFilteredDebts.length / itemsPerPage)
    : 1;

  const handleInputChange = (id: string, field: string, value: any) => {
    const newDebts = debts.map(debt => {
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

  const handleUpdate = async (id: string, field: string, value: any) => {
    if (!isEditable) return;
    setIsSaving(`${id}-${field}`);
    const result = await updateDebtAction({ id, field, value });
    if (result?.error) {
      toast({
        title: 'Update Failed',
        description: result.error,
        variant: 'destructive',
      });
      setDebts(initialDebts); // Revert
    } else {
      router.refresh();
    }
    setIsSaving(null);
  };

  const handleAddNewDebt = async () => {
    setIsAdding(true);
    const result = await addDebtAction();
    if (result.success) {
      toast({
        title: 'Debt Added',
        description: 'The new debt has been created.',
      });
      router.refresh();
    } else {
      toast({
        title: 'Failed to Add',
        description: result.error || 'Could not save the new debt.',
        variant: 'destructive',
      });
    }
    setIsAdding(false);
  };
  
    const deleteRow = async (id: string) => {
        const originalDebts = debts;
        setDebts(debts.filter(d => d.id !== id));

        const result = await deleteTransactionAction(id); // Reusing delete action
        if (result.error) {
            toast({
                title: 'Delete Failed',
                description: result.error,
                variant: 'destructive',
            });
            setDebts(originalDebts);
        } else {
            toast({
                title: 'Debt Deleted',
                description: 'The item has been removed.',
            });
            router.refresh();
        }
    };

  return (
    <Card>
      <CardHeader className="flex-row justify-between items-center">
        <div>
          <CardTitle>Debts & Debtors</CardTitle>
          <CardDescription>
            Track your outstanding debts and what others owe you.
          </CardDescription>
        </div>
        {isEditable && (
          <Button onClick={handleAddNewDebt} disabled={isAdding}>
            {isAdding ? <Loader2 className="animate-spin" /> : <PlusCircle />}
            Add Debt
          </Button>
        )}
      </CardHeader>
      <CardContent>
        {isEditable && (
          <div className="mb-4">
            <Input
              placeholder="Search debts by name..."
              value={filter}
              onChange={e => setFilter(e.target.value)}
            />
          </div>
        )}
        {isEditable && (
            <div className="flex flex-wrap items-center gap-2 mb-4 text-sm text-muted-foreground">
                <span>Sort by:</span>
                <Button variant="ghost" size="sm" onClick={() => handleSort('date')}><ArrowUpDown className="w-4 h-4 mr-2" />Date</Button>
                <Button variant="ghost" size="sm" onClick={() => handleSort('name')}><ArrowUpDown className="w-4 h-4 mr-2" />Name</Button>
                <Button variant="ghost" size="sm" onClick={() => handleSort('status')}><ArrowUpDown className="w-4 h-4 mr-2" />Status</Button>
                <Button variant="ghost" size="sm" onClick={() => handleSort('total')}><ArrowUpDown className="w-4 h-4 mr-2" />Total</Button>
            </div>
        )}
        <div className="space-y-4">
          {paginatedDebts.map(debt => (
            <div key={debt.id} className={cn("p-4 rounded-lg border-2", statusColors[debt.status as keyof typeof statusColors] || 'border-border')}>
              <div className="flex justify-between items-start mb-2">
                <div>
                   <div className="relative flex-1 mr-4">
                        {isEditable ? (
                            <Input
                            value={debt.name}
                            onChange={e => handleInputChange(debt.id, 'name', e.target.value)}
                            onBlur={e => handleUpdate(debt.id, 'name', e.target.value)}
                            className="font-medium text-lg border-none bg-transparent p-0 h-auto focus-visible:ring-0 w-full"
                            />
                        ) : (
                            <span className="font-medium text-lg">{debt.name}</span>
                        )}
                        {isSaving === `${debt.id}-name` && <Loader2 className="animate-spin absolute right-0 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />}
                    </div>
                     <div className="relative flex-1 mr-4 mt-1">
                        {isEditable ? (
                            <Input
                                value={debt.reason}
                                onChange={(e) => handleInputChange(debt.id, 'reason', e.target.value)}
                                onBlur={(e) => handleUpdate(debt.id, 'reason', e.target.value)}
                                placeholder="Reason..."
                                className="text-sm text-muted-foreground border-none bg-transparent p-0 h-auto focus-visible:ring-0 w-full"
                            />
                        ) : (
                            <p className="text-sm text-muted-foreground">{debt.reason}</p>
                        )}
                         {isSaving === `${debt.id}-reason` && <Loader2 className="animate-spin absolute right-0 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />}
                    </div>
                </div>

                <div className="flex flex-col items-end gap-1">
                    {isEditable ? (
                      <Select
                        value={debt.status}
                        onValueChange={value => {
                          handleInputChange(debt.id, 'status', value);
                          handleUpdate(debt.id, 'status', value);
                        }}
                      >
                        <SelectTrigger className="w-fit border-none bg-transparent p-0 h-auto focus:ring-0 text-xs">
                          <Badge
                            variant={
                              debt.status === 'Listo'
                                ? 'secondary'
                                : 'destructive'
                            }
                          >
                            <SelectValue placeholder="Select status" />
                          </Badge>
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Sin pagar">Sin pagar</SelectItem>
                          <SelectItem value="Pendiente">Pendiente</SelectItem>
                          <SelectItem value="Listo">Listo</SelectItem>
                        </SelectContent>
                      </Select>
                    ) : (
                      <Badge
                        variant={
                          debt.status === 'Listo' ? 'secondary' : 'destructive'
                        }
                      >
                        {debt.status}
                      </Badge>
                    )}
                     <Badge
                        variant={debt.type === 'Debt' ? 'destructive' : 'secondary'}
                        className="w-fit"
                    >
                        {debt.type}
                    </Badge>
                </div>
              </div>

                <div className="flex justify-between items-baseline text-sm mb-1">
                     <div className="text-muted-foreground flex items-center gap-1 text-xs">
                        {isEditable ? (
                             <Input
                                type="date"
                                value={debt.date}
                                onChange={(e) => handleInputChange(debt.id, 'date', e.target.value)}
                                onBlur={(e) => handleUpdate(debt.id, 'date', e.target.value)}
                                className="font-mono border-none bg-transparent p-0 h-auto focus-visible:ring-0 w-[120px]"
                            />
                        ) : (
                           <span>{format(new Date(debt.date), "MMM d, yyyy")}</span>
                        )}
                    </div>
                    <div className="text-muted-foreground flex items-center gap-1">
                        Paid:
                        {isEditable ? (
                        <>
                            $
                            <Input
                            type="number"
                            value={debt.paid}
                            onChange={e =>
                                handleInputChange(debt.id, 'paid', e.target.value)
                            }
                            onBlur={e => handleUpdate(debt.id, 'paid', e.target.value)}
                            className="font-mono border-none bg-transparent p-0 h-auto focus-visible:ring-0 w-20"
                            />
                            of $
                            <Input
                            type="number"
                            value={debt.total}
                            onChange={e =>
                                handleInputChange(debt.id, 'total', e.target.value)
                            }
                             onBlur={e => handleUpdate(debt.id, 'total', e.target.value)}
                            className="font-mono border-none bg-transparent p-0 h-auto focus-visible:ring-0 w-20"
                            />
                        </>
                        ) : (
                        <span className="font-mono">
                            {new Intl.NumberFormat('en-US', {
                            style: 'currency',
                            currency: 'USD',
                            }).format(debt.paid)}{' '}
                            of{' '}
                            {new Intl.NumberFormat('en-US', {
                            style: 'currency',
                            currency: 'USD',
                            }).format(debt.total)}
                        </span>
                        )}
                    </div>
                    {isEditable && (
                        <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-6 w-6">
                            <Trash2 className="w-4 h-4 text-destructive" />
                            </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                            <AlertDialogDescription>
                                This action cannot be undone. This will permanently delete
                                this item.
                            </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => deleteRow(debt.id)}>
                                Delete
                            </AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                        </AlertDialog>
                    )}
                </div>

              <Progress
                value={debt.total > 0 ? (debt.paid / debt.total) * 100 : 0}
              />
            </div>
          ))}
        </div>
        {isEditable && totalPages > 1 && (
          <div className="flex justify-between items-center mt-6">
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
