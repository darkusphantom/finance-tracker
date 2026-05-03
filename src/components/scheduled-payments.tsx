'use client';

import { useState, useEffect, useMemo } from 'react';
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Button } from './ui/button';
import { PlusCircle, Trash2, Loader2, ArrowUpDown, Pencil } from 'lucide-react';
import {
  addScheduledPaymentAction,
  updateScheduledPaymentAction,
  deleteScheduledPaymentAction,
} from '@/app/actions';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { v4 as uuidv4 } from 'uuid';
import { Badge } from '@/components/ui/badge';

function EditPaymentModal({
  item,
  open,
  onOpenChange,
  onSave,
}: {
  item: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (updatedItem: any) => void;
}) {
  const [form, setForm] = useState(item);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  useEffect(() => {
    if (open) setForm(item);
  }, [item, open]);

  const handleField = (field: string, value: any) => {
    setForm((prev: any) => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    const fieldsToUpdate: Array<{ field: string; value: any }> = [];

    const tracked = ['name', 'day', 'amount', 'type'];
    for (const field of tracked) {
      if (form[field] !== item[field]) {
        fieldsToUpdate.push({ field, value: form[field] });
      }
    }

    let hasError = false;
    for (const { field, value } of fieldsToUpdate) {
      const result = await updateScheduledPaymentAction({ id: item.id, field, value });
      if (result?.error) {
        toast({ title: 'Update Failed', description: result.error, variant: 'destructive' });
        hasError = true;
        break;
      }
    }

    if (!hasError) {
      toast({ title: 'Payment Updated', description: 'Changes have been saved.' });
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
          <DialogTitle>Edit Scheduled {item.category === 'income' ? 'Income' : 'Payment'}</DialogTitle>
          <DialogDescription>Update details about this scheduled item.</DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid gap-1.5">
            <Label>Name</Label>
            <Input value={form.name || ''} onChange={e => handleField('name', e.target.value)} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-1.5">
              <Label>Month Day</Label>
              <Input type="number" min="1" max="31" value={form.day} onChange={e => handleField('day', parseInt(e.target.value) || 1)} />
            </div>
            <div className="grid gap-1.5">
              <Label>Amount</Label>
              <Input type="number" value={form.amount} onChange={e => handleField('amount', parseFloat(e.target.value) || 0)} />
            </div>
          </div>

          <div className="grid gap-1.5">
            <Label>Type</Label>
            <Select value={form.type || ''} onValueChange={val => handleField('type', val)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="fixed">Fijo</SelectItem>
                <SelectItem value="variable">Variable</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function ScheduledPayments({ initialItems = [] }: { initialItems?: any[] }) {
  const [items, setItems] = useState(initialItems.map(item => ({ ...item, tempId: item.id || uuidv4() })));
  const [isSaving, setIsSaving] = useState<string | null>(null);
  const [incomeSort, setIncomeSort] = useState({ key: 'name', order: 'asc' });
  const [expenseSort, setExpenseSort] = useState({ key: 'name', order: 'asc' });
  const { toast } = useToast();
  const router = useRouter();

  useEffect(() => {
    setItems(initialItems.map(item => ({ ...item, tempId: item.id || uuidv4() })));
  }, [initialItems]);
  const [editingItem, setEditingItem] = useState<any | null>(null);

  const handleSaveItem = (updatedItem: any) => {
    setItems(prev =>
      prev.map(i => (i.id === updatedItem.id ? updatedItem : i))
    );
  };

  const addNewRow = async (category: 'income' | 'expense') => {
    const tempId = `new-${uuidv4()}`;
    const newItem = {
      tempId,
      id: tempId,
      name: 'Nuevo Item',
      day: 1,
      amount: 0,
      type: 'variable' as const,
      category,
    };

    const result = await addScheduledPaymentAction(newItem);
    if (result.success && result.newPageId) {
       toast({
        title: 'Item Added',
        description: 'The new item has been saved.',
       });
       router.refresh();
    } else {
        toast({
            title: 'Failed to Add',
            description: result.error || 'Could not save the new item.',
            variant: 'destructive',
        });
    }
  };

  const deleteRow = async (tempId: string) => {
    const itemToDelete = items.find(i => i.tempId === tempId);
    if (!itemToDelete) return;

    // Optimistically remove from UI
    const originalItems = items;
    setItems(items.filter(item => item.tempId !== tempId));

    if (!itemToDelete.id.startsWith('new-')) {
      const result = await deleteScheduledPaymentAction(itemToDelete.id);
      if (result.error) {
        toast({
          title: 'Delete Failed',
          description: result.error,
          variant: 'destructive',
        });
        setItems(originalItems); // Revert
      } else {
        toast({
          title: 'Item Deleted',
          description: 'The item has been removed.',
        });
        router.refresh();
      }
    }
  };

  const sortItems = (data: typeof items, sortConfig: {key: string, order: string}) => {
    return [...data].sort((a, b) => {
        const aValue = a[sortConfig.key as keyof typeof a];
        const bValue = b[sortConfig.key as keyof typeof a];
        if (aValue < bValue) return sortConfig.order === 'asc' ? -1 : 1;
        if (aValue > bValue) return sortConfig.order === 'asc' ? 1 : -1;
        return 0;
    });
  }
  
  const incomeItems = useMemo(() => sortItems(items.filter(item => item.category === 'income'), incomeSort), [items, incomeSort]);
  const expenseItems = useMemo(() => sortItems(items.filter(item => item.category === 'expense'), expenseSort), [items, expenseSort]);

  const totalIncome = useMemo(() => incomeItems.reduce((acc, item) => acc + (item.amount || 0), 0), [incomeItems]);
  const totalExpenses = useMemo(() => expenseItems.reduce((acc, item) => acc + (item.amount || 0), 0), [expenseItems]);


  const handleSort = (category: 'income' | 'expense', key: string) => {
    const setSort = category === 'income' ? setIncomeSort : setExpenseSort;
    const currentSort = category === 'income' ? incomeSort : expenseSort;

    setSort({
        key,
        order: currentSort.key === key && currentSort.order === 'asc' ? 'desc' : 'asc'
    });
  }

  const renderTable = (data: typeof items, category: 'income' | 'expense', total: number) => (
    <div>
        <div className='flex justify-between items-center mb-2'>
             <div className="flex items-baseline gap-4">
                <h3 className="text-lg font-semibold capitalize">{category === 'income' ? 'Ingresos Programados' : 'Pagos Programados'}</h3>
                 <p className="text-sm text-muted-foreground">
                    Total: {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(total)}
                </p>
            </div>
            <Button variant="outline" size="sm" onClick={() => addNewRow(category)}>
                <PlusCircle className="mr-2 h-4 w-4" />
                Añadir
            </Button>
        </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>
                <Button variant="ghost" onClick={() => handleSort(category, 'name')}>
                    Nombre
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
            </TableHead>
            <TableHead className='text-center'>
                <Button variant="ghost" onClick={() => handleSort(category, 'day')}>
                    Día del Mes
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
            </TableHead>
            <TableHead>
                <Button variant="ghost" onClick={() => handleSort(category, 'type')}>
                    Tipo
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
            </TableHead>
            <TableHead>
                <Button variant="ghost" onClick={() => handleSort(category, 'amount')}>
                    Monto
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
            </TableHead>
            <TableHead className="text-right">Acción</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map(item => (
            <TableRow key={item.tempId}>
              <TableCell>
                <div className='font-medium'>{item.name}</div>
              </TableCell>
              <TableCell className='text-center'>
                <Badge variant="outline">{item.day}</Badge>
              </TableCell>
              <TableCell>
                <Badge variant={item.type === 'fixed' ? 'default' : 'secondary'}>
                  {item.type === 'fixed' ? 'Fijo' : 'Variable'}
                </Badge>
              </TableCell>
              <TableCell>
                 <span className={`font-mono ${item.category === 'income' ? 'text-green-500' : 'text-destructive'}`}>
                    {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(item.amount)}
                 </span>
              </TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-1">
                  <Button variant="ghost" size="icon" onClick={() => setEditingItem(item)}>
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
                           This action cannot be undone. This will permanently delete this item.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={() => deleteRow(item.tempId)}>
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Pagos e Ingresos Programados</CardTitle>
        <CardDescription>
          Gestiona tus ingresos y gastos recurrentes del mes.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-8">
        <div key="income-table">{renderTable(incomeItems, 'income', totalIncome)}</div>
        <div key="expense-table">{renderTable(expenseItems, 'expense', totalExpenses)}</div>

        {editingItem && (
          <EditPaymentModal
            item={editingItem}
            open={!!editingItem}
            onOpenChange={(open) => !open && setEditingItem(null)}
            onSave={handleSaveItem}
          />
        )}
      </CardContent>
    </Card>
  );
}
