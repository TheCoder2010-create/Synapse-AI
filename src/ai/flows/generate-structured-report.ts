
'use server';

/**
 * @fileOverview A Genkit flow for structuring a free-text radiology report into a formal document.
 *
 * - generateStructuredReport - A function that handles the report structuring process.
 */

import {ai} from '@/ai/genkit';
import {
  GenerateStructuredReportInput,
  GenerateStructuredReportInputSchema,
  GenerateStructuredReportOutput,
  GenerateStructuredReportOutputSchema
} from '@/ai/types';

export async function generateStructuredReport(
  input: GenerateStructuredReportInput
): Promise<GenerateStructuredReportOutput> {
  return generateStructuredReportFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateStructuredReportPrompt',
  input: {schema: GenerateStructuredReportInputSchema},
  output: {schema: GenerateStructuredReportOutputSchema},
  config: {
    temperature: 0.1,
  },
  system: `You are an expert radiologist AI assistant. Your primary task is to take an unstructured report draft, the initial AI diagnosis, and potentially a user-provided template, and format them into a highly structured, formal report suitable for clinical use.

**Formatting Rules:**
1.  **If a \`reportTemplate\` is provided**, you MUST use it as the primary structure for your output. Analyze the template's sections (e.g., TECHNIQUE, FINDINGS, IMPRESSION) and placeholders, and fill them in using the information from the unstructured draft and the AI diagnosis.
2.  **If NO \`reportTemplate\` is provided**, you MUST fall back to generating a standard report with the following three sections: "Technique", "Findings", and "Impression".

**Content Generation Rules:**
-   **Technique**: Generate a standard technique description based on the AI's initial analysis of the scan (e.g., "Multi-planar, multi-sequential MRI of the brain...").
-   **Findings**: Synthesize the 'Unstructured Report Draft' and the 'Initial AI Diagnosis Context' into a detailed, objective, point-by-point list of observations. Use precise anatomical and radiological terminology.
-   **Impression**: This is the most critical section. Based on the "Findings", state the final diagnostic conclusion concisely. For example, if the primary finding was "pancreatic mass," the impression must state a specific diagnosis like "1. Large mass in the pancreatic head, suspicious for adenocarcinoma." The impression should be a numbered list if there are multiple distinct conclusions.
`,
  prompt: `
  {{#if reportTemplate}}
  Use this template to structure your report:
  --- TEMPLATE START ---
  {{{reportTemplate}}}
  --- TEMPLATE END ---
  {{/if}}

  Unstructured Report Draft:
  {{{reportText}}}

  Initial AI Diagnosis Context:
  Primary Suggestion: {{{diagnosis.primarySuggestion}}}
  Potential Areas of Interest: {{{diagnosis.potentialAreasOfInterest}}}
  Measurements:
  {{#each diagnosis.measurements}}
  - {{structure}}: {{measurement}}
  {{/each}}
  `,
});

const generateStructuredReportFlow = ai.defineFlow(
  {
    name: 'generateStructuredReportFlow',
    inputSchema: GenerateStructuredReportInputSchema,
    outputSchema: GenerateStructuredReportOutputSchema,
  },
  async (input) => {
    const primaryModel = 'googleai/gemini-1.5-flash-latest';
    const fallbackModel = 'googleai/gemini-1.5-pro-latest';
    const maxRetries = 2;
    const retryDelay = 1000;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        let result;
        try {
            console.log(`Attempt ${attempt}: Trying structured report with primary model: ${primaryModel}`);
            result = await prompt(input, { model: primaryModel });
        } catch (primaryError) {
            console.warn(`Attempt ${attempt}: Primary model for structured report failed. Retrying with fallback: ${fallbackModel}. Error:`, primaryError);
            result = await prompt(input, { model: fallbackModel });
        }

        const {output} = result;
        if (output) {
          return output;
        }
        throw new Error("AI returned empty output for structured report.");
      } catch (error) {
        console.error(`Attempt ${attempt} for structured report failed with both models. Error:`, error);
        if (attempt === maxRetries) {
          console.error(`All ${maxRetries} structured report attempts failed.`);
          const finalError = error instanceof Error ? error : new Error('An unexpected error occurred.');
          throw new Error(`AI report generation service is temporarily unavailable. Last error: ${finalError.message}`);
        }
        await new Promise(res => setTimeout(res, retryDelay));
      }
    }
    throw new Error('AI report generation service is temporarily unavailable. Please try again in a few moments.');
  }
);
