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
  addTransaction,
  deleteTransaction,
  updateTransaction,
  findOrCreateMonthPage,
} from '@/lib/notion';
import { z } from 'zod';
import { format } from 'date-fns';

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

    const monthName = format(date, 'MMMM yyyy');
    const monthPageId = await findOrCreateMonthPage(
      process.env.NOTION_TOTAL_SAVINGS_DB!,
      monthName
    );

    const transactionAmount =
      type === 'expense' ? -Math.abs(amount) : Math.abs(amount);

    await addTransaction(process.env.NOTION_TRANSACTIONS_DB!, {
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

    await updateTransaction(id, notionProperty);
    return { success: true };
  } catch (error) {
    console.error('Failed to update transaction in Notion:', error);
    return { error: 'Failed to update transaction.' };
  }
}

export async function deleteTransactionAction(id: string) {
  try {
    await deleteTransaction(id);
    return { success: true };
  } catch (error) {
    console.error('Failed to delete transaction in Notion:', error);
    return { error: 'Failed to delete transaction.' };
  }
}
