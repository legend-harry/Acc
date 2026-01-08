'use server';
/**
 * @fileOverview This file defines a Genkit flow that imports expense data and suggests categories.
 *
 * The flow takes raw expense data as input and uses an LLM to suggest categories for each expense item.
 * It exports:
 *   - importDataAndSuggestCategories: The main function to invoke the flow.
 *   - ImportDataAndSuggestCategoriesInput: The input type for the flow.
 *   - ImportDataAndSuggestCategoriesOutput: The output type for the flow.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ExpenseItemSchema = z.object({
  date: z.string().describe('Date of the expense'),
  invoiceNo: z.string().describe('Invoice number, if applicable'),
  glCode: z.string().describe('General Ledger code'),
  title: z.string().describe('Title of the expense'),
  amount: z.string().describe('Amount of the expense'),
  qty: z.string().describe('Quantity'),
  unit: z.string().describe('Unit of quantity'),
  ratePerUnit: z.string().describe('Rate per unit'),
  vendor: z.string().describe('Vendor of the expense'),
  description: z.string().describe('Description of the expense'),
  notes: z.string().describe('Additional notes'),
});

export type ExpenseItem = z.infer<typeof ExpenseItemSchema>;

const ImportDataAndSuggestCategoriesInputSchema = z.object({
  data: z.string().describe('The raw expense data as a string, typically from a CSV or similar format.'),
});
export type ImportDataAndSuggestCategoriesInput = z.infer<typeof ImportDataAndSuggestCategoriesInputSchema>;

const SuggestedCategorySchema = z.object({
  category: z.string().describe('Suggested category for the expense item.'),
  confidence: z.number().describe('Confidence level (0-1) for the suggested category.'),
});

const ImportDataAndSuggestCategoriesOutputSchema = z.array(
  z.object({
    item: ExpenseItemSchema,
    suggestions: z.array(SuggestedCategorySchema).describe('Suggested categories for this item'),
  })
);

export type ImportDataAndSuggestCategoriesOutput = z.infer<typeof ImportDataAndSuggestCategoriesOutputSchema>;

export async function importDataAndSuggestCategories(
  input: ImportDataAndSuggestCategoriesInput
): Promise<ImportDataAndSuggestCategoriesOutput> {
  return importDataAndSuggestCategoriesFlow(input);
}

const prompt = ai.definePrompt({
  name: 'importDataAndSuggestCategoriesPrompt',
  input: {schema: ImportDataAndSuggestCategoriesInputSchema},
  output: {schema: ImportDataAndSuggestCategoriesOutputSchema},
  prompt: `You are an expert accounting assistant. Your job is to take expense data and suggest categories for each expense item.

  The data will be in a raw string format. Parse the string, and identify the columns.
  For each row, suggest categories based on the description, title and other information available. 
  Output a JSON array of objects. Each object should contain the original expense item and an array of category suggestions with confidence levels.

  Here is the expense data:
  {{data}}
  `,
});

const importDataAndSuggestCategoriesFlow = ai.defineFlow(
  {
    name: 'importDataAndSuggestCategoriesFlow',
    inputSchema: ImportDataAndSuggestCategoriesInputSchema,
    outputSchema: ImportDataAndSuggestCategoriesOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);

