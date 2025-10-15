'use server';

/**
 * @fileOverview A transaction categorization AI agent.
 *
 * - categorizeTransaction - A function that suggests transaction categories based on the description and type.
 * - CategorizeTransactionInput - The input type for the categorizeTransaction function.
 * - CategorizeTransactionOutput - The return type for the categorizeTransaction function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const CategorizeTransactionInputSchema = z.object({
  description: z.string().describe('The description of the transaction.'),
  type: z.enum(['income', 'expense']).describe('The type of transaction.'),
});
export type CategorizeTransactionInput = z.infer<
  typeof CategorizeTransactionInputSchema
>;

const CategorizeTransactionOutputSchema = z.object({
  category: z.string().describe('The suggested category for the transaction.'),
});
export type CategorizeTransactionOutput = z.infer<
  typeof CategorizeTransactionOutputSchema
>;

export async function categorizeTransaction(
  input: CategorizeTransactionInput
): Promise<CategorizeTransactionOutput> {
  return categorizeTransactionFlow(input);
}

const incomeCategories = "'Salary', 'Bonus', 'Freelance', 'Dividends', 'Interest', 'Side Hustle', 'Loan'";
const expenseCategories = "'Rent/Mortgage', 'Food & Drink (Groceries)', 'Dining Out', 'Health', 'Personal Care', 'Medicine', 'Transportation', 'Retail', 'Clothes', 'Entertainment', 'Environment Work', 'Technology', 'Education', 'Utilities', 'Insurance', 'Other', 'Debt Payment', 'Prestamo', 'Gift', 'Others'";


const prompt = ai.definePrompt({
  name: 'categorizeTransactionPrompt',
  input: {schema: CategorizeTransactionInputSchema},
  output: {schema: CategorizeTransactionOutputSchema},
  prompt: `You are a personal finance expert. Based on the transaction description and type provided, suggest a category for the transaction.

Description: {{{description}}}
Transaction Type: {{{type}}}

{{#if (eq type 'income')}}
Choose ONLY one of the following income categories: ${incomeCategories}.
{{else}}
Choose ONLY one of the following expense categories: ${expenseCategories}.
{{/if}}

You are not allowed to create a new category, only select one from the list provided for the given transaction type.

Category:`,
});

const categorizeTransactionFlow = ai.defineFlow(
  {
    name: 'categorizeTransactionFlow',
    inputSchema: CategorizeTransactionInputSchema,
    outputSchema: CategorizeTransactionOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
