'use server';

/**
 * @fileOverview Quality assurance flow for validating AI diagnosis accuracy and completeness
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { AiAssistedDiagnosisOutput, GenerateStructuredReportOutput } from '@/ai/types';

export const QualityAssuranceInputSchema = z.object({
  diagnosis: z.object({
    primarySuggestion: z.string(),
    confidence: z.number(),
    differentialDiagnoses: z.array(z.object({
      diagnosis: z.string(),
      probability: z.number(),
      supportingFeatures: z.array(z.string()),
      excludingFeatures: z.array(z.string()).optional()
    })).optional(),
    measurements: z.array(z.object({
      structure: z.string(),
      measurement: z.string(),
      significance: z.enum(['normal', 'borderline', 'abnormal', 'critical']),
      referenceRange: z.string().optional()
    })).optional(),
    reasoningProcess: z.object({
      initialObservations: z.string(),
      systematicAnalysis: z.string(),
      keyFindings: z.array(z.string()),
      justification: z.string(),
      uncertainties: z.array(z.string()).optional()
    }),
    qualityAssessment: z.object({
      imageQuality: z.enum(['excellent', 'good', 'adequate', 'poor', 'non-diagnostic']),
      limitations: z.array(z.string()).optional(),
      completeness: z.number()
    })
  }),
  report: z.object({
    technique: z.string(),
    findings: z.object({
      systematic: z.string(),
      abnormal: z.array(z.object({
        finding: z.string(),
        description: z.string(),
        severity: z.enum(['mild', 'moderate', 'severe', 'critical']).optional()
      })).optional(),
      normal: z.string().optional()
    }),
    impression: z.object({
      primary: z.string(),
      differential: z.array(z.string()).optional(),
      incidental: z.array(z.string()).optional()
    }),
    recommendations: z.object({
      followUp: z.array(z.string()).optional(),
      clinical: z.array(z.string()).optional(),
      urgent: z.array(z.string()).optional()
    }).optional()
  }).optional(),
  clinicalContext: z.object({
    patientAge: z.number().optional(),
    patientSex: z.enum(['M', 'F']).optional(),
    clinicalHistory: z.string().optional(),
    priorImaging: z.string().optional()
  }).optional()
});

export type QualityAssuranceInput = z.infer<typeof QualityAssuranceInputSchema>;

export const QualityAssuranceOutputSchema = z.object({
  overallQualityScore: z.number().min(0).max(1).describe('Overall quality score from 0.0 to 1.0'),
  diagnosticAccuracy: z.object({
    score: z.number().min(0).max(1).describe('Diagnostic accuracy assessment score'),
    strengths: z.array(z.string()).describe('Diagnostic strengths identified'),
    concerns: z.array(z.string()).describe('Diagnostic concerns or weaknesses'),
    confidence: z.enum(['high', 'moderate', 'low']).describe('Confidence in diagnostic accuracy')
  }),
  clinicalRelevance: z.object({
    score: z.number().min(0).max(1).describe('Clinical relevance score'),
    appropriateness: z.string().describe('Assessment of clinical appropriateness'),
    urgencyAssessment: z.enum(['appropriate', 'underestimated', 'overestimated']).describe('Urgency level assessment')
  }),
  reportQuality: z.object({
    score: z.number().min(0).max(1).describe('Report quality score'),
    completeness: z.number().min(0).max(1).describe('Report completeness score'),
    clarity: z.number().min(0).max(1).describe('Report clarity score'),
    consistency: z.number().min(0).max(1).describe('Consistency between diagnosis and report')
  }).optional(),
  criticalIssues: z.array(z.object({
    type: z.enum(['diagnostic_error', 'missing_finding', 'inappropriate_urgency', 'measurement_error', 'inconsistency']),
    description: z.string(),
    severity: z.enum(['low', 'moderate', 'high', 'critical']),
    recommendation: z.string()
  })).describe('Critical issues requiring attention'),
  recommendations: z.array(z.string()).describe('Specific recommendations for improvement'),
  validationChecks: z.object({
    measurementAccuracy: z.boolean().describe('Whether measurements are within expected ranges'),
    terminologyConsistency: z.boolean().describe('Whether radiological terminology is consistent'),
    differentialAppropriate: z.boolean().describe('Whether differential diagnoses are appropriate'),
    followUpAppropriate: z.boolean().describe('Whether follow-up recommendations are appropriate')
  })
});

export type QualityAssuranceOutput = z.infer<typeof QualityAssuranceOutputSchema>;

export async function qualityAssurance(input: QualityAssuranceInput): Promise<QualityAssuranceOutput> {
  return qualityAssuranceFlow(input);
}

const prompt = ai.definePrompt({
  name: 'qualityAssurancePrompt',
  input: { schema: QualityAssuranceInputSchema },
  output: { schema: QualityAssuranceOutputSchema },
  config: {
    temperature: 0.1,
  },
  system: `You are an expert radiologist quality assurance specialist. Your role is to evaluate AI-generated diagnoses and reports for accuracy, completeness, clinical relevance, and safety.

**QUALITY ASSESSMENT FRAMEWORK:**

**1. DIAGNOSTIC ACCURACY EVALUATION:**
- Assess the appropriateness of the primary diagnosis
- Evaluate the quality and relevance of differential diagnoses
- Check for consistency between findings and diagnostic conclusions
- Validate confidence scores against evidence strength
- Identify potential diagnostic errors or omissions

**2. CLINICAL RELEVANCE ASSESSMENT:**
- Evaluate clinical appropriateness of findings and recommendations
- Assess urgency level assignment (routine/urgent/emergent)
- Check for missing critical findings that require immediate attention
- Validate follow-up recommendations against clinical guidelines

**3. MEASUREMENT VALIDATION:**
- Verify measurements are within physiologically reasonable ranges
- Check measurement techniques are appropriate for the structure
- Assess clinical significance assignments
- Validate reference range comparisons

**4. REPORT QUALITY EVALUATION:**
- Assess completeness of systematic analysis
- Evaluate clarity and organization of findings
- Check consistency between diagnosis and report sections
- Validate radiological terminology usage

**5. SAFETY AND RISK ASSESSMENT:**
- Identify any missed critical findings
- Assess appropriateness of urgency classifications
- Evaluate potential patient safety implications
- Check for adequate uncertainty acknowledgment

**SCORING METHODOLOGY:**
- Overall Quality Score: Weighted average of all components
  * Diagnostic Accuracy: 35%
  * Clinical Relevance: 25%
  * Report Quality: 20%
  * Safety Assessment: 20%

**CRITICAL ISSUE IDENTIFICATION:**
- Flag any findings that could impact patient safety
- Identify diagnostic inconsistencies or errors
- Highlight inappropriate urgency assessments
- Note missing follow-up recommendations for significant findings

**VALIDATION CHECKS:**
- Measurement accuracy: Check against normal ranges and anatomical constraints
- Terminology consistency: Verify standard radiological terminology usage
- Differential appropriateness: Assess clinical relevance of alternative diagnoses
- Follow-up appropriateness: Validate recommendations against guidelines

Provide constructive feedback focused on improving diagnostic accuracy and patient safety.`,
  
  prompt: `Please evaluate the following AI diagnosis and report for quality, accuracy, and clinical appropriateness:

**PRIMARY DIAGNOSIS:**
{{{diagnosis.primarySuggestion}}} (Confidence: {{{diagnosis.confidence}}})

**DIFFERENTIAL DIAGNOSES:**
{{#each diagnosis.differentialDiagnoses}}
- {{diagnosis}} (Probability: {{probability}})
  Supporting: {{supportingFeatures}}
  {{#if excludingFeatures}}Excluding: {{excludingFeatures}}{{/if}}
{{/each}}

**KEY FINDINGS:**
{{#each diagnosis.reasoningProcess.keyFindings}}
- {{this}}
{{/each}}

**MEASUREMENTS:**
{{#each diagnosis.measurements}}
- {{structure}}: {{measurement}} ({{significance}}){{#if referenceRange}} [Normal: {{referenceRange}}]{{/if}}
{{/each}}

**REASONING PROCESS:**
Initial Observations: {{{diagnosis.reasoningProcess.initialObservations}}}
Systematic Analysis: {{{diagnosis.reasoningProcess.systematicAnalysis}}}
Justification: {{{diagnosis.reasoningProcess.justification}}}
{{#if diagnosis.reasoningProcess.uncertainties}}
Uncertainties: {{diagnosis.reasoningProcess.uncertainties}}
{{/if}}

**IMAGE QUALITY ASSESSMENT:**
Quality: {{{diagnosis.qualityAssessment.imageQuality}}}
Completeness: {{{diagnosis.qualityAssessment.completeness}}}
{{#if diagnosis.qualityAssessment.limitations}}
Limitations: {{diagnosis.qualityAssessment.limitations}}
{{/if}}

{{#if report}}
**STRUCTURED REPORT:**
Technique: {{{report.technique}}}
Findings: {{{report.findings.systematic}}}
{{#if report.findings.abnormal}}
Abnormal Findings:
{{#each report.findings.abnormal}}
- {{finding}}: {{description}}{{#if severity}} ({{severity}}){{/if}}
{{/each}}
{{/if}}
Primary Impression: {{{report.impression.primary}}}
{{#if report.impression.differential}}
Differential: {{report.impression.differential}}
{{/if}}
{{#if report.recommendations}}
Recommendations: 
{{#if report.recommendations.followUp}}Follow-up: {{report.recommendations.followUp}}{{/if}}
{{#if report.recommendations.clinical}}Clinical: {{report.recommendations.clinical}}{{/if}}
{{#if report.recommendations.urgent}}Urgent: {{report.recommendations.urgent}}{{/if}}
{{/if}}
{{/if}}

{{#if clinicalContext}}
**CLINICAL CONTEXT:**
{{#if clinicalContext.patientAge}}Age: {{clinicalContext.patientAge}}{{/if}}
{{#if clinicalContext.patientSex}}Sex: {{clinicalContext.patientSex}}{{/if}}
{{#if clinicalContext.clinicalHistory}}History: {{{clinicalContext.clinicalHistory}}}{{/if}}
{{#if clinicalContext.priorImaging}}Prior Imaging: {{{clinicalContext.priorImaging}}}{{/if}}
{{/if}}`
});

const qualityAssuranceFlow = ai.defineFlow(
  {
    name: 'qualityAssuranceFlow',
    inputSchema: QualityAssuranceInputSchema,
    outputSchema: QualityAssuranceOutputSchema,
  },
  async (input) => {
    const primaryModel = 'googleai/gemini-1.5-pro-latest';
    const fallbackModel = 'googleai/gemini-1.5-flash-latest';
    const maxRetries = 2;
    const retryDelay = 1000;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        let result;
        try {
          console.log(`Attempt ${attempt}: Quality assurance with primary model: ${primaryModel}`);
          result = await prompt(input, { model: primaryModel });
        } catch (primaryError) {
          console.warn(`Attempt ${attempt}: Primary QA model failed. Retrying with fallback: ${fallbackModel}. Error:`, primaryError);
          result = await prompt(input, { model: fallbackModel });
        }

        const { output } = result;
        if (output) {
          return output;
        }
        throw new Error("AI returned empty output for quality assurance.");
      } catch (error) {
        console.error(`Attempt ${attempt} for quality assurance failed with both models. Error:`, error);
        if (attempt === maxRetries) {
          console.error(`All ${maxRetries} quality assurance attempts failed.`);
          const finalError = error instanceof Error ? error : new Error('An unexpected error occurred.');
          throw new Error(`Quality assurance service is temporarily unavailable. Last error: ${finalError.message}`);
        }
        await new Promise(res => setTimeout(res, retryDelay));
      }
    }
    throw new Error('Quality assurance service is temporarily unavailable. Please try again in a few moments.');
  }
);