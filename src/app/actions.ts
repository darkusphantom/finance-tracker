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
  createUser,
  getAccounts,
  getDebts,
} from '@/lib/notion';
import { transformAccountData, transformDebtData } from '@/lib/utils';
import { createSessionToken } from '@/lib/session';
import { z } from 'zod';
import { format } from 'date-fns';
import { cookies } from 'next/headers';
import bcrypt from 'bcrypt';
import { requireAuth } from '@/lib/auth';

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

    // [ALTA-2] Firmar el token con HMAC-SHA256 en lugar de almacenar el UUID crudo.
    // Cualquier alteración del token invalida la firma en el middleware.
    const sessionToken = await createSessionToken(user.id);

    (await cookies()).set('auth-token', sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 días
      path: '/',
    });
  } catch (error: unknown) {
    console.error('Login error:', error);
    return {
      error: 'An unexpected error occurred. Please try again.',
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
    // await createUser({ email, username, password: hashedPassword });
  } catch (error: unknown) {
    console.error('Register error:', error);
    return {
      error: 'An unexpected error occurred. Please try again.',
    };
  }
  return { success: true };
}

export async function logoutAction() {
  (await cookies()).delete('auth-token');
  return { success: true };
}


const suggestCategorySchema = z.object({
  description: z.string().min(1, 'Description is required.'),
  type: z.enum(['income', 'expense']),
});

export async function suggestCategoryAction(
  input: CategorizeTransactionInput
): Promise<{ category?: string; error?: string }> {
  await requireAuth();
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

const MAX_DATA_URI_BYTES = 10 * 1024 * 1024; // 10 MB
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

const extractTransactionSchema = z.object({
  photoDataUri: z
    .string()
    .min(1, 'Image data is required.')
    .max(MAX_DATA_URI_BYTES * 1.4, 'Image too large.') // base64 añade ~37%
    .refine(
      (uri) => ALLOWED_MIME_TYPES.some((type) => uri.startsWith(`data:${type};base64,`)),
      { message: 'Only JPEG, PNG, WebP or GIF images are allowed.' }
    ),
});

export async function extractTransactionAction(
  input: ExtractTransactionFromImageInput
) {
  await requireAuth();
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
  date: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: "Invalid date format",
  }),
  currency: z.string().optional(),
  exchangeRate: z.coerce.number().optional(),
  // Account to update after the transaction is recorded
  accountId: z.string().optional(),
  accountBalance: z.coerce.number().optional(),
  // Debt linking: if this payment is related to an existing debt
  debtId: z.string().optional(),
  debtPaidSoFar: z.coerce.number().optional(),
});

export async function addTransactionAction(values: unknown) {
  await requireAuth();

  const parsed = addTransactionSchema.safeParse(values);
  if (!parsed.success) {
    return { error: 'Invalid input.' };
  }

  try {
    const { description, amount, category, date, type, currency, exchangeRate, accountId, accountBalance, debtId, debtPaidSoFar } = parsed.data;

    const monthName = format(new Date(date), 'MMMM yyyy');
    const monthPageId = await findOrCreateMonthPage(
      process.env.NOTION_TOTAL_SAVINGS_DB!,
      monthName
    );

    const transactionAmount = Math.abs(amount);

    const databaseId =
      type === 'income'
        ? process.env.NOTION_INCOME_DB!
        : process.env.NOTION_TRANSACTIONS_DB!;

    const notionProperties: Record<string, any> = {
      Source: { title: [{ text: { content: description } }] },
      Amount: { number: transactionAmount },
      Tags: { select: { name: category || 'Other' } },
      Date: { date: { start: date } },
      Month: { relation: [{ id: monthPageId }] },
    };

    if (currency) {
      notionProperties['Currency'] = { select: { name: currency } };
    }
    if (exchangeRate !== undefined && exchangeRate !== null) {
      notionProperties['Exchange Rate Used'] = { number: exchangeRate };
    }

    await addPageToDb(databaseId, notionProperties);

    // Update account balance if an account was selected
    if (accountId && accountBalance !== undefined) {
      const newBalance =
        type === 'income'
          ? accountBalance + transactionAmount
          : accountBalance - transactionAmount;
      await updatePage(accountId, {
        'Balance Amount': { number: newBalance },
        'Last Transaction Date': { date: { start: date } },
      });
    }

    // Update debt's Amount Paid if this transaction is linked to a debt
    if (debtId && debtPaidSoFar !== undefined) {
      const newAmountPaid = debtPaidSoFar + transactionAmount;
      await updatePage(debtId, {
        'Amount Paid': { number: newAmountPaid },
      });
    }

    return { success: true };
  } catch (error) {
    console.error('Failed to add transaction to Notion:', error);
    return { error: 'Failed to save transaction.' };
  }
}

const addTransferSchema = z.object({
  description: z.string().min(2),
  type: z.enum(['Transferencia', 'Cambio Divisa']),
  date: z.string(),
  fromAccountId: z.string(),
  toAccountId: z.string(),
  sentAmount: z.coerce.number(),
  receivedAmount: z.coerce.number(),
  rateSource: z.string().optional(),
  referenceRate: z.coerce.number().optional(),
  baseRate: z.coerce.number().optional(),
  fxLoss: z.coerce.number().optional(),
  fromAccountBalance: z.coerce.number().optional(),
  toAccountBalance: z.coerce.number().optional(),
  toAccountCurrency: z.string().optional(),
  officialRate: z.coerce.number().optional(),
});

export async function addTransferAction(values: unknown) {
  await requireAuth();

  const parsed = addTransferSchema.safeParse(values);
  if (!parsed.success) {
    return { error: 'Invalid input.' };
  }

  try {
    const {
      description, type, date, fromAccountId, toAccountId,
      sentAmount, receivedAmount, rateSource, referenceRate, fxLoss, fromAccountBalance, toAccountBalance,
      toAccountCurrency, officialRate
    } = parsed.data;

    const monthName = format(new Date(date), 'MMMM yyyy');
    const monthPageId = await findOrCreateMonthPage(
      process.env.NOTION_TOTAL_SAVINGS_DB!,
      monthName
    );

    // Using the Transfer & FX DB ID provided by the user if the env variable isn't set yet.
    const databaseId = process.env.NOTION_TRANSFER_DB || '2d6408ab-be2a-8149-ba7d-ef417c499d92';

    const notionProperties: Record<string, any> = {
      Description: { title: [{ text: { content: description } }] },
      Type: { select: { name: type } },
      Date: { date: { start: date } },
      'From Account': { relation: [{ id: fromAccountId }] },
      'To Account': { relation: [{ id: toAccountId }] },
      'Sent Amount': { number: sentAmount },
      'Received Amount': { number: receivedAmount },
      Month: { relation: [{ id: monthPageId }] },
    };

    if (type === 'Cambio Divisa') {
      if (rateSource) notionProperties['Rate Source'] = { select: { name: rateSource } };
      if (referenceRate !== undefined) notionProperties['Reference Rate'] = { number: referenceRate };
    }

    await addPageToDb(databaseId, notionProperties);

    // Update From Account balance (Subtract sentAmount)
    if (fromAccountBalance !== undefined) {
      await updatePage(fromAccountId, {
        'Balance Amount': { number: fromAccountBalance - sentAmount },
        'Last Transaction Date': { date: { start: date } },
      });
    }

    // Update To Account balance (Add receivedAmount)
    if (toAccountBalance !== undefined) {
      await updatePage(toAccountId, {
        'Balance Amount': { number: toAccountBalance + receivedAmount },
        'Last Transaction Date': { date: { start: date } },
      });
    }

    // Materialize FX Loss as an Expense
    if (fxLoss && fxLoss > 0) {
      const expenseDbId = process.env.NOTION_TRANSACTIONS_DB!;
      const expenseProps: Record<string, any> = {
        Source: { title: [{ text: { content: `Pérdida Cambiaria: ${description}` } }] },
        Amount: { number: fxLoss },
        Tags: { select: { name: 'Deposit on Binance' } },
        Date: { date: { start: date } },
        Month: { relation: [{ id: monthPageId }] },
      };

      if (toAccountCurrency) {
        expenseProps['Currency'] = { select: { name: toAccountCurrency } };
      }
      if (officialRate) {
        expenseProps['Exchange Rate Used'] = { number: officialRate };
      }

      await addPageToDb(expenseDbId, expenseProps);
    }

    return { success: true };
  } catch (error) {
    console.error('Failed to add transfer to Notion:', error);
    return { error: 'Failed to save transfer.' };
  }
}


export async function getActiveAccountsAction() {
  await requireAuth();
  try {
    const rawAccounts = await getAccounts(process.env.NOTION_ACCOUNTS_DB!);
    const accounts = transformAccountData(rawAccounts);
    return { accounts: accounts.filter((a: any) => a.isActive) };
  } catch (error) {
    console.error('Failed to fetch active accounts:', error);
    return { accounts: [] };
  }
}

export async function getPendingDebtsAction() {
  await requireAuth();
  try {
    const rawDebts = await getDebts(process.env.NOTION_DEBTS_DB!);
    const debts = transformDebtData(rawDebts);
    // Only return pending debts of type "Debt" (i.e., money I owe)
    return {
      debts: debts.filter(
        (d: any) => d.type === 'Debt' && d.status !== 'Pagado' && d.status !== 'Paid'
      ),
    };
  } catch (error) {
    console.error('Failed to fetch pending debts:', error);
    return { debts: [] };
  }
}

const updateTransactionSchema = z.object({
  id: z.string(),
  field: z.string(),
  value: z.union([z.string().max(2000), z.number().safe(), z.boolean(), z.null(), z.undefined()]),
});

export async function updateTransactionAction(values: unknown) {
  await requireAuth();
  const parsed = updateTransactionSchema.safeParse(values);
  if (!parsed.success) {
    console.log(parsed.error);
    return { error: 'Invalid input.' };
  }

  try {
    const { id, field } = parsed.data;
    const value = parsed.data.value as string;
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
      case 'currency':
        notionProperty = { Currency: { select: { name: value } } };
        break;
      case 'exchangeRate':
        notionProperty = { 'Exchange Rate Used': { number: parseFloat(value) || 0 } };
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
  await requireAuth();
  try {
    await deletePage(id);
    return { success: true };
  } catch (error) {
    console.error('Failed to delete transaction in Notion:', error);
    return { error: 'Failed to delete transaction.' };
  }
}

export async function addAccountAction() {
  await requireAuth();
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

const updateAccountSchema = z.object({
  id: z.string(),
  field: z.string(),
  value: z.union([z.string().max(2000), z.number().safe(), z.boolean(), z.null(), z.undefined()]),
});

export async function updateAccountAction(values: unknown) {
  await requireAuth();
  const parsed = updateAccountSchema.safeParse(values);
  if (!parsed.success) {
    return { error: 'Invalid input.' };
  }

  try {
    const { id, field } = parsed.data;
    const value = parsed.data.value as string;
    let notionProperty;
    switch (field) {
      case 'name':
        notionProperty = { Name: { title: [{ text: { content: value } }] } };
        break;
      case 'type':
        notionProperty = { 'Account Type': { select: { name: value } } };
        break;
      case 'currency':
        notionProperty = { Currency: { select: { name: value } } };
        break;
      case 'balance':
        notionProperty = { 'Balance Amount': { number: parseFloat(value) || 0 } };
        break;
      case 'isActive':
        notionProperty = { 'Is Active': { checkbox: value } };
        break;
      case 'accountNumber':
        notionProperty = { 'Account Number': { rich_text: [{ text: { content: value } }] } };
        break;
      default:
        return { error: 'Invalid field.' };
    }
    await updatePage(id, notionProperty);
    return { success: true };
  } catch (error) {
    console.error('Failed to update account in Notion:', error);
    return { error: 'Failed to update account.' };
  }
}

export async function deleteAccountAction(id: string) {
  await requireAuth();
  try {
    await deletePage(id);
    return { success: true };
  } catch (error) {
    console.error('Failed to delete account in Notion:', error);
    return { error: 'Failed to delete account.' };
  }
}

export async function addDebtAction() {
  await requireAuth();
  try {
    const notionProperties = {
      Title: { title: [{ text: { content: 'New Debt' } }] },
      Type: { select: { name: 'Deuda' } },
      'Debt Amount': { number: 0 },
      'Amount Paid': { number: 0 },
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
  value: z.union([z.string().max(2000), z.number().safe(), z.boolean(), z.null(), z.undefined()]),
});

export async function updateDebtAction(values: unknown) {
  await requireAuth();
  const parsed = updateDebtSchema.safeParse(values);
  if (!parsed.success) {
    return { error: 'Invalid input.' };
  }

  try {
    const { id, field } = parsed.data;
    const value = parsed.data.value as string;
    let notionProperty;
    switch (field) {
      case 'name':
        notionProperty = { Title: { title: [{ text: { content: value } }] } };
        break;
      case 'total':
        notionProperty = { 'Debt Amount': { number: parseFloat(value) || 0 } };
        break;
      case 'paid':
        notionProperty = { 'Amount Paid': { number: parseFloat(value) || 0 } };
        break;
      case 'status':
        notionProperty = { Status: { select: { name: value } } };
        break;
      case 'reason':
        notionProperty = { Reason: { rich_text: [{ text: { content: value } }] } };
        break;
      case 'date':
        notionProperty = { Date: { date: value ? { start: value } : null } };
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
  isActive: z.boolean().optional().default(true),
});

export async function addScheduledPaymentAction(
  values: z.infer<typeof scheduledPaymentSchema>
) {
  await requireAuth();
  const parsed = scheduledPaymentSchema.safeParse(values);
  if (!parsed.success) {
    return { error: 'Invalid input.', details: parsed.error.format() };
  }

  try {
    const { name, day, amount, type, category, isActive } = parsed.data;
    const notionProperties = {
      Name: { title: [{ text: { content: name } }] },
      'Month Day': { number: day },
      'Budget Amount': { number: amount },
      Type: { select: { name: type === 'fixed' ? 'Fijo' : 'Variable' } },
      Category: { select: { name: category === 'income' ? 'Ingreso' : 'Pago' } },
      IsActive: { checkbox: isActive },
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
  value: z.union([z.string().max(2000), z.number().safe(), z.boolean(), z.null(), z.undefined()]),
});

export async function updateScheduledPaymentAction(values: unknown) {
  await requireAuth();
  const parsed = updateScheduledPaymentSchema.safeParse(values);
  if (!parsed.success) {
    return { error: 'Invalid input.' };
  }

  try {
    const { id, field } = parsed.data;
    const value = parsed.data.value as any;
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
      case 'isActive':
        notionProperty = { IsActive: { checkbox: value === true || value === 'true' } };
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
  await requireAuth();
  try {
    await deletePage(id);
    return { success: true };
  } catch (error) {
    console.error('Failed to delete scheduled payment in Notion:', error);
    return { error: 'Failed to delete scheduled payment.' };
  }
}

const financialChatSchema = z.object({
  message: z.string().max(2000, 'Message too long.'),
  fileDataUri: z.string().nullable(),
});

export async function chatWithBotAction(input: {
  message: string;
  fileDataUri: string | null;
}) {
  await requireAuth();
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
  await requireAuth();
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

export async function addWishlistItemAction() {
  await requireAuth();
  try {
    const notionProperties = {
      Name: { title: [{ text: { content: 'Nuevo Item' } }] },
      Price: { number: 0 },
      'Is Purchased': { checkbox: false },
      Discard: { checkbox: false },
    };
    const newPage = await addPageToDb(
      process.env.NOTION_WISHLIST_DB!,
      notionProperties
    );
    return { success: true, newPageId: newPage.id };
  } catch (error) {
    console.error('Failed to add wishlist item to Notion:', error);
    return { error: 'Failed to save wishlist item.' };
  }
}

const updateWishlistItemSchema = z.object({
  id: z.string(),
  field: z.string(),
  value: z.union([z.string().url().startsWith('https://'), z.number().safe(), z.boolean()]),
});

export async function updateWishlistItemAction(values: unknown) {
  await requireAuth();
  const parsed = updateWishlistItemSchema.safeParse(values);
  if (!parsed.success) {
    return { error: 'Invalid input.' };
  }

  try {
    const { id, field } = parsed.data;
    const value = parsed.data.value as any;
    let notionProperty;
    switch (field) {
      case 'name':
        notionProperty = { Name: { title: [{ text: { content: value } }] } };
        break;
      case 'price':
        notionProperty = { Price: { number: parseFloat(value) || 0 } };
        break;
      case 'priorityLevel':
        notionProperty = { 'Priority Level': { select: { name: value } } };
        break;
      case 'storeLocation':
        notionProperty = { 'Store Location': { rich_text: [{ text: { content: value } }] } };
        break;
      case 'itemCategory':
        notionProperty = { 'Item Category': { select: { name: value } } };
        break;
      case 'purchaseDate':
        notionProperty = { 'Purchase Date': { date: value ? { start: value } : null } };
        break;
      case 'isPurchased':
        notionProperty = { 'Is Purchased': { checkbox: value === true || value === 'true' } };
        break;
      case 'supplierContact':
        notionProperty = { 'Supplier Contact': { rich_text: [{ text: { content: value } }] } };
        break;
      case 'discard':
        notionProperty = { Discard: { checkbox: value === true || value === 'true' } };
        break;
      case 'itemImage':
        notionProperty = {
          'Item Image': {
            files: value
              ? [
                {
                  name: 'Wishlist Image',
                  type: 'external',
                  external: {
                    url: value,
                  },
                },
              ]
              : [],
          },
        };
        break;
      default:
        return { error: 'Invalid field.' };
    }
    await updatePage(id, notionProperty);
    return { success: true };
  } catch (error) {
    console.error('Failed to update wishlist item in Notion:', error);
    return { error: 'Failed to update wishlist item.' };
  }
}