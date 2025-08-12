
'use server';
/**
 * @fileOverview A Genkit flow for getting an AI segmentation from a MONAI Label server.
 * This flow acts as a dedicated AI model for data labeling.
 *
 * - getAISegmentation - A function that takes an image and a model name, and returns segmentation data.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import { getSegmentation as getSegmentationFromMonai } from '@/services/monai';


export const AISegmentationInputSchema = z.object({
  radiologyImageDataUri: z
    .string()
    .describe(
      "The original radiology image to be segmented, as a data URI."
    ),
  model: z.string().describe("The name of the segmentation model to use (e.g., 'segmentation_spleen', 'brain_tumor')."),
});
export type AISegmentationInput = z.infer<typeof AISegmentationInputSchema>;

// Define the structure for a single labeled part
const SegmentationPartSchema = z.object({
    label: z.string().describe("The anatomical label for the segment (e.g., 'Spleen')."),
    color: z.string().describe("The RGBA color for the segment mask (e.g., 'rgba(255, 0, 0, 0.5)')."),
    type: z.string().describe("The type of segmentation data (e.g., 'mock_circle')."),
    params: z.any().describe("The parameters for drawing the segmentation (e.g., center and radius for a circle).")
});

export const AISegmentationOutputSchema = z.object({
  segmentationData: z.array(SegmentationPartSchema).describe('An array of labeled segmentation parts.'),
});
export type AISegmentationOutput = z.infer<typeof AISegmentationOutputSchema>;


export async function getAISegmentation(input: AISegmentationInput): Promise<AISegmentationOutput> {
  return getAISegmentationFlow(input);
}

const getAISegmentationFlow = ai.defineFlow(
  {
    name: 'getAISegmentationFlow',
    inputSchema: AISegmentationInputSchema,
    outputSchema: AISegmentationOutputSchema,
  },
  async (input) => {
    try {
      console.log(`Requesting segmentation from MONAI service for model: ${input.model}`);
      
      const segmentationData = await getSegmentationFromMonai({
        imageDataUri: input.radiologyImageDataUri,
        model: input.model,
      });

      if (!segmentationData) {
        throw new Error('MONAI service returned no segmentation data.');
      }
      
      return {
        segmentationData: segmentationData,
      };

    } catch (error) {
      console.error(`Failed to get segmentation from MONAI service. Error:`, error);
      const finalError = error instanceof Error ? error : new Error('An unexpected error occurred during segmentation.');
      throw finalError;
    }
  }
);

