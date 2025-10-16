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
import { useToast } from '@/hooks/use-toast';
import { useState, useTransition } from 'react';
import { loginAction } from '@/app/actions';
import { Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

const formSchema = z.object({
  loginIdentifier: z.string().min(1, { message: 'Username or Email is required.' }),
  password: z.string().min(1, { message: 'Password is required.' }),
});

export function LoginForm() {
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();
  const router = useRouter();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      loginIdentifier: '',
      password: '',
    },
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    startTransition(async () => {
      const result = await loginAction(values);

      if (result?.error) {
        toast({
          title: 'Login Failed',
          description: result.error,
          variant: 'destructive',
        });
      } else if (result?.success) {
        router.push('/dashboard');
      }
    });
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="loginIdentifier"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Usuario o Email</FormLabel>
              <FormControl>
                <Input placeholder="tu-usuario o tu@email.com" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Contraseña</FormLabel>
              <FormControl>
                <Input type="password" placeholder="••••••••" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" className="w-full" disabled={isPending}>
          {isPending && <Loader2 className="animate-spin mr-2" />}
          Iniciar Sesión
        </Button>
      </form>
    </Form>
  );
}
