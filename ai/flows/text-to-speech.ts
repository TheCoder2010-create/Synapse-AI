
'use server';
/**
 * @fileOverview A Genkit flow for converting text to speech.
 */
import { ai } from '@/ai/genkit';
import { googleAI } from '@genkit-ai/googleai';
import { z } from 'zod';
import wav from 'wav';

export const VoiceConfigSchema = z.object({
  voiceName: z.enum(['Algenib', 'Vega', 'Altair', 'Polaris', 'Sirius']).default('Algenib').describe('Voice selection for text-to-speech'),
  speed: z.number().min(0.5).max(2.0).default(1.0).describe('Speech speed multiplier (0.5-2.0)'),
  pitch: z.number().min(-20).max(20).default(0).describe('Pitch adjustment in semitones (-20 to +20)'),
  volume: z.number().min(0.1).max(1.0).default(0.8).describe('Volume level (0.1-1.0)'),
  medicalTerminologyMode: z.boolean().default(true).describe('Enable enhanced pronunciation for medical terminology')
});

export type VoiceConfig = z.infer<typeof VoiceConfigSchema>;

export const TextToSpeechInputSchema = z.object({
  text: z.string().describe('Text to convert to speech'),
  voiceConfig: VoiceConfigSchema.optional().describe('Voice configuration options')
});

export type TextToSpeechInput = z.infer<typeof TextToSpeechInputSchema>;

async function toWav(
  pcmData: Buffer,
  channels = 1,
  rate = 24000,
  sampleWidth = 2
): Promise<string> {
  return new Promise((resolve, reject) => {
    const writer = new wav.Writer({
      channels,
      sampleRate: rate,
      bitDepth: sampleWidth * 8,
    });

    let bufs: any[] = [];
    writer.on('error', reject);
    writer.on('data', function (d) {
      bufs.push(d);
    });
    writer.on('end', function () {
      resolve(Buffer.concat(bufs).toString('base64'));
    });

    writer.write(pcmData);
    writer.end();
  });
}

/**
 * Enhanced medical terminology pronunciation
 */
function preprocessMedicalText(text: string, medicalMode: boolean): string {
  if (!medicalMode) return text;
  
  // Medical pronunciation mappings
  const medicalPronunciations: Record<string, string> = {
    'pneumothorax': 'new-mo-THOR-ax',
    'pneumonia': 'new-MOAN-ya',
    'atelectasis': 'at-uh-LEK-tuh-sis',
    'bronchiectasis': 'brong-kee-EK-tuh-sis',
    'emphysema': 'em-fuh-SEE-muh',
    'pleural': 'PLOOR-al',
    'pericardial': 'pair-ih-CAR-dee-al',
    'myocardial': 'my-oh-CAR-dee-al',
    'hepatomegaly': 'hep-uh-toe-MEG-uh-lee',
    'splenomegaly': 'splee-no-MEG-uh-lee',
    'lymphadenopathy': 'lim-fad-uh-NOP-uh-thee',
    'adenocarcinoma': 'ad-uh-no-car-sih-NO-muh',
    'glioblastoma': 'glee-oh-blas-TOE-muh',
    'meningioma': 'meh-nin-jee-OH-muh'
  };
  
  let processedText = text;
  
  // Replace medical terms with phonetic pronunciations
  Object.entries(medicalPronunciations).forEach(([term, pronunciation]) => {
    const regex = new RegExp(`\\b${term}\\b`, 'gi');
    processedText = processedText.replace(regex, pronunciation);
  });
  
  // Add pauses after measurements for clarity
  processedText = processedText.replace(/(\d+\.?\d*\s*(mm|cm|m|inches?|feet))/gi, '$1... ');
  
  // Add emphasis to critical findings
  processedText = processedText.replace(/\b(critical|urgent|emergent|immediate)\b/gi, '**$1**');
  
  return processedText;
}

/**
 * Cache for generated audio to improve performance
 */
const audioCache = new Map<string, string>();
const MAX_CACHE_SIZE = 100;

function getCacheKey(text: string, config: VoiceConfig): string {
  return `${text.substring(0, 100)}_${config.voiceName}_${config.speed}_${config.pitch}`;
}

export const textToSpeechFlow = ai.defineFlow(
  {
    name: 'textToSpeechFlow',
    inputSchema: TextToSpeechInputSchema,
    outputSchema: z.string(),
  },
  async (input) => {
    const text = typeof input === 'string' ? input : input.text;
    const voiceConfig = typeof input === 'object' ? input.voiceConfig : undefined;
    
    // Use default voice config if not provided
    const config: VoiceConfig = {
      voiceName: 'Algenib',
      speed: 1.0,
      pitch: 0,
      volume: 0.8,
      medicalTerminologyMode: true,
      ...voiceConfig
    };
    
    // Check cache first
    const cacheKey = getCacheKey(text, config);
    if (audioCache.has(cacheKey)) {
      console.log('TTS: Using cached audio');
      return audioCache.get(cacheKey)!;
    }
    
    // Preprocess text for medical terminology
    const processedText = preprocessMedicalText(text, config.medicalTerminologyMode);
    
    try {
      const { media } = await ai.generate({
        model: googleAI.model('gemini-2.5-flash-preview-tts'),
        config: {
          responseModalities: ['AUDIO'],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { 
                voiceName: config.voiceName 
              },
            },
            // Note: Gemini TTS may not support all these parameters yet
            // This is a forward-looking implementation
            audioConfig: {
              audioEncoding: 'LINEAR16',
              sampleRateHertz: 24000,
              speakingRate: config.speed,
              pitch: config.pitch,
              volumeGainDb: Math.log10(config.volume) * 20, // Convert to dB
            }
          },
        },
        prompt: processedText,
      });
      
      if (!media) {
        throw new Error('No media returned from TTS model');
      }
      
      const audioBuffer = Buffer.from(
        media.url.substring(media.url.indexOf(',') + 1),
        'base64'
      );
      
      const wavBase64 = await toWav(audioBuffer);
      const audioDataUri = `data:audio/wav;base64,${wavBase64}`;
      
      // Cache the result
      if (audioCache.size >= MAX_CACHE_SIZE) {
        // Remove oldest entry
        const firstKey = audioCache.keys().next().value;
        audioCache.delete(firstKey);
      }
      audioCache.set(cacheKey, audioDataUri);
      
      console.log(`TTS: Generated audio for ${text.length} characters using voice ${config.voiceName}`);
      return audioDataUri;
      
    } catch (error) {
      console.error('TTS generation failed:', error);
      
      // Fallback: return a simple error message
      throw new Error(`Text-to-speech generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
);

// Convenience function for simple text-to-speech (backward compatibility)
export async function simpleTextToSpeech(text: string): Promise<string> {
  return textToSpeechFlow({ text });
}

// Function for medical-optimized speech
export async function medicalTextToSpeech(
  text: string, 
  voiceConfig?: Partial<VoiceConfig>
): Promise<string> {
  return textToSpeechFlow({
    text,
    voiceConfig: {
      medicalTerminologyMode: true,
      voiceName: 'Algenib', // Professional voice for medical content
      speed: 0.9, // Slightly slower for medical terminology
      ...voiceConfig
    }
  });
}

// Function to clear TTS cache
export function clearTTSCache(): void {
  audioCache.clear();
  console.log('TTS cache cleared');
}

// Function to get TTS cache stats
export function getTTSCacheStats(): { size: number; maxSize: number } {
  return {
    size: audioCache.size,
    maxSize: MAX_CACHE_SIZE
  };
}
