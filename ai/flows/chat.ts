
'use server';

/**
 * @fileOverview A Genkit flow for handling general chat interactions with the AI radiologist assistant.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { aiAssistedDiagnosis } from './ai-assisted-diagnosis';
import { searchClinicalKnowledgeBase } from '@/services/synapse-wrapper-api';
import type { ChatInput } from '@/ai/types';
import { textToSpeechFlow, medicalTextToSpeech } from './text-to-speech';
import { ConversationMemoryManager } from '@/lib/conversation-memory';
import { PerformanceMonitor } from '@/lib/performance-monitoring';


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

async function chat(input: ChatInput, sessionId: string = 'default') {
    const memoryManager = ConversationMemoryManager.getInstance();
    const performanceMonitor = PerformanceMonitor.getInstance();
    const startTime = performance.now();

    if (input.media) {
      // If there's an image, we go straight to the diagnosis flow.
      const diagnosis = await aiAssistedDiagnosis({
        radiologyMediaDataUris: [input.media.url],
        isDicom: input.media.contentType === 'application/dicom',
        mediaType: 'image',
      });
      
      // Update conversation context with case information
      const caseId = `case_${Date.now()}`;
      memoryManager.updateCaseContext(sessionId, {
        caseId,
        modality: input.media.contentType === 'application/dicom' ? 'DICOM' : 'Image',
        anatomy: 'Unknown', // Would be determined from diagnosis
        primaryDiagnosis: diagnosis.primarySuggestion,
        confidence: diagnosis.confidence,
        keyFindings: diagnosis.reasoningProcess.keyFindings,
        measurements: diagnosis.measurements?.map(m => ({
          structure: m.structure,
          value: m.measurement,
          significance: m.significance
        })) || []
      });
      
      // Format the structured output into a conversational response.
      const conversationalResponse = `I've analyzed the scan. Here's what I found:

**Primary Suggestion:** ${diagnosis.primarySuggestion} (Confidence: ${(diagnosis.confidence * 100).toFixed(1)}%)

**Potential Areas of Interest:** ${diagnosis.potentialAreasOfInterest}

**Key Measurements:**
${diagnosis.measurements?.map(m => `- ${m.structure}: ${m.measurement} (${m.significance})`).join('\n') || 'No specific measurements taken.'}

${diagnosis.clinicalCorrelation.urgency === 'emergent' ? '🚨 **URGENT**: This case requires immediate clinical attention.' : ''}

I've also attached my detailed reasoning and any relevant knowledge base lookups to the side panel for your review. Let me know if you'd like me to draft a full report.`;

      // Add message to conversation history
      memoryManager.addMessage(sessionId, {
        role: 'assistant',
        text: conversationalResponse,
        context: {
          caseId,
          confidence: diagnosis.confidence,
          mediaAttached: true
        }
      });

      // Use medical-optimized TTS
      const audioUrl = await medicalTextToSpeech(conversationalResponse);
      
      // Record chat metrics
      const responseTime = performance.now() - startTime;
      performanceMonitor.recordChatMetrics({
        responseTime,
        messageLength: conversationalResponse.length,
        toolsUsed: 1, // diagnosis tool
        streamingLatency: 0,
        audioGenerationTime: performance.now() - startTime,
        modelTokenUsage: 2000, // Estimated
        conversationTurn: input.messages.length + 1,
        timestamp: new Date()
      });

      return {text: conversationalResponse, audioUrl};
    }

    // If no image, proceed with a conversational flow with memory context
    const context = memoryManager.getOrCreateContext(sessionId);
    const contextualPrompt = memoryManager.getContextualPrompt(sessionId);
    
    // "Flash-then-Pro" strategy: Try the faster model first, and if it fails, fallback to the more powerful one.
    const flashModel = 'googleai/gemini-1.5-flash-latest';
    const proModel = 'googleai/gemini-1.5-pro-latest';
    
    const systemPrompt = `You are Synapse AI, an expert radiologist co-pilot with access to conversation history and case context.
        
        Your role is to assist human radiologists by answering questions, researching terms, and analyzing medical scans.
        Be concise, accurate, and professional. 
        When you use a tool to find information, cite your source by stating "According to the Clinical Knowledge Base..." or similar.
        If the user asks you to perform a task you cannot do (like giving medical advice directly to a patient), politely decline and explain your role as an assistant for medical professionals.
        
        CONVERSATION CONTEXT:
        ${contextualPrompt}
        
        Use this context to provide more relevant and personalized responses. Reference previous discussions when appropriate.`;
    
    const userPrompt = `The user's message history is: ${JSON.stringify(
        input.messages
      )}. Respond to the latest message with awareness of the conversation context.`;

    try {
        console.log(`Trying conversational chat with primary model: ${flashModel}`);
        const llmResponse = await ai.generate({
          model: flashModel,
          tools: [searchKnowledgeBaseTool],
          system: systemPrompt,
          prompt: userPrompt,
        });
        
        // Add messages to conversation history
        const userMessage = input.messages[input.messages.length - 1];
        if (userMessage) {
          memoryManager.addMessage(sessionId, {
            role: userMessage.role,
            text: userMessage.text
          });
        }
        
        memoryManager.addMessage(sessionId, {
          role: 'assistant',
          text: llmResponse.text,
          context: {
            toolsUsed: ['searchKnowledgeBase']
          }
        });
        
        // Use user's preferred voice settings if available
        const voiceConfig = context.preferences.voiceConfig;
        const audioUrl = await medicalTextToSpeech(llmResponse.text, voiceConfig);
        
        // Record metrics
        const responseTime = performance.now() - startTime;
        performanceMonitor.recordChatMetrics({
          responseTime,
          messageLength: llmResponse.text.length,
          toolsUsed: 1,
          streamingLatency: 0,
          audioGenerationTime: performance.now() - startTime,
          modelTokenUsage: 1500, // Estimated
          conversationTurn: input.messages.length + 1,
          timestamp: new Date()
        });
        
        return {text: llmResponse.text, audioUrl};
    } catch (error) {
        console.warn(`Primary chat model (${flashModel}) failed. Retrying with fallback: ${proModel}. Error:`, error);
        const llmResponse = await ai.generate({
          model: proModel,
          tools: [searchKnowledgeBaseTool],
          system: systemPrompt,
          prompt: userPrompt,
        });
        
        const audioUrl = await medicalTextToSpeech(llmResponse.text, context.preferences.voiceConfig);
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
