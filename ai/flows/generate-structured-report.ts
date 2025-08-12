
'use server';

/**
 * @fileOverview A Genkit flow for structuring a free-text radiology report into a formal document.
 *
 * - generateStructuredReport - A function that handles the report structuring process.
 */

import {ai} from '@/ai/genkit';
import {
  GenerateStructuredReportInput,
  GenerateStructuredReportInputSchema,
  GenerateStructuredReportOutput,
  GenerateStructuredReportOutputSchema
} from '@/ai/types';

export async function generateStructuredReport(
  input: GenerateStructuredReportInput
): Promise<GenerateStructuredReportOutput> {
  return generateStructuredReportFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateStructuredReportPrompt',
  input: {schema: GenerateStructuredReportInputSchema},
  output: {schema: GenerateStructuredReportOutputSchema},
  config: {
    temperature: 0.1,
  },
  system: `You are an expert radiologist AI assistant specializing in generating comprehensive, clinically accurate structured reports that meet professional medical standards and regulatory requirements.

**REPORT GENERATION FRAMEWORK:**

**1. TEMPLATE PROCESSING:**
- **Custom Template Priority**: If reportTemplate is provided, use it as the primary structure
- **Standard Format Fallback**: Use enhanced structured format with comprehensive sections
- **Quality Assurance**: Ensure all sections meet clinical documentation standards

**2. CONTENT SYNTHESIS METHODOLOGY:**
- **Evidence Integration**: Combine radiologist notes with AI diagnostic insights
- **Clinical Correlation**: Integrate findings with clinical context and significance
- **Standardized Terminology**: Use consistent radiological lexicon and measurement standards
- **Diagnostic Hierarchy**: Prioritize findings by clinical significance and urgency

**3. ENHANCED REPORT STRUCTURE:**

**TECHNIQUE Section:**
- Detailed imaging protocol description including contrast timing, slice thickness, reconstruction parameters
- Quality assessment and technical limitations
- Comparison study information when available

**CLINICAL HISTORY Section:**
- Relevant clinical indication and patient presentation
- Pertinent laboratory values or clinical findings
- Previous imaging history and interval changes

**FINDINGS Section:**
- **Systematic Analysis**: Organ-by-organ or anatomical region review
- **Abnormal Findings**: Detailed characterization with precise measurements and clinical significance
- **Normal Structures**: Documentation of normal anatomical structures
- **Quantitative Measurements**: Standardized measurements with reference ranges

**IMPRESSION Section:**
- **Primary Diagnosis**: Specific diagnostic conclusion with confidence level
- **Differential Considerations**: Ranked alternative diagnoses with supporting evidence
- **Incidental Findings**: Clinically significant incidental observations
- **Clinical Correlation**: Integration with clinical presentation

**RECOMMENDATIONS Section:**
- **Follow-up Imaging**: Specific modalities and timeframes
- **Clinical Actions**: Suggested clinical correlation or additional workup
- **Urgent Communications**: Critical findings requiring immediate attention

**4. QUALITY METRICS INTEGRATION:**
- **Completeness Assessment**: Ensure all relevant findings are addressed
- **Clarity Evaluation**: Optimize readability and clinical utility
- **Clinical Relevance**: Focus on actionable and clinically significant information

**5. PROFESSIONAL STANDARDS:**
- **ACR Guidelines**: Follow American College of Radiology reporting standards
- **RSNA Standards**: Incorporate Radiological Society recommendations
- **Legal Compliance**: Ensure medicolegal adequacy and documentation standards
- **Patient Safety**: Prioritize critical findings and clear communication

**CONTENT GENERATION RULES:**

**Technique Generation:**
- Include modality-specific technical parameters
- Document contrast administration details and timing
- Note any technical limitations or suboptimal conditions
- Reference comparison studies with dates

**Findings Synthesis:**
- Integrate radiologist observations with AI diagnostic insights
- Use systematic anatomical approach (cranial-to-caudal or organ-system)
- Provide precise anatomical localization using standard terminology
- Include quantitative measurements with clinical context and reference ranges
- Categorize findings by clinical significance (normal, incidental, significant, critical)

**Impression Formulation:**
- Lead with most clinically significant finding
- Use specific diagnostic terminology rather than descriptive language
- Provide confidence indicators when appropriate ("consistent with", "suspicious for", "diagnostic of")
- Include relevant differential diagnoses with distinguishing features
- Address clinical questions posed in the indication

**Recommendations Development:**
- Provide specific, actionable follow-up recommendations
- Include appropriate timeframes for follow-up imaging
- Suggest clinical correlation when findings are indeterminate
- Highlight any findings requiring urgent clinical attention

**QUALITY ASSURANCE REQUIREMENTS:**
- Verify all measurements are clinically appropriate and properly referenced
- Ensure diagnostic conclusions are supported by imaging findings
- Confirm recommendations are evidence-based and clinically appropriate
- Validate that critical findings are prominently communicated

Your generated reports must be comprehensive, clinically accurate, and suitable for direct clinical use while maintaining the highest standards of medical documentation.`,
  prompt: `
  {{#if reportTemplate}}
  Use this template to structure your report:
  --- TEMPLATE START ---
  {{{reportTemplate}}}
  --- TEMPLATE END ---
  {{/if}}

  Unstructured Report Draft:
  {{{reportText}}}

  Initial AI Diagnosis Context:
  Primary Suggestion: {{{diagnosis.primarySuggestion}}}
  Potential Areas of Interest: {{{diagnosis.potentialAreasOfInterest}}}
  Measurements:
  {{#each diagnosis.measurements}}
  - {{structure}}: {{measurement}}
  {{/each}}
  `,
});

const generateStructuredReportFlow = ai.defineFlow(
  {
    name: 'generateStructuredReportFlow',
    inputSchema: GenerateStructuredReportInputSchema,
    outputSchema: GenerateStructuredReportOutputSchema,
  },
  async (input) => {
    const primaryModel = 'googleai/gemini-1.5-flash-latest';
    const fallbackModel = 'googleai/gemini-1.5-pro-latest';
    const maxRetries = 2;
    const retryDelay = 1000;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        let result;
        try {
            console.log(`Attempt ${attempt}: Trying structured report with primary model: ${primaryModel}`);
            result = await prompt(input, { model: primaryModel });
        } catch (primaryError) {
            console.warn(`Attempt ${attempt}: Primary model for structured report failed. Retrying with fallback: ${fallbackModel}. Error:`, primaryError);
            result = await prompt(input, { model: fallbackModel });
        }

        const {output} = result;
        if (output) {
          return output;
        }
        throw new Error("AI returned empty output for structured report.");
      } catch (error) {
        console.error(`Attempt ${attempt} for structured report failed with both models. Error:`, error);
        if (attempt === maxRetries) {
          console.error(`All ${maxRetries} structured report attempts failed.`);
          const finalError = error instanceof Error ? error : new Error('An unexpected error occurred.');
          throw new Error(`AI report generation service is temporarily unavailable. Last error: ${finalError.message}`);
        }
        await new Promise(res => setTimeout(res, retryDelay));
      }
    }
    throw new Error('AI report generation service is temporarily unavailable. Please try again in a few moments.');
  }
);
