
import {z} from 'genkit';

export const ChatInputSchema = z.object({
  messages: z.array(z.object({
    role: z.enum(['user', 'assistant']),
    text: z.string(),
  })),
  media: z.optional(z.object({
    url: z.string().describe("A media file, as a data URI."),
    contentType: z.string().describe("The MIME type of the media file."),
  })),
});
export type ChatInput = z.infer<typeof ChatInputSchema>;


// From ai-assisted-diagnosis.ts
export const AiAssistedDiagnosisInputSchema = z.object({
  radiologyMediaDataUris: z
    .array(z.string())
    .describe(
      "A sequence of radiology media (images or video frames), each as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
  mediaType: z.enum(['image', 'video']).describe("Specifies whether the media is a single image, an image series, or frames from a video."),
  segmentationData: z.any().optional().describe('Optional segmentation data from a pre-analysis step (e.g., from a MONAI model). This provides a region of interest for the diagnostic model to focus on.'),
  isDicom: z.boolean().optional().describe('Set to true if the uploaded file is a DICOM file, which may contain embedded metadata.'),
});
export type AiAssistedDiagnosisInput = z.infer<typeof AiAssistedDiagnosisInputSchema>;

export const AiAssistedDiagnosisOutputSchema = z.object({
  primarySuggestion: z
    .string()
    .describe('The most likely diagnostic suggestion, stated as a concise diagnostic impression using formal radiological terminology. This should be a specific diagnosis (e.g., "Pancreatic schwannoma"), not a generic description (e.g., "pancreatic mass").'),
  confidence: z
    .number()
    .min(0)
    .max(1)
    .describe('Confidence score from 0.0 to 1.0 indicating the AI\'s certainty in the primary diagnosis. Values: 0.9-1.0 (High confidence), 0.7-0.89 (Moderate confidence), 0.5-0.69 (Low confidence), <0.5 (Very uncertain).'),
  differentialDiagnoses: z.array(z.object({
    diagnosis: z.string().describe('Alternative diagnostic possibility using formal radiological terminology.'),
    probability: z.number().min(0).max(1).describe('Probability score for this differential diagnosis.'),
    supportingFeatures: z.array(z.string()).describe('Imaging features that support this diagnosis.'),
    excludingFeatures: z.array(z.string()).optional().describe('Features that argue against this diagnosis.')
  })).optional().describe('List of differential diagnoses ranked by probability, providing comprehensive diagnostic considerations.'),
  potentialAreasOfInterest: z
    .string()
    .describe('A list of other relevant observations or incidental findings, described with precise radiological terms.'),
  measurements: z.array(z.object({
      structure: z.string().describe("The anatomical structure that was measured (e.g., 'Heart', 'Right Lung Nodule')."),
      measurement: z.string().describe("The estimated measurement of the structure, including units (e.g., 'Cardiothoracic ratio: ~0.55', 'Diameter: 1.2 cm')."),
      significance: z.enum(['normal', 'borderline', 'abnormal', 'critical']).describe('Clinical significance of the measurement.'),
      referenceRange: z.string().optional().describe('Normal reference range for comparison.')
  })).optional().describe('A list of key measurements for organs or findings identified in the scan. Provide this when relevant for diagnosis.'),
  clinicalCorrelation: z.object({
    recommendedFollowUp: z.array(z.string()).optional().describe('Recommended follow-up imaging or clinical actions.'),
    clinicalQuestions: z.array(z.string()).optional().describe('Clinical questions that should be addressed based on findings.'),
    urgency: z.enum(['routine', 'urgent', 'emergent']).describe('Clinical urgency level based on findings.')
  }).describe('Clinical correlation and follow-up recommendations.'),
  reasoningProcess: z.object({
    initialObservations: z.string().describe("The AI's initial, unfiltered visual observations from the scan."),
    systematicAnalysis: z.string().describe("Systematic analysis following radiological reporting standards (e.g., organ-by-organ review)."),
    keyFindings: z.array(z.string()).describe("List of key abnormal findings that led to the diagnosis."),
    justification: z.string().describe("The final, concise justification for the primary suggestion, based on the synthesis of observations and tool-based information."),
    uncertainties: z.array(z.string()).optional().describe("Areas of diagnostic uncertainty or limitations in the analysis.")
  }).describe("The structured step-by-step reasoning process the AI followed to reach its conclusion."),
  qualityAssessment: z.object({
    imageQuality: z.enum(['excellent', 'good', 'adequate', 'poor', 'non-diagnostic']).describe('Assessment of image quality for diagnostic purposes.'),
    limitations: z.array(z.string()).optional().describe('Technical or clinical limitations affecting the analysis.'),
    completeness: z.number().min(0).max(1).describe('Completeness score of the diagnostic evaluation (0.0-1.0).')
  }).describe('Quality assessment of the diagnostic analysis.'),
  tciaLookups: z.array(z.object({
      term: z.string().describe('The term looked up on Public Research Datasets.'),
      summary: z.string().describe('The summary provided by the search tool.')
  })).optional().describe('Summaries of relevant imaging collections found by searching Public Research Datasets.'),
  imaiosLookups: z.array(z.object({
      term: z.string().describe('The anatomical term looked up on IMAIOS e-Anatomy.'),
      summary: z.string().describe('The definition provided by the IMAIOS search tool.')
  })).optional().describe('Definitions of anatomical structures found by searching the IMAIOS e-Anatomy atlas.'),
  openiLookups: z.array(z.object({
      term: z.string().describe('The term looked up on the Open-i medical image database.'),
      summary: z.string().describe('The summary provided by the search tool.')
  })).optional().describe('Summaries of relevant images found on the Open-i database.'),
});
export type AiAssistedDiagnosisOutput = z.infer<typeof AiAssistedDiagnosisOutputSchema>;

// From generate-structured-report.ts
export const GenerateStructuredReportInputSchema = z.object({
  reportText: z.string().describe('The raw, unstructured report text written by the radiologist.'),
  diagnosis: AiAssistedDiagnosisOutputSchema.describe('The initial AI-assisted diagnosis for context.'),
  reportTemplate: z.string().optional().describe('A user-provided template for the structured report. If provided, the AI will use this structure for the output.'),
});
export type GenerateStructuredReportInput = z.infer<typeof GenerateStructuredReportInputSchema>;

export const GenerateStructuredReportOutputSchema = z.object({
  technique: z.string().describe('The imaging technique used, describing modality and contrast. Example: "CT of the chest was performed without intravenous contrast, with reconstructions in axial, coronal, and sagittal planes."'),
  clinicalHistory: z.string().optional().describe('Relevant clinical history and indication for the study, if provided.'),
  comparison: z.string().optional().describe('Comparison with prior studies, if available.'),
  findings: z.object({
    systematic: z.string().describe('Systematic organ-by-organ or region-by-region analysis using standardized radiological terminology.'),
    abnormal: z.array(z.object({
      finding: z.string().describe('Specific abnormal finding with precise anatomical localization.'),
      description: z.string().describe('Detailed description of the abnormality including size, characteristics, and significance.'),
      severity: z.enum(['mild', 'moderate', 'severe', 'critical']).optional().describe('Severity assessment of the finding.')
    })).optional().describe('List of abnormal findings with detailed descriptions.'),
    normal: z.string().optional().describe('Summary of normal structures and findings.')
  }).describe('Comprehensive findings section with systematic analysis.'),
  measurements: z.array(z.object({
    structure: z.string(),
    value: z.string(),
    method: z.string().optional().describe('Measurement technique used.'),
    significance: z.string().optional().describe('Clinical significance of the measurement.')
  })).optional().describe('Quantitative measurements with clinical context.'),
  impression: z.object({
    primary: z.string().describe('Primary diagnostic impression with confidence level.'),
    differential: z.array(z.string()).optional().describe('Differential diagnostic considerations.'),
    incidental: z.array(z.string()).optional().describe('Incidental findings of clinical significance.')
  }).describe('Structured diagnostic impression with primary and differential diagnoses.'),
  recommendations: z.object({
    followUp: z.array(z.string()).optional().describe('Specific follow-up imaging recommendations with timeframes.'),
    clinical: z.array(z.string()).optional().describe('Clinical correlation or additional workup recommendations.'),
    urgent: z.array(z.string()).optional().describe('Urgent actions required based on findings.')
  }).optional().describe('Clinical recommendations and follow-up suggestions.'),
  reportQuality: z.object({
    completeness: z.number().min(0).max(1).describe('Report completeness score (0.0-1.0).'),
    clarity: z.number().min(0).max(1).describe('Report clarity and readability score (0.0-1.0).'),
    clinicalRelevance: z.number().min(0).max(1).describe('Clinical relevance score (0.0-1.0).')
  }).describe('Quality metrics for the generated report.')
});
export type GenerateStructuredReportOutput = z.infer<typeof GenerateStructuredReportOutputSchema>;

// From summarize-reports.ts
export const SummarizeReportInputSchema = z.object({
  reportText: z.string().describe('The full text of the patient report.'),
});
export type SummarizeReportInput = z.infer<typeof SummarizeReportInputSchema>;

export const SummarizeReportOutputSchema = z.object({
  summary: z.string().describe('A concise, clinically-focused summary of the patient report, suitable for a referring physician. It should highlight the primary diagnosis and key findings.'),
});
export type SummarizeReportOutput = z.infer<typeof SummarizeReportOutputSchema>;

// From save-final-report.ts
export const SaveFinalReportInputSchema = z.object({
  // Use the first image of the series as the representative image for the case.
  radiologyMediaDataUri: z
    .string()
    .describe('The primary radiology image for the case, as a data URI.'),
  diagnosis: AiAssistedDiagnosisOutputSchema.describe(
    'The initial AI-assisted diagnosis for context.'
  ),
  finalReport: GenerateStructuredReportOutputSchema.describe(
    'The finalized, structured report content, verified by the radiologist.'
  ),
});
export type SaveFinalReportInput = z.infer<typeof SaveFinalReportInputSchema>;
