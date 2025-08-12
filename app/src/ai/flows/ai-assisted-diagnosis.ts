
'use server';

/**
 * @fileOverview A Genkit flow for AI-assisted diagnosis of radiology images.
 *
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import { searchRadiopaedia } from '@/services/radiopaedia';
import { searchTCIADatasets } from '@/services/tcia';
import { extractDicomMetadataTool } from '@/ai/tools/extract-dicom-metadata';
import { searchImaiosAnatomy } from '@/services/imaios';
import { searchOpenI } from '@/services/openi';
import { findCaseExamplesTool } from '@/ai/tools/find-case-examples';
import { searchXNAT } from '@/services/xnat';
import {
  AiAssistedDiagnosisInput,
  AiAssistedDiagnosisInputSchema,
  AiAssistedDiagnosisOutput,
  AiAssistedDiagnosisOutputSchema
} from '@/ai/types';
import { diagnosisSystemPrompt, diagnosisUserPrompt } from '@/ai/prompts/diagnosis-prompt';


const searchRadiopaediaTool = ai.defineTool(
  {
    name: 'searchRadiopaedia',
    description: 'Searches Radiopaedia.org for definitions and context of specific radiological terms to improve diagnostic accuracy. Use this to clarify findings like "Pneumothorax" or "Atelectasis".',
    inputSchema: z.object({ term: z.string().describe('The radiological term to search for (e.g., "Pneumothorax").') }),
    outputSchema: z.string(),
  },
  async (input) => searchRadiopaedia(input.term)
);

const searchTCIATool = ai.defineTool(
  {
    name: 'searchPublicResearchDatasets',
    description: 'Searches public research archives (like TCIA) for imaging collections relevant to a specific cancer type or radiological finding (e.g., "Lung Adenocarcinoma", "GBM"). Returns a summary of matching collection names.',
    inputSchema: z.object({ term: z.string().describe('The cancer type or finding to search for.') }),
    outputSchema: z.string(),
  },
  async (input) => searchTCIADatasets(input.term)
);

const searchImaiosAnatomyTool = ai.defineTool(
  {
    name: 'searchImaiosAnatomy',
    description: 'Searches the IMAIOS e-Anatomy atlas for detailed definitions of anatomical structures. Use this to clarify the specific location or characteristics of a finding (e.g., "periventricular", "cerebellum").',
    inputSchema: z.object({ term: z.string().describe('The anatomical term to search for.') }),
    outputSchema: z.string(),
  },
  async (input) => searchImaiosAnatomy(input.term)
);

const searchOpenITool = ai.defineTool(
  {
    name: 'searchMedicalImageDatabase',
    description: 'Searches the Open-i medical image database for visual examples of a specific radiological finding. Use this to find reference images to visually confirm a diagnosis.',
    inputSchema: z.object({ term: z.string().describe('The radiological finding to search for (e.g., "pleural effusion").') }),
    outputSchema: z.string(),
  },
  async (input) => searchOpenI(input.term)
);

const searchXNATTool = ai.defineTool(
  {
    name: 'searchXNATProjects',
    description: 'Searches a connected XNAT server for projects related to a specific search term. Use this to find relevant internal or private imaging datasets.',
    inputSchema: z.object({ term: z.string().describe('The term to search for in XNAT project names or keywords.') }),
    outputSchema: z.string(),
  },
  async (input) => searchXNAT(input.term)
);


export async function aiAssistedDiagnosis(
  input: AiAssistedDiagnosisInput
): Promise<AiAssistedDiagnosisOutput> {
  return aiAssistedDiagnosisFlow(input);
}

const prompt = ai.definePrompt({
  name: 'aiAssistedDiagnosisPrompt',
  input: {schema: AiAssistedDiagnosisInputSchema},
  output: {schema: AiAssistedDiagnosisOutputSchema},
  tools: [searchRadiopaediaTool, searchTCIATool, extractDicomMetadataTool, searchImaiosAnatomyTool, searchOpenITool, findCaseExamplesTool, searchXNATTool],
  config: {
    temperature: 0.1,
    safetySettings: [
      {
        category: 'HARM_CATEGORY_HATE_SPEECH',
        threshold: 'BLOCK_NONE',
      },
      {
        category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
        threshold: 'BLOCK_NONE',
      },
      {
        category: 'HARM_CATEGORY_HARASSMENT',
        threshold: 'BLOCK_NONE',
      },
      {
        category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
        threshold: 'BLOCK_NONE',
      },
    ],
  },
  system: diagnosisSystemPrompt,
  prompt: diagnosisUserPrompt,
});

const aiAssistedDiagnosisFlow = ai.defineFlow(
  {
    name: 'aiAssistedDiagnosisFlow',
    inputSchema: AiAssistedDiagnosisInputSchema,
    outputSchema: AiAssistedDiagnosisOutputSchema,
  },
  async (input) => {
    // The prompt expects the first image for DICOM parsing.
    const dicomParsingInput = {
      ...input,
      imageDataUri: input.radiologyMediaDataUris[0], // Pass first image for metadata
    }

    const primaryModel = 'googleai/gemini-1.5-flash-latest';
    const fallbackModel = 'googleai/gemini-1.5-pro-latest';
    const maxRetries = 2;
    const retryDelay = 1000; // 1 second

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        let result;
        try {
          console.log(`Attempt ${attempt}: Trying primary model: ${primaryModel}`);
          result = await prompt(dicomParsingInput, { model: primaryModel });
        } catch (primaryError) {
          console.warn(`Attempt ${attempt}: Primary model failed. Retrying with fallback: ${fallbackModel}. Error:`, primaryError);
          result = await prompt(dicomParsingInput, { model: fallbackModel });
        }
        
        const {output} = result;
        if (output) {
          return output; // Success, exit the loop
        }
        throw new Error("AI returned empty output."); // Handle cases where the call succeeds but output is null/undefined
      } catch (error) {
        console.error(`Attempt ${attempt} failed with both models. Error:`, error);
        if (attempt === maxRetries) {
          console.error(`All ${maxRetries} attempts failed. Throwing final error.`);
          const finalError = error instanceof Error ? error : new Error('An unexpected error occurred during AI processing.');
          throw new Error(`AI services are temporarily unavailable. Last error: ${finalError.message}`);
        }
        // Wait before retrying
        await new Promise(res => setTimeout(res, retryDelay));
      }
    }
    // This part should be unreachable if maxRetries > 0, but is needed for type safety.
    throw new Error('AI services are temporarily unavailable. Please try again in a few moments.');
  }
);
