'use server';
/**
 * @fileOverview This file defines a Genkit flow that extracts transaction details from unstructured text.
 *
 * The flow takes a string as input (e.g., "I spent 500 on coffee") and uses an LLM
 * to extract structured transaction data. It also suggests a relevant category.
 *
 * It exports:
 *   - extractTransactionDetails: The main function to invoke the flow.
 *   - ExtractTransactionDetailsInput: The input type for the flow.
 *   - ExtractTransactionDetailsOutput: The output type for the flow.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ExtractTransactionDetailsInputSchema = z.object({
  text: z.string().describe('The unstructured text containing transaction details.'),
  categories: z.array(z.string()).describe('A list of existing categories to help the AI choose an appropriate one.'),
});
export type ExtractTransactionDetailsInput = z.infer<typeof ExtractTransactionDetailsInputSchema>;

const TransactionSuggestionSchema = z.object({
    title: z.string().describe('A concise title for the transaction.'),
    amount: z.number().describe('The transaction amount.'),
    category: z.string().describe('The most relevant category from the provided list.'),
    vendor: z.string().optional().describe('The vendor or store, if mentioned.'),
    description: z.string().optional().describe('Any additional description.'),
});

const ExtractTransactionDetailsOutputSchema = z.object({
  suggestion: TransactionSuggestionSchema.optional().describe('The structured transaction suggestion. This will be undefined if no details can be extracted.'),
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
  prompt: `You are an expert at parsing transaction details from text.
    Your task is to extract the details for a financial transaction from the user's text and suggest a category for it from the provided list.

    Analyze the following text:
    "{{{text}}}"

    Here is the list of available categories:
    {{#each categories}}
    - {{{this}}}
    {{/each}}

    Based on the text and the category list, extract the transaction details.
    The output should be a structured JSON object. If you cannot extract a reasonable title and amount, return an empty suggestion.`,
});

const extractTransactionDetailsFlow = ai.defineFlow(
  {
    name: 'extractTransactionDetailsFlow',
    inputSchema: ExtractTransactionDetailsInputSchema,
    outputSchema: ExtractTransactionDetailsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output || { suggestion: undefined };
  }
);
