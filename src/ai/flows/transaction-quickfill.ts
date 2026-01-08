"use server";

import { ai } from "@/ai/genkit";
import { z } from "genkit";

const TransactionAssistInputSchema = z.object({
  text: z
    .string()
    .min(8, "Add a bit more detail for the AI to work with.")
    .describe("Natural language transaction note, e.g. 'Bought coffee for 5.75 at Blue Bottle today'."),
  categories: z
    .array(z.string())
    .optional()
    .describe("List of allowed categories to map to if possible."),
});

const TransactionAssistOutputSchema = z.object({
  title: z.string().optional(),
  amount: z.number().optional(),
  category: z.string().optional(),
  vendor: z.string().optional(),
  date: z
    .string()
    .optional()
    .describe("ISO 8601 date (YYYY-MM-DD) when the expense occurred."),
  description: z.string().optional(),
  invoiceNo: z.string().optional(),
  glCode: z.string().optional(),
  notes: z.string().optional(),
  confidence: z
    .number()
    .min(0)
    .max(1)
    .optional()
    .describe("AI confidence that the mapping is correct (0-1)."),
});

export type TransactionAssistOutput = z.infer<typeof TransactionAssistOutputSchema>;
export type TransactionAssistInput = z.infer<typeof TransactionAssistInputSchema>;

export async function suggestTransactionFromText(
  input: TransactionAssistInput
): Promise<TransactionAssistOutput> {
  return transactionAssistFlow(input);
}

const prompt = ai.definePrompt({
  name: "transactionAssistPrompt",
  input: { schema: TransactionAssistInputSchema },
  output: { schema: TransactionAssistOutputSchema },
  prompt: `You are a concise expense-entry assistant. Map the provided free-form note to structured fields.

Rules:
- If categories are provided, pick the closest match. Otherwise infer a short category.
- Dates must be ISO 8601 (YYYY-MM-DD). If missing, use today's date.
- Amount must be numeric without currency symbols.
- Do not invent data. Leave fields empty if unsure.
- Keep descriptions short (max 120 chars).
- Confidence between 0 and 1.

Available categories: {{categories}}
Note: {{text}}

Return ONLY the JSON object with the fields title, amount, category, vendor, date, description, invoiceNo, glCode, notes, confidence.`,
});

const transactionAssistFlow = ai.defineFlow(
  {
    name: "transactionAssistFlow",
    inputSchema: TransactionAssistInputSchema,
    outputSchema: TransactionAssistOutputSchema,
  },
  async input => {
    const { output } = await prompt(input);
    return output!;
  }
);
