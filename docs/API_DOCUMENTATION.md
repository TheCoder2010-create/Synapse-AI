# Synapse AI - API Documentation

## Overview

Synapse AI provides a comprehensive set of AI-powered flows and services for medical imaging analysis and report generation. This documentation covers the core API endpoints, data structures, and integration patterns.

## Core AI Flows

### 1. AI-Assisted Diagnosis

**Endpoint**: `aiAssistedDiagnosis`  
**Purpose**: Primary diagnostic analysis of radiology images using advanced AI models

#### Input Schema
```typescript
interface AiAssistedDiagnosisInput {
  radiologyMediaDataUris: string[];     // Base64 encoded media files
  mediaType: 'image' | 'video';         // Media type specification
  segmentationData?: any;               // Optional MONAI segmentation data
  isDicom?: boolean;                    // DICOM format indicator
}
```

#### Output Schema
```typescript
interface AiAssistedDiagnosisOutput {
  primarySuggestion: string;            // Main diagnostic impression
  potentialAreasOfInterest: string;     // Additional observations
  measurements?: Array<{
    structure: string;                  // Anatomical structure
    measurement: string;                // Measurement with units
  }>;
  reasoningProcess: {
    initialObservations: string;        // AI's visual observations
    justification: string;              // Diagnostic reasoning
  };
  // External knowledge lookups
  tciaLookups?: Array<{term: string; summary: string}>;
  imaiosLookups?: Array<{term: string; summary: string}>;
  openiLookups?: Array<{term: string; summary: string}>;
}
```

#### Features
- **Multi-modal Support**: Handles DICOM images, image series, and video files
- **External Knowledge Integration**: Automatic lookup of relevant medical information
- **Transparent Reasoning**: Step-by-step diagnostic process explanation
- **Fallback Strategy**: Primary model with automatic fallback for reliability

#### Available Tools
- `searchClinicalKnowledgeBase` - Radiopaedia clinical definitions
- `searchPublicResearchDatasets` - TCIA cancer imaging collections
- `searchImaiosAnatomy` - Anatomical structure definitions
- `searchMedicalImageDatabase` - Open-i visual reference images
- `findCaseExamplesTool` - Historical case examples
- `searchXNATProjects` - Internal imaging datasets
- `searchDrugInfo` - Pharmaceutical database lookup

### 2. Interactive Chat Assistant

**Endpoint**: `chatStream`  
**Purpose**: Real-time conversational AI for case discussion and medical queries

#### Input Schema
```typescript
interface ChatInput {
  messages: Array<{
    role: 'user' | 'assistant';
    text: string;
  }>;
  media?: {
    url: string;                        // Data URI for media
    contentType: string;                // MIME type
  };
}
```

#### Features
- **Streaming Responses**: Real-time text generation
- **Voice Integration**: Text-to-speech audio responses
- **Image Analysis**: Direct image upload for instant diagnosis
- **Knowledge Base Access**: Real-time medical term lookup
- **Multi-turn Conversations**: Context-aware dialogue

### 3. Structured Report Generation

**Endpoint**: `generateStructuredReport`  
**Purpose**: Convert free-text reports into professional medical documentation

#### Input Schema
```typescript
interface GenerateStructuredReportInput {
  reportText: string;                   // Raw radiologist notes
  diagnosis: AiAssistedDiagnosisOutput; // AI analysis context
  reportTemplate?: string;              // Optional custom template
}
```

#### Output Schema
```typescript
interface GenerateStructuredReportOutput {
  technique: string;                    // Imaging technique description
  findings: string;                     // Detailed objective observations
  impression: string;                   // Final diagnostic conclusions
}
```

#### Features
- **Custom Templates**: Institution-specific report formatting
- **Standard Structure**: Technique, Findings, Impression sections
- **Clinical Terminology**: Precise radiological language
- **Context Integration**: Combines AI analysis with radiologist input

### 4. Report Summarization

**Endpoint**: `summarizeReport`  
**Purpose**: Generate concise clinical summaries for referring physicians

#### Input Schema
```typescript
interface SummarizeReportInput {
  reportText: string;                   // Full patient report
}
```

#### Output Schema
```typescript
interface SummarizeReportOutput {
  summary: string;                      // Concise clinical summary
}
```

## External Service Integrations

### Synapse Wrapper API

**Purpose**: Proprietary unified interface to medical knowledge bases

#### Available Services
- **Clinical Knowledge Base** (Radiopaedia)
- **Pharmaceutical Database** (Mock implementation)
- **Anatomical Atlas** (IMAIOS e-Anatomy)
- **Research Datasets** (TCIA)
- **Medical Images** (Open-i)
- **Internal Archives** (XNAT)

#### Security Features
- Environment-based API key management
- Graceful degradation for missing services
- Error handling and fallback responses
- Rate limiting and request optimization

### Knowledge Base Tools

#### searchClinicalKnowledgeBase
```typescript
async function searchClinicalKnowledgeBase(term: string): Promise<string>
```
- Searches Radiopaedia for radiological term definitions
- Returns formatted clinical descriptions
- Handles authentication and error states

#### searchTCIADatasets
```typescript
async function searchTCIADatasets(term: string): Promise<string>
```
- Queries The Cancer Imaging Archive
- Returns relevant imaging collection summaries
- Supports cancer type and finding searches

#### searchImaiosAnatomy
```typescript
async function searchImaiosAnatomy(term: string): Promise<string>
```
- Accesses IMAIOS e-Anatomy atlas
- Provides detailed anatomical structure definitions
- Supports location-specific queries

## AI Model Configuration

### Primary Models
- **gemini-1.5-pro-latest**: Complex reasoning and analysis
- **gemini-1.5-flash-latest**: Fast processing and fallback
- **gemini-2.0-flash-preview-image-generation**: Image annotation

### Model Selection Strategy
1. **Primary Model**: High-accuracy processing for complex cases
2. **Fallback Model**: Ensures service availability and speed
3. **Retry Logic**: Automatic retry with exponential backoff
4. **Error Handling**: Graceful degradation and user feedback

### Safety Configuration
```typescript
safetySettings: [
  { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_NONE' },
  { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' },
  { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_NONE' },
  { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_NONE' }
]
```

## Image Processing Pipeline

### Supported Formats
- **DICOM**: Native medical imaging format
- **Compressed DICOM**: Automatic .gz decompression
- **Standard Images**: JPG, PNG formats
- **Video Files**: MP4 with frame extraction

### Processing Features
- **Frame Extraction**: Video to image sequence conversion
- **Compression Handling**: Automatic pako.js decompression
- **Multi-file Support**: Batch processing capabilities
- **Canvas Rendering**: Interactive image display with windowing

### Windowing Controls
- **Brightness Adjustment**: 0-200% range
- **Contrast Control**: 0-200% range
- **Interactive Windowing**: Mouse-based adjustment
- **Real-time Updates**: Live preview during adjustment

## Error Handling

### Retry Strategy
- **Maximum Attempts**: 2 retries per operation
- **Backoff Delay**: 1-second intervals
- **Model Fallback**: Automatic secondary model usage
- **Graceful Degradation**: Informative error messages

### Error Types
- **API Failures**: External service unavailability
- **Model Errors**: AI processing failures
- **Format Errors**: Unsupported file types
- **Network Issues**: Connectivity problems

### User Feedback
- **Toast Notifications**: Real-time status updates
- **Loading States**: Progress indicators
- **Error Messages**: Clear problem descriptions
- **Recovery Suggestions**: Next steps for users

## Security Considerations

### Data Privacy
- **No Data Persistence**: Images processed in memory only
- **Secure Transmission**: HTTPS for all communications
- **Environment Variables**: Secure credential management
- **HIPAA Awareness**: Healthcare data privacy considerations

### API Security
- **Authentication**: API key-based access control
- **Rate Limiting**: Request throttling protection
- **Input Validation**: Schema-based data validation
- **Error Sanitization**: No sensitive data in error messages

## Performance Optimization

### Caching Strategy
- **Model Responses**: Intelligent caching for repeated queries
- **Knowledge Base**: Local caching of frequently accessed terms
- **Image Processing**: Optimized canvas rendering
- **Network Requests**: Request deduplication

### Resource Management
- **Memory Usage**: Efficient image handling
- **CPU Optimization**: Optimized processing pipelines
- **Network Efficiency**: Compressed data transmission
- **Concurrent Processing**: Parallel operation support

## Integration Examples

### Basic Diagnosis Flow
```typescript
const result = await aiAssistedDiagnosis({
  radiologyMediaDataUris: [imageDataUri],
  mediaType: 'image',
  isDicom: true
});

console.log('Primary diagnosis:', result.primarySuggestion);
console.log('Reasoning:', result.reasoningProcess.justification);
```

### Chat Integration
```typescript
const stream = await chatStream({
  messages: [
    { role: 'user', text: 'What does this finding suggest?' }
  ],
  media: {
    url: imageDataUri,
    contentType: 'image/jpeg'
  }
});

// Process streaming response
const reader = stream.getReader();
while (true) {
  const { value, done } = await reader.read();
  if (done) break;
  
  const data = JSON.parse(new TextDecoder().decode(value));
  if (data.text) console.log('AI Response:', data.text);
  if (data.audioUrl) playAudio(data.audioUrl);
}
```

### Report Generation
```typescript
const structuredReport = await generateStructuredReport({
  reportText: radiologistNotes,
  diagnosis: aiDiagnosis,
  reportTemplate: institutionTemplate
});

console.log('Technique:', structuredReport.technique);
console.log('Findings:', structuredReport.findings);
console.log('Impression:', structuredReport.impression);
```

## Development Guidelines

### Best Practices
- **Error Handling**: Always implement try-catch blocks
- **Type Safety**: Use TypeScript interfaces consistently
- **Validation**: Validate inputs with Zod schemas
- **Testing**: Test with various image formats and sizes
- **Documentation**: Comment complex AI prompt logic

### Performance Tips
- **Batch Processing**: Group multiple images when possible
- **Model Selection**: Use appropriate model for task complexity
- **Caching**: Implement intelligent caching strategies
- **Monitoring**: Track API usage and performance metrics

---

This API documentation provides comprehensive coverage of Synapse AI's core functionality. For additional technical details, refer to the source code and inline documentation.