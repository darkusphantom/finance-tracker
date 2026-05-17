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
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Loader2, AlertTriangle } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useExchangeRates } from '@/hooks/use-exchange-rates';
import {
  addTransferAction,
  getActiveAccountsAction,
} from '@/app/actions';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { useRouter } from 'next/navigation';

const formSchema = z.object({
  description: z.string().min(2, { message: 'Description must be at least 2 characters.' }),
  type: z.enum(['Transferencia', 'Cambio Divisa']),
  date: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: "Invalid date format",
  }),
  fromAccountId: z.string().min(1, 'Source account is required'),
  toAccountId: z.string().min(1, 'Destination account is required'),
  sentAmount: z.coerce.number().positive('Amount must be positive'),
  receivedAmount: z.coerce.number().positive('Amount must be positive'),
  rateSource: z.enum(['BCV', 'Paralelo', 'Binance', 'Custom', 'N/A']).optional(),
  referenceRate: z.coerce.number().optional(),
  baseRate: z.coerce.number().optional(),
  fxLoss: z.coerce.number().optional(),
}).refine(data => data.fromAccountId !== data.toAccountId, {
  message: "Source and destination accounts must be different",
  path: ["toAccountId"]
});

export function AddTransferForm({
  afterSubmit,
}: {
  afterSubmit?: () => void;
}) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeAccounts, setActiveAccounts] = useState<any[]>([]);
  const { toast } = useToast();
  const router = useRouter();
  const { rates } = useExchangeRates();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      description: '',
      type: 'Cambio Divisa',
      date: format(new Date(), 'yyyy-MM-dd'),
      fromAccountId: '',
      toAccountId: '',
      sentAmount: 0,
      receivedAmount: 0,
      rateSource: 'BCV',
      referenceRate: 0,
      baseRate: 0,
      fxLoss: 0,
    },
  });

  const transactionType = useWatch({
    control: form.control,
    name: 'type',
  });

  const sentAmount = useWatch({
    control: form.control,
    name: 'sentAmount',
  });

  const rateSource = useWatch({
    control: form.control,
    name: 'rateSource',
  });

  const referenceRate = useWatch({
    control: form.control,
    name: 'referenceRate',
  });

  const baseRate = useWatch({
    control: form.control,
    name: 'baseRate',
  });

  const receivedAmount = useWatch({
    control: form.control,
    name: 'receivedAmount',
  });

  const fxLoss = (transactionType === 'Cambio Divisa' && baseRate && sentAmount && receivedAmount && baseRate > 0) 
    ? (sentAmount / baseRate) - receivedAmount 
    : 0;
  
  const isLoss = fxLoss > 0;

  useEffect(() => {
    getActiveAccountsAction().then(res => setActiveAccounts(res.accounts));
  }, []);

  // Update receivedAmount based on referenceRate logic 
  // Very basic projection example (user could refine)
  // useEffect(() => {
  //   if (transactionType === 'Cambio Divisa' && referenceRate && referenceRate > 0 && sentAmount) {
  //     // Basic logic: assuming sent is VES and received is USD. You can customize this.
  //     form.setValue('receivedAmount', parseFloat((sentAmount / referenceRate).toFixed(2)));
  //   }
  // }, [sentAmount, referenceRate, transactionType, form]);

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsSubmitting(true);

    const fromAccount = activeAccounts.find(a => a.id === values.fromAccountId);
    const toAccount = activeAccounts.find(a => a.id === values.toAccountId);
    const toCurrency = toAccount?.currency || 'USD';

    // Obtenemos la tasa oficial del día de DolarAPI (o fallback al referenceRate)
    const officialRateObj = rates.find((r: any) => r.fuente === 'oficial');
    const officialRate = officialRateObj ? officialRateObj.promedio : (values.referenceRate || 0);

    const result = await addTransferAction({
      ...values,
      fxLoss: isLoss ? parseFloat(fxLoss.toFixed(2)) : 0,
      fromAccountBalance: fromAccount?.balance,
      toAccountBalance: toAccount?.balance,
      toAccountCurrency: toCurrency,
      officialRate: officialRate,
    });

    if (result.success) {
      toast({
        title: 'Transfer/FX Added',
        description: `Your transaction has been recorded.`,
      });
      form.reset();
      router.refresh();
      if (afterSubmit) afterSubmit();
    } else {
      toast({
        title: 'Submission Failed',
        description: result.error,
        variant: 'destructive',
      });
    }
    setIsSubmitting(false);
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 py-4">
        
        <FormField
          control={form.control}
          name="type"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Type</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="Cambio Divisa">Cambio de Divisa (FX)</SelectItem>
                  <SelectItem value="Transferencia">Transferencia Interna</SelectItem>
                </SelectContent>
              </Select>
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
                  placeholder="e.g., Recarga a Binance"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

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

        <div className="grid grid-cols-2 gap-4 border-t pt-4">
          <div className="space-y-4">
            <h3 className="font-semibold text-sm">From (Origin)</h3>
            <FormField
              control={form.control}
              name="fromAccountId"
              render={({ field }) => (
                <FormItem>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select origin" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {activeAccounts.map(account => (
                        <SelectItem key={account.id} value={account.id}>
                          {account.name} ({account.currency})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="sentAmount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Amount Sent</FormLabel>
                  <FormControl>
                    <Input type="number" step="0.01" {...field} value={field.value || ''} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="space-y-4">
            <h3 className="font-semibold text-sm">To (Destination)</h3>
            <FormField
              control={form.control}
              name="toAccountId"
              render={({ field }) => (
                <FormItem>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select destination" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {activeAccounts.map(account => (
                        <SelectItem key={account.id} value={account.id}>
                          {account.name} ({account.currency})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="receivedAmount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Amount Received</FormLabel>
                  <FormControl>
                    <Input type="number" step="0.01" {...field} value={field.value || ''} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        {transactionType === 'Cambio Divisa' && (
          <div className="grid grid-cols-2 gap-4 border-t pt-4 bg-muted/50 p-3 rounded-md">
            <FormField
              control={form.control}
              name="rateSource"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Rate Source</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select source" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="BCV">BCV</SelectItem>
                      <SelectItem value="Paralelo">Paralelo</SelectItem>
                      <SelectItem value="Binance">Binance</SelectItem>
                      <SelectItem value="Custom">Custom</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="referenceRate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Reference Rate (Binance)</FormLabel>
                  <FormControl>
                    <Input type="number" step="0.01" {...field} value={field.value || ''} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="baseRate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Base Rate (Opcional - Adquisición)</FormLabel>
                  <FormControl>
                    <Input type="number" step="0.01" {...field} value={field.value || ''} placeholder="Ej. 515" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        )}

        {isLoss && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Pérdida Cambiaria Proyectada</AlertTitle>
            <AlertDescription>
              Valor original estimado de tus fondos: <strong>${(sentAmount / (baseRate || 1)).toFixed(2)} USD</strong><br/>
              Valor real a recibir: <strong>${receivedAmount} USD</strong><br/>
              <span className="mt-2 block">
                <strong>Pérdida Neta: -${fxLoss.toFixed(2)} USD</strong><br/>
                <span className="text-xs opacity-90">(Se registrará automáticamente como gasto en 'Recarga en Binance')</span>
              </span>
            </AlertDescription>
          </Alert>
        )}

        <Button
          type="submit"
          className="w-full"
          disabled={isSubmitting}
        >
          {isSubmitting && <Loader2 className="animate-spin mr-2" />}
          Add {transactionType === 'Cambio Divisa' ? 'FX Transaction' : 'Transfer'}
        </Button>
      </form>
    </Form>
  );
}
