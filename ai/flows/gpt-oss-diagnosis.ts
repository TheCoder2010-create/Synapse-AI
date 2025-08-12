'use server';

/**
 * @fileOverview GPT-OSS-120B Diagnosis Flow
 * Alternative AI diagnosis flow using local GPT-OSS model
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { GPTOSSManager } from '@/services/gpt-oss-integration';
import { searchClinicalKnowledgeBase } from '@/services/synapse-wrapper-api';
import { withMedicalRetry, MedicalAIError, MedicalErrorCode, MedicalErrorSeverity } from '@/lib/medical-errors';
import { PerformanceMonitor } from '@/lib/performance-monitoring';
import {
  AiAssistedDiagnosisInput,
  AiAssistedDiagnosisInputSchema,
  AiAssistedDiagnosisOutput,
  AiAssistedDiagnosisOutputSchema
} from '@/ai/types';

export async function gptOssDiagnosis(
  input: AiAssistedDiagnosisInput
): Promise<AiAssistedDiagnosisOutput> {
  return gptOssDiagnosisFlow(input);
}

const gptOssDiagnosisFlow = ai.defineFlow(
  {
    name: 'gptOssDiagnosisFlow',
    inputSchema: AiAssistedDiagnosisInputSchema,
    outputSchema: AiAssistedDiagnosisOutputSchema,
  },
  async (input) => {
    const performanceMonitor = PerformanceMonitor.getInstance();
    const gptOssManager = GPTOSSManager.getInstance();
    
    const modality = input.isDicom ? 'DICOM' : input.mediaType === 'video' ? 'Fluoroscopy' : 'Image';
    const anatomy = 'Unknown';
    
    const timer = performanceMonitor.startDiagnosisTimer({
      modality,
      anatomy,
      caseId: `gpt_oss_case_${Date.now()}`,
      userId: 'system'
    });

    return withMedicalRetry(
      async () => {
        console.log('🧠 Using GPT-OSS-120B for AI diagnosis...');
        
        // Create comprehensive medical prompt
        const medicalPrompt = createMedicalDiagnosisPrompt(input);
        
        // Generate diagnosis using GPT-OSS
        const gptOssResponse = await gptOssManager.generate(medicalPrompt, {
          temperature: 0.1, // Low temperature for medical accuracy
          maxTokens: 2048,
          topP: 0.9
        });

        // Parse and structure the response
        const structuredOutput = await parseGptOssResponse(gptOssResponse.text, input);
        
        // Validate output quality
        if (structuredOutput.confidence < 0.3) {
          throw new MedicalAIError(
            `GPT-OSS diagnostic confidence too low: ${(structuredOutput.confidence * 100).toFixed(1)}%`,
            MedicalErrorCode.MODEL_CONFIDENCE_LOW,
            MedicalErrorSeverity.HIGH,
            { confidence: structuredOutput.confidence, model: 'gpt-oss-120b' }
          );
        }

        // Record performance metrics
        timer.finish({
          confidenceScore: structuredOutput.confidence,
          imageQualityScore: structuredOutput.qualityAssessment.imageQuality === 'excellent' ? 1.0 : 0.8,
          diagnosticComplexity: structuredOutput.differentialDiagnoses?.length || 1,
          modelTokenUsage: gptOssResponse.tokens
        });

        console.log(`✅ GPT-OSS diagnosis completed: ${structuredOutput.primarySuggestion} (Confidence: ${(structuredOutput.confidence * 100).toFixed(1)}%)`);
        
        return structuredOutput;
      },
      'GPT-OSS AI diagnosis',
      {
        maxAttempts: 2,
        retryableErrors: [
          MedicalErrorCode.MODEL_PROCESSING_ERROR,
          MedicalErrorCode.PROCESSING_TIMEOUT
        ]
      }
    );
  }
);

/**
 * Create comprehensive medical diagnosis prompt for GPT-OSS
 */
function createMedicalDiagnosisPrompt(input: AiAssistedDiagnosisInput): string {
  const mediaInfo = `${input.radiologyMediaDataUris.length} ${input.mediaType} file(s)`;
  const dicomInfo = input.isDicom ? ' (DICOM format)' : '';
  
  return `You are an expert radiologist AI assistant. Analyze the provided medical imaging data and provide a comprehensive diagnostic assessment.

IMAGING DATA:
- Media Type: ${input.mediaType}${dicomInfo}
- Number of Images/Frames: ${input.radiologyMediaDataUris.length}
${input.segmentationData ? '- Segmentation Data: Available (focus analysis on segmented regions)' : ''}

REQUIRED OUTPUT FORMAT:
Please provide your analysis in the following structured format:

PRIMARY DIAGNOSIS:
[Specific radiological diagnosis using formal medical terminology]

CONFIDENCE LEVEL:
[Numerical confidence from 0.0 to 1.0]

DIFFERENTIAL DIAGNOSES:
1. [Alternative diagnosis 1] (Probability: X.X)
   - Supporting features: [list]
   - Excluding features: [list]
2. [Alternative diagnosis 2] (Probability: X.X)
   - Supporting features: [list]

KEY FINDINGS:
- [Finding 1 with anatomical location]
- [Finding 2 with anatomical location]
- [Finding 3 with anatomical location]

MEASUREMENTS:
- [Structure]: [Measurement with units] ([Normal/Borderline/Abnormal])
- [Structure]: [Measurement with units] ([Normal/Borderline/Abnormal])

CLINICAL CORRELATION:
- Urgency Level: [Routine/Urgent/Emergent]
- Recommended Follow-up: [Specific recommendations]
- Clinical Questions: [Questions for referring physician]

REASONING PROCESS:
Initial Observations: [What you see in the images]
Systematic Analysis: [Organ-by-organ or region-by-region review]
Key Abnormalities: [List of significant abnormal findings]
Final Justification: [Why you arrived at the primary diagnosis]

IMAGE QUALITY ASSESSMENT:
- Quality: [Excellent/Good/Adequate/Poor/Non-diagnostic]
- Limitations: [Any technical limitations affecting interpretation]
- Completeness: [Score from 0.0 to 1.0]

Please analyze the imaging data and provide your comprehensive assessment following this exact format.`;
}

/**
 * Parse GPT-OSS response into structured output
 */
async function parseGptOssResponse(
  responseText: string, 
  input: AiAssistedDiagnosisInput
): Promise<AiAssistedDiagnosisOutput> {
  // Parse the structured response from GPT-OSS
  const sections = parseResponseSections(responseText);
  
  // Extract primary diagnosis and confidence
  const primarySuggestion = sections.primaryDiagnosis || 'Unable to determine specific diagnosis';
  const confidence = parseFloat(sections.confidenceLevel) || 0.5;
  
  // Parse differential diagnoses
  const differentialDiagnoses = parseDifferentialDiagnoses(sections.differentialDiagnoses);
  
  // Parse measurements
  const measurements = parseMeasurements(sections.measurements);
  
  // Parse clinical correlation
  const clinicalCorrelation = parseClinicalCorrelation(sections.clinicalCorrelation);
  
  // Parse reasoning process
  const reasoningProcess = parseReasoningProcess(sections.reasoningProcess);
  
  // Parse quality assessment
  const qualityAssessment = parseQualityAssessment(sections.imageQualityAssessment);
  
  // Enhance with knowledge base lookups for key terms
  const keyTerms = extractMedicalTerms(primarySuggestion);
  const knowledgeLookups = await performKnowledgeLookups(keyTerms);

  return {
    primarySuggestion,
    confidence,
    differentialDiagnoses,
    potentialAreasOfInterest: sections.keyFindings || 'No additional areas of interest identified',
    measurements,
    clinicalCorrelation,
    reasoningProcess,
    qualityAssessment,
    ...knowledgeLookups
  };
}

/**
 * Parse response into sections
 */
function parseResponseSections(responseText: string): Record<string, string> {
  const sections: Record<string, string> = {};
  const lines = responseText.split('\n');
  let currentSection = '';
  let currentContent = '';
  
  for (const line of lines) {
    const trimmedLine = line.trim();
    
    if (trimmedLine.endsWith(':') && trimmedLine.length < 50) {
      // Save previous section
      if (currentSection) {
        sections[currentSection.toLowerCase().replace(/\s+/g, '')] = currentContent.trim();
      }
      
      // Start new section
      currentSection = trimmedLine.slice(0, -1);
      currentContent = '';
    } else {
      currentContent += line + '\n';
    }
  }
  
  // Save last section
  if (currentSection) {
    sections[currentSection.toLowerCase().replace(/\s+/g, '')] = currentContent.trim();
  }
  
  return sections;
}

/**
 * Parse differential diagnoses from text
 */
function parseDifferentialDiagnoses(text: string): AiAssistedDiagnosisOutput['differentialDiagnoses'] {
  if (!text) return [];
  
  const differentials: AiAssistedDiagnosisOutput['differentialDiagnoses'] = [];
  const lines = text.split('\n').filter(line => line.trim());
  
  for (const line of lines) {
    const match = line.match(/(\d+)\.\s*(.+?)\s*\(Probability:\s*([\d.]+)\)/);
    if (match) {
      const [, , diagnosis, probability] = match;
      
      // Extract supporting and excluding features
      const supportingMatch = text.match(new RegExp(`${diagnosis}[\\s\\S]*?Supporting features:\\s*\\[([^\\]]+)\\]`));
      const excludingMatch = text.match(new RegExp(`${diagnosis}[\\s\\S]*?Excluding features:\\s*\\[([^\\]]+)\\]`));
      
      differentials.push({
        diagnosis: diagnosis.trim(),
        probability: parseFloat(probability),
        supportingFeatures: supportingMatch ? supportingMatch[1].split(',').map(f => f.trim()) : [],
        excludingFeatures: excludingMatch ? excludingMatch[1].split(',').map(f => f.trim()) : []
      });
    }
  }
  
  return differentials;
}

/**
 * Parse measurements from text
 */
function parseMeasurements(text: string): AiAssistedDiagnosisOutput['measurements'] {
  if (!text) return [];
  
  const measurements: AiAssistedDiagnosisOutput['measurements'] = [];
  const lines = text.split('\n').filter(line => line.trim() && line.includes(':'));
  
  for (const line of lines) {
    const match = line.match(/^-?\s*(.+?):\s*(.+?)\s*\(([^)]+)\)/);
    if (match) {
      const [, structure, measurement, significance] = match;
      
      measurements.push({
        structure: structure.trim(),
        measurement: measurement.trim(),
        significance: significance.toLowerCase() as 'normal' | 'borderline' | 'abnormal' | 'critical',
        referenceRange: 'Reference range not specified'
      });
    }
  }
  
  return measurements;
}

/**
 * Parse clinical correlation
 */
function parseClinicalCorrelation(text: string): AiAssistedDiagnosisOutput['clinicalCorrelation'] {
  const urgencyMatch = text?.match(/Urgency Level:\s*(\w+)/i);
  const followUpMatch = text?.match(/Recommended Follow-up:\s*(.+?)(?:\n|$)/i);
  const questionsMatch = text?.match(/Clinical Questions:\s*(.+?)(?:\n|$)/i);
  
  return {
    recommendedFollowUp: followUpMatch ? [followUpMatch[1].trim()] : [],
    clinicalQuestions: questionsMatch ? [questionsMatch[1].trim()] : [],
    urgency: (urgencyMatch?.[1]?.toLowerCase() as 'routine' | 'urgent' | 'emergent') || 'routine'
  };
}

/**
 * Parse reasoning process
 */
function parseReasoningProcess(text: string): AiAssistedDiagnosisOutput['reasoningProcess'] {
  const initialMatch = text?.match(/Initial Observations:\s*(.+?)(?:\n|Systematic)/s);
  const systematicMatch = text?.match(/Systematic Analysis:\s*(.+?)(?:\n|Key)/s);
  const keyFindingsMatch = text?.match(/Key Abnormalities:\s*(.+?)(?:\n|Final)/s);
  const justificationMatch = text?.match(/Final Justification:\s*(.+?)(?:\n|$)/s);
  
  return {
    initialObservations: initialMatch?.[1]?.trim() || 'Initial observations not specified',
    systematicAnalysis: systematicMatch?.[1]?.trim() || 'Systematic analysis not provided',
    keyFindings: keyFindingsMatch?.[1]?.split('\n').map(f => f.trim()).filter(f => f) || [],
    justification: justificationMatch?.[1]?.trim() || 'Justification not provided',
    uncertainties: []
  };
}

/**
 * Parse quality assessment
 */
function parseQualityAssessment(text: string): AiAssistedDiagnosisOutput['qualityAssessment'] {
  const qualityMatch = text?.match(/Quality:\s*(\w+)/i);
  const limitationsMatch = text?.match(/Limitations:\s*(.+?)(?:\n|Completeness)/s);
  const completenessMatch = text?.match(/Completeness:\s*([\d.]+)/);
  
  return {
    imageQuality: (qualityMatch?.[1]?.toLowerCase() as any) || 'adequate',
    limitations: limitationsMatch ? [limitationsMatch[1].trim()] : [],
    completeness: parseFloat(completenessMatch?.[1] || '0.8')
  };
}

/**
 * Extract medical terms for knowledge base lookup
 */
function extractMedicalTerms(text: string): string[] {
  const medicalTerms = text.match(/\b[a-z]+(?:osis|itis|oma|pathy|trophy|plasia|sclerosis|stenosis|megaly)\b/gi) || [];
  return [...new Set(medicalTerms)].slice(0, 3); // Limit to 3 terms
}

/**
 * Perform knowledge base lookups
 */
async function performKnowledgeLookups(terms: string[]): Promise<{
  tciaLookups?: Array<{ term: string; summary: string }>;
  imaiosLookups?: Array<{ term: string; summary: string }>;
  openiLookups?: Array<{ term: string; summary: string }>;
}> {
  const lookups: any = {};
  
  if (terms.length > 0) {
    try {
      const knowledgeResults = await Promise.all(
        terms.map(term => searchClinicalKnowledgeBase(term))
      );
      
      lookups.tciaLookups = terms.map((term, index) => ({
        term,
        summary: knowledgeResults[index] || 'No information found'
      }));
    } catch (error) {
      console.warn('Knowledge base lookup failed:', error);
    }
  }
  
  return lookups;
}