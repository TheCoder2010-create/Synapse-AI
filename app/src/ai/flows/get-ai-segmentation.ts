
'use server';
/**
 * @fileOverview A Genkit flow for getting an AI segmentation from a MONAI Label server.
 * This flow acts as a dedicated AI model for data labeling.
 *
 * - getAISegmentation - A function that takes an image and a model name, and returns segmentation data.
 */

import {ai} from '@/ai/genkit';
import { AISegmentationInput, AISegmentationInputSchema, AISegmentationOutput, AISegmentationOutputSchema } from '@/ai/types';
import { getSegmentation as getSegmentationFromMonai } from '@/services/monai';


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
      
      return {
        segmentationData: segmentationData,
      };

    } catch (error) {
      console.error(`Failed to get segmentation from MONAI service. Error:`, error);
      // Return null instead of throwing, so the UI can handle it gracefully.
      return { segmentationData: null };
    }
  }
);
