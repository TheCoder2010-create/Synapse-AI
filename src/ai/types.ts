
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
  potentialAreasOfInterest: z
    .string()
    .describe('A list of other relevant observations or incidental findings, described with precise radiological terms.'),
  measurements: z.array(z.object({
      structure: z.string().describe("The anatomical structure that was measured (e.g., 'Heart', 'Right Lung Nodule')."),
      measurement: z.string().describe("The estimated measurement of the structure, including units (e.g., 'Cardiothoracic ratio: ~0.55', 'Diameter: 1.2 cm')."),
  })).optional().describe('A list of key measurements for organs or findings identified in the scan. Provide this when relevant for diagnosis.'),
  reasoningProcess: z.object({
    initialObservations: z.string().describe("The AI's initial, unfiltered visual observations from the scan."),
    justification: z.string().describe("The final, concise justification for the primary suggestion, based on the synthesis of observations and tool-based information."),
  }).describe("The structured step-by-step reasoning process the AI followed to reach its conclusion."),
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
  findings: z.string().describe('A detailed, objective, point-by-point list of observations from the scan, using precise anatomical and radiological terminology. Each finding is on a new line.'),
  impression: z.string().describe('The final diagnostic conclusion, stated concisely and addressing the primary findings. Should be a numbered list if there are multiple conclusions.'),
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
