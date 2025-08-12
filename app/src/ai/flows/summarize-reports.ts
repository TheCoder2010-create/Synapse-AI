
'use server';

/**
 * @fileOverview A report summarization AI agent.
 *
 * - summarizeReport - A function that handles the report summarization process.
 */

import {ai} from '@/ai/genkit';
import {
  SummarizeReportInput,
  SummarizeReportInputSchema,
  SummarizeReportOutput,
  SummarizeReportOutputSchema
} from '@/ai/types';

export async function summarizeReport(input: SummarizeReportInput): Promise<SummarizeReportOutput> {
  return summarizeReportFlow(input);
}

const prompt = ai.definePrompt({
  name: 'summarizeReportPrompt',
  input: {schema: SummarizeReportInputSchema},
  output: {schema: SummarizeReportOutputSchema},
  config: {
    temperature: 0.1,
  },
  prompt: `You are an expert radiologist AI assistant. Your task is to summarize a full radiology report into a concise, clinically relevant summary for a referring physician.

The summary should:
- Begin with the primary finding or impression.
- Briefly mention any significant secondary findings.
- Omit procedural details (like technique) unless they are critical to the interpretation.
- Use clear and professional medical language.

Patient Report: {{{reportText}}}`,
});

const summarizeReportFlow = ai.defineFlow(
  {
    name: 'summarizeReportFlow',
    inputSchema: SummarizeReportInputSchema,
    outputSchema: SummarizeReportOutputSchema,
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
            console.log(`Attempt ${attempt}: Trying summarization with primary model: ${primaryModel}`);
            result = await prompt(input, { model: primaryModel });
        } catch (primaryError) {
            console.warn(`Attempt ${attempt}: Primary summarization model failed. Retrying with fallback: ${fallbackModel}. Error:`, primaryError);
            result = await prompt(input, { model: fallbackModel });
        }

        const {output} = result;
        if (output?.summary) {
          return output;
        }
        throw new Error("AI returned empty or invalid output for summarization.");
      } catch (error) {
        console.error(`Attempt ${attempt} for summarization failed with both models. Error:`, error);
        if (attempt === maxRetries) {
          console.error(`All ${maxRetries} summarization attempts failed.`);
          const finalError = error instanceof Error ? error : new Error('An unexpected error occurred.');
          // Instead of throwing, return a structured error message.
          return { summary: `The AI summarization service is temporarily unavailable. Last error: ${finalError.message}` };
        }
        await new Promise(res => setTimeout(res, retryDelay));
      }
    }
    // This part should be unreachable if maxRetries > 0, but is needed for type safety.
    return { summary: "The AI summarization service could not be reached. Please try again." };
  }
);
