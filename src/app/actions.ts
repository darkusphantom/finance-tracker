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
  updatePage,
  findOrCreateMonthPage,
  findUserByUsernameOrEmail,
  createUser
} from '@/lib/notion';
import { z } from 'zod';
import { format } from 'date-fns';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import bcrypt from 'bcrypt';

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

  try {
    const user = await findUserByUsernameOrEmail(loginIdentifier);

    if (!user) {
      return { error: 'Invalid credentials.' };
    }

    const passwordMatch = await bcrypt.compare(password, user.password);

    if (!passwordMatch) {
      return { error: 'Invalid credentials.' };
    }

    cookies().set('auth-token', user.id, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24 * 7, // One week
      path: '/',
    });
  } catch (error: any) {
    return {
      error: error.message || 'An unexpected error occurred during login.',
    };
  }

  return { success: true };
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

    const hashedPassword = await bcrypt.hash(password, 10);
    await createUser({ email, username, password: hashedPassword });
  } catch (error: any) {
    return {
      error:
        error.message || 'An unexpected error occurred during registration.',
    };
  }
  return { success: true };
}

export async function logoutAction() {
    cookies().delete('auth-token');
    redirect('/login');
}


const suggestCategorySchema = z.object({
  description: z.string().min(1, 'Description is required.'),
  type: z.enum(['income', 'expense']),
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
    return { data: result.transactions };
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

    const monthName = format(date, 'MMMM yyyy');
    const monthPageId = await findOrCreateMonthPage(
      process.env.NOTION_TOTAL_SAVINGS_DB!,
      monthName
    );

    const transactionAmount = Math.abs(amount);

    const databaseId =
      type === 'income'
        ? process.env.NOTION_INCOME_DB!
        : process.env.NOTION_TRANSACTIONS_DB!;

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

    await updatePage(id, notionProperty);
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
    const notionProperties = {
      Name: { title: [{ text: { content: 'New Account' } }] },
      'Account Type': { select: { name: 'Corriente' } },
      'Balance Amount': { number: 0 },
      'Is Active': { checkbox: true },
    };
    const newPage = await addPageToDb(
      process.env.NOTION_ACCOUNTS_DB!,
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
    const notionProperties = {
      Title: { title: [{ text: { content: 'New Debt' } }] },
      Type: { select: { name: 'Deuda' } },
      'Debt Amount': { number: 0 },
      Status: { select: { name: 'Pendiente' } },
    };
    const newPage = await addPageToDb(
      process.env.NOTION_DEBTS_DB!,
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
    await updatePage(id, notionProperty);
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
    const { name, day, amount, type, category } = parsed.data;
    const notionProperties = {
      Name: { title: [{ text: { content: name } }] },
      'Month Day': { number: day },
      'Budget Amount': { number: amount },
      Type: { select: { name: type === 'fixed' ? 'Fijo' : 'Variable' } },
      Category: { select: { name: category === 'income' ? 'Ingreso' : 'Pago' } },
    };
    const newPage = await addPageToDb(
      process.env.NOTION_BUDGET_DB!,
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
    await updatePage(id, notionProperty);
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
}
