# Synapse AI - Code Documentation

## Overview

This document provides detailed code documentation for Synapse AI's core components, including AI flows, services, utilities, and UI components.

## AI Flows (`/ai/flows/`)

### AI-Assisted Diagnosis Flow

**File**: `ai/flows/ai-assisted-diagnosis.ts`

The primary diagnostic analysis flow that processes medical images and generates comprehensive diagnostic suggestions.

#### Key Components

**Main Function**
```typescript
export async function aiAssistedDiagnosis(
  input: AiAssistedDiagnosisInput
): Promise<AiAssistedDiagnosisOutput>
```

**Input Schema**
```typescript
interface AiAssistedDiagnosisInput {
  radiologyMediaDataUris: string[];     // Base64 encoded medical images
  mediaType: 'image' | 'video';         // Media type specification
  segmentationData?: any;               // Optional MONAI segmentation data
  isDicom?: boolean;                    // DICOM format indicator
}
```

**Output Schema**
```typescript
interface AiAssistedDiagnosisOutput {
  primarySuggestion: string;            // Main diagnostic impression
  potentialAreasOfInterest: string;     // Additional observations
  measurements?: Measurement[];         // Anatomical measurements
  reasoningProcess: {
    initialObservations: string;        // AI's visual observations
    justification: string;              // Diagnostic reasoning
  };
  // External knowledge lookups
  tciaLookups?: KnowledgeLookup[];
  imaiosLookups?: KnowledgeLookup[];
  openiLookups?: KnowledgeLookup[];
}
```

**AI Tools Integration**
- `searchClinicalKnowledgeBase` - Radiopaedia medical definitions
- `searchPublicResearchDatasets` - TCIA cancer imaging collections
- `searchImaiosAnatomy` - Anatomical structure definitions
- `searchMedicalImageDatabase` - Open-i visual references
- `findCaseExamplesTool` - Historical case examples
- `searchXNATProjects` - Internal dataset access
- `searchDrugInfo` - Pharmaceutical information

**Error Handling & Reliability**
```typescript
// Dual-model strategy with automatic fallback
const primaryModel = 'googleai/gemini-1.5-pro-latest';
const fallbackModel = 'googleai/gemini-1.5-flash-latest';
const maxRetries = 2;
const retryDelay = 1000;

// Retry logic with exponential backoff
for (let attempt = 1; attempt <= maxRetries; attempt++) {
  try {
    // Try primary model first
    result = await prompt(input, { model: primaryModel });
  } catch (primaryError) {
    // Fallback to secondary model
    result = await prompt(input, { model: fallbackModel });
  }
}
```

### Interactive Chat Flow

**File**: `ai/flows/chat.ts`

Handles conversational AI interactions with streaming responses and voice integration.

#### Key Features

**Streaming Chat**
```typescript
export async function chatStream(input: ChatInput): Promise<ReadableStream>
```

**Image Analysis Integration**
```typescript
// Automatic diagnosis when image is provided
if (input.media) {
  const diagnosis = await aiAssistedDiagnosis({
    radiologyMediaDataUris: [input.media.url],
    isDicom: input.media.contentType === 'application/dicom',
    mediaType: 'image',
  });
  
  // Format conversational response
  const conversationalResponse = formatDiagnosisForChat(diagnosis);
  const audioUrl = await textToSpeechFlow(conversationalResponse);
  return { text: conversationalResponse, audioUrl };
}
```

**Model Selection Strategy**
```typescript
// Flash-then-Pro strategy for optimal performance
const flashModel = 'googleai/gemini-1.5-flash-latest';  // Fast responses
const proModel = 'googleai/gemini-1.5-pro-latest';      // Complex reasoning

try {
  // Try fast model first
  const response = await ai.generate({
    model: flashModel,
    tools: [searchKnowledgeBaseTool],
    system: systemPrompt,
    prompt: userPrompt,
  });
} catch (error) {
  // Fallback to powerful model
  const response = await ai.generate({
    model: proModel,
    // ... same configuration
  });
}
```

### Structured Report Generation

**File**: `ai/flows/generate-structured-report.ts`

Converts free-text radiologist notes into professional medical reports.

#### Template System

**Custom Template Support**
```typescript
// Template-based report generation
if (input.reportTemplate) {
  // Use provided institutional template
  const structuredReport = await generateFromTemplate(
    input.reportText,
    input.diagnosis,
    input.reportTemplate
  );
} else {
  // Use standard medical report format
  const structuredReport = await generateStandardReport(
    input.reportText,
    input.diagnosis
  );
}
```

**Standard Report Structure**
```typescript
interface GenerateStructuredReportOutput {
  technique: string;    // Imaging technique description
  findings: string;     // Detailed objective observations
  impression: string;   // Final diagnostic conclusions
}
```

**System Prompt Design**
```typescript
const systemPrompt = `You are an expert radiologist AI assistant.

FORMATTING RULES:
1. If reportTemplate is provided, use it as primary structure
2. If no template, use standard: Technique, Findings, Impression

CONTENT GENERATION:
- Technique: Standard technique description
- Findings: Objective, point-by-point observations
- Impression: Specific diagnostic conclusions (numbered list)

MEDICAL STANDARDS:
- Use precise anatomical terminology
- Include measurements when relevant
- State conclusions with appropriate confidence levels`;
```

### Report Summarization Flow

**File**: `ai/flows/summarize-reports.ts`

Generates concise clinical summaries for referring physicians.

```typescript
export async function summarizeReport(
  input: SummarizeReportInput
): Promise<SummarizeReportOutput>

interface SummarizeReportInput {
  reportText: string;   // Full patient report
}

interface SummarizeReportOutput {
  summary: string;      // Concise clinical summary
}
```

## Services (`/services/`)

### Synapse Wrapper API

**File**: `services/synapse-wrapper-api.ts`

Proprietary unified interface to external medical knowledge bases.

#### Core Functions

**Clinical Knowledge Base Search**
```typescript
export async function searchClinicalKnowledgeBase(
  term: string
): Promise<string>
```

**Implementation Details**
```typescript
// Radiopaedia API integration with error handling
const apiKey = process.env.RADIOPAEDIA_API_KEY;

if (!apiKey) {
  // Graceful degradation
  return "Could not connect to external knowledge base due to configuration error.";
}

try {
  // Search for articles
  const searchResponse = await fetch(
    `https://radiopaedia.org/api/v1/search?q=${encodeURIComponent(term)}`,
    { headers: { 'Authorization': apiKey } }
  );
  
  // Fetch article details
  const articleResponse = await fetch(
    `https://radiopaedia.org/api/v1/articles/${topResult.id}`,
    { headers }
  );
  
  // Return formatted definition
  return `From Clinical Knowledge Base: ${cleanSynopsis}`;
} catch (error) {
  // Error handling with informative messages
  return `Search failed for "${term}". Please try again.`;
}
```

**Drug Information Search**
```typescript
export async function searchDrugInfo(drugName: string): Promise<string>
```

**Mock Implementation** (placeholder for licensed pharmaceutical database)
```typescript
const mockDrugDatabase = {
  "aspirin": {
    genericName: "Aspirin",
    brandNames: ["Bayer", "Ecotrin"],
    indications: "Pain relief, anti-inflammatory, antiplatelet agent"
  },
  // ... more entries
};

// Fuzzy matching logic
const foundDrug = Object.keys(mockDrugDatabase).find(key => 
  lowerCaseDrugName.includes(key) ||
  mockDrugDatabase[key].brandNames.some(brand => 
    brand.toLowerCase() === lowerCaseDrugName
  )
);
```

### MONAI Integration

**File**: `services/monai.ts`

Integration with MONAI (Medical Open Network for AI) for medical image segmentation.

```typescript
// MONAI model integration for image segmentation
export async function getAISegmentation(
  imageUri: string,
  modelType: 'organ' | 'tumor' | 'vessel'
): Promise<SegmentationResult>
```

## UI Components (`/components/`)

### Professional Image Viewer

**Core Features**
- Canvas-based DICOM rendering
- Interactive windowing (brightness/contrast)
- Multi-frame carousel support
- Video playback with frame extraction
- Zoom, pan, and measurement tools

**Implementation Highlights**

**Canvas Rendering**
```typescript
// Dynamic canvas sizing and image rendering
useEffect(() => {
  if (images && images.length > 0) {
    images.forEach((imageUri, index) => {
      const canvas = canvasRefs.current[index];
      const context = canvas?.getContext('2d');
      
      if (context && imageUri) {
        const img = new Image();
        img.onload = () => {
          // Calculate optimal canvas dimensions
          const aspectRatio = img.width / img.height;
          let newWidth = parentWidth;
          let newHeight = parentWidth / aspectRatio;
          
          if (newHeight > parentHeight) {
            newHeight = parentHeight;
            newWidth = parentHeight * aspectRatio;
          }
          
          // Render image to canvas
          canvas.width = newWidth;
          canvas.height = newHeight;
          context.drawImage(img, 0, 0, canvas.width, canvas.height);
        };
        img.src = imageUri;
      }
    });
  }
}, [images, currentSlide, brightness, contrast]);
```

**Interactive Windowing**
```typescript
// Mouse-based windowing controls
const handleMouseDownOnCanvas = (e: React.MouseEvent<HTMLCanvasElement>) => {
  if (e.button === 2) { // Right click
    setIsWindowingActive(true);
    windowingStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      initialBrightness: brightness,
      initialContrast: contrast,
    };
  }
};

const handleMouseMoveOnCanvas = (e: React.MouseEvent<HTMLCanvasElement>) => {
  if (isWindowingActive && windowingStartRef.current) {
    const deltaX = e.clientX - windowingStartRef.current.x;
    const deltaY = e.clientY - windowingStartRef.current.y;
    
    // Update windowing values based on mouse movement
    const newContrast = windowingStartRef.current.initialContrast + deltaX * 0.5;
    const newBrightness = windowingStartRef.current.initialBrightness - deltaY * 0.5;
    
    setContrast(Math.max(0, Math.min(200, newContrast)));
    setBrightness(Math.max(0, Math.min(200, newBrightness)));
  }
};
```

### Voice Assistant Interface

**Speech Recognition Integration**
```typescript
// Web Speech API setup
useEffect(() => {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  
  if (SpeechRecognition) {
    recognitionRef.current = new SpeechRecognition();
    recognitionRef.current.continuous = false;
    recognitionRef.current.interimResults = false;
    recognitionRef.current.lang = 'en-US';
    
    recognitionRef.current.onresult = handleRecognitionResult;
    recognitionRef.current.onerror = handleRecognitionError;
  }
}, []);

const handleRecognitionResult = async (event: SpeechRecognitionEvent) => {
  const transcript = event.results[0][0].transcript;
  await handleSend(transcript);
};
```

**Audio Playback**
```typescript
// Text-to-speech integration
const handleSend = async (text: string) => {
  const stream = await chatStream({
    messages: [...messages, { role: 'user', text }],
  });
  
  // Process streaming response
  const reader = stream.getReader();
  let fullText = "";
  let audioUrl = "";
  
  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    
    const data = JSON.parse(new TextDecoder().decode(value));
    if (data.text) fullText += data.text;
    if (data.audioUrl) audioUrl = data.audioUrl;
  }
  
  // Play audio response
  if (audioUrl && audioRef.current) {
    audioRef.current.src = audioUrl;
    audioRef.current.play();
  }
};
```

## Utilities (`/lib/`)

### Image Processing Utilities

**File**: `lib/utils.ts`

**Video Frame Extraction**
```typescript
export function extractFramesFromVideo(
  videoDataUrl: string,
  frameCount: number
): Promise<string[]>
```

**Implementation**
```typescript
return new Promise((resolve, reject) => {
  const video = document.createElement('video');
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');
  
  video.onloadeddata = () => {
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    const duration = video.duration;
    const interval = duration / frameCount;
    let currentTime = 0;
    let frames: string[] = [];
    
    const captureFrame = () => {
      video.currentTime = currentTime;
    };
    
    video.onseeked = () => {
      // Draw current frame to canvas
      context.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      // Convert to data URL
      frames.push(canvas.toDataURL('image/jpeg'));
      
      currentTime += interval;
      if (currentTime <= duration && frames.length < frameCount) {
        captureFrame();
      } else {
        resolve(frames);
      }
    };
    
    captureFrame(); // Start extraction
  };
  
  video.src = videoDataUrl;
  video.load();
});
```

**CSS Class Utilities**
```typescript
// Tailwind CSS class merging utility
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

### File Processing

**DICOM File Handling**
```typescript
// Automatic decompression for .gz files
const processFile = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onloadend = () => {
      if (file.name.endsWith('.gz')) {
        try {
          // Decompress using pako
          const compressedData = new Uint8Array(reader.result as ArrayBuffer);
          const decompressedData = pako.inflate(compressedData);
          
          // Create blob and convert to data URL
          const blob = new Blob([decompressedData], { type: 'application/dicom' });
          const blobReader = new FileReader();
          blobReader.onloadend = () => resolve(blobReader.result as string);
          blobReader.readAsDataURL(blob);
        } catch (err) {
          reject(err);
        }
      } else {
        resolve(reader.result as string);
      }
    };
    
    // Read file based on type
    if (file.name.endsWith('.gz')) {
      reader.readAsArrayBuffer(file);
    } else {
      reader.readAsDataURL(file);
    }
  });
};
```

## Type Definitions (`/ai/types.ts`)

### Core Type System

**Zod Schema Validation**
```typescript
import { z } from 'genkit';

// Input validation schemas
export const ChatInputSchema = z.object({
  messages: z.array(z.object({
    role: z.enum(['user', 'assistant']),
    text: z.string(),
  })),
  media: z.optional(z.object({
    url: z.string().describe("Media file as data URI"),
    contentType: z.string().describe("MIME type"),
  })),
});

export const AiAssistedDiagnosisInputSchema = z.object({
  radiologyMediaDataUris: z.array(z.string()).describe(
    "Radiology media as data URIs with Base64 encoding"
  ),
  mediaType: z.enum(['image', 'video']),
  segmentationData: z.any().optional(),
  isDicom: z.boolean().optional(),
});
```

**Type Inference**
```typescript
// Automatic type generation from schemas
export type ChatInput = z.infer<typeof ChatInputSchema>;
export type AiAssistedDiagnosisInput = z.infer<typeof AiAssistedDiagnosisInputSchema>;
export type AiAssistedDiagnosisOutput = z.infer<typeof AiAssistedDiagnosisOutputSchema>;
```

### Medical Data Types

**Measurement Structure**
```typescript
interface Measurement {
  structure: string;    // Anatomical structure name
  measurement: string;  // Measurement with units
}
```

**Knowledge Lookup Structure**
```typescript
interface KnowledgeLookup {
  term: string;     // Search term used
  summary: string;  // Retrieved information
}
```

**Reasoning Process Structure**
```typescript
interface ReasoningProcess {
  initialObservations: string;  // AI's visual observations
  justification: string;        // Final diagnostic reasoning
}
```

## Configuration Files

### Genkit Configuration

**File**: `ai/genkit.ts`

```typescript
import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/googleai';

export const ai = genkit({
  plugins: [
    googleAI({
      apiVersion: 'v1beta',
    }),
  ],
});
```

### Next.js Configuration

**File**: `next.config.ts`

```typescript
/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: true,
  },
  images: {
    domains: ['localhost'],
  },
  // Webpack configuration for medical imaging libraries
  webpack: (config) => {
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      path: false,
    };
    return config;
  },
};

export default nextConfig;
```

### Tailwind Configuration

**File**: `tailwind.config.ts`

```typescript
import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: ['class'],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        // Medical UI color palette
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        // ... additional color definitions
      },
      animation: {
        // Custom animations for medical UI
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
};

export default config;
```

## Error Handling Patterns

### AI Flow Error Handling

```typescript
// Standardized error handling across AI flows
try {
  const result = await aiFlow(input);
  return result;
} catch (error) {
  console.error(`AI flow failed:`, error);
  
  if (error instanceof Error) {
    throw new Error(`AI processing failed: ${error.message}`);
  }
  
  throw new Error('Unknown AI processing error occurred');
}
```

### API Route Error Handling

```typescript
// Next.js API route error handling
export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // Validate input
    const validatedInput = InputSchema.parse(body);
    
    // Process request
    const result = await processRequest(validatedInput);
    
    return Response.json(result);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return Response.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      );
    }
    
    console.error('API route error:', error);
    return Response.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

### Frontend Error Boundaries

```typescript
// React error boundary for medical UI
class MedicalErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  
  componentDidCatch(error, errorInfo) {
    // Log error for medical compliance
    console.error('Medical UI error:', error, errorInfo);
    
    // Report to monitoring service
    reportMedicalError(error, errorInfo);
  }
  
  render() {
    if (this.state.hasError) {
      return (
        <div className="error-boundary">
          <h2>Medical Application Error</h2>
          <p>Please refresh and try again. If the problem persists, contact support.</p>
        </div>
      );
    }
    
    return this.props.children;
  }
}
```

## Performance Optimization

### Image Processing Optimization

```typescript
// Optimized canvas rendering with debouncing
const debouncedRender = useMemo(
  () => debounce((images: string[]) => {
    // Render images to canvas
    renderImagesToCanvas(images);
  }, 100),
  []
);

// Efficient image caching
const imageCache = new Map<string, HTMLImageElement>();

const loadImage = (src: string): Promise<HTMLImageElement> => {
  if (imageCache.has(src)) {
    return Promise.resolve(imageCache.get(src)!);
  }
  
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      imageCache.set(src, img);
      resolve(img);
    };
    img.onerror = reject;
    img.src = src;
  });
};
```

### AI Response Caching

```typescript
// Intelligent caching for AI responses
const responseCache = new Map<string, any>();

const getCachedResponse = (input: any): any | null => {
  const key = JSON.stringify(input);
  return responseCache.get(key) || null;
};

const setCachedResponse = (input: any, response: any): void => {
  const key = JSON.stringify(input);
  responseCache.set(key, response);
  
  // Implement cache size limit
  if (responseCache.size > 100) {
    const firstKey = responseCache.keys().next().value;
    responseCache.delete(firstKey);
  }
};
```

---

This code documentation provides comprehensive coverage of Synapse AI's implementation details, focusing on medical AI best practices, error handling, and performance optimization.