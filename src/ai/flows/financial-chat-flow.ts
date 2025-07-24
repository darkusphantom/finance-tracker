'use server';

/**
 * @fileOverview A financial expert chatbot AI agent.
 *
 * - financialChat - A function that handles the financial chat conversation.
 * - FinancialChatInput - The input type for the financialChat function.
 * - FinancialChatOutput - The return type for the financialChat function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const FinancialChatInputSchema = z.object({
  message: z.string().describe('The user message to the chatbot.'),
  fileDataUri: z
    .string()
    .describe(
      "An optional file (image or document) as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    )
    .nullable(),
});
export type FinancialChatInput = z.infer<typeof FinancialChatInputSchema>;

const FinancialChatOutputSchema = z.object({
  response: z
    .string()
    .describe('The chatbot response to the user message.'),
});
export type FinancialChatOutput = z.infer<typeof FinancialChatOutputSchema>;

export async function financialChat(
  input: FinancialChatInput
): Promise<FinancialChatOutput> {
  return financialChatFlow(input);
}

const prompt = ai.definePrompt({
  name: 'financialChatPrompt',
  input: { schema: FinancialChatInputSchema },
  output: { schema: FinancialChatOutputSchema },
  prompt: `You are a friendly and expert financial advisor chatbot. Your goal is to help users manage their finances, achieve their goals, and develop healthy financial habits.

You can provide recommendations, create financial plans, and develop effective strategies. You can also analyze images of receipts or financial documents provided by the user.

- If the user uploads an image or document, analyze it in the context of their message. For example, if they upload a receipt and ask "How can I reduce this expense?", analyze the receipt and provide specific advice.
- If the user asks for a financial plan, ask clarifying questions to provide a personalized and effective plan.
- Be encouraging, clear, and actionable in your responses.
- Break down complex topics into simple, understandable steps.

User message: {{{message}}}

{{#if fileDataUri}}
Attached document/image for analysis:
{{media url=fileDataUri}}
{{/if}}
`,
});

const financialChatFlow = ai.defineFlow(
  {
    name: 'financialChatFlow',
    inputSchema: FinancialChatInputSchema,
    outputSchema: FinancialChatOutputSchema,
  },
  async input => {
    const { output } = await prompt(input);
    return { response: output!.response };
  }
);
