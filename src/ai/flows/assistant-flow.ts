
'use server';
/**
 * @fileOverview This is the main "brain" for the AI assistant.
 * It defines a flexible flow that can be extended with tools to perform various tasks.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

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
  prompt: "You are an expert financial assistant for an app called ExpenseWise. Your user's name is {{user}}.\n\nYour primary jobs are:\n1. Answering questions about the user's financial data.\n2. Helping the user perform tasks within the app, like adding transactions or employees.\n\n## Conversation History\n{{history}}\n\n## Current User Message\n{{utterance}}\n\n## YOUR TASK\nBased on the conversation history and the user's latest message, generate a helpful and friendly response.\nIf you don't know how to do something, say so.\n\n## RULES\n- Keep your answers concise.\n- If the user asks what you can do, summarize your main jobs.\n- You are not permitted to perform delete operations. If asked to delete something, politely refuse and explain you don't have permission. You can, however, help the user navigate to the correct page.",
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
    const { output } = await assistantPrompt(input);
    return output!;
  }
);
