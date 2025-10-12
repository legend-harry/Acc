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
  nextQuestion: z.string().describe("Next question to gather missing info. If complete: 'I have all details. Please review.'"),
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
  prompt: `You are a financial assistant helping users log transactions conversationally.

## CONTEXT
**Current Transaction State:**
{{json currentState}}

**Available Projects:** {{json availableProjects}}
**Available Categories:** {{json availableCategories}}
**Previous Questions:** {{json conversationHistory}}
**User's Latest Utterance:** "{{utterance}}"
**Today's Date:** ${new Date().toISOString().split('T')[0]}

## PROCESSING RULES

### 1. STATE UPDATE INSTRUCTIONS
**Field Extraction:**
- **Amount**: Extract numerical values. If user says "fifty dollars" → 50
- **Date**: Convert relative dates ("yesterday", "last Friday") to YYYY-MM-DD
- **Type**: Infer from context: "I paid" → expense, "I received" → income
- **Category**: Map to closest available category. If unclear, keep original and validate later
- **Project**: If user says "the second one" or "number 3", select from availableProjects by index
- **Status**: Default to 'completed' unless user specifies "credit", "due", "expected", or "pending"

**Validation Rules:**
- If project not in availableProjects → keep user's input but flag for confirmation
- If category not in availableCategories → suggest closest match in next question
- Amount must be positive number

### 2. NEXT QUESTION STRATEGY

**Priority Order (ask for missing fields in this sequence):**
1. **Type** (if missing) → "Is this an expense or income?"
2. **Amount** (if missing) → "What was the amount?"
3. **Title** (if missing) → "What should I title this transaction?"
4. **Project** (if missing) → Present as numbered list: "Which project? Options: 1. ProjectA, 2. ProjectB, 3. ProjectC"
5. **Category** (for expenses only, if missing) → "What category? Options: [categories]"
6. **Date** (if missing or invalid) → "When did this occur? (YYYY-MM-DD)"
7. **Vendor/Description** (lower priority)

**Special Cases:**
- If user provides invalid project: "Project '{{project}}' isn't in your list. Create it or choose from: [availableProjects]"
- If user provides invalid category: "Category '{{category}}' not found. Did you mean [closest match]?"
- If all required fields filled: "I have all the details. Please review."
- For greetings/commands: Acknowledge then ask highest priority missing field

**Required Fields Completion Check:**
A transaction is complete when it has:
- type + amount + title + project + (category if expense)

### 3. CONVERSATION GUIDELINES
- Ask ONE clear, specific question at a time
- Never repeat questions from conversationHistory
- Acknowledge user input before asking next question
- Keep questions concise and natural
- Confirm ambiguous or invalid inputs immediately

## PROCESS USER'S UTTERANCE: "{{utterance}}"

Update the transaction state and determine the single most important next question.`
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