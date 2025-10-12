
'use server';
/**
 * @fileOverview Genkit flow for conversational transaction data extraction.
 * Extracts transaction details through dialog, updating state and determining next questions.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const TransactionStateSchema = z.object({
  project: z.string().optional().describe('The project associated with the transaction. Must match availableProjects.'),
  type: z.enum(['expense', 'income']).optional().describe('Transaction type: expense or income.'),
  category: z.string().optional().describe('Expense category. Must match availableCategories for expenses.'),
  status: z.enum(['completed', 'credit', 'expected']).optional().describe('Transaction status.'),
  date: z.string().optional().describe('Transaction date in YYYY-MM-DD format.'),
  title: z.string().optional().describe('Brief, descriptive title for the transaction.'),
  amount: z.number().optional().describe('Monetary value as a positive number.'),
  vendor: z.string().optional().describe('Vendor or counterparty name.'),
  description: z.string().optional().describe('Detailed transaction description.'),
  quantity: z.number().optional().describe('Item quantity for inventory tracking.'),
});

const ExtractTransactionDetailsInputSchema = z.object({
  currentState: TransactionStateSchema.describe("Current partially filled transaction details."),
  availableProjects: z.array(z.string()).describe("Valid projects user can assign to."),
  availableCategories: z.array(z.string()).describe("Valid expense categories."),
  utterance: z.string().describe("User's latest spoken response."),
  conversationHistory: z.array(z.string()).describe("Previous questions asked. Do not repeat."),
});
export type ExtractTransactionDetailsInput = z.infer<typeof ExtractTransactionDetailsInputSchema>;

const ExtractTransactionDetailsOutputSchema = z.object({
  updatedState: TransactionStateSchema.describe("Updated transaction state after processing user response."),
  nextQuestion: z.string().describe("Next question to gather missing info. If complete: 'I have all the details. Please review.'"),
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
  prompt: `You are a financial assistant helping a user log a transaction via voice. Your goal is to fill in the transaction details by asking a series of questions, one at a time, until all required information is gathered.

## CORE INSTRUCTIONS
1.  **Analyze the User's Utterance**: First, examine the user's latest response ("{{utterance}}") to extract any relevant details.
2.  **Update the State**: Update the \`currentState\` with any new information you've gathered.
3.  **Determine the Next Question**: Based on the updated state, decide on the single most important question to ask next. **NEVER** ask for information that is already present in the \`currentState\`. **NEVER** repeat a question that is already in the \`conversationHistory\`.

## CONTEXT
-   **Current Transaction State:** \`{{json currentState}}\`
-   **Available Projects:** \`{{json availableProjects}}\`
-   **Available Categories:** \`{{json availableCategories}}\`
-   **Conversation History (Questions you have already asked):** \`{{json conversationHistory}}\`
-   **User's Latest Utterance:** "{{utterance}}"
-   **Today's Date:** ${new Date().toISOString().split('T')[0]}

## REQUIRED FIELDS & QUESTION PRIORITY
Ask for missing information in this exact order. Once a field is filled, move to the next one.
1.  **Type**: Is it an 'expense' or 'income'? (Ask: "Is this an expense or an income?")
2.  **Amount**: The transaction amount. (Ask: "What was the amount?")
3.  **Title**: A short description. (Ask: "What should I title this transaction?")
4.  **Project**: The associated project. (Ask: "Which project is this for? Your options are: {{#each availableProjects}}{{@index_1}}. {{this}}{{#unless @last}}, {{/unless}}{{/each}}")
5.  **Category**: (Only if type is 'expense'). The expense category. (Ask: "What category does this fall under?")

## STATE UPDATE RULES
-   **Amount**: Extract numerical values. "fifty dollars" -> 50.
-   **Date**: Convert relative dates like "yesterday" or "last Friday" to YYYY-MM-DD format. Default to today if not specified.
-   **Type**: Infer from words like "paid", "spent" (expense) or "received", "earned" (income). Default to 'expense' if ambiguous.
-   **Status**: Default to 'completed' unless words like "credit", "due", "pending", "future", "expected" are used.
-   **Project**: If the user says "the second one" or "number 3", select the project from \`availableProjects\` by its 1-based index. If the user names a project not in the list, ask them if they want to create it or choose from the existing list.
-   **Category**: Map the user's response to the closest available category. If it's unclear, you can ask for clarification.

## COMPLETION
-   When all required fields (Type, Amount, Title, Project, and Category if expense) are filled, your **ONLY** response for \`nextQuestion\` must be: "I have all the details. Please review."

## YOUR TASK
Given the user's utterance "{{utterance}}", update the state and determine the single next question to ask based on the priority list and the rules above.`,
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
