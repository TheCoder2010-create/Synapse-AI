
'use server';

/**
 * @fileOverview A Genkit flow for AI-assisted diagnosis of radiology images.
 *
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import { searchClinicalKnowledgeBase, searchDrugInfo } from '@/services/synapse-wrapper-api';
import { searchTCIADatasets } from '@/services/tcia';
import { searchImaiosAnatomy } from '@/services/imaios';
import { searchOpenI } from '@/services/openi';
import { findCaseExamplesTool } from '@/ai/tools/find-case-examples';
import { searchXNAT } from '@/services/xnat';
import { withMedicalRetry, MedicalAIError, MedicalErrorCode, MedicalErrorSeverity } from '@/lib/medical-errors';
import { PerformanceMonitor } from '@/lib/performance-monitoring';
import {
  AiAssistedDiagnosisInput,
  AiAssistedDiagnosisInputSchema,
  AiAssistedDiagnosisOutput,
  AiAssistedDiagnosisOutputSchema
} from '@/ai/types';
import { diagnosisSystemPrompt, diagnosisUserPrompt } from '@/ai/prompts/diagnosis-prompt';


const searchKnowledgeBaseTool = ai.defineTool(
  {
    name: 'searchClinicalKnowledgeBase',
    description: 'Searches the proprietary Synapse API to access clinical knowledge bases for definitions and context of specific radiological terms. Use this to clarify findings like "Pneumothorax" or "Atelectasis".',
    inputSchema: z.object({ term: z.string().describe('The radiological term to search for (e.g., "Pneumothorax").') }),
    outputSchema: z.string(),
  },
  async (input) => searchClinicalKnowledgeBase(input.term)
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

const searchDrugInfoTool = ai.defineTool(
    {
        name: 'searchDrugInfo',
        description: 'Searches a pharmaceutical database for information on a given drug, including its generic/brand names and indications. Use this if a drug is mentioned in patient history or is relevant to a finding.',
        inputSchema: z.object({ drugName: z.string().describe('The brand or generic name of the drug.') }),
        outputSchema: z.string(),
    },
    async (input) => searchDrugInfo(input.drugName)
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
  tools: [searchKnowledgeBaseTool, searchTCIATool, searchImaiosAnatomyTool, searchOpenITool, findCaseExamplesTool, searchXNATTool, searchDrugInfoTool],
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
    const performanceMonitor = PerformanceMonitor.getInstance();
    
    // Determine modality and anatomy from input
    const modality = input.isDicom ? 'DICOM' : input.mediaType === 'video' ? 'Fluoroscopy' : 'Image';
    const anatomy = 'Unknown'; // Would be determined from image analysis in production
    
    const timer = performanceMonitor.startDiagnosisTimer({
      modality,
      anatomy,
      caseId: `case_${Date.now()}`,
      userId: 'system' // Would come from user context
    });

    return withMedicalRetry(
      async () => {
        const primaryModel = 'googleai/gemini-1.5-pro-latest';
        const fallbackModel = 'googleai/gemini-1.5-flash-latest';

        let result;
        try {
          console.log(`AI Diagnosis: Trying primary model: ${primaryModel}`);
          result = await prompt(input, { model: primaryModel });
        } catch (primaryError) {
          console.warn(`Primary model failed. Retrying with fallback: ${fallbackModel}. Error:`, primaryError);
          
          // Check if this is a critical error that shouldn't be retried
          if (primaryError instanceof Error && primaryError.message.includes('image quality')) {
            throw new MedicalAIError(
              'Image quality insufficient for reliable diagnosis',
              MedicalErrorCode.INSUFFICIENT_IMAGE_QUALITY,
              MedicalErrorSeverity.HIGH,
              { originalError: primaryError.message },
              false
            );
          }
          
          result = await prompt(input, { model: fallbackModel });
        }
        
        const { output } = result;
        if (!output) {
          throw new MedicalAIError(
            'AI model returned empty diagnostic output',
            MedicalErrorCode.MODEL_PROCESSING_ERROR,
            MedicalErrorSeverity.MEDIUM,
            { input: { mediaCount: input.radiologyMediaDataUris.length, mediaType: input.mediaType } }
          );
        }

        // Validate output quality
        if (output.confidence < 0.3) {
          throw new MedicalAIError(
            `Diagnostic confidence too low: ${(output.confidence * 100).toFixed(1)}%`,
            MedicalErrorCode.MODEL_CONFIDENCE_LOW,
            MedicalErrorSeverity.HIGH,
            { confidence: output.confidence, primarySuggestion: output.primarySuggestion }
          );
        }

        // Check for critical findings that need urgent attention
        const criticalKeywords = ['hemorrhage', 'pneumothorax', 'aortic dissection', 'stroke', 'fracture'];
        const hasCriticalFinding = criticalKeywords.some(keyword => 
          output.primarySuggestion.toLowerCase().includes(keyword) ||
          output.potentialAreasOfInterest.toLowerCase().includes(keyword)
        );

        if (hasCriticalFinding && output.clinicalCorrelation.urgency !== 'emergent') {
          console.warn('Critical finding detected but urgency not set to emergent');
        }

        // Record performance metrics
        const metrics = timer.finish({
          confidenceScore: output.confidence,
          imageQualityScore: output.qualityAssessment.imageQuality === 'excellent' ? 1.0 :
                           output.qualityAssessment.imageQuality === 'good' ? 0.8 :
                           output.qualityAssessment.imageQuality === 'adequate' ? 0.6 : 0.4,
          diagnosticComplexity: output.differentialDiagnoses?.length || 1,
          modelTokenUsage: 1000 // Would be actual token count from model
        });

        console.log(`AI Diagnosis completed successfully: ${output.primarySuggestion} (Confidence: ${(output.confidence * 100).toFixed(1)}%)`);
        
        return output;
      },
      'AI-assisted diagnosis',
      {
        maxAttempts: 3,
        retryableErrors: [
          MedicalErrorCode.MODEL_PROCESSING_ERROR,
          MedicalErrorCode.EXTERNAL_SERVICE_TIMEOUT,
          MedicalErrorCode.KNOWLEDGE_BASE_UNAVAILABLE
        ]
      }
    );
  }
);
