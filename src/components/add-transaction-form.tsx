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

import { CalendarIcon, Sparkles, Loader2, Camera, CalculatorIcon, Trash2 } from 'lucide-react';
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
import { Label } from './ui/label';

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
  date: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: "Invalid date format",
  }),
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
      router.refresh(); 
      setShowContinueDialog(true); 
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
            setScannedTransactions(result.data.map((item, index) => ({...item, id: `scanned-${index}`})));
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
    router.refresh();
    setShowContinueDialog(true);
  }
  
  const handleScannedItemChange = (id: string, field: string, value: string | number) => {
    setScannedTransactions(prev => 
        prev.map(item => item.id === id ? {...item, [field]: value} : item)
    );
  }

  const handleDeleteScannedItem = (id: string) => {
    setScannedTransactions(prev => prev.filter(item => item.id !== id));
  }


  const handleContinueDialogAction = (addAnother: boolean) => {
    setShowContinueDialog(false);
    if (addAnother) {
        form.reset({
            description: '',
            amount: 0,
            type: 'expense',
            category: '',
            date: format(new Date(), 'yyyy-MM-dd'),
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
                                    <Input value={trans.description} onChange={(e) => handleScannedItemChange(trans.id, 'description', e.target.value)} className="h-8"/>
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
                                    <Input type="number" value={trans.amount} onChange={(e) => handleScannedItemChange(trans.id, 'amount', parseFloat(e.target.value) || 0)} className="h-8 text-right"/>
                                </TableCell>
                                <TableCell className="text-right">
                                    <Button variant="ghost" size="icon" onClick={() => handleDeleteScannedItem(trans.id)}>
                                        <Trash2 className="w-4 h-4 text-destructive" />
                                    </Button>
                                </TableCell>
                            </TableRow>
                        )})}
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
