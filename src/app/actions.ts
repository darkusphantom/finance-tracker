'use server';

import {
  categorizeTransaction,
  type CategorizeTransactionInput,
} from '@/ai/flows/categorize-transaction';
import { z } from 'zod';

const inputSchema = z.object({
  description: z.string().min(1, 'Description is required.'),
});

export async function suggestCategoryAction(
  input: CategorizeTransactionInput
): Promise<{ category?: string; error?: string }> {
  const parsedInput = inputSchema.safeParse(input);
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
