'use server';

import {
  categorizeTransaction,
  type CategorizeTransactionInput,
} from '@/ai/flows/categorize-transaction';
import { extractTransactionFromImage, type ExtractTransactionFromImageInput } from '@/ai/flows/extract-transaction-from-image';
import { z } from 'zod';

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

export async function extractTransactionAction(input: ExtractTransactionFromImageInput) {
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
