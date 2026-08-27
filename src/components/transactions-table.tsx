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
import { Badge } from './ui/badge';
import { useState, useEffect, useMemo } from 'react';
import { Button } from './ui/button';
import {
  Trash2,
  Pencil,
  ChevronsLeft,
  ChevronLeft,
  ChevronRight,
  ChevronsRight,
  Calendar as CalendarIcon,
  Loader2,
  Link2,
} from 'lucide-react';
import { Input } from './ui/input';
import { Label } from './ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import { useToast } from '@/hooks/use-toast';
import {
  updateTransactionAction,
  deleteTransactionAction,
  deleteTransferAction,
} from '@/app/actions';
import { useRouter } from 'next/navigation';
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
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { Calendar } from './ui/calendar';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

// ─── Category data ────────────────────────────────────────────────────────────

const expenseCategories = [
  { value: 'Rent/Mortgage', label: '🏠 Rent/Mortgage' },
  { value: 'Food & Drink (Groceries)', label: '🛒 Food & Drink (Groceries)' },
  { value: 'Dining Out', label: '🍔 Dining Out' },
  { value: 'Health', label: '❤️ Health' },
  { value: 'Personal Care', label: '💅 Personal Care' },
  { value: 'Medicine', label: '💊 Medicine' },
  { value: 'Transportation', label: '🚗 Transportation' },
  { value: 'Retail', label: '🛍️ Retail' },
  { value: 'Clothes', label: '👕 Clothes' },
  { value: 'Entertainment', label: '🎉 Entertainment' },
  { value: 'Environment Work', label: '🌱 Environment Work' },
  { value: 'Technology', label: '💻 Technology' },
  { value: 'Education', label: '📚 Education' },
  { value: 'Utilities', label: '💡 Utilities' },
  { value: 'Insurance', label: '🛡️ Insurance' },
  { value: 'Debt Payment', label: '💸 Debt Payment' },
  { value: 'Prestamo', label: '🤝 Prestamo' },
  { value: 'Gift', label: '🎁 Gift' },
  { value: 'Other', label: '❓ Other' },
  { value: 'Others', label: '❓ Others' },
];

const incomeCategories = [
  { value: 'Salary', label: '💼 Salary' },
  { value: 'Bonus', label: '🏆 Bonus' },
  { value: 'Freelance', label: '✍️ Freelance' },
  { value: 'Dividends', label: '📈 Dividends' },
  { value: 'Interest', label: '💰 Interest' },
  { value: 'Side Hustle', label: '🚀 Side Hustle' },
  { value: 'Loan', label: '🏦 Loan' },
];

const allCategories = [...expenseCategories, ...incomeCategories];

const getCategoryLabel = (value: string) => {
  const category = allCategories.find(c => c.value === value);
  return category ? category.label : value;
};

const currencies = [
  { value: 'USD', label: '🇺🇸 USD' },
  { value: 'VES', label: '🇻🇪 VES' },
  { value: 'USDT', label: 'USDT' },
];

// ─── Edit Modal ───────────────────────────────────────────────────────────────

type Transaction = Record<string, any>;

function EditTransactionModal({
  transaction,
  open,
  onOpenChange,
  onSave,
}: {
  transaction: Transaction | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (updated: Transaction) => void;
}) {
  const [form, setForm] = useState<Transaction>({});
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  // Sync form state when a different transaction is opened
  useEffect(() => {
    if (transaction) {
      setForm({ ...transaction });
    }
  }, [transaction]);

  if (!transaction) return null;

  const categories =
    transaction.type === 'income' ? incomeCategories : expenseCategories;

  const handleField = (field: string, value: any) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    setIsSaving(true);

    const fieldsToUpdate: Array<{ field: string; value: any }> = [];

    const tracked = ['date', 'description', 'amount', 'category', 'currency', 'exchangeRate'];
    for (const field of tracked) {
      if (form[field] !== transaction[field]) {
        fieldsToUpdate.push({ field, value: form[field] });
      }
    }

    let hasError = false;
    for (const { field, value } of fieldsToUpdate) {
      const result = await updateTransactionAction({
        id: transaction.id,
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
      toast({ title: 'Transaction Updated', description: 'Changes have been saved.' });
      onSave(form);
      onOpenChange(false);
      router.refresh();
    }

    setIsSaving(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <DialogTitle>Edit Transaction</DialogTitle>
            <Badge variant={transaction.type === 'income' ? 'default' : 'destructive'}>
              {transaction.type === 'income' ? 'Income' : 'Expense'}
            </Badge>
          </div>
          <DialogDescription>
            {transaction.description}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-2">
          {/* Date */}
          <div className="grid gap-1.5">
            <Label htmlFor="edit-date">Date</Label>
            <Input
              id="edit-date"
              type="date"
              value={form.date || ''}
              onChange={e => handleField('date', e.target.value)}
            />
          </div>

          {/* Description */}
          <div className="grid gap-1.5">
            <Label htmlFor="edit-description">Description</Label>
            <Input
              id="edit-description"
              value={form.description || ''}
              onChange={e => handleField('description', e.target.value)}
            />
          </div>

          {/* Category */}
          <div className="grid gap-1.5">
            <Label>Category</Label>
            <Select
              value={form.category || ''}
              onValueChange={value => handleField('category', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map(c => (
                  <SelectItem key={c.value} value={c.value}>
                    {c.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Amount + Currency */}
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-1.5">
              <Label htmlFor="edit-amount">Amount</Label>
              <Input
                id="edit-amount"
                type="number"
                step="0.01"
                value={form.amount ?? ''}
                onChange={e => handleField('amount', parseFloat(e.target.value) || 0)}
              />
            </div>
            <div className="grid gap-1.5">
              <Label>Currency</Label>
              <Select
                value={form.currency || 'USD'}
                onValueChange={value => handleField('currency', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {currencies.map(c => (
                    <SelectItem key={c.value} value={c.value}>
                      {c.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Exchange Rate (optional) */}
          <div className="grid gap-1.5">
            <Label htmlFor="edit-exchange-rate">
              Exchange Rate{' '}
              <span className="text-muted-foreground text-xs">(optional)</span>
            </Label>
            <Input
              id="edit-exchange-rate"
              type="number"
              step="0.01"
              placeholder="e.g. 300"
              value={form.exchangeRate ?? ''}
              onChange={e =>
                handleField(
                  'exchangeRate',
                  e.target.value === '' ? null : parseFloat(e.target.value)
                )
              }
            />
          </div>

          {/* Real USD — read-only formula result */}
          {form.realUsdAmount != null && (
            <div className="grid gap-1.5">
              <Label>Real USD (calculated)</Label>
              <div className="flex items-center h-9 px-3 rounded-md border bg-muted text-sm font-mono">
                ${Number(form.realUsdAmount).toFixed(4)}
              </div>
            </div>
          )}

          {/* Bank Commission — read-only, shown only when a commission was charged */}
          {form.commission != null && Number(form.commission) > 0 && (
            <div className="grid gap-1.5">
              <Label className="flex items-center gap-1.5">
                <span>Comisión bancaria</span>
                <span className="text-xs font-normal text-muted-foreground">(0.3% — solo lectura)</span>
              </Label>
              <div className="flex items-center justify-between h-9 px-3 rounded-md border border-yellow-500/40 bg-yellow-500/10 text-sm font-mono text-yellow-700 dark:text-yellow-400">
                <span>{Number(form.commission).toLocaleString('es-VE', { minimumFractionDigits: 2 })} VES</span>
                <span className="text-xs font-sans text-muted-foreground">
                  Total descontado: {(Number(form.amount) + Number(form.commission)).toLocaleString('es-VE', { minimumFractionDigits: 2 })} VES
                </span>
              </div>
            </div>
          )}

          {/* Debt link indicator — read-only, shown only when the transaction is linked to a debt or debtor */}
          {(form.category === 'Debt Payment' || (form.description || '').startsWith('Cobro deudor:')) && (
            <div className="grid gap-1.5">
              <Label className="flex items-center gap-1.5">
                <Link2 className="h-3.5 w-3.5" />
                <span>{form.category === 'Debt Payment' ? 'Pago de deuda' : 'Cobro de deudor'}</span>
              </Label>
              <div className="flex items-center gap-2 h-9 px-3 rounded-md border border-primary/30 bg-primary/5 text-sm text-primary">
                <Link2 className="h-3.5 w-3.5 shrink-0" />
                <span>
                  {form.category === 'Debt Payment'
                    ? 'Esta transacción está vinculada al pago de una deuda.'
                    : 'Esta transacción está vinculada al cobro de un deudor.'}
                </span>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving && <Loader2 className="animate-spin mr-2 h-4 w-4" />}
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Main Table ───────────────────────────────────────────────────────────────

export function TransactionsTable({
  initialTransactions = [],
}: {
  initialTransactions?: any[];
}) {
  const [transactions, setTransactions] = useState(initialTransactions);
  const [filter, setFilter] = useState('');
  const [page, setPage] = useState(1);
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const itemsPerPage = 15;
  const { toast } = useToast();
  const router = useRouter();

  useEffect(() => {
    setTransactions(initialTransactions);
  }, [initialTransactions]);

  const filteredTransactions = useMemo(() => {
    return transactions.filter(t => {
      const descriptionMatch = t.description
        .toLowerCase()
        .includes(filter.toLowerCase());

      if (!startDate && !endDate) return descriptionMatch;

      const [y, m, d] = t.date.split('-').map(Number);
      const txDate = new Date(Date.UTC(y, m - 1, d));

      const startMatch = startDate
        ? txDate >= new Date(Date.UTC(startDate.getFullYear(), startDate.getMonth(), startDate.getDate()))
        : true;
      const endMatch = endDate
        ? txDate <= new Date(Date.UTC(endDate.getFullYear(), endDate.getMonth(), endDate.getDate(), 23, 59, 59, 999))
        : true;

      return descriptionMatch && startMatch && endMatch;
    });
  }, [transactions, filter, startDate, endDate]);

  const paginatedTransactions = useMemo(() => {
    const startIndex = (page - 1) * itemsPerPage;
    return filteredTransactions.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredTransactions, page]);

  const totalPages = Math.ceil(filteredTransactions.length / itemsPerPage);

  const handleEditSave = (updated: Transaction) => {
    setTransactions(prev =>
      prev.map(t => (t.id === updated.id ? { ...t, ...updated } : t))
    );
  };

  const deleteRow = async (id: string) => {
    const original = transactions;
    const target = transactions.find(t => t.id === id);
    setTransactions(prev => prev.filter(t => t.id !== id));

    let result = null;
    if (target?.type === 'Transferencia' || target?.type === 'Cambio Divisa') {
      result = await deleteTransferAction(id);
    } else {
      result = await deleteTransactionAction(id, target?.type);
    }

    if (result?.error) {
      toast({ title: 'Revert Failed', description: result.error, variant: 'destructive' });
      setTransactions(original);
    } else {
      toast({ title: 'Transaction Reverted', description: 'Transaction removed and amount returned to the account.' });
      router.refresh();
    }
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>All Transactions</CardTitle>
          <CardDescription>A complete history of your income and expenses.</CardDescription>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="flex flex-wrap items-center gap-4 mb-4">
            <Input
              placeholder="Search by description..."
              value={filter}
              onChange={e => setFilter(e.target.value)}
              className="flex-grow max-w-sm"
            />
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn('w-full sm:w-[200px] justify-start text-left font-normal', !startDate && 'text-muted-foreground')}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {startDate ? format(startDate, 'dd/MM/yyyy') : <span>Start date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar mode="single" selected={startDate} onSelect={setStartDate} initialFocus />
              </PopoverContent>
            </Popover>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn('w-full sm:w-[200px] justify-start text-left font-normal', !endDate && 'text-muted-foreground')}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {endDate ? format(endDate, 'dd/MM/yyyy') : <span>End date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar mode="single" selected={endDate} onSelect={setEndDate} initialFocus />
              </PopoverContent>
            </Popover>
            <Button
              variant="ghost"
              onClick={() => { setStartDate(undefined); setEndDate(undefined); }}
            >
              Clear
            </Button>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Currency</TableHead>
                  <TableHead>Exchange Rate</TableHead>
                  <TableHead>Real USD</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedTransactions.map(transaction => {
                  // Format date as dd/mm/yyyy for display
                  const [y, m, d] = (transaction.date || '').split('-');
                  const displayDate = y && m && d ? `${d}/${m}/${y}` : transaction.date;

                  return (
                    <TableRow key={transaction.id}>
                      {/* Date */}
                      <TableCell className="whitespace-nowrap font-medium text-sm">
                        {displayDate}
                      </TableCell>

                      {/* Description */}
                      <TableCell className="max-w-[200px] truncate text-sm">
                        {transaction.description}
                      </TableCell>

                      {/* Category */}
                      <TableCell>
                        <Badge variant="outline" className="text-xs whitespace-nowrap">
                          {getCategoryLabel(transaction.category)}
                        </Badge>
                      </TableCell>

                      {/* Amount */}
                      <TableCell
                        className={`font-mono text-sm font-semibold whitespace-nowrap ${transaction.type === 'income' ? 'text-primary' : 'text-destructive'
                          }`}
                      >
                        {transaction.type === 'income' ? '+' : '-'}
                        {Number(transaction.amount).toLocaleString()}
                      </TableCell>

                      {/* Currency */}
                      <TableCell className="text-sm">
                        {transaction.currency || 'USD'}
                      </TableCell>

                      {/* Exchange Rate */}
                      <TableCell className="font-mono text-sm text-muted-foreground">
                        {transaction.exchangeRate != null
                          ? transaction.exchangeRate.toLocaleString()
                          : '—'}
                      </TableCell>

                      {/* Real USD */}
                      <TableCell className="font-mono text-sm text-muted-foreground">
                        {transaction.realUsdAmount != null
                          ? `$${Number(transaction.realUsdAmount).toFixed(2)}`
                          : '—'}
                      </TableCell>

                      {/* Actions */}
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          {/* Edit */}
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setEditingTransaction(transaction)}
                          >
                            <Pencil className="w-4 h-4" />
                          </Button>

                          {/* Delete */}
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
                                  This action cannot be undone. This will permanently delete the transaction and return the original amount (including commissions) to the source account.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={() => deleteRow(transaction.id)}>
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-2 mt-4">
              <Button onClick={() => setPage(1)} disabled={page === 1} variant="outline" size="icon">
                <ChevronsLeft className="h-4 w-4" />
              </Button>
              <Button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} variant="outline" size="icon">
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm text-muted-foreground">
                Page {page} of {totalPages}
              </span>
              <Button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} variant="outline" size="icon">
                <ChevronRight className="h-4 w-4" />
              </Button>
              <Button onClick={() => setPage(totalPages)} disabled={page === totalPages} variant="outline" size="icon">
                <ChevronsRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Modal */}
      <EditTransactionModal
        transaction={editingTransaction}
        open={editingTransaction !== null}
        onOpenChange={open => { if (!open) setEditingTransaction(null); }}
        onSave={handleEditSave}
      />
    </>
  );
}
