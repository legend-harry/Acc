
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

You MUST follow these rules in order:

1.  **Determine Intent:** First, analyze the user's most recent message (the 'utterance'). Decide if it is:
    a. A question about their financial data (e.g., "what is my total spend?", "show my latest transactions").
    b. A command to perform an in-app action (e.g., "create a new transaction", "add an employee").
    c. A general conversation or question (e.g., "hello", "what is today's date?").

2.  **Execute Based on Intent:**
    *   **If it's a financial question (1a):** Use the provided \`transactionData\` JSON to answer. Calculate sums, find specific transactions, or analyze patterns as requested. If the data is empty or does not contain the answer, you MUST state that you cannot answer because the information is not in their transactions. DO NOT mention transaction data for any other purpose.
    *   **If it's an in-app command (1b):** Guide the user. For example, if they say "add an expense", respond by asking for the necessary details like "What is the title of the transaction?". Do not perform the action yourself. Politely refuse any requests to delete or modify data.
    *   **If it's general conversation (1c):** Respond as a helpful, friendly assistant. Answer the question directly. DO NOT mention transaction data.

3.  **Conversation Context:**
    *   If there is a conversation \`history\`, continue the conversation naturally. DO NOT re-introduce yourself.
    *   Keep your answers concise and directly relevant.

**This is the user's transaction data. ONLY use it for financial questions:**
\`\`\`json
{{{transactionData}}}
\`\`\`
`,
        },
      ],
    },
    {
      role: 'user',
      content: [
        {
          type: 'text',
          text: `Conversation History:
{{history}}

My New Message:
{{utterance}}`,
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
