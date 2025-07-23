'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
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
import { Sparkles, Loader2, Camera } from 'lucide-react';
import { useState, useRef } from 'react';
import { suggestCategoryAction, extractTransactionAction } from '@/app/actions';
import { useToast } from '@/hooks/use-toast';

const formSchema = z.object({
  description: z.string().min(2, {
    message: 'Description must be at least 2 characters.',
  }),
  amount: z.coerce.number().positive({ message: 'Amount must be positive.' }),
  type: z.enum(['income', 'expense']),
  category: z.string().optional(),
});

export function AddTransactionForm({
  afterSubmit,
}: {
  afterSubmit?: () => void;
}) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuggesting, setIsSuggesting] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      description: '',
      amount: '' as any, // Fix: Initialize with an empty string
      type: 'expense',
      category: '',
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsSubmitting(true);
    console.log(values);
    // Here you would typically call a server action to save to Notion
    await new Promise((resolve) => setTimeout(resolve, 1000)); // Simulate API call
    toast({
      title: 'Transaction Added',
      description: `${values.description} for $${values.amount} has been added.`,
    });
    setIsSubmitting(false);
    form.reset();
    afterSubmit?.();
  }

  async function handleSuggestCategory() {
    setIsSuggesting(true);
    const description = form.getValues('description');
    if (!description || description.length < 2) {
      form.setError('description', {
        message: 'Please enter a description first.',
      });
      setIsSuggesting(false);
      return;
    }

    const result = await suggestCategoryAction({ description });
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

  const handleImageScan = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsScanning(true);
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = async () => {
      const photoDataUri = reader.result as string;
      const result = await extractTransactionAction({ photoDataUri });
      
      if (result.data) {
        form.setValue('description', result.data.description, { shouldValidate: true });
        form.setValue('amount', result.data.amount, { shouldValidate: true });
        form.setValue('type', result.data.type, { shouldValidate: true });
        toast({
            title: 'Scan Successful!',
            description: 'Transaction details have been filled in.',
        });
        // Automatically suggest a category after scanning
        const categoryResult = await suggestCategoryAction({ description: result.data.description });
        if (categoryResult.category) {
            form.setValue('category', categoryResult.category, { shouldValidate: true });
        }

      } else if (result.error) {
        toast({
            title: 'Scan Failed',
            description: result.error,
            variant: 'destructive',
        });
      }
      setIsScanning(false);
    };
    reader.onerror = (error) => {
        console.error('Error reading file:', error);
        toast({
            title: 'File Error',
            description: 'Could not read the selected file.',
            variant: 'destructive',
        });
        setIsScanning(false);
    };
  };

  return (
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
                    {isScanning ? <Loader2 className="animate-spin" /> : <Camera />}
                    Scan Receipt or Screenshot
                </Button>
            </div>

            <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
                <FormItem>
                <FormLabel>Description</FormLabel>
                <FormControl>
                    <Textarea placeholder="e.g., Coffee with a friend" {...field} />
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
                    <Input type="number" step="0.01" placeholder="0.00" {...field} />
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
                    onValueChange={field.onChange}
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
                <FormControl>
                    <Input placeholder="e.g., Food & Drink" {...field} />
                </FormControl>
                <FormMessage />
                </FormItem>
            )}
            />
        </div>
        <Button type="submit" className="w-full" disabled={isSubmitting || isScanning}>
          {(isSubmitting || isScanning) && <Loader2 className="animate-spin mr-2" />}
          Add Transaction
        </Button>
      </form>
    </Form>
  );
}
