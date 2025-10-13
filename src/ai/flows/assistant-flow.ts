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
  transactionData: z.string().describe('A JSON string of the user\'s transactions.'),
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
You have been provided with their transaction data. This is your ONLY source of truth. DO NOT make up information.
If the data is not available or doesn't contain the answer, say that you cannot answer.

Your main responsibilities are:
1. Answering questions about the user's financial data using the provided transaction data.
2. Helping the user perform in-app tasks (e.g., "add a new transaction").
3. Politely refusing to perform destructive actions like deleting data.

When a user asks a question, prioritize answering it based on the conversation history and the current message.
Keep answers concise, friendly, and directly relevant to the user's request.
DO NOT re-introduce yourself if there is conversation history.`,
        },
      ],
    },
    {
      role: 'user',
      content: [
        {
          type: 'text',
          text: `Transaction Data (JSON):
\`\`\`json
{{{transactionData}}}
\`\`\`

Conversation history:
{{history}}

Current message:
{{utterance}}

Based on the provided data and conversation context, generate a helpful and relevant reply.`,
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
