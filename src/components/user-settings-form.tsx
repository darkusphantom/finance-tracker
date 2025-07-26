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
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { useState } from 'react';
import { updateUserAction, logoutAction } from '@/app/actions';
import { Loader2, LogOut } from 'lucide-react';
import { useRouter } from 'next/navigation';

const formSchema = z.object({
  username: z.string().min(3, { message: 'Username must be at least 3 characters.' }),
  email: z.string().email({ message: 'Please enter a valid email.' }),
  password: z.string().min(6, { message: 'Password must be at least 6 characters.' }).optional().or(z.literal('')),
});

export function UserSettingsForm({ currentUser }: { currentUser: { username?: string, email?: string } }) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      username: currentUser.username || '',
      email: currentUser.email || '',
      password: '',
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsSubmitting(true);
    const result = await updateUserAction(values);

    if (result?.error) {
      toast({
        title: 'Update Failed',
        description: result.error,
        variant: 'destructive',
      });
    } else {
       toast({
        title: 'Success!',
        description: result.message,
      });
      router.refresh();
    }
    setIsSubmitting(false);
  }
  
  async function handleLogout() {
    setIsLoggingOut(true);
    await logoutAction();
  }

  return (
    <Card className="max-w-2xl">
         <CardHeader>
            <CardTitle>User Profile</CardTitle>
            <CardDescription>Update your account information here.</CardDescription>
        </CardHeader>
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)}>
                <CardContent className="space-y-6">
                    <FormField
                    control={form.control}
                    name="username"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Username</FormLabel>
                        <FormControl>
                            <Input placeholder="your-username" {...field} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
                    <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                            <Input type="email" placeholder="your@email.com" {...field} />
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
                        <FormLabel>New Password</FormLabel>
                        <FormControl>
                            <Input type="password" placeholder="Leave blank to keep current password" {...field} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
                </CardContent>
                <CardFooter className="flex justify-between">
                     <Button type="submit" disabled={isSubmitting}>
                        {isSubmitting && <Loader2 className="animate-spin mr-2" />}
                        Save Changes
                    </Button>
                    <Button variant="destructive" type="button" onClick={handleLogout} disabled={isLoggingOut}>
                        {isLoggingOut ? <Loader2 className="animate-spin" /> : <LogOut />}
                        Logout
                    </Button>
                </CardFooter>
            </form>
        </Form>
    </Card>
  );
}
