'use server';
/**
 * @fileOverview Main AI assistant flow for ExpenseWise app.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';

// Input schema
const AssistantFlowInputSchema = z.object({
  utterance: z.string().describe("The user's most recent message."),
  history: z.string().describe("The entire conversation history, for context."),
  user: z.string().describe("The name of the current user."),
});
export type AssistantFlowInput = z.infer<typeof AssistantFlowInputSchema>;

// Output schema
const AssistantFlowOutputSchema = z.object({
  answer: z.string().describe("The assistant's response to the user."),
});
export type AssistantFlowOutput = z.infer<typeof AssistantFlowOutputSchema>;

// Exported callable wrapper
export async function assistantFlow(input: AssistantFlowInput): Promise<AssistantFlowOutput> {
  return assistantFlowInternal(input);
}

const assistantPrompt = ai.definePrompt({
  name: 'assistantPrompt',
  input: { schema: AssistantFlowInputSchema },
  output: { schema: AssistantFlowOutputSchema },
  messages: [
    {
      role: 'system',
      content: `You are an expert financial assistant for an app called ExpenseWise.
Your user's name is {{user}}.
Your main responsibilities are:
1. Answering questions about financial data.
2. Helping the user perform in-app tasks like adding transactions or employees.
3. Politely refusing delete operations but guiding users to the correct page instead.

Keep answers concise and friendly.`,
    },
    {
      role: 'user',
      content: [
        { text: 'Conversation history: {{history}}' },
        { text: 'Current message: {{utterance}}' },
        { text: 'Based on this context, generate a helpful and relevant reply.' },
      ],
    },
  ],
});

// Main flow definition
const assistantFlowInternal = ai.defineFlow(
  {
    name: 'assistantFlow',
    inputSchema: AssistantFlowInputSchema,
    outputSchema: AssistantFlowOutputSchema,
  },
  async (input) => {
    // Sanitize input to prevent template errors
    const sanitizedInput = {
      ...input,
      history: input.history.replace(/(\r\n|\n|\r)/gm, ' '),
      utterance: input.utterance.replace(/(\r\n|\n|\r)/gm, ' '),
    };

    const { output } = await assistantPrompt(sanitizedInput);
    return output!;
  }
);
