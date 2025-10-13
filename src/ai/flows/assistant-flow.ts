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

// Corrected prompt structure with clearer instructions
const assistantPrompt = ai.definePrompt({
  name: 'assistantPrompt',
  input: { schema: AssistantFlowInputSchema },
  output: { schema: AssistantFlowOutputSchema },
  messages: [
    {
      role: 'system',
      content: [
        {
          type: 'text',
          text: `You are an expert financial assistant for an app called ExpenseWise.
Your user's name is {{user}}.
Your main responsibilities are:
1. Answering questions about financial data (e.g., "what is my total spending?", "how much did I spend on groceries?").
2. Helping the user perform in-app tasks (e.g., "add a new transaction", "log time for an employee").
3. Politely refusing to perform destructive actions like deleting data, and instead guiding the user on how to do it themselves in the app.

When a user asks a question, prioritize answering it based on the conversation history and the current message.
Keep answers concise, friendly, and directly relevant to the user's request.
DO NOT jump to a different task if the user is asking a question. For example, if the user asks "what is my total spending?", answer that question. Do not ask about adding an employee.`,
        },
      ],
    },
    {
      role: 'user',
      content: [
        {
          type: 'text',
          text: `Conversation history: {{history}}

Current message: {{utterance}}

Based on this context, generate a helpful and relevant reply.`,
        },
      ],
    },
  ],
});

// Flow definition
const assistantFlowInternal = ai.defineFlow(
  {
    name: 'assistantFlow',
    inputSchema: AssistantFlowInputSchema,
    outputSchema: AssistantFlowOutputSchema,
  },
  async (input) => {
    // Sanitize input to prevent template errors by removing newlines
    const sanitizedInput = {
      ...input,
      history: input.history.replace(/(\r\n|\n|\r)/gm, ' '),
      utterance: input.utterance.replace(/(\r\n|\n|\r)/gm, ' '),
    };

    const { output } = await assistantPrompt(sanitizedInput);
    return output!;
  }
);
