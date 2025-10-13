'use server';
/**
 * @fileOverview This is the main "brain" for the AI assistant.
 * It defines a flexible flow that can be extended with tools to perform various tasks.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';

// Input schema for the main assistant flow
const AssistantFlowInputSchema = z.object({
  utterance: z.string().describe("The user's most recent message."),
  history: z.string().describe("The entire conversation history, for context."),
  user: z.string().describe("The name of the current user."),
});
export type AssistantFlowInput = z.infer<typeof AssistantFlowInputSchema>;

// Output schema for the main assistant flow
const AssistantFlowOutputSchema = z.object({
  answer: z.string().describe("The assistant's response to the user."),
});
export type AssistantFlowOutput = z.infer<typeof AssistantFlowOutputSchema>;

// This is an exported wrapper function that makes the flow callable from the client
export async function assistantFlow(input: AssistantFlowInput): Promise<AssistantFlowOutput> {
  return assistantFlowInternal(input);
}

// Define the prompt that the AI will use
const assistantPrompt = ai.definePrompt({
  name: 'assistantPrompt',
  input: { schema: AssistantFlowInputSchema },
  output: { schema: AssistantFlowOutputSchema },
  // Define the system message and prompt using Handlebars templating
  prompt: `You are an expert financial assistant for an app called ExpenseWise. Your user's name is {{user}}.
Your primary jobs are:
1. Answering questions about the user's financial data.
2. Helping the user perform tasks within the app, like adding transactions or employees.

## Conversation History
{{{history}}}

## Current User Message
{{{utterance}}}

## YOUR TASK
Based on the conversation history and the user's latest message, generate a helpful and friendly response.
If you don't know how to do something, say so.

## RULES
- Keep your answers concise.
- If the user asks what you can do, summarize your main jobs.
- You are not permitted to perform delete operations. If asked to delete something, politely refuse and explain you don't have permission. You can, however, help the user navigate to the correct page.`,
});

// Define the main flow for the assistant
const assistantFlowInternal = ai.defineFlow(
  {
    name: 'assistantFlow',
    inputSchema: AssistantFlowInputSchema,
    outputSchema: AssistantFlowOutputSchema,
  },
  async (input) => {
    // For now, we just call the prompt directly.
    // In the future, we will add tools here to give the assistant new abilities.
    
    // Sanitize history and utterance to prevent "parts template" error
    const sanitizedHistory = input.history.replace(/(\r\n|\n|\r)/gm, " ");
    const sanitizedUtterance = input.utterance.replace(/(\r\n|\n|\r)/gm, " ");
    const sanitizedInput = { ...input, history: sanitizedHistory, utterance: sanitizedUtterance };

    const { output } = await assistantPrompt(sanitizedInput);
    return output!;
  }
);
