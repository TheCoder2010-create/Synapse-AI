
'use server';

/**
 * @fileOverview A dedicated Genkit flow for looking up a single term from the Radiopaedia knowledge base.
 * This acts as a specialized 'submodel' for terminology lookups.
 *
 * - lookupRadiologyTerm - A function that takes a term and returns its definition.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { searchClinicalKnowledgeBase } from '@/services/synapse-wrapper-api';


// Define the input schema for the flow
const LookupInputSchema = z.object({
  term: z.string().describe('The radiological term to search for.'),
});
export type LookupInput = z.infer<typeof LookupInputSchema>;

// Define the output schema for the flow
const LookupOutputSchema = z.object({
  term: z.string().describe('The original term that was looked up.'),
  definition: z.string().describe('The definition or summary returned from the knowledge base.'),
});
export type LookupOutput = z.infer<typeof LookupOutputSchema>;

/**
 * Looks up a radiological term using the Radiopaedia service.
 * @param input An object containing the term to look up.
 * @returns A promise that resolves to an object containing the term and its definition.
 */
export async function lookupRadiologyTerm(input: LookupInput): Promise<LookupOutput> {
  return lookupRadiologyTermFlow(input);
}

const lookupRadiologyTermFlow = ai.defineFlow(
  {
    name: 'lookupRadiologyTermFlow',
    inputSchema: LookupInputSchema,
    outputSchema: LookupOutputSchema,
  },
  async (input) => {
    console.log(`Executing lookupRadiologyTermFlow for: "${input.term}"`);

    const definition = await searchClinicalKnowledgeBase(input.term);

    return {
      term: input.term,
      definition: definition,
    };
  }
);
