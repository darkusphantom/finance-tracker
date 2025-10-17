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

const TransactionItemSchema = z.object({
    description: z.string().describe('A concise summary of the transaction. If there are multiple items, use the specific item name.'),
    amount: z.number().describe('The total amount of the transaction item. It should always be a positive number.'),
    type: z.enum(['income', 'expense']).describe('The type of transaction.'),
});

const ExtractTransactionFromImageOutputSchema = z.object({
  transactions: z.array(TransactionItemSchema).describe('A list of one or more transactions found in the image.')
});

export type ExtractTransactionFromImageOutput = z.infer<typeof ExtractTransactionFromImageOutputSchema>;

export async function extractTransactionFromImage(input: ExtractTransactionFromImageInput): Promise<ExtractTransactionFromImageOutput> {
  return extractTransactionFromImageFlow(input);
}

const prompt = ai.definePrompt({
  name: 'extractTransactionFromImagePrompt',
  input: {schema: ExtractTransactionFromImageInputSchema},
  output: {schema: ExtractTransactionFromImageOutputSchema},
  prompt: `You are a financial assistant. Analyze the provided image, which could be a receipt or a payment screenshot (like PayPal, bank transfer, etc.). Extract all individual transaction items.

- If it's a receipt with multiple items, create a separate transaction object for EACH item. Use the item's name as the description.
- If it's a single item purchase or a payment screenshot, create a single transaction object. Summarize the transaction, for example, "Payment to John Doe" or "Online purchase".
- Determine if it's 'income' or 'expense' for each item. Payments made are 'expense', payments received are 'income'.
- Extract the amount for each item. The amount should always be positive.
- If you find a total amount that seems to be the sum of other items, do not include the total as a separate transaction. Only extract the individual line items.

Return the result as a list of transaction objects.

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
