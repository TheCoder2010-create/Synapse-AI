
'use server';

/**
 * @fileOverview A Genkit flow for handling general chat interactions with the AI radiologist assistant.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { aiAssistedDiagnosis } from './ai-assisted-diagnosis';
import { searchRadiopaedia } from '@/services/radiopaedia';
import type { ChatInput } from '@/ai/types';


const searchRadiopaediaTool = ai.defineTool(
  {
    name: 'searchRadiopaediaForChat',
    description:
      'Searches Radiopaedia.org for definitions of radiological terms. Use this when the user asks a question about a specific medical term or finding.',
    inputSchema: z.object({
      term: z.string().describe('The radiological term to search for.'),
    }),
    outputSchema: z.string(),
  },
  async (input) => searchRadiopaedia(input.term)
);

async function chat(input: ChatInput) {
    if (input.media) {
      // If there's an image, we go straight to the diagnosis flow.
      const diagnosis = await aiAssistedDiagnosis({
        radiologyMediaDataUris: [input.media.url],
        isDicom: input.media.contentType === 'application/dicom',
        mediaType: 'image',
      });
      
      // Format the structured output into a conversational response.
      const conversationalResponse = `I've analyzed the scan. Here's what I found:

**Primary Suggestion:** ${diagnosis.primarySuggestion}

**Potential Areas of Interest:** ${diagnosis.potentialAreasOfInterest}

**Key Measurements:**
${diagnosis.measurements?.map(m => `- ${m.structure}: ${m.measurement}`).join('\n') || 'No specific measurements taken.'}

I've also attached my detailed reasoning and any relevant knowledge base lookups to the side panel for your review. Let me know if you'd like me to draft a full report.`;

      return conversationalResponse;
    }

    // If no image, proceed with a conversational flow.
    // "Flash-then-Pro" strategy: Try the faster model first, and if it fails, fallback to the more powerful one.
    const flashModel = 'googleai/gemini-1.5-flash-latest';
    const proModel = 'googleai/gemini-1.5-pro-latest';
    
    const systemPrompt = `You are Synapse AI, an expert radiologist co-pilot. 
        Your role is to assist human radiologists by answering questions, researching terms, and analyzing medical scans.
        Be concise, accurate, and professional. 
        When you use a tool to find information, cite your source by stating "According to Radiopaedia.org..." or similar.
        If the user asks you to perform a task you cannot do (like giving medical advice directly to a patient), politely decline and explain your role as an assistant for medical professionals.`;
    
    const userPrompt = `The user's message history is: ${JSON.stringify(
        input.messages
      )}. Respond to the latest message.`;

    try {
        console.log(`Trying conversational chat with primary model: ${flashModel}`);
        const llmResponse = await ai.generate({
          model: flashModel,
          tools: [searchRadiopaediaTool],
          system: systemPrompt,
          prompt: userPrompt,
        });
        return llmResponse.text;
    } catch (error) {
        console.warn(`Primary chat model (${flashModel}) failed. Retrying with fallback: ${proModel}. Error:`, error);
        const llmResponse = await ai.generate({
          model: proModel,
          tools: [searchRadiopaediaTool],
          system: systemPrompt,
          prompt: userPrompt,
        });
        return llmResponse.text;
    }
}

export async function chatStream(input: ChatInput) {
    if (input.media) {
        // Streaming isn't well-suited for the structured diagnosis response.
        // We'll return the full response as a single chunk.
        const response = await chat(input);
        const readableStream = new ReadableStream({
            start(controller) {
                const encoder = new TextEncoder();
                controller.enqueue(encoder.encode(response));
                controller.close();
            }
        });
        return readableStream;
    }
    
    // "Flash-then-Pro" streaming strategy
    const flashModel = 'googleai/gemini-1.5-flash-latest';
    const proModel = 'googleai/gemini-1.5-pro-latest';

    const systemPrompt = `You are Synapse AI, an expert radiologist co-pilot. 
        Your role is to assist human radiologists by answering questions, researching terms, and analyzing medical scans.
        Be concise, accurate, and professional. 
        When you use a tool to find information, cite your source by stating "According to Radiopaedia.org..." or similar.
        If the user asks you to perform a task you cannot do (like giving medical advice directly to a patient), politely decline and explain your role as an assistant for medical professionals.`;
    
    const userPrompt = `The user's message history is: ${JSON.stringify(
        input.messages
      )}. Respond to the latest message.`;

    try {
        console.log(`Trying streaming chat with primary model: ${flashModel}`);
        const {stream} = ai.generateStream({
          model: flashModel,
          tools: [searchRadiopaediaTool],
          system: systemPrompt,
          prompt: userPrompt,
        });
        return toReadableStream(stream);
    } catch (error) {
        console.warn(`Primary streaming model (${flashModel}) failed. Retrying with fallback: ${proModel}. Error:`, error);
        const {stream} = ai.generateStream({
          model: proModel,
          tools: [searchRadiopaediaTool],
          system: systemPrompt,
          prompt: userPrompt,
        });
        return toReadableStream(stream);
    }
}

// Helper to convert Genkit stream to a ReadableStream
function toReadableStream(genkitStream: AsyncGenerator<any>) {
    const outputStream = new ReadableStream({
        async start(controller) {
            const encoder = new TextEncoder();
            for await (const chunk of genkitStream) {
                controller.enqueue(encoder.encode(chunk.text));
            }
            controller.close();
        }
    });
    return outputStream;
}
