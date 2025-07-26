'use server';

import {
  categorizeTransaction,
  type CategorizeTransactionInput,
} from '@/ai/flows/categorize-transaction';
import {
  extractTransactionFromImage,
  type ExtractTransactionFromImageInput,
} from '@/ai/flows/extract-transaction-from-image';
import {
  financialChat,
} from '@/ai/flows/financial-chat-flow';
import {
  assessRiskProfile,
  type AssessRiskProfileInput,
} from '@/ai/flows/risk-profile-flow';
import {
  addPageToDb,
  deletePage,
  updatePage as updateNotionPage,
  findOrCreateMonthPage,
} from '@/lib/notion';
import { findUserByUsernameOrEmail, createUser, updateUser as updateUserAirtable } from '@/lib/airtable';
import { z } from 'zod';
import { format } from 'date-fns';
import { getIronSession } from 'iron-session';
import { sessionOptions, type SessionData } from '@/lib/session';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
<<<<<<< HEAD
import { isRedirectError } from 'next/dist/client/components/navigation';
=======
>>>>>>> e2e3579 (Perfecto. Vamos a crear otra página. Crea una página para los ajustes de)

const loginSchema = z.object({
  loginIdentifier: z.string().min(1, 'Username or email is required'),
  password: z.string().min(1, 'Password is required'),
});

export async function loginAction(values: unknown) {
    const parsed = loginSchema.safeParse(values);
    if (!parsed.success) {
      return { error: 'Invalid input.' };
    }

    const { loginIdentifier, password } = parsed.data;

    let user;
    try {
        user = await findUserByUsernameOrEmail(loginIdentifier);
    } catch (error: any) {
        return { error: error.message || 'An unexpected error occurred during login.' };
    }

    if (!user || user.Password !== password) {
      return { error: 'Invalid credentials.' };
    }

    const session = await getIronSession<SessionData>(cookies(), sessionOptions);
    session.isLoggedIn = true;
    session.userId = user.id;
    session.username = user.Username as string;
    session.email = user.Email as string;
<<<<<<< HEAD
    session.notionToken = user.NOTION_TOKEN as string;
    session.notionDatabases = {
        transactions: user.NOTION_TRANSACTIONS_DB as string,
        income: user.NOTION_INCOME_DB as string,
        totalSavings: user.NOTION_TOTAL_SAVINGS_DB as string,
        accounts: user.NOTION_ACCOUNTS_DB as string,
        debts: user.NOTION_DEBTS_DB as string,
        budget: user.NOTION_BUDGET_DB as string,
    };
=======
>>>>>>> e2e3579 (Perfecto. Vamos a crear otra página. Crea una página para los ajustes de)
    await session.save();

    redirect('/dashboard');
}

const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  username: z.string().min(3, 'Username must be at least 3 characters'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export async function registerAction(values: unknown) {
  const parsed = registerSchema.safeParse(values);
  if (!parsed.success) {
    return { error: 'Invalid input.' };
  }
  const { email, username, password } = parsed.data;
  
  try {
    const existingUser = await findUserByUsernameOrEmail(username);
    if (existingUser) {
        return { error: 'Username already taken.' };
    }
    const existingEmail = await findUserByUsernameOrEmail(email);
    if (existingEmail) {
        return { error: 'Email already registered.' };
    }
    await createUser({ email, username, password });
  } catch (error: any) {
     if (isRedirectError(error)) {
      throw error;
    }
    return { error: error.message || 'An unexpected error occurred during registration.' };
  }

  redirect('/login?registered=true');
}

export async function logoutAction() {
    const session = await getIronSession<SessionData>(cookies(), sessionOptions);
    session.destroy();
    redirect('/login');
}

<<<<<<< HEAD
const updateUserSchema = z.object({
    username: z.string().min(3, 'Username must be at least 3 characters'),
    email: z.string().email('Invalid email address'),
=======
const updateUserSettingsSchema = z.object({
    username: z.string().min(3, 'Username must be at least 3 characters').optional(),
    email: z.string().email('Invalid email address').optional(),
    password: z.string().min(6, 'Password must be at least 6 characters').optional().or(z.literal('')),
>>>>>>> e2e3579 (Perfecto. Vamos a crear otra página. Crea una página para los ajustes de)
});

export async function updateUserAction(values: unknown) {
    const session = await getIronSession<SessionData>(cookies(), sessionOptions);
    if (!session.isLoggedIn || !session.userId) {
        return { error: 'You must be logged in to update your settings.' };
    }

<<<<<<< HEAD
    const parsed = updateUserSchema.safeParse(values);
=======
    const parsed = updateUserSettingsSchema.safeParse(values);
>>>>>>> e2e3579 (Perfecto. Vamos a crear otra página. Crea una página para los ajustes de)
    if (!parsed.success) {
        return { error: 'Invalid input.' };
    }

<<<<<<< HEAD
    const { username, email } = parsed.data;
    const fieldsToUpdate: { Username?: string; Email?: string; } = {};

    if (username) fieldsToUpdate.Username = username;
    if (email) fieldsToUpdate.Email = email;
=======
    const { username, email, password } = parsed.data;
    const fieldsToUpdate: { Username?: string; Email?: string; Password?: string } = {};

    if (username) fieldsToUpdate.Username = username;
    if (email) fieldsToUpdate.Email = email;
    if (password) fieldsToUpdate.Password = password;
>>>>>>> e2e3579 (Perfecto. Vamos a crear otra página. Crea una página para los ajustes de)

    if (Object.keys(fieldsToUpdate).length === 0) {
        return { success: true, message: 'No changes were made.' };
    }

    try {
        await updateUserAirtable(session.userId, fieldsToUpdate);
        
<<<<<<< HEAD
=======
        // Update session if needed
>>>>>>> e2e3579 (Perfecto. Vamos a crear otra página. Crea una página para los ajustes de)
        if (username) session.username = username;
        if (email) session.email = email;
        await session.save();
        
<<<<<<< HEAD
        return { success: true, message: 'Your profile has been updated successfully.' };
    } catch (error: any) {
        return { error: error.message || 'An unexpected error occurred while updating your profile.' };
    }
}

const updatePasswordSchema = z.object({
    password: z.string().min(6, 'Password must be at least 6 characters'),
});

export async function updatePasswordAction(values: unknown) {
    const session = await getIronSession<SessionData>(cookies(), sessionOptions);
    if (!session.isLoggedIn || !session.userId) {
        return { error: 'You must be logged in to update your password.' };
    }

    const parsed = updatePasswordSchema.safeParse(values);
    if (!parsed.success) {
        return { error: 'Invalid input.' };
    }
    
    try {
        await updateUserAirtable(session.userId, { Password: parsed.data.password });
        return { success: true, message: 'Your password has been updated successfully.' };
    } catch (error: any) {
        return { error: error.message || 'An unexpected error occurred while updating your password.' };
    }
}

const notionSettingsSchema = z.object({
    NOTION_TOKEN: z.string().min(1, "Notion Token is required"),
    NOTION_TRANSACTIONS_DB: z.string().min(1, "Transactions DB ID is required"),
    NOTION_INCOME_DB: z.string().min(1, "Income DB ID is required"),
    NOTION_TOTAL_SAVINGS_DB: z.string().min(1, "Total Savings DB ID is required"),
    NOTION_ACCOUNTS_DB: z.string().min(1, "Accounts DB ID is required"),
    NOTION_DEBTS_DB: z.string().min(1, "Debts DB ID is required"),
    NOTION_BUDGET_DB: z.string().min(1, "Budget DB ID is required"),
});

export async function updateNotionSettingsAction(values: unknown) {
    const session = await getIronSession<SessionData>(cookies(), sessionOptions);
    if (!session.isLoggedIn || !session.userId) {
        return { error: 'You must be logged in to update your settings.' };
    }

    const parsed = notionSettingsSchema.safeParse(values);
    if (!parsed.success) {
        return { error: 'Invalid input.', details: parsed.error.format() };
    }
    
    try {
        await updateUserAirtable(session.userId, parsed.data);
        
        // Update session
        session.notionToken = parsed.data.NOTION_TOKEN;
        session.notionDatabases = {
            transactions: parsed.data.NOTION_TRANSACTIONS_DB,
            income: parsed.data.NOTION_INCOME_DB,
            totalSavings: parsed.data.NOTION_TOTAL_SAVINGS_DB,
            accounts: parsed.data.NOTION_ACCOUNTS_DB,
            debts: parsed.data.NOTION_DEBTS_DB,
            budget: parsed.data.NOTION_BUDGET_DB,
        };
        await session.save();

        return { success: true, message: 'Your Notion settings have been updated successfully.' };
=======
        return { success: true, message: 'Your settings have been updated successfully.' };
>>>>>>> e2e3579 (Perfecto. Vamos a crear otra página. Crea una página para los ajustes de)
    } catch (error: any) {
        return { error: error.message || 'An unexpected error occurred while updating your settings.' };
    }
}


export async function getCurrentUser() {
    const session = await getIronSession<SessionData>(cookies(), sessionOptions);
    if (!session.isLoggedIn) {
        return null;
    }
    return {
        isLoggedIn: session.isLoggedIn,
        username: session.username,
        email: session.email,
<<<<<<< HEAD
        notionToken: session.notionToken,
        notionDatabases: session.notionDatabases,
=======
>>>>>>> e2e3579 (Perfecto. Vamos a crear otra página. Crea una página para los ajustes de)
    };
}


const suggestCategorySchema = z.object({
  description: z.string().min(1, 'Description is required.'),
});

export async function suggestCategoryAction(
  input: CategorizeTransactionInput
): Promise<{ category?: string; error?: string }> {
  const parsedInput = suggestCategorySchema.safeParse(input);
  if (!parsedInput.success) {
    return { error: 'Invalid input.' };
  }

  try {
    const result = await categorizeTransaction(parsedInput.data);
    return { category: result.category };
  } catch (error) {
    console.error('AI category suggestion failed:', error);
    return { error: 'Failed to generate category suggestion.' };
  }
}

const extractTransactionSchema = z.object({
  photoDataUri: z.string().min(1, 'Image data is required.'),
});

export async function extractTransactionAction(
  input: ExtractTransactionFromImageInput
) {
  const parsedInput = extractTransactionSchema.safeParse(input);
  if (!parsedInput.success) {
    return { error: 'Invalid input.' };
  }

  try {
    const result = await extractTransactionFromImage(parsedInput.data);
    return { data: result };
  } catch (error) {
    console.error('AI transaction extraction failed:', error);
    return { error: 'Failed to extract transaction details from image.' };
  }
}

const addTransactionSchema = z.object({
  description: z.string().min(2),
  amount: z.coerce.number(),
  type: z.enum(['income', 'expense']),
  category: z.string().optional(),
  date: z.date(),
});

export async function addTransactionAction(values: unknown) {
  const parsed = addTransactionSchema.safeParse(values);
  if (!parsed.success) {
    return { error: 'Invalid input.' };
  }

  try {
    const { description, amount, category, date, type } = parsed.data;
    const session = await getIronSession<SessionData>(cookies(), sessionOptions);

    const monthName = format(date, 'MMMM yyyy');
    const monthPageId = await findOrCreateMonthPage(
      session.notionDatabases?.totalSavings!,
      monthName
    );

    const transactionAmount = Math.abs(amount);

    const databaseId =
      type === 'income'
        ? session.notionDatabases?.income!
        : session.notionDatabases?.transactions!;

    await addPageToDb(databaseId, {
      Source: { title: [{ text: { content: description } }] },
      Amount: { number: transactionAmount },
      Tags: { select: { name: category || 'Other' } },
      Date: { date: { start: date.toISOString().split('T')[0] } },
      Month: { relation: [{ id: monthPageId }] },
    });
    return { success: true };
  } catch (error) {
    console.error('Failed to add transaction to Notion:', error);
    return { error: 'Failed to save transaction.' };
  }
}

const updateTransactionSchema = z.object({
  id: z.string(),
  field: z.string(),
  value: z.any(),
});

export async function updateTransactionAction(values: unknown) {
  const parsed = updateTransactionSchema.safeParse(values);
  if (!parsed.success) {
    console.log(parsed.error);
    return { error: 'Invalid input.' };
  }

  try {
    const { id, field, value } = parsed.data;
    let notionProperty;
    switch (field) {
      case 'description':
        notionProperty = { Source: { title: [{ text: { content: value } }] } };
        break;
      case 'amount':
        notionProperty = { Amount: { number: parseFloat(value) || 0 } };
        break;
      case 'category':
        notionProperty = { Tags: { select: { name: value } } };
        break;
      case 'date':
        notionProperty = { Date: { date: { start: value } } };
        break;
      default:
        return { error: 'Invalid field.' };
    }

    await updateNotionPage(id, notionProperty);
    return { success: true };
  } catch (error) {
    console.error('Failed to update transaction in Notion:', error);
    return { error: 'Failed to update transaction.' };
  }
}

export async function deleteTransactionAction(id: string) {
  try {
    await deletePage(id);
    return { success: true };
  } catch (error) {
    console.error('Failed to delete transaction in Notion:', error);
    return { error: 'Failed to delete transaction.' };
  }
}

export async function addAccountAction() {
  try {
    const session = await getIronSession<SessionData>(cookies(), sessionOptions);
    const notionProperties = {
      Name: { title: [{ text: { content: 'New Account' } }] },
      'Account Type': { select: { name: 'Corriente' } },
      'Balance Amount': { number: 0 },
      'Is Active': { checkbox: true },
    };
    const newPage = await addPageToDb(
      session.notionDatabases?.accounts!,
      notionProperties
    );
    return { success: true, newPageId: newPage.id };
  } catch (error) {
    console.error('Failed to add account to Notion:', error);
    return { error: 'Failed to save account.' };
  }
}

export async function addDebtAction() {
  try {
    const session = await getIronSession<SessionData>(cookies(), sessionOptions);
    const notionProperties = {
      Title: { title: [{ text: { content: 'New Debt' } }] },
      Type: { select: { name: 'Deuda' } },
      'Debt Amount': { number: 0 },
      Status: { select: { name: 'Pendiente' } },
    };
    const newPage = await addPageToDb(
      session.notionDatabases?.debts!,
      notionProperties
    );
    return { success: true, newPageId: newPage.id };
  } catch (error) {
    console.error('Failed to add debt to Notion:', error);
    return { error: 'Failed to save debt.' };
  }
}

const updateDebtSchema = z.object({
  id: z.string(),
  field: z.string(),
  value: z.any(),
});

export async function updateDebtAction(values: unknown) {
  const parsed = updateDebtSchema.safeParse(values);
  if (!parsed.success) {
    return { error: 'Invalid input.' };
  }

  try {
    const { id, field, value } = parsed.data;
    let notionProperty;
    switch (field) {
      case 'name':
        notionProperty = { Title: { title: [{ text: { content: value } }] } };
        break;
      case 'total':
        notionProperty = { 'Debt Amount': { number: parseFloat(value) || 0 } };
        break;
      case 'type':
        notionProperty = {
          Type: { select: { name: value === 'Debt' ? 'Deuda' : 'Deudor' } },
        };
        break;
      default:
        return { error: 'Invalid field.' };
    }
    await updateNotionPage(id, notionProperty);
    return { success: true };
  } catch (error) {
    console.error('Failed to update debt in Notion:', error);
    return { error: 'Failed to update debt.' };
  }
}

const scheduledPaymentSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  day: z.coerce.number().min(1).max(31),
  amount: z.coerce.number(),
  type: z.enum(['fixed', 'variable']),
  category: z.enum(['income', 'expense']),
});

export async function addScheduledPaymentAction(
  values: z.infer<typeof scheduledPaymentSchema>
) {
  const parsed = scheduledPaymentSchema.safeParse(values);
  if (!parsed.success) {
    return { error: 'Invalid input.', details: parsed.error.format() };
  }

  try {
    const session = await getIronSession<SessionData>(cookies(), sessionOptions);
    const { name, day, amount, type, category } = parsed.data;
    const notionProperties = {
      Name: { title: [{ text: { content: name } }] },
      'Month Day': { number: day },
      'Budget Amount': { number: amount },
      Type: { select: { name: type === 'fixed' ? 'Fijo' : 'Variable' } },
      Category: { select: { name: category === 'income' ? 'Ingreso' : 'Pago' } },
    };
    const newPage = await addPageToDb(
      session.notionDatabases?.budget!,
      notionProperties
    );
    return { success: true, newPageId: newPage.id };
  } catch (error) {
    console.error('Failed to add scheduled payment to Notion:', error);
    return { error: 'Failed to save scheduled payment.' };
  }
}

const updateScheduledPaymentSchema = z.object({
  id: z.string(),
  field: z.string(),
  value: z.any(),
});

export async function updateScheduledPaymentAction(values: unknown) {
  const parsed = updateScheduledPaymentSchema.safeParse(values);
  if (!parsed.success) {
    return { error: 'Invalid input.' };
  }

  try {
    const { id, field, value } = parsed.data;
    let notionProperty;
    switch (field) {
      case 'name':
        notionProperty = { Name: { title: [{ text: { content: value } }] } };
        break;
      case 'day':
        notionProperty = { 'Month Day': { number: parseInt(value, 10) || 1 } };
        break;
      case 'amount':
        notionProperty = { 'Budget Amount': { number: parseFloat(value) || 0 } };
        break;
      case 'type':
        notionProperty = {
          Type: { select: { name: value === 'fixed' ? 'Fijo' : 'Variable' } },
        };
        break;
      default:
        return { error: 'Invalid field.' };
    }
    await updateNotionPage(id, notionProperty);
    return { success: true };
  } catch (error) {
    console.error('Failed to update scheduled payment in Notion:', error);
    return { error: 'Failed to update scheduled payment.' };
  }
}

export async function deleteScheduledPaymentAction(id: string) {
  try {
    await deletePage(id);
    return { success: true };
  } catch (error) {
    console.error('Failed to delete scheduled payment in Notion:', error);
    return { error: 'Failed to delete scheduled payment.' };
  }
}

const financialChatSchema = z.object({
  message: z.string(),
  fileDataUri: z.string().nullable(),
});

export async function chatWithBotAction(input: {
  message: string;
  fileDataUri: string | null;
}) {
  const parsedInput = financialChatSchema.safeParse(input);
  if (!parsedInput.success) {
    return { error: 'Invalid input.' };
  }

  try {
    const result = await financialChat(parsedInput.data);
    return { response: result.response };
  } catch (error) {
    console.error('Financial chat failed:', error);
    return { error: 'Failed to get a response from the AI advisor.' };
  }
}

const riskProfileSchema = z.object({
  jobStability: z.enum(['stable', 'moderate', 'unstable']),
  healthStatus: z.enum(['good', 'fair', 'poor']),
  emergencyFund: z.coerce.number().positive(),
  monthlyExpenses: z.coerce.number().positive(),
});

export async function getRiskProfileAnalysisAction(
  input: AssessRiskProfileInput
) {
  const parsed = riskProfileSchema.safeParse(input);
  if (!parsed.success) {
    return { error: 'Invalid input.', details: parsed.error.format() };
  }

  try {
    const result = await assessRiskProfile(parsed.data);
    return { data: result };
  } catch (error) {
    console.error('AI risk profile analysis failed:', error);
    return { error: 'Failed to generate risk profile analysis.' };
  }
<<<<<<< HEAD
}
=======
}
>>>>>>> e2e3579 (Perfecto. Vamos a crear otra página. Crea una página para los ajustes de)
