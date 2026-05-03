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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { addDebtAction, updateDebtAction } from '@/app/actions';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { Pencil } from 'lucide-react';

function EditDebtModal({
  debt,
  open,
  onOpenChange,
  onSave,
}: {
  debt: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (updatedDebt: any) => void;
}) {
  const [form, setForm] = useState(debt);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  useEffect(() => {
    if (open) setForm(debt);
  }, [debt, open]);

  const handleField = (field: string, value: any) => {
    setForm((prev: any) => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    const fieldsToUpdate: Array<{ field: string; value: any }> = [];

    const tracked = ['name', 'type', 'paid', 'total', 'status', 'reason', 'date'];
    for (const field of tracked) {
      if (form[field] !== debt[field]) {
        fieldsToUpdate.push({ field, value: form[field] });
      }
    }

    let hasError = false;
    for (const { field, value } of fieldsToUpdate) {
      const result = await updateDebtAction({ id: debt.id, field, value });
      if (result?.error) {
        toast({ title: 'Update Failed', description: result.error, variant: 'destructive' });
        hasError = true;
        break;
      }
    }

    if (!hasError) {
      toast({ title: 'Debt Updated', description: 'Changes have been saved.' });
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
          <DialogTitle>Edit Debt / Debtor</DialogTitle>
          <DialogDescription>Update details about this item.</DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid gap-1.5">
            <Label>Title</Label>
            <Input value={form.name || ''} onChange={e => handleField('name', e.target.value)} />
          </div>

          <div className="grid gap-1.5">
            <Label>Type</Label>
            <Select value={form.type || ''} onValueChange={val => handleField('type', val)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Debt">Debt (Deuda)</SelectItem>
                <SelectItem value="Debtor">Debtor (Deudor)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-1.5">
            <Label>Status</Label>
            <Select value={form.status || ''} onValueChange={val => handleField('status', val)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Pendiente">Pendiente</SelectItem>
                <SelectItem value="Listo">Listo</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-1.5">
              <Label>Debt Amount</Label>
              <Input type="number" value={form.total} onChange={e => handleField('total', parseFloat(e.target.value) || 0)} />
            </div>
            <div className="grid gap-1.5">
              <Label>Amount Paid</Label>
              <Input type="number" value={form.paid} onChange={e => handleField('paid', parseFloat(e.target.value) || 0)} />
            </div>
          </div>

          <div className="grid gap-1.5">
            <Label>Reason (Optional)</Label>
            <Input value={form.reason || ''} onChange={e => handleField('reason', e.target.value)} />
          </div>

          <div className="grid gap-1.5">
            <Label>Date</Label>
            <Input type="date" value={form.date || ''} onChange={e => handleField('date', e.target.value)} />
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

export function Debts({ isEditable = true, initialDebts = [] }: { isEditable?: boolean, initialDebts?: any[] }) {
  const [debts, setDebts] = useState(initialDebts);
  const [filter, setFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Pendiente' | 'Listo'>('All');
  const [page, setPage] = useState(1);
  const [isAdding, setIsAdding] = useState(false);
  const [editingDebt, setEditingDebt] = useState<any | null>(null);
  const itemsPerPage = isEditable ? 15 : 10;
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    setDebts(initialDebts);
  }, [initialDebts]);

  const filteredDebts = useMemo(() => {
    let result = [...debts];

    result.sort((a, b) => {
      if (!a.date) return 1;
      if (!b.date) return -1;
      return new Date(b.date).getTime() - new Date(a.date).getTime();
    });

    if (!isEditable) {
      return result.slice(0, itemsPerPage);
    }
    
    if (filter) {
      result = result.filter(debt => debt.name.toLowerCase().includes(filter.toLowerCase()));
    }

    if (statusFilter !== 'All') {
      result = result.filter(debt => debt.status === statusFilter);
    }

    return result;

  }, [debts, filter, statusFilter, isEditable, itemsPerPage]);

  const paginatedDebts = useMemo(() => {
    if (!isEditable) {
      return filteredDebts;
    }
    const startIndex = (page - 1) * itemsPerPage;
    return filteredDebts.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredDebts, page, itemsPerPage, isEditable]);

  const totalPages = isEditable ? Math.ceil(filteredDebts.length / itemsPerPage) : 1;

  const handleSaveDebt = (updatedDebt: any) => {
    setDebts(prev =>
      prev.map(d => (d.id === updatedDebt.id ? updatedDebt : d))
    );
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
          <div className="mb-4 flex flex-col sm:flex-row gap-4">
            <Input
              placeholder="Search debts..."
              value={filter}
              onChange={e => setFilter(e.target.value)}
              className="max-w-sm"
            />
            <div className="flex gap-2">
              <Button
                variant={statusFilter === 'All' ? 'default' : 'outline'}
                onClick={() => setStatusFilter('All')}
              >
                All
              </Button>
              <Button
                variant={statusFilter === 'Pendiente' ? 'default' : 'outline'}
                onClick={() => setStatusFilter('Pendiente')}
              >
                Pendiente
              </Button>
              <Button
                variant={statusFilter === 'Listo' ? 'default' : 'outline'}
                onClick={() => setStatusFilter('Listo')}
              >
                Listo
              </Button>
            </div>
          </div>
        )}
        <div className="space-y-6">
          {paginatedDebts.map((debt) => (
            <div key={debt.id} className="border p-4 rounded-lg bg-card">
              <div className="flex justify-between items-start mb-2">
                <div className="flex flex-col gap-1 flex-1 mr-4">
                  <span className="font-medium text-lg">{debt.name}</span>
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge variant={debt.type === 'Debt' ? 'destructive' : 'secondary'}>
                      {debt.type}
                    </Badge>
                    <Badge variant="outline">
                      {debt.estadoDeuda}
                    </Badge>
                    {debt.status === 'Listo' && (
                      <Badge className="bg-green-500 hover:bg-green-600">Listo</Badge>
                    )}
                    {debt.date && <span className="text-xs text-muted-foreground ml-1">{debt.date}</span>}
                  </div>
                  {debt.reason && <span className="text-sm text-muted-foreground mt-1">📝 {debt.reason}</span>}
                </div>

                {isEditable && (
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" onClick={() => setEditingDebt(debt)}>
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
                          <AlertDialogAction onClick={() => deleteRow(debt.id)}>
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                )}
              </div>

              <div className="flex justify-between items-baseline text-sm mt-4 mb-2">
                <div className="text-muted-foreground">
                  <span className="font-mono font-medium">
                    {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(debt.paid)}
                  </span>
                  {' '}of{' '}
                  <span className="font-mono">
                    {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(debt.total)}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-xs text-muted-foreground mr-2">Balance:</span>
                  <span className={`font-mono font-bold ${debt.saldoPendiente > 0 ? 'text-destructive' : 'text-green-500'}`}>
                    {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(debt.saldoPendiente)}
                  </span>
                </div>
              </div>
              <Progress value={debt.total > 0 ? (debt.paid / debt.total) * 100 : 0} className="h-2" />
            </div>
          ))}
        </div>
        {isEditable && totalPages > 1 && (
          <div className="flex justify-between items-center mt-6">
            <Button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} variant="outline">Previous</Button>
            <span>Page {page} of {totalPages}</span>
            <Button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} variant="outline">Next</Button>
          </div>
        )}
        {editingDebt && (
          <EditDebtModal
            debt={editingDebt}
            open={!!editingDebt}
            onOpenChange={(open) => !open && setEditingDebt(null)}
            onSave={handleSaveDebt}
          />
        )}
      </CardContent>
    </Card>
  );
}
