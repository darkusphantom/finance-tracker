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
import { useState } from 'react';
import { registerAction } from '@/app/actions';
import { Loader2 } from 'lucide-react';
import { isRedirectError } from 'next/dist/client/components/redirect';
import { useRouter } from 'next/navigation';


const formSchema = z.object({
  email: z.string().email({ message: 'Por favor ingresa un email válido.' }),
  username: z.string().min(3, { message: 'El usuario debe tener al menos 3 caracteres.' }),
  password: z.string().min(6, { message: 'La contraseña debe tener al menos 6 caracteres.' }),
});

export function RegisterForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: '',
      username: '',
      password: '',
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsSubmitting(true);
    try {
      const result = await registerAction(values);
      if (result?.error) {
        toast({
          title: 'Registro Fallido',
          description: result.error,
          variant: 'destructive',
        });
      }
    } catch (error) {
      if (isRedirectError(error)) {
        toast({
          title: '¡Registro Exitoso!',
          description: 'Ya puedes iniciar sesión con tu nueva cuenta.',
        });
        router.push(error.digest.split(';')[1]); // Extract URL from digest
      } else {
        toast({
          title: 'Error Inesperado',
          description: 'Ocurrió un error durante el registro.',
          variant: 'destructive',
        });
      }
    } finally {
        setIsSubmitting(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input placeholder="tu@email.com" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="username"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Usuario</FormLabel>
              <FormControl>
                <Input placeholder="tu-usuario" {...field} />
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
        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="animate-spin mr-2" />}
          Crear Cuenta
        </Button>
      </form>
    </Form>
  );
}
