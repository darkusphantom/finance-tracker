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
import { Trash2, PlusCircle, Loader2 } from 'lucide-react';
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
import { addDebtAction, updateDebtAction } from '@/app/actions';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';

export function Debts({ isEditable = true, initialDebts = [] }: { isEditable?: boolean, initialDebts?: any[] }) {
  const [debts, setDebts] = useState(initialDebts);
  const [filter, setFilter] = useState('');
  const [page, setPage] = useState(1);
  const [isAdding, setIsAdding] = useState(false);
  const [isSaving, setIsSaving] = useState<string | null>(null);
  const itemsPerPage = isEditable ? 15 : 10;
  const router = useRouter();
  const { toast } = useToast();
  
  useEffect(() => {
    setDebts(initialDebts);
  }, [initialDebts]);

  const filteredDebts = useMemo(() => {
     if (!isEditable) {
        return debts.slice(0, itemsPerPage);
     }
     return debts.filter(debt => debt.name.toLowerCase().includes(filter.toLowerCase()));
  }, [debts, filter, isEditable, itemsPerPage]);

  const paginatedDebts = useMemo(() => {
    if (!isEditable) {
      return filteredDebts;
    }
    const startIndex = (page - 1) * itemsPerPage;
    return filteredDebts.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredDebts, page, itemsPerPage, isEditable]);

  const totalPages = isEditable ? Math.ceil(filteredDebts.length / itemsPerPage) : 1;


  const handleInputChange = (id: string, field: string, value: any) => {
    const newDebts = debts.map((debt) => {
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


  const deleteRow = (id: string) => {
    setDebts(debts.filter((debt) => debt.id !== id));
  };

  return (
    <Card>
      <CardHeader className='flex-row justify-between items-center'>
        <div>
            <CardTitle>Debts & Debtors</CardTitle>
            <CardDescription>
            Track your outstanding debts and what others owe you.
            </CardDescription>
        </div>
         {isEditable && (
            <Button onClick={handleAddNewDebt} disabled={isAdding}>
                {isAdding ? <Loader2 className='animate-spin' /> : <PlusCircle />}
                Add Debt
            </Button>
        )}
      </CardHeader>
      <CardContent>
        {isEditable && (
          <div className="mb-4">
            <Input 
              placeholder="Search debts..."
              value={filter}
              onChange={e => setFilter(e.target.value)}
            />
          </div>
        )}
        <div className="space-y-6">
        {paginatedDebts.map((debt) => (
          <div key={debt.id}>
            <div className="flex justify-between items-center mb-2">
              <div className="relative flex-1 mr-4">
                {isEditable ? (
                    <Input
                    value={debt.name}
                    onChange={(e) => handleInputChange(debt.id, 'name', e.target.value)}
                    onBlur={(e) => handleUpdate(debt.id, 'name', e.target.value)}
                    className="font-medium border-none bg-transparent p-0 h-auto focus-visible:ring-0 w-full"
                    />
                ) : (
                    <span className="font-medium">{debt.name}</span>
                )}
                 {isSaving === `${debt.id}-name` && <Loader2 className="animate-spin absolute right-0 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />}
              </div>
              {isEditable ? (
                 <Select
                    value={debt.type}
                    onValueChange={(value) => {
                        handleInputChange(debt.id, 'type', value);
                        handleUpdate(debt.id, 'type', value);
                    }}
                    >
                    <SelectTrigger className="w-[120px] border-none bg-transparent p-0 h-auto focus:ring-0 text-xs">
                         <Badge variant={debt.type === 'Debt' ? 'destructive' : 'secondary'}>
                            <SelectValue placeholder="Select type" />
                         </Badge>
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="Debt">Debt</SelectItem>
                        <SelectItem value="Debtor">Debtor</SelectItem>
                    </SelectContent>
                 </Select>
              ) : (
                <Badge
                    variant={debt.type === 'Debt' ? 'destructive' : 'secondary'}
                >
                    {debt.type}
                </Badge>
              )}
            </div>
            <div className="flex justify-between items-baseline text-sm mb-1">
              <div className="text-muted-foreground flex items-center gap-1">
                Paid: 
                {isEditable ? (
                  <>
                    $
                    <Input
                      type="number"
                      value={debt.paid}
                      onChange={(e) =>
                        handleInputChange(debt.id, 'paid', e.target.value)
                      }
                      onBlur={(e) => handleUpdate(debt.id, 'paid', e.target.value)}
                      className="font-mono border-none bg-transparent p-0 h-auto focus-visible:ring-0 w-20"
                    />
                    of $
                    <Input
                      type="number"
                      value={debt.total}
                      onChange={(e) =>
                        handleInputChange(debt.id, 'total', e.target.value)
                      }
                      onBlur={(e) => handleUpdate(debt.id, 'total', e.target.value)}
                      className="font-mono border-none bg-transparent p-0 h-auto focus-visible:ring-0 w-20"
                    />
                  </>
                ) : (
                  <span className="font-mono">
                    {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(debt.paid)} of {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(debt.total)}
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
                             This action cannot be undone. This will permanently delete this item.
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
            <Progress value={debt.total > 0 ? (debt.paid / debt.total) * 100 : 0} />
          </div>
        ))}
        </div>
        {isEditable && totalPages > 1 && (
          <div className="flex justify-between items-center mt-6">
              <Button onClick={() => setPage(p => Math.max(1, p-1))} disabled={page === 1} variant="outline">Previous</Button>
              <span>Page {page} of {totalPages}</span>
              <Button onClick={() => setPage(p => Math.min(totalPages, p+1))} disabled={page === totalPages} variant="outline">Next</Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
