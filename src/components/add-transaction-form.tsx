'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, useWatch } from 'react-hook-form';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

import { CalendarIcon, Sparkles, Loader2, Camera, CalculatorIcon, Trash2, CreditCard, X, Info } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import {
  suggestCategoryAction,
  extractTransactionAction,
  addTransactionAction,
  getActiveAccountsAction,
  getPendingDebtsAction,
} from '@/app/actions';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { useRouter } from 'next/navigation';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from './ui/collapsible';
import type { ExtractTransactionFromImageOutput } from '@/ai/flows/extract-transaction-from-image';
import { Label } from './ui/label';
import { useExchangeRates } from '@/hooks/use-exchange-rates';
import { CurrencyCalculator } from './currency-calculator';

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
  { value: 'Contribution Home', label: '👨‍👩‍👧‍👦 Aporte House' },
  { value: 'Deposit on Binance', label: '🪙 Deposit on Binance' },
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
  { value: 'Deposit on Binance', label: '👨‍👩🪙 Deposit on Binance' },
];


/** Payment method options for bank accounts that may charge commissions. */
const PAYMENT_METHODS = [
  { value: 'pago_movil', label: '📱 Pago Móvil' },
  { value: 'transferencia', label: '🏦 Transferencia' },
  { value: 'c2p', label: '🔁 C2P' },
  { value: 'debito', label: '💳 Pago Débito' },
  { value: 'punto', label: '🖥️ Por Punto' },
] as const;

const formSchema = z.object({
  description: z.string().min(2, {
    message: 'Description must be at least 2 characters.',
  }),
  amount: z.coerce.number().positive({ message: 'Amount must be positive.' }),
  type: z.enum(['income', 'expense']),
  category: z.string().optional(),
  date: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: "Invalid date format",
  }),
  currency: z.string().optional(),
  exchangeRate: z.coerce.number().optional(),
  accountId: z.string().optional(),
  /** Payment method — required when the account belongs to a commission-bearing bank. */
  paymentMethod: z.string().optional(),
});

type ScannedTransaction = Extract<ExtractTransactionFromImageOutput['transactions'], Array<any>>[number] & { id: string, category?: string };


export function AddTransactionForm({
  afterSubmit,
}: {
  afterSubmit?: () => void;
}) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuggesting, setIsSuggesting] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [showCalculator, setShowCalculator] = useState(false);
  const [showContinueDialog, setShowContinueDialog] = useState(false);
  const [scannedTransactions, setScannedTransactions] = useState<ScannedTransaction[]>([]);
  const [scannedDate, setScannedDate] = useState<Date>(new Date());
  const [activeAccounts, setActiveAccounts] = useState<any[]>([]);
  // Debt linking state
  const [isDebtPayment, setIsDebtPayment] = useState(false);
  const [pendingDebts, setPendingDebts] = useState<any[]>([]);
  const [isLoadingDebts, setIsLoadingDebts] = useState(false);
  const [selectedDebt, setSelectedDebt] = useState<any | null>(null);
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      description: '',
      amount: 0,
      type: 'expense',
      category: '',
      date: format(new Date(), 'yyyy-MM-dd'),
      currency: 'VES',
      exchangeRate: 0,
      accountId: undefined,
      paymentMethod: undefined,
    },
  });



  const refreshAccounts = () => {
    getActiveAccountsAction().then(res => setActiveAccounts(res.accounts));
  };

  useEffect(() => {
    refreshAccounts();
  }, []);

  const transactionType = useWatch({
    control: form.control,
    name: 'type',
  });

  const selectedCurrency = useWatch({
    control: form.control,
    name: 'currency',
  });

  /** Tracks the selected accountId to derive commission preview. */
  const selectedAccountId = useWatch({
    control: form.control,
    name: 'accountId',
  });

  /** Tracks the payment method chosen by the user. */
  const selectedPaymentMethod = useWatch({
    control: form.control,
    name: 'paymentMethod',
  });

  const { rates } = useExchangeRates();

  useEffect(() => {
    if (rates.length > 0) {
      const currentExchangeRate = form.getValues('exchangeRate');
      if (!currentExchangeRate) {
        const officialRate = rates.find((r: any) => r.fuente === 'oficial');
        if (officialRate) {
          form.setValue('exchangeRate', officialRate.promedio);
        }
      }
    }
  }, [rates, form]);

  const filteredAccounts = activeAccounts.filter(account => account.currency === selectedCurrency);

  /** The full account object currently selected in the form. */
  const selectedAccount = activeAccounts.find(a => a.id === selectedAccountId);

  /**
   * True when the selected account belongs to a bank that charges commissions
   * (BDV or Provincial) on a VES expense — regardless of payment method.
   * Used to conditionally render the payment method selector.
   */
  const isCommissionBank =
    transactionType === 'expense' &&
    selectedCurrency === 'VES' &&
    !!selectedAccount &&
    ['venezuela', 'provincial'].some((bank) =>
      selectedAccount.name?.toLowerCase().includes(bank)
    );

  /**
   * Commission preview — 0.3% applied ONLY when the payment method is Pago Móvil.
   */
  const COMMISSION_RATE = 0.003;
  const isCommissionApplicable = isCommissionBank && selectedPaymentMethod === 'pago_movil';
  const currentAmount = form.watch('amount') || 0;
  const commissionPreview = isCommissionApplicable
    ? parseFloat((Math.abs(currentAmount) * COMMISSION_RATE).toFixed(2))
    : 0;

  const categories = transactionType === 'income' ? incomeCategories : expenseCategories;


  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsSubmitting(true);

    // Find the selected account's data to pass balance and name to the action
    const accountForSubmit = activeAccounts.find(a => a.id === values.accountId);
    const result = await addTransactionAction({
      ...values,
      accountBalance: accountForSubmit?.balance,
      // Pass the account name so the server action can determine commission eligibility
      accountName: accountForSubmit?.name,
      // Debt linking
      debtId: selectedDebt?.id,
      debtPaidSoFar: selectedDebt?.paid,
    });

    if (result.success) {
      const commissionCharged = 'commission' in result ? result.commission : 0;
      toast({
        title: 'Transaction Added',
        description: selectedDebt
          ? `Transaction added and debt "${selectedDebt.name}" updated.`
          : commissionCharged && commissionCharged > 0
            ? `Transacción guardada. Comisión bancaria aplicada: ${commissionCharged.toLocaleString('es-VE', { minimumFractionDigits: 2 })} VES`
            : `Your transaction has been added.`,
      });
      if (document.activeElement instanceof HTMLElement) {
        document.activeElement.blur();
      }

      // Optimistically update local activeAccounts state to prevent stale data between submissions
      if (values.accountId) {
        const amountValue = Math.abs(values.amount);
        const totalDeduction = amountValue + (typeof commissionCharged === 'number' ? commissionCharged : 0);
        setActiveAccounts((prev) =>
          prev.map((acc) => {
            if (acc.id === values.accountId) {
              const newBalance =
                values.type === 'income'
                  ? acc.balance + amountValue
                  : acc.balance - totalDeduction;
              return { ...acc, balance: newBalance };
            }
            return acc;
          })
        );
      }

      // Optimistically update local pendingDebts state to prevent stale data
      if (selectedDebt) {
        const amountValue = Math.abs(values.amount);
        setPendingDebts((prev) =>
          prev.map((d) => {
            if (d.id === selectedDebt.id) {
              return { ...d, paid: d.paid + amountValue };
            }
            return d;
          })
        );
      }

      // Refresh accounts so the balance is up to date for the next transaction
      refreshAccounts();
      setShowContinueDialog(true);
      router.refresh();
    } else {
      toast({
        title: 'Submission Failed',
        description: result.error,
        variant: 'destructive',
      });
    }
    setIsSubmitting(false);
  }

  async function handleSuggestCategory() {
    setIsSuggesting(true);
    const description = form.getValues('description');
    const type = form.getValues('type');
    if (!description || description.length < 2) {
      form.setError('description', {
        message: 'Please enter a description first.',
      });
      setIsSuggesting(false);
      return;
    }

    const result = await suggestCategoryAction({ description, type });
    if (result.category) {
      form.setValue('category', result.category, { shouldValidate: true });
      toast({
        title: 'Category Suggested!',
        description: `We suggest "${result.category}" for this transaction.`,
      });
    } else if (result.error) {
      toast({
        title: 'Suggestion Failed',
        description: result.error,
        variant: 'destructive',
      });
    }
    setIsSuggesting(false);
  }

  const handleImageScan = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsScanning(true);
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = async () => {
      const photoDataUri = reader.result as string;
      const result = await extractTransactionAction({ photoDataUri });

      if (result.data && result.data.length > 0) {
        if (result.data.length === 1) {
          const { description, amount, type } = result.data[0];
          form.setValue('description', description, { shouldValidate: true });
          form.setValue('amount', amount, { shouldValidate: true });
          form.setValue('type', type, { shouldValidate: true });
          handleSuggestCategory();
        } else {
          setScannedTransactions(result.data.map((item, index) => ({ ...item, id: `scanned-${index}` })));
        }
        toast({
          title: 'Scan Successful!',
          description: `Extracted ${result.data.length} transaction(s).`,
        });
      } else if (result.error) {
        toast({
          title: 'Scan Failed',
          description: result.error,
          variant: 'destructive',
        });
      }
      setIsScanning(false);
    };
    reader.onerror = error => {
      console.error('Error reading file:', error);
      toast({
        title: 'File Error',
        description: 'Could not read the selected file.',
        variant: 'destructive',
      });
      setIsScanning(false);
    };
  };

  const handleAddScannedTransactions = async () => {
    setIsSubmitting(true);
    let successCount = 0;
    const dateString = format(scannedDate, 'yyyy-MM-dd');

    for (const trans of scannedTransactions) {
      const category = trans.category || 'Other';
      const result = await addTransactionAction({
        ...trans,
        category,
        date: dateString,
      });
      if (result.success) {
        successCount++;
      }
    }
    setIsSubmitting(false);
    setScannedTransactions([]);
    toast({
      title: "Batch Add Complete",
      description: `${successCount} of ${scannedTransactions.length} transactions were added.`
    })
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
    setShowContinueDialog(true);
    router.refresh();
  }

  const handleScannedItemChange = (id: string, field: string, value: string | number) => {
    setScannedTransactions(prev =>
      prev.map(item => item.id === id ? { ...item, [field]: value } : item)
    );
  }

  const handleDeleteScannedItem = (id: string) => {
    setScannedTransactions(prev => prev.filter(item => item.id !== id));
  }


  const handleToggleDebtPayment = async () => {
    if (!isDebtPayment) {
      setIsLoadingDebts(true);
      const res = await getPendingDebtsAction();
      setPendingDebts(res.debts);
      setIsLoadingDebts(false);
    } else {
      setSelectedDebt(null);
    }
    setIsDebtPayment(prev => !prev);
  };

  const handleSelectDebt = (debt: any) => {
    setSelectedDebt(debt);
    const currentType = form.getValues('type');
    if (currentType === 'expense') {
      // Paying off a debt I owe
      form.setValue('description', `Pago deuda: ${debt.name}`, { shouldValidate: true });
      if (form.getValues('category') === '') {
        form.setValue('category', 'Debt Payment');
      }
    } else {
      // Collecting from a debtor (income)
      form.setValue('description', `Cobro deudor: ${debt.name}`, { shouldValidate: true });
      if (form.getValues('category') === '') {
        form.setValue('category', 'Loan');
      }
    }
  };

  const handleContinueDialogAction = (addAnother: boolean) => {
    setShowContinueDialog(false);
    if (addAnother) {
      const currentExchangeRate = form.getValues('exchangeRate');
      const currentCurrency = form.getValues('currency');
      const currentAccountId = form.getValues('accountId');
      const currentType = form.getValues('type');

      setSelectedDebt(null);
      setIsDebtPayment(false);
      form.reset({
        description: '',
        amount: 0,
        type: currentType,
        category: '',
        date: format(new Date(), 'yyyy-MM-dd'),
        currency: currentCurrency,
        exchangeRate: currentExchangeRate,
        accountId: currentAccountId,
        paymentMethod: undefined,
      });
    } else {
      afterSubmit?.();
    }
  }

  return (
    <>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8 py-8">
          <div className="space-y-4">
            <div className="flex justify-end">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleImageScan}
                className="hidden"
                accept="image/*"
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                disabled={isScanning}
                className="w-full"
              >
                {isScanning ? (
                  <Loader2 className="animate-spin" />
                ) : (
                  <Camera />
                )}
                Scan Receipt or Screenshot
              </Button>
            </div>

            <FormField
              control={form.control}
              name="date"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Date</FormLabel>
                  <Input
                    type="date"
                    {...field}
                  />
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="e.g., Coffee with a friend"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Amount</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        {...field}
                        value={field.value || ''}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Type</FormLabel>
                    <Select
                      onValueChange={(value) => {
                        field.onChange(value)
                        form.setValue('category', '')
                      }}
                      defaultValue={field.value}
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="expense">Expense</SelectItem>
                        <SelectItem value="income">Income</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <div className="flex justify-between items-center">
                    <FormLabel>Category</FormLabel>
                    {/*
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleSuggestCategory}
                      disabled={isSuggesting}
                    >
                      {isSuggesting ? (
                        <Loader2 className="animate-spin" />
                      ) : (
                        <Sparkles />
                      )}
                      Suggest
                    </Button>
                    */}
                  </div>
                  <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a category" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {categories.map(category => (
                        <SelectItem key={category.value} value={category.value}>
                          {category.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />


            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="currency"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Currency</FormLabel>
                    <Select
                      onValueChange={(value) => {
                        field.onChange(value);
                        // Reset account selection when currency changes
                        form.setValue('accountId', undefined);
                        if (value === 'VES') {
                          const officialRate = rates.find((r: any) => r.fuente === 'oficial');
                          if (officialRate) {
                            form.setValue('exchangeRate', officialRate.promedio);
                          }
                        } else {
                          form.setValue('exchangeRate', 0);
                        }
                      }}
                      defaultValue={field.value}
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select currency" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="VES">🇻🇪 VES</SelectItem>
                        <SelectItem value="USD">🇺🇸 USD</SelectItem>
                        <SelectItem value="USDT">USDT</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="exchangeRate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Exchange Rate</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="e.g. 300"
                        {...field}
                        value={field.value ?? ''}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Account selector — filtered by selected currency */}
            <FormField
              control={form.control}
              name="accountId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Account
                    {filteredAccounts.length === 0 && selectedCurrency && (
                      <span className="text-xs text-muted-foreground ml-2">
                        (no active {selectedCurrency} accounts)
                      </span>
                    )}
                  </FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value ?? ''}
                    disabled={filteredAccounts.length === 0}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select account (optional)" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {filteredAccounts.map(account => (
                        <SelectItem key={account.id} value={account.id}>
                          <span className="font-medium">{account.name}</span>
                          <span className="ml-2 text-muted-foreground font-mono text-xs">
                            {new Intl.NumberFormat('en-US', {
                              style: 'currency',
                              currency: account.currency === 'USDT' ? 'USD' : account.currency,
                            }).format(account.balance)}
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Payment method selector — shown only for commission-bearing bank accounts on VES expenses */}
            {isCommissionBank && (
              <FormField
                control={form.control}
                name="paymentMethod"
                render={({ field }) => (
                  <FormItem>
                    <div className="flex items-center gap-2">
                      <FormLabel>Método de pago</FormLabel>

                      {/* Commission tooltip — visible only when Pago Móvil is selected and amount is entered */}
                      {isCommissionApplicable && commissionPreview > 0 && (
                        <TooltipProvider delayDuration={100}>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span className="inline-flex items-center gap-1 rounded-full bg-yellow-500/15 px-2 py-0.5 text-xs font-medium text-yellow-600 dark:text-yellow-400 cursor-default select-none">
                                <Info className="h-3 w-3" />
                                +{commissionPreview.toLocaleString('es-VE', { minimumFractionDigits: 2 })} VES
                              </span>
                            </TooltipTrigger>
                            <TooltipContent side="right" className="max-w-[220px] space-y-1 text-xs">
                              <p className="font-semibold text-yellow-500">⚠️ Comisión bancaria (0.3%)</p>
                              <p>
                                Comisión:{' '}
                                <span className="font-mono font-bold">
                                  {commissionPreview.toLocaleString('es-VE', { minimumFractionDigits: 2 })} VES
                                </span>
                              </p>
                              <p className="border-t border-border pt-1">
                                Total descontado:{' '}
                                <span className="font-mono font-bold">
                                  {(Math.abs(currentAmount) + commissionPreview).toLocaleString('es-VE', { minimumFractionDigits: 2 })} VES
                                </span>
                              </p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      )}
                    </div>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value ?? ''}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecciona el método de pago" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {PAYMENT_METHODS.map((method) => (
                          <SelectItem key={method.value} value={method.value}>
                            {method.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
          </div>
          <div className="space-y-4">
            {/* Debt / Debtor Toggle — label and list vary by transaction type */}
            <div className="space-y-3">
              <Button
                type="button"
                variant={isDebtPayment ? 'default' : 'outline'}
                className="w-full"
                onClick={handleToggleDebtPayment}
                disabled={isLoadingDebts}
              >
                {isLoadingDebts ? (
                  <Loader2 className="animate-spin mr-2" />
                ) : (
                  <CreditCard className="mr-2 h-4 w-4" />
                )}
                {isDebtPayment
                  ? transactionType === 'expense'
                    ? 'Desactivar pago de deuda'
                    : 'Desactivar cobro de deudor'
                  : transactionType === 'expense'
                    ? 'Pagar deuda existente'
                    : 'Registrar cobro de deudor'}
              </Button>

              {isDebtPayment && (
                <div className="rounded-md border p-3 space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">
                    {transactionType === 'expense'
                      ? 'Selecciona la deuda a pagar:'
                      : 'Selecciona el deudor a cobrar:'}
                  </p>
                  {(() => {
                    /**
                     * Filter by type AND remaining balance:
                     * - expense → Debt entries (money I owe) with remaining > 0
                     * - income  → Debtor entries (money owed to me) with remaining > 0
                     */
                    const relevantEntries = pendingDebts.filter(d =>
                      (transactionType === 'expense' ? d.type === 'Debt' : d.type === 'Debtor') &&
                      (d.total - d.paid) > 0
                    );

                    if (relevantEntries.length === 0) {
                      return (
                        <div className="flex flex-col items-center gap-1 py-3 text-center">
                          <span className="text-lg">{transactionType === 'expense' ? '🎉' : '📭'}</span>
                          <p className="text-sm font-medium text-muted-foreground">
                            {transactionType === 'expense'
                              ? '¡No tienes deudas pendientes!'
                              : 'No hay deudores pendientes.'}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {transactionType === 'expense'
                              ? 'No debes nada en este momento.'
                              : 'Nadie te debe dinero en este momento.'}
                          </p>
                        </div>
                      );
                    }

                    return (
                      <div className="space-y-2 max-h-48 overflow-y-auto">
                        {relevantEntries.map(debt => {
                          const remaining = debt.total - debt.paid;
                          const isSelected = selectedDebt?.id === debt.id;
                          return (
                            <button
                              key={debt.id}
                              type="button"
                              onClick={() => handleSelectDebt(debt)}
                              className={`w-full text-left rounded-md border p-3 text-sm transition-colors ${isSelected
                                ? 'border-primary bg-primary/10'
                                : 'hover:bg-muted'
                                }`}
                            >
                              <div className="flex justify-between items-center">
                                <span className="font-medium">{debt.name}</span>
                                {isSelected && <X className="h-4 w-4 text-primary" onClick={(e) => { e.stopPropagation(); setSelectedDebt(null); }} />}
                              </div>
                              <div className="text-xs text-muted-foreground mt-1 flex gap-3">
                                <span>Total: <strong>{debt.total.toFixed(2)}</strong></span>
                                <span>Pagado: <strong>{debt.paid.toFixed(2)}</strong></span>
                                <span className="text-destructive">Resta: <strong>{remaining.toFixed(2)}</strong></span>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    );
                  })()}
                </div>
              )}
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={isSubmitting || isScanning}
            >
              {(isSubmitting || isScanning) && (
                <Loader2 className="animate-spin mr-2" />
              )}
              Add Transaction
            </Button>
            <Collapsible open={showCalculator} onOpenChange={setShowCalculator}>
              <CollapsibleTrigger asChild>
                <Button type="button" variant="outline" className="w-full">
                  <CalculatorIcon />
                  Mostrar Calculadora
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="mt-4">
                <CurrencyCalculator showTitle={false} />
              </CollapsibleContent>
            </Collapsible>
          </div>
        </form>
      </Form>

      <AlertDialog open={showContinueDialog} onOpenChange={setShowContinueDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Transaction Added!</AlertDialogTitle>
            <AlertDialogDescription>
              Would you like to add another transaction?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => handleContinueDialogAction(false)}>No, I'm Done</AlertDialogCancel>
            <AlertDialogAction onClick={() => handleContinueDialogAction(true)}>Yes, Add Another</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={scannedTransactions.length > 0} onOpenChange={() => setScannedTransactions([])}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Scanned Transactions</DialogTitle>
            <DialogDescription>
              Review, edit, and categorize the transactions found in your receipt. Click "Add All" to save them.
            </DialogDescription>
          </DialogHeader>
          <div className="max-h-[60vh] overflow-y-auto space-y-4 pr-6">
            <div className="flex flex-col gap-2">
              <Label>Transaction Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={'outline'}
                    className={cn(
                      'w-[280px] justify-start text-left font-normal',
                      !scannedDate && 'text-muted-foreground'
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {scannedDate ? format(scannedDate, 'PPP') : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={scannedDate}
                    onSelect={(date) => setScannedDate(date || new Date())}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className='w-2/6'>Description</TableHead>
                  <TableHead className='w-1/6'>Type</TableHead>
                  <TableHead className='w-2/6'>Category</TableHead>
                  <TableHead className="w-1/6 text-right">Amount</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {scannedTransactions.map((trans) => {
                  const cats = trans.type === 'income' ? incomeCategories : expenseCategories;
                  return (
                    <TableRow key={trans.id}>
                      <TableCell>
                        <Input value={trans.description} onChange={(e) => handleScannedItemChange(trans.id, 'description', e.target.value)} className="h-8" />
                      </TableCell>
                      <TableCell>
                        <Select value={trans.type} onValueChange={(value) => handleScannedItemChange(trans.id, 'type', value)}>
                          <SelectTrigger className="h-8">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="expense">Expense</SelectItem>
                            <SelectItem value="income">Income</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <Select value={trans.category} onValueChange={(value) => handleScannedItemChange(trans.id, 'category', value)}>
                          <SelectTrigger className="h-8">
                            <SelectValue placeholder="Select Category" />
                          </SelectTrigger>
                          <SelectContent>
                            {cats.map(c => (
                              <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <Input type="number" value={trans.amount} onChange={(e) => handleScannedItemChange(trans.id, 'amount', parseFloat(e.target.value) || 0)} className="h-8 text-right" />
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" onClick={() => handleDeleteScannedItem(trans.id)}>
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
            <Collapsible>
              <CollapsibleTrigger asChild>
                <Button type="button" variant="outline" className="w-full mt-4">
                  <CalculatorIcon />
                  Show Calculator
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="mt-4">
                <CurrencyCalculator showTitle={false} />
              </CollapsibleContent>
            </Collapsible>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setScannedTransactions([])}>Cancel</Button>
            <Button onClick={handleAddScannedTransactions} disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="animate-spin mr-2" />}
              Add All
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}