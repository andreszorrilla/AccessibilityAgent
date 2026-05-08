'use server';
/**
 * @fileOverview Checks user text for typos and suggests corrections.
 *
 * - checkTypo - A function that handles the typo checking process.
 * - CheckTypoInput - The input type for the checkTypo function.
 * - CheckTypoOutput - The return type for the checkTypo function.
 */

import {ai} from '@/ai/ai-instance';
import {z} from 'genkit';

const CheckTypoInputSchema = z.object({
  text: z.string().describe('The text to check for typos.'),
});
export type CheckTypoInput = z.infer<typeof CheckTypoInputSchema>;

const CheckTypoOutputSchema = z.object({
  correctedText: z.string().describe('The corrected text or a message indicating no typos were found.'),
});
export type CheckTypoOutput = z.infer<typeof CheckTypoOutputSchema>;

// TODO: Replacing checkTypo

export async function checkTypo(input: CheckTypoInput): Promise<CheckTypoOutput> {
  return Promise.resolve({} as CheckTypoOutput);
  // return checkTypoFlow(input);
}

// REPLACE ME PART 1: add prompt here
const prompt = ai.definePrompt({
  name: 'checkTypoPrompt',
  input: {
    schema: CheckTypoInputSchema,
  },
  output: {
    schema: CheckTypoOutputSchema,
  },
  prompt: `You are a helpful AI assistant that checks user text for typos and suggests corrections.
- If you find typos, respond with the corrected text.
- If there are no typos, or if you are unsure about a correction, respond with the original text unchanged.

User text: {text}

Corrected text:
`,
});

// REPLACE ME PART 2: add flow here

const checkTypoFlow = ai.defineFlow<
  typeof CheckTypoInputSchema,
  typeof CheckTypoOutputSchema
>(
  {
    name: 'checkTypoFlow',
    inputSchema: CheckTypoInputSchema,
    outputSchema: CheckTypoOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
