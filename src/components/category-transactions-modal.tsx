'use client';

import { useMemo } from 'react';
import { format, parseISO, getYear, getMonth } from 'date-fns';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { TrendingUp, TrendingDown } from 'lucide-react';

/** Formats a number as USD currency string. */
const formatCurrency = (value: number): string =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);

/**
 * Formats a local amount with its currency code defensively.
 * Falls back to a plain decimal format for non-ISO-4217 codes (e.g. USDT).
 */
const formatLocalCurrency = (amount: number, currency: string): string => {
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
    }).format(amount);
  } catch {
    return `${currency} ${new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount)}`;
  }
};

/** Represents a single grouped month section (annual view). */
interface MonthGroup {
  label: string;
  transactions: Transaction[];
}

/** Minimal shape of a transaction used by this component. */
interface Transaction {
  id: string;
  date: string;
  description: string;
  amount: number;
  realUsdAmount: number | null;
  type: 'income' | 'expense';
  category: string;
  currency: string;
}

interface CategoryTransactionsModalProps {
  /** Whether the dialog is open. */
  open: boolean;
  /** Callback to close the dialog. */
  onClose: () => void;
  /** Selected category name to filter by. */
  category: string;
  /** The transaction type being displayed. */
  type: 'income' | 'expense';
  /** Transactions already filtered to the relevant period (month or year). */
  transactions: Transaction[];
  /**
   * When true the modal groups transactions by month with a visual separator.
   * Use this for the annual view so the user knows which month each row belongs to.
   */
  isAnnualView?: boolean;
}

/**
 * `CategoryTransactionsModal`
 *
 * A Shadcn UI Dialog that renders a list of transactions for a specific category.
 * In annual view mode the transactions are grouped by calendar month and separated
 * by labelled dividers (e.g. "January 2026", "February 2026").
 *
 * @param props - See {@link CategoryTransactionsModalProps}.
 */
export function CategoryTransactionsModal({
  open,
  onClose,
  category,
  type,
  transactions,
  isAnnualView = false,
}: CategoryTransactionsModalProps) {
  const isIncome = type === 'income';

  /** Total USD amount for the category in the current period. */
  const total = useMemo(
    () =>
      transactions.reduce((sum, t) => sum + Math.abs(t.realUsdAmount ?? t.amount), 0),
    [transactions]
  );

  /**
   * Monthly groups — only computed when `isAnnualView` is true to avoid
   * unnecessary work on the monthly view.
   */
  const monthGroups = useMemo<MonthGroup[]>(() => {
    if (!isAnnualView) return [];

    const grouped = new Map<string, Transaction[]>();

    // Sort oldest-to-newest so month headers appear in chronological order.
    const sorted = [...transactions].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    for (const t of sorted) {
      const date = parseISO(t.date);
      const key = `${getYear(date)}-${String(getMonth(date)).padStart(2, '0')}`;
      if (!grouped.has(key)) grouped.set(key, []);
      grouped.get(key)!.push(t);
    }

    return Array.from(grouped.entries()).map(([key, txns]) => {
      const [year, monthIdx] = key.split('-').map(Number);
      const label = format(new Date(year, monthIdx), 'MMMM yyyy');
      return { label, transactions: txns };
    });
  }, [transactions, isAnnualView]);

  /** Transactions already sorted newest-to-oldest (monthly view). */
  const sortedTransactions = useMemo(
    () =>
      [...transactions].sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
      ),
    [transactions]
  );

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] flex flex-col gap-0 p-0">
        {/* Header */}
        <DialogHeader className="px-6 pt-6 pb-4">
          <div className="flex items-center gap-3">
            <span
              className={`flex items-center justify-center h-9 w-9 rounded-full ${
                isIncome
                  ? 'bg-primary/10 text-primary'
                  : 'bg-destructive/10 text-destructive'
              }`}
            >
              {isIncome ? (
                <TrendingUp className="h-4 w-4" />
              ) : (
                <TrendingDown className="h-4 w-4" />
              )}
            </span>
            <div>
              <DialogTitle className="text-lg leading-tight">{category}</DialogTitle>
              <DialogDescription className="text-xs mt-0.5">
                {isIncome ? 'Income' : 'Expense'} · {transactions.length} transaction
                {transactions.length !== 1 ? 's' : ''} ·{' '}
                <span
                  className={`font-semibold ${
                    isIncome ? 'text-primary' : 'text-destructive'
                  }`}
                >
                  {formatCurrency(total)}
                </span>
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <Separator />

        {/* Scrollable body */}
        <ScrollArea className="flex-1 overflow-y-auto px-6 py-4">
          {transactions.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              No transactions found for this category.
            </p>
          ) : isAnnualView ? (
            /* Annual view — grouped by month */
            <div className="space-y-6">
              {monthGroups.map((group) => (
                <div key={group.label} className="space-y-2">
                  {/* Month separator */}
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground whitespace-nowrap">
                      {group.label}
                    </span>
                    <Separator className="flex-1" />
                  </div>

                  <div className="space-y-2">
                    {group.transactions
                      .slice()
                      .sort(
                        (a, b) =>
                          new Date(b.date).getTime() - new Date(a.date).getTime()
                      )
                      .map((t) => (
                        <TransactionRow key={t.id} transaction={t} isIncome={isIncome} />
                      ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            /* Monthly view — flat list */
            <div className="space-y-2">
              {sortedTransactions.map((t) => (
                <TransactionRow key={t.id} transaction={t} isIncome={isIncome} />
              ))}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}

/* ──────────────────────────────────────────────────────────────────────────── */

interface TransactionRowProps {
  transaction: Transaction;
  isIncome: boolean;
}

/**
 * `TransactionRow`
 *
 * Renders a single transaction item used inside `CategoryTransactionsModal`.
 */
function TransactionRow({ transaction: t, isIncome }: TransactionRowProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/40 transition-colors gap-2 sm:gap-0">
      <div className="flex flex-col gap-0.5">
        <div className="flex flex-wrap items-center gap-2">
          <p className="font-medium text-sm">{t.description}</p>
          <Badge variant="outline" className="text-xs">
            {t.category}
          </Badge>
        </div>
        <span className="text-xs text-muted-foreground">
          {format(parseISO(t.date), 'MMM d, yyyy')}
        </span>
      </div>

      <div className="flex flex-row sm:flex-col items-center sm:items-end justify-between sm:justify-start gap-1 w-full sm:w-auto shrink-0">
        <span
          className={`font-mono font-bold text-sm ${
            isIncome ? 'text-primary' : 'text-destructive'
          }`}
        >
          {isIncome ? '+' : '-'}
          {formatCurrency(Math.abs(t.realUsdAmount ?? t.amount))}
        </span>
        {t.currency !== 'USD' && (
          <span className="text-xs font-mono text-muted-foreground">
            {formatLocalCurrency(t.amount, t.currency)}
          </span>
        )}
      </div>
    </div>
  );
}
