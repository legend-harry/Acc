
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
  conversationHistory: z.array(z.string()).describe("The history of questions asked so far. Do not repeat these questions."),
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

1.  **Analyze the user's response** ("{{utterance}}") and update the transaction details in 'updatedState'.
    *   If the user provides a category, make sure it's one of the available categories. If it's similar, map it to the closest one.
    *   The default status for an expense is 'completed'. Only change it if the user specifies 'credit', 'unpaid', 'due', 'expected', or 'later'.
    *   Today's date is ${new Date().toDateString()}.
    *   If the user's response for the project is not in the list of available projects, set the project name to what they said, but in the next question, confirm if they want to create it.
    *   If the user says "the first one" or "number 2", select the project from the list.

2.  **Determine the next question** based on what information is still missing in 'updatedState'.
    *   Check the 'currentState' and 'conversationHistory'. Do NOT ask for information that is already filled or has been asked before.
    *   Your priority for asking questions is: title, amount, project, then category (for expenses).
    *   **If the project is missing and you haven't asked for it**, list the options for the user as a numbered list: "Which project is this for? Your options are: {{#each availableProjects}} {{ @index }}. {{this}}{{#unless @last}},{{/unless}}{{/each}}."
    *   **If the user specified a project name that is NOT in the availableProjects list**, ask for confirmation: "I don't see '{{currentState.project}}' in your projects. Would you like to create it?"
    *   Ask only one clear and simple question at a time. For example: "What was the amount?" or "What should I title this transaction?"
    *   If the user's utterance is a general greeting or command like "create a transaction", your next question should be to ask for the title or amount. Example: "Great, what was the amount?" or "Okay, what's a title for this transaction?"
    *   If all necessary fields (project, type, amount, title, and category for expenses) are filled, your next question **must be**: "I have all the details. Please review."
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
