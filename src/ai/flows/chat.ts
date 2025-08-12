
'use server';

/**
 * @fileOverview A Genkit flow for handling general chat interactions with the AI radiologist assistant.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { aiAssistedDiagnosis } from './ai-assisted-diagnosis';
import { searchClinicalKnowledgeBase } from '@/services/synapse-wrapper-api';
import type { ChatInput } from '@/ai/types';
import { textToSpeechFlow } from './text-to-speech';


const searchKnowledgeBaseTool = ai.defineTool(
  {
    name: 'searchClinicalKnowledgeBaseForChat',
    description:
      'Searches the Synapse API to access a clinical knowledge base for definitions of radiological terms. Use this when the user asks a question about a specific medical term or finding.',
    inputSchema: z.object({
      term: z.string().describe('The radiological term to search for.'),
    }),
    outputSchema: z.string(),
  },
  async (input) => searchClinicalKnowledgeBase(input.term)
);

async function chat(input: ChatInput) {
    if (input.media) {
      // If there's an image, we go straight to the diagnosis flow.
      const diagnosis = await aiAssistedDiagnosis({
        radiologyMediaDataUris: [input.media.url],
        mediaType: 'image',
      });
      
      // Format the structured output into a conversational response.
      const conversationalResponse = `I've analyzed the scan. Here's what I found:

**Primary Suggestion:** ${diagnosis.primarySuggestion}

**Potential Areas of Interest:** ${diagnosis.potentialAreasOfInterest}

**Key Measurements:**
${diagnosis.measurements?.map(m => `- ${m.structure}: ${m.measurement}`).join('\n') || 'No specific measurements taken.'}

I've also attached my detailed reasoning and any relevant knowledge base lookups to the side panel for your review. Let me know if you'd like me to draft a full report.`;

      const audioUrl = await textToSpeechFlow(conversationalResponse);
      return {text: conversationalResponse, audioUrl};
    }

    // If no image, proceed with a conversational flow.
    // "Flash-then-Pro" strategy: Try the faster model first, and if it fails, fallback to the more powerful one.
    const flashModel = 'googleai/gemini-1.5-flash-latest';
    const proModel = 'googleai/gemini-1.5-pro-latest';
    
    const systemPrompt = `You are Synapse AI, an expert radiologist co-pilot. 
        Your role is to assist human radiologists by answering questions, researching terms, and analyzing medical scans.
        Be concise, accurate, and professional. 
        When you use a tool to find information, cite your source by stating "According to the Clinical Knowledge Base..." or similar.
        If the user asks you to perform a task you cannot do (like giving medical advice directly to a patient), politely decline and explain your role as an assistant for medical professionals.`;
    
    const userPrompt = `The user's message history is: ${JSON.stringify(
        input.messages
      )}. Respond to the latest message.`;

    try {
        console.log(`Trying conversational chat with primary model: ${flashModel}`);
        const llmResponse = await ai.generate({
          model: flashModel,
          tools: [searchKnowledgeBaseTool],
          system: systemPrompt,
          prompt: userPrompt,
        });
        const audioUrl = await textToSpeechFlow(llmResponse.text);
        return {text: llmResponse.text, audioUrl};
    } catch (error) {
        console.warn(`Primary chat model (${flashModel}) failed. Retrying with fallback: ${proModel}. Error:`, error);
        const llmResponse = await ai.generate({
          model: proModel,
          tools: [searchKnowledgeBaseTool],
          system: systemPrompt,
          prompt: userPrompt,
        });
        const audioUrl = await textToSpeechFlow(llmResponse.text);
        return {text: llmResponse.text, audioUrl};
    }
}

export async function chatStream(input: ChatInput) {
    const readableStream = new ReadableStream({
        async start(controller) {
            const encoder = new TextEncoder();
            
            if (input.media) {
                const response = await chat(input);
                controller.enqueue(encoder.encode(JSON.stringify(response)));
                controller.close();
                return;
            }

            const flashModel = 'googleai/gemini-1.5-flash-latest';
            const proModel = 'googleai/gemini-1.5-pro-latest';

            const systemPrompt = `You are Synapse AI, an expert radiologist co-pilot. Your role is to assist human radiologists by answering questions, researching terms, and analyzing medical scans. Be concise, accurate, and professional. When you use a tool to find information, cite your source by stating "According to the Clinical Knowledge Base..." or similar. If you are asked to perform a task you cannot do (like giving medical advice directly to a patient), politely decline and explain your role as an assistant for medical professionals.`;
            const userPrompt = `The user's message history is: ${JSON.stringify(input.messages)}. Respond to the latest message.`;

            let stream;
            try {
                console.log(`Trying streaming chat with primary model: ${flashModel}`);
                const result = ai.generateStream({
                    model: flashModel,
                    tools: [searchKnowledgeBaseTool],
                    system: systemPrompt,
                    prompt: userPrompt,
                });
                stream = result.stream;
            } catch (error) {
                console.warn(`Primary streaming model (${flashModel}) failed. Retrying with fallback: ${proModel}. Error:`, error);
                const result = ai.generateStream({
                    model: proModel,
                    tools: [searchKnowledgeBaseTool],
                    system: systemPrompt,
                    prompt: userPrompt,
                });
                stream = result.stream;
            }

            let fullText = "";
            for await (const chunk of stream) {
                if (chunk.text) {
                    fullText += chunk.text;
                    controller.enqueue(encoder.encode(JSON.stringify({ text: chunk.text })));
                }
            }
            
            const audioUrl = await textToSpeechFlow(fullText);
            controller.enqueue(encoder.encode(JSON.stringify({ audioUrl })));

            controller.close();
        }
    });

    return readableStream;
}
