
'use server';
/**
 * @fileOverview A Genkit flow for getting an AI segmentation from a MONAI Label server.
 *
 * - getAISegmentation - A function that takes an image and returns segmentation data.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import { AnnotateImageInput, AnnotateImageInputSchema, AnnotateImageOutput, AnnotateImageOutputSchema } from '@/ai/types';
import { getSegmentation } from '@/services/monai';


export async function getAISegmentation(input: AnnotateImageInput): Promise<AnnotateImageOutput> {
  return getAISegmentationFlow(input);
}

const getAISegmentationFlow = ai.defineFlow(
  {
    name: 'getAISegmentationFlow',
    inputSchema: AnnotateImageInputSchema,
    outputSchema: AnnotateImageOutputSchema,
  },
  async (input) => {
    try {
      console.log(`Requesting segmentation from MONAI service for image.`);
      
      // In a real implementation, you might pass the diagnosis to the MONAI server
      // to help it select the correct model (e.g., 'brain-tumor-segmentation').
      const segmentationData = await getSegmentation({
        imageDataUri: input.radiologyImageDataUri,
        model: 'segmentation_spleen', // Example model name
      });
      
      if (!segmentationData) {
        throw new Error("MONAI service returned no segmentation data.");
      }

      // The output schema now expects segmentation data, not an annotated image URI.
      return {
        segmentationData: segmentationData,
      };

    } catch (error) {
      console.error(`Failed to get segmentation from MONAI service. Error:`, error);
      const finalError = error instanceof Error ? error : new Error('An unexpected error occurred.');
      throw new Error(`AI segmentation service is temporarily unavailable. Last error: ${finalError.message}`);
    }
  }
);
