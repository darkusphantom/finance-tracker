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

import { CalendarIcon, Sparkles, Loader2, Camera, CalculatorIcon } from 'lucide-react';
import { useState, useRef } from 'react';
import {
  suggestCategoryAction,
  extractTransactionAction,
  addTransactionAction,
} from '@/app/actions';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { useRouter } from 'next/navigation';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from './ui/collapsible';
import { CurrencyCalculator } from './currency-calculator';
import type { ExtractTransactionFromImageOutput } from '@/ai/flows/extract-transaction-from-image';

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


const formSchema = z.object({
  description: z.string().min(2, {
    message: 'Description must be at least 2 characters.',
  }),
  amount: z.coerce.number().positive({ message: 'Amount must be positive.' }),
  type: z.enum(['income', 'expense']),
  category: z.string().optional(),
  date: z.date(),
});

type ScannedTransaction = Extract<ExtractTransactionFromImageOutput['transactions'], Array<any>>[number];


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
      date: new Date(),
    },
  });
  
  const transactionType = useWatch({
    control: form.control,
    name: 'type',
  });
  
  const categories = transactionType === 'income' ? incomeCategories : expenseCategories;


  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsSubmitting(true);
    const result = await addTransactionAction(values);
    
    if (result.success) {
      toast({
        title: 'Transaction Added',
        description: `Your transaction has been added.`,
      });
      router.refresh(); // Refresh the page to show the new transaction
      setShowContinueDialog(true); // Ask user if they want to add another
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
            handleSuggestCategory(); // Automatically suggest after filling
        } else {
            setScannedTransactions(result.data);
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
    for (const trans of scannedTransactions) {
      const result = await addTransactionAction({
        ...trans,
        date: new Date(), // Use current date for scanned items
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
    router.refresh();
    setShowContinueDialog(true);
  }

  const handleContinueDialogAction = (addAnother: boolean) => {
    setShowContinueDialog(false);
    if (addAnother) {
        form.reset({
            description: '',
            amount: 0,
            type: 'expense',
            category: '',
            date: new Date(),
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
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant={'outline'}
                          className={cn(
                            'w-full pl-3 text-left font-normal',
                            !field.value && 'text-muted-foreground'
                          )}
                        >
                          {field.value ? (
                            format(field.value, 'PPP')
                          ) : (
                            <span>Pick a date</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={(date) => {
                          field.onChange(date)
                          form.clearErrors('date');
                        }}
                        disabled={date =>
                          date > new Date() || date < new Date('1900-01-01')
                        }
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
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
          </div>
          <div className="space-y-4">
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
        <DialogContent className="max-w-2xl">
            <DialogHeader>
                <DialogTitle>Scanned Transactions</DialogTitle>
                <DialogDescription>
                    Review the transactions found in your receipt. Click "Add All" to save them.
                </DialogDescription>
            </DialogHeader>
            <div className="max-h-[60vh] overflow-y-auto">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Description</TableHead>
                            <TableHead>Type</TableHead>
                            <TableHead className="text-right">Amount</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {scannedTransactions.map((trans, index) => (
                            <TableRow key={index}>
                                <TableCell>{trans.description}</TableCell>
                                <TableCell>{trans.type}</TableCell>
                                <TableCell className="text-right font-mono">{trans.amount.toFixed(2)}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
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
