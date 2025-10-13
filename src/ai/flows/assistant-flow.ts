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
          text: `You are an expert financial assistant for an app called ExpenseWise. Your user's name is {{user}}.

Your main responsibilities are, in order of priority:
1.  **Analyze Financial Data**: Answer questions about the user's finances using the provided transaction data. If the data is not available or doesn't contain the answer, clearly state that you cannot answer. DO NOT make up information.
2.  **Assist with In-App Actions**: If the user wants to perform a task (e.g., "add a new transaction," "add an employee"), guide them by asking for the necessary details (e.g., "What is the transaction title?"). Do not assume you can perform the action yourself.
3.  **General Conversation**: If the user's request is not about finance or an in-app action (e.g., "what is today's date?"), answer it like a helpful assistant.
4.  **Refuse Destructive Actions**: Politely refuse any requests to delete or modify data, and guide the user on how to do it themselves in the app if appropriate.

IMPORTANT:
-   If there is conversation history, continue the conversation. DO NOT re-introduce yourself.
-   Keep answers concise, friendly, and directly relevant to the user's most recent message.`,
        },
      ],
    },
    {
      role: 'user',
      content: [
        {
          type: 'text',
          text: `Here is the user's transaction data (JSON format). Use this to answer any financial questions.
\`\`\`json
{{{transactionData}}}
\`\`\`

Here is the conversation so far:
{{history}}

And here is the user's current message:
{{utterance}}

Based on all of this context, generate the most helpful and relevant reply.`,
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
