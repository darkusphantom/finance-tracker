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
  FormDescription,
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
import { updateUserAction, logoutAction, updatePasswordAction, updateNotionSettingsAction } from '@/app/actions';
import { Loader2, LogOut } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Separator } from './ui/separator';

// --- Schemas ---
const profileFormSchema = z.object({
  username: z.string().min(3, { message: 'Username must be at least 3 characters.' }),
  email: z.string().email({ message: 'Please enter a valid email.' }),
});

const passwordFormSchema = z.object({
  password: z.string().min(6, { message: 'Password must be at least 6 characters.' }),
});

const notionFormSchema = z.object({
    NOTION_TOKEN: z.string().min(1, "Notion Token is required"),
    NOTION_TRANSACTIONS_DB: z.string().min(1, "Transactions DB ID is required"),
    NOTION_INCOME_DB: z.string().min(1, "Income DB ID is required"),
    NOTION_TOTAL_SAVINGS_DB: z.string().min(1, "Total Savings DB ID is required"),
    NOTION_ACCOUNTS_DB: z.string().min(1, "Accounts DB ID is required"),
    NOTION_DEBTS_DB: z.string().min(1, "Debts DB ID is required"),
    NOTION_BUDGET_DB: z.string().min(1, "Budget DB ID is required"),
});

// --- Main Component ---
export function UserSettingsForm({ currentUser }: { currentUser: any }) {
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const router = useRouter();

  async function handleLogout() {
    setIsLoggingOut(true);
    await logoutAction();
  }

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <ProfileForm currentUser={currentUser} />
      <Separator />
      <PasswordForm />
      <Separator />
      <NotionForm currentUser={currentUser} />
      <Separator />
       <Card>
        <CardHeader>
          <CardTitle>Session</CardTitle>
          <CardDescription>
            End your current session and log out of the application.
          </CardDescription>
        </CardHeader>
        <CardFooter>
          <Button variant="destructive" type="button" onClick={handleLogout} disabled={isLoggingOut}>
            {isLoggingOut ? <Loader2 className="animate-spin" /> : <LogOut />}
            Logout
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}

// --- Profile Form Component ---
function ProfileForm({ currentUser }: { currentUser: any }) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  const form = useForm<z.infer<typeof profileFormSchema>>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      username: currentUser.username || '',
      email: currentUser.email || '',
    },
  });

  async function onSubmit(values: z.infer<typeof profileFormSchema>) {
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

  return (
    <Card>
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
          </CardContent>
          <CardFooter>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="animate-spin mr-2" />}
              Save Profile
            </Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
}

// --- Password Form Component ---
function PasswordForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const form = useForm<z.infer<typeof passwordFormSchema>>({
    resolver: zodResolver(passwordFormSchema),
    defaultValues: {
      password: '',
    },
  });

  async function onSubmit(values: z.infer<typeof passwordFormSchema>) {
    setIsSubmitting(true);
    const result = await updatePasswordAction(values);

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
      form.reset();
    }
    setIsSubmitting(false);
  }
    
  return (
     <Card>
        <CardHeader>
            <CardTitle>Password</CardTitle>
            <CardDescription>Change your password here. Your new password must be at least 6 characters long.</CardDescription>
        </CardHeader>
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)}>
                <CardContent>
                    <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>New Password</FormLabel>
                        <FormControl>
                            <Input type="password" placeholder="••••••••" {...field} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
                </CardContent>
                <CardFooter>
                    <Button type="submit" disabled={isSubmitting}>
                        {isSubmitting && <Loader2 className="animate-spin mr-2" />}
                        Change Password
                    </Button>
                </CardFooter>
            </form>
        </Form>
     </Card>
  )
}

// --- Notion Form Component ---
function NotionForm({ currentUser }: { currentUser: any }) {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { toast } = useToast();
    
    const form = useForm<z.infer<typeof notionFormSchema>>({
        resolver: zodResolver(notionFormSchema),
        defaultValues: {
            NOTION_TOKEN: currentUser.notionToken || '',
            NOTION_TRANSACTIONS_DB: currentUser.notionDatabases?.transactions || '',
            NOTION_INCOME_DB: currentUser.notionDatabases?.income || '',
            NOTION_TOTAL_SAVINGS_DB: currentUser.notionDatabases?.totalSavings || '',
            NOTION_ACCOUNTS_DB: currentUser.notionDatabases?.accounts || '',
            NOTION_DEBTS_DB: currentUser.notionDatabases?.debts || '',
            NOTION_BUDGET_DB: currentUser.notionDatabases?.budget || '',
        },
    });

    async function onSubmit(values: z.infer<typeof notionFormSchema>) {
        setIsSubmitting(true);
        const result = await updateNotionSettingsAction(values);
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
        }
        setIsSubmitting(false);
    }

    const notionFields = [
        { name: 'NOTION_TOKEN', label: 'Notion API Token', description: 'Your secret Notion integration token.' },
        { name: 'NOTION_TRANSACTIONS_DB', label: 'Expenses Database ID', description: 'The ID of your main expenses database.' },
        { name: 'NOTION_INCOME_DB', label: 'Income Database ID', description: 'The ID of your income database.' },
        { name: 'NOTION_TOTAL_SAVINGS_DB', label: 'Monthly Summary Database ID', description: 'The database used to link transactions to a month.' },
        { name: 'NOTION_ACCOUNTS_DB', label: 'Accounts Database ID', description: 'The ID of your bank and cash accounts database.' },
        { name: 'NOTION_DEBTS_DB', label: 'Debts Database ID', description: 'The ID of your debts and debtors database.' },
        { name: 'NOTION_BUDGET_DB', label: 'Scheduled Payments Database ID', description: 'The ID of your recurring payments database.' },
    ] as const;

    return (
        <Card>
            <CardHeader>
                <CardTitle>Notion Integration</CardTitle>
                <CardDescription>Connect the application to your Notion databases by providing the required IDs and API token.</CardDescription>
            </CardHeader>
             <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)}>
                    <CardContent className="space-y-6">
                        {notionFields.map(fieldInfo => (
                             <FormField
                                key={fieldInfo.name}
                                control={form.control}
                                name={fieldInfo.name}
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>{fieldInfo.label}</FormLabel>
                                        <FormControl>
                                            <Input placeholder={`Enter your ${fieldInfo.label}`} {...field} />
                                        </FormControl>
                                        <FormDescription>{fieldInfo.description}</FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        ))}
                    </CardContent>
                    <CardFooter>
                        <Button type="submit" disabled={isSubmitting}>
                            {isSubmitting && <Loader2 className="animate-spin mr-2" />}
                            Save Notion Settings
                        </Button>
                    </CardFooter>
                </form>
            </Form>
        </Card>
    )
}
