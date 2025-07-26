'use server';

/**
 * @fileOverview An AI agent for assessing a user's financial risk profile.
 *
 * - assessRiskProfile - A function that analyzes user inputs to generate a risk profile.
 * - AssessRiskProfileInput - The input type for the assessRiskProfile function.
 * - AssessRiskProfileOutput - The return type for the assessRiskProfile function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const AssessRiskProfileInputSchema = z.object({
  jobStability: z.enum(['stable', 'moderate', 'unstable']),
  healthStatus: z.enum(['good', 'fair', 'poor']),
  emergencyFund: z.coerce.number().positive(),
  monthlyExpenses: z.coerce.number().positive(),
});
export type AssessRiskProfileInput = z.infer<
  typeof AssessRiskProfileInputSchema
>;

const AssessRiskProfileOutputSchema = z.object({
  riskScore: z
    .number()
    .min(0)
    .max(100)
    .describe(
      'A numerical score from 0 (very low risk) to 100 (very high risk).'
    ),
  riskLevel: z
    .enum(['Low', 'Moderate', 'High'])
    .describe('The calculated risk level category.'),
  summary: z.string().describe('A concise summary of the risk profile.'),
  emergencyFund: z.object({
    currentMonths: z
      .number()
      .describe('How many months the current emergency fund covers.'),
    recommendedMonths: z
      .number()
      .describe(
        'How many months of expenses are recommended for the emergency fund based on the risk profile.'
      ),
    recommendation: z
      .string()
      .describe(
        'A detailed recommendation for the emergency fund, explaining the reasoning.'
      ),
  }),
});
export type AssessRiskProfileOutput = z.infer<
  typeof AssessRiskProfileOutputSchema
>;

export async function assessRiskProfile(
  input: AssessRiskProfileInput
): Promise<AssessRiskProfileOutput> {
  return await riskProfileFlow(input);
}

const prompt = ai.definePrompt({
  name: 'riskProfilePrompt',
  input: { schema: AssessRiskProfileInputSchema },
  output: { schema: AssessRiskProfileOutputSchema },
  prompt: `You are a financial risk assessment expert. Analyze the user's financial situation to create a risk profile.

User's situation:
- Job Stability: {{{jobStability}}}
- Health Status: {{{healthStatus}}}
- Current Emergency Fund: {{{emergencyFund}}}
- Monthly Expenses: {{{monthlyExpenses}}}

Based on this, perform the following tasks:

1.  **Calculate a Risk Score (0-100):**
    -   'stable' job / 'good' health = Low risk (e.g., 0-30 score).
    -   'moderate' job / 'fair' health = Medium risk (e.g., 31-60 score).
    -   'unstable' job / 'poor' health = High risk (e.g., 61-100 score).
    -   A low emergency fund (relative to expenses) should significantly increase the score. An emergency fund covering less than 3 months of expenses should push the score towards high risk. A fund covering more than 6 months indicates lower risk.

2.  **Determine Risk Level:** Categorize the score into 'Low', 'Moderate', or 'High'.

3.  **Write a Summary:** Provide a brief, clear summary explaining why the user is at that risk level.

4.  **Analyze Emergency Fund:**
    -   Calculate how many months the current fund covers (fund / monthly expenses).
    -   Recommend an ideal number of months for their emergency fund based on their risk level (Low risk: 3-6 months, Moderate risk: 6-9 months, High risk: 9-12 months).
    -   Provide a clear recommendation, explaining why the recommended amount is appropriate for their situation.`,
});

const riskProfileFlow = ai.defineFlow(
  {
    name: 'riskProfileFlow',
    inputSchema: AssessRiskProfileInputSchema,
    outputSchema: AssessRiskProfileOutputSchema,
  },
  async input => {
    const { output } = await prompt(input);
    return output!;
  }
);
