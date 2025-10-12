
'use server';
/**
 * @fileOverview This file defines a Genkit flow for conversationally extracting transaction details.
 *
 * The flow takes the current state of a transaction and the latest user utterance,
 * then uses an LLM to extract information, update the state, and determine the next question to ask.
 * It exports:
 *   - extractTransactionDetails: The main function to invoke the flow.
 *   - ExtractTransactionDetailsInput: The input type for the flow.
 *   - ExtractTransactionDetailsOutput: The output type for the flow.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const TransactionStateSchema = z.object({
  project: z.string().optional().describe('The project associated with the transaction.'),
  type: z.enum(['expense', 'income']).optional().describe('The type of transaction.'),
  category: z.string().optional().describe('The category of the expense.'),
  status: z.enum(['completed', 'credit', 'expected']).optional().describe('The status of the transaction.'),
  date: z.string().optional().describe('The date of the transaction in YYYY-MM-DD format.'),
  title: z.string().optional().describe('A brief title for the transaction.'),
  amount: z.number().optional().describe('The monetary value of the transaction.'),
  vendor: z.string().optional().describe('The vendor or person paid to/received from.'),
  description: z.string().optional().describe('A longer description of the transaction.'),
});

const ExtractTransactionDetailsInputSchema = z.object({
  currentState: TransactionStateSchema.describe("The current, partially filled details of the transaction."),
  availableProjects: z.array(z.string()).describe("A list of available projects the user can assign this to."),
  availableCategories: z.array(z.string()).describe("A list of available expense categories."),
  utterance: z.string().describe("The latest user's spoken response."),
  conversationHistory: z.array(z.string()).describe("The history of questions asked so far."),
});
export type ExtractTransactionDetailsInput = z.infer<typeof ExtractTransactionDetailsInputSchema>;

const ExtractTransactionDetailsOutputSchema = z.object({
  updatedState: TransactionStateSchema.describe("The transaction details after extracting info from the user's response."),
  nextQuestion: z.string().describe("The next question to ask the user to get missing information. Ask one question at a time. If all details are filled, say 'I have all the details. Please review.'"),
});
export type ExtractTransactionDetailsOutput = z.infer<typeof ExtractTransactionDetailsOutputSchema>;

export async function extractTransactionDetails(
  input: ExtractTransactionDetailsInput
): Promise<ExtractTransactionDetailsOutput> {
  return extractTransactionDetailsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'extractTransactionDetailsPrompt',
  input: {schema: ExtractTransactionDetailsInputSchema},
  output: {schema: ExtractTransactionDetailsOutputSchema},
  prompt: `You are an AI assistant helping a user enter a financial transaction via voice.
Your goal is to fill in the details of a transaction by asking one question at a time.

Current Transaction Details:
{{json currentState}}

The user has access to the following projects: {{json availableProjects}}
And the following expense categories: {{json availableCategories}}

You have already asked: {{json conversationHistory}}
The user just said: "{{utterance}}"

Analyze the user's response and update the transaction details.
- If the user provides a category, make sure it's one of the available categories. If it's similar, map it to the closest one.
- The default status for an expense is 'completed'. Only change it if the user specifies 'credit', 'unpaid', 'due', 'expected', or 'later'.
- Today's date is ${new Date().toDateString()}.

Based on the updated details, determine the next logical question to ask to fill in the missing fields.
- Ask for the project first if it's missing.
- Then ask for the amount if it's missing.
- Then title.
- Then category (only for expenses).
- Don't ask for fields that are already filled.
- Ask only one question at a time.

If all necessary fields (project, type, amount, title, and category for expenses) are filled, your next question should be "I have all the details. Please review."
`,
});

const extractTransactionDetailsFlow = ai.defineFlow(
  {
    name: 'extractTransactionDetailsFlow',
    inputSchema: ExtractTransactionDetailsInputSchema,
    outputSchema: ExtractTransactionDetailsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
