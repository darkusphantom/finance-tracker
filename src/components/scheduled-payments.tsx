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
import { Button } from './ui/button';
import { PlusCircle, Trash2, Loader2, ArrowUpDown } from 'lucide-react';
import {
  addScheduledPaymentAction,
  updateScheduledPaymentAction,
  deleteScheduledPaymentAction,
} from '@/app/actions';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { v4 as uuidv4 } from 'uuid';

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

  const handleInputChange = (tempId: string, field: string, value: any) => {
    const newItems = items.map(item => {
      if (item.tempId === tempId) {
        if (field === 'amount' || field === 'day') {
            return { ...item, [field]: parseFloat(value) || 0 };
        }
        return { ...item, [field]: value };
      }
      return item;
    });
    setItems(newItems);
  };
  
  const handleUpdate = async (tempId: string, field: string, value: any) => {
    const itemToUpdate = items.find(i => i.tempId === tempId);
    if (!itemToUpdate || itemToUpdate.id.startsWith('new-')) {
        // This is a new item, it will be saved with the "Add" button
        return;
    }
    
    setIsSaving(`${tempId}-${field}`);
    const result = await updateScheduledPaymentAction({ id: itemToUpdate.id, field, value });

    if (result?.error) {
        toast({
            title: 'Update Failed',
            description: result.error,
            variant: 'destructive',
        });
        // Optionally revert state
    } else {
        router.refresh();
    }
    setIsSaving(null);
  };


  const addNewRow = async (category: 'income' | 'expense') => {
    const tempId = `new-${uuidv4()}`;
    const newItem = {
      tempId,
      id: tempId,
      name: 'Nuevo Item',
      day: 1,
      amount: 0,
      type: 'variable',
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

  const handleSort = (category: 'income' | 'expense', key: string) => {
    const setSort = category === 'income' ? setIncomeSort : setExpenseSort;
    const currentSort = category === 'income' ? incomeSort : expenseSort;

    setSort({
        key,
        order: currentSort.key === key && currentSort.order === 'asc' ? 'desc' : 'asc'
    });
  }

  const renderTable = (data: typeof items, category: 'income' | 'expense') => (
    <div>
        <div className='flex justify-between items-center mb-2'>
            <h3 className="text-lg font-semibold capitalize">{category === 'income' ? 'Ingresos Programados' : 'Pagos Programados'}</h3>
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
                <div className='relative'>
                    <Input
                    value={item.name}
                    onChange={e => handleInputChange(item.tempId, 'name', e.target.value)}
                    onBlur={e => handleUpdate(item.tempId, 'name', e.target.value)}
                    className="border-none bg-transparent p-0 h-auto focus-visible:ring-0"
                    />
                    {isSaving === `${item.tempId}-name` && <Loader2 className="animate-spin absolute right-0 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />}
                </div>
              </TableCell>
              <TableCell className='text-center'>
                <div className='relative'>
                    <Input
                    type="number"
                    value={item.day}
                    onChange={e => handleInputChange(item.tempId, 'day', e.target.value)}
                    onBlur={e => handleUpdate(item.tempId, 'day', e.target.value)}
                    className="border-none bg-transparent p-0 h-auto focus-visible:ring-0 w-16 text-center"
                    min="1"
                    max="31"
                    />
                    {isSaving === `${item.tempId}-day` && <Loader2 className="animate-spin absolute right-0 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />}
                </div>
              </TableCell>
              <TableCell>
                <Select
                  value={item.type}
                  onValueChange={value => {
                      handleInputChange(item.tempId, 'type', value);
                      handleUpdate(item.tempId, 'type', value);
                  }}
                >
                  <SelectTrigger className="w-[120px] border-none bg-transparent p-0 h-auto focus:ring-0">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="fixed">Fijo</SelectItem>
                    <SelectItem value="variable">Variable</SelectItem>
                  </SelectContent>
                </Select>
              </TableCell>
              <TableCell>
                 <div className='relative'>
                    <Input
                    type="number"
                    value={item.amount}
                    onChange={e => handleInputChange(item.tempId, 'amount', e.target.value)}
                    onBlur={e => handleUpdate(item.tempId, 'amount', e.target.value)}
                    className={`font-mono border-none bg-transparent p-0 h-auto focus-visible:ring-0 ${
                        item.category === 'income' ? 'text-primary' : 'text-destructive'
                    }`}
                    />
                    {isSaving === `${item.tempId}-amount` && <Loader2 className="animate-spin absolute right-0 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />}
                </div>
              </TableCell>
              <TableCell className="text-right">
                <Button variant="ghost" size="icon" onClick={() => deleteRow(item.tempId)}>
                  <Trash2 className="w-4 h-4 text-destructive" />
                </Button>
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
        <div key="income-table">{renderTable(incomeItems, 'income')}</div>
        <div key="expense-table">{renderTable(expenseItems, 'expense')}</div>
      </CardContent>
    </Card>
  );
}
