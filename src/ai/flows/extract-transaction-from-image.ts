'use server';
/**
 * @fileOverview An AI agent for extracting transaction details from images.
 *
 * - extractTransactionFromImage - A function that extracts transaction details from an image.
 * - ExtractTransactionFromImageInput - The input type for the extractTransactionFromImage function.
 * - ExtractTransactionFromImageOutput - The return type for the extractTransactionFromImage function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ExtractTransactionFromImageInputSchema = z.object({
  photoDataUri: z
    .string()
    .describe(
      "A photo of a receipt or payment screenshot, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type ExtractTransactionFromImageInput = z.infer<typeof ExtractTransactionFromImageInputSchema>;

const ExtractTransactionFromImageOutputSchema = z.object({
    description: z.string().describe('A concise summary of the transaction. If there are multiple items, summarize them (e.g., "Groceries from Store"). If one item, use its name.'),
    amount: z.number().describe('The total amount of the transaction. It should always be a positive number.'),
    type: z.enum(['income', 'expense']).describe('The type of transaction.'),
});
export type ExtractTransactionFromImageOutput = z.infer<typeof ExtractTransactionFromImageOutputSchema>;

export async function extractTransactionFromImage(input: ExtractTransactionFromImageInput): Promise<ExtractTransactionFromImageOutput> {
  return extractTransactionFromImageFlow(input);
}

const prompt = ai.definePrompt({
  name: 'extractTransactionFromImagePrompt',
  input: {schema: ExtractTransactionFromImageInputSchema},
  output: {schema: ExtractTransactionFromImageOutputSchema},
  prompt: `You are a financial assistant. Analyze the provided image, which could be a receipt or a payment screenshot (like PayPal, bank transfer, etc.). Extract the transaction details.

- If it's a receipt with multiple items, provide a general description like "Groceries at [Store Name]" or "Shopping at [Store Name]".
- If it's a single item, use the item's name as the description.
- For payment screenshots, summarize the transaction, for example, "Payment to John Doe" or "Online purchase".
- Determine if it's an 'income' or 'expense'. Payments made are typically 'expense', while payments received are 'income'.
- Extract the final total amount. The amount should always be positive.

Here is the image:
{{media url=photoDataUri}}`,
});

const extractTransactionFromImageFlow = ai.defineFlow(
  {
    name: 'extractTransactionFromImageFlow',
    inputSchema: ExtractTransactionFromImageInputSchema,
    outputSchema: ExtractTransactionFromImageOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
