# Contributing to Synapse AI

## Overview

Thank you for your interest in contributing to Synapse AI! This document provides guidelines and best practices for contributing to our medical imaging AI platform.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Development Setup](#development-setup)
- [Project Structure](#project-structure)
- [Coding Standards](#coding-standards)
- [AI Flow Development](#ai-flow-development)
- [Testing Guidelines](#testing-guidelines)
- [Pull Request Process](#pull-request-process)
- [Security Considerations](#security-considerations)

## Code of Conduct

### Our Standards

- **Professional Communication**: Maintain respectful, constructive dialogue
- **Medical Ethics**: Prioritize patient safety and data privacy
- **Quality Focus**: Ensure all contributions meet medical-grade standards
- **Collaborative Spirit**: Support team members and share knowledge
- **Continuous Learning**: Stay updated with medical AI best practices

### Responsibilities

- Report security vulnerabilities privately
- Respect HIPAA and medical data privacy requirements
- Follow established coding patterns and conventions
- Document all changes thoroughly
- Test contributions with various medical imaging formats

## Development Setup

### Prerequisites

```bash
# Required tools
node --version    # 18.x or later
npm --version     # 9.x or later
git --version     # 2.x or later
docker --version  # 20.x or later (optional)
```

### Local Environment

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd synapse-ai
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment configuration**
   ```bash
   cp .env.example .env
   # Edit .env with your API keys
   ```

4. **Start development servers**
   ```bash
   # Terminal 1: Next.js frontend
   npm run dev
   
   # Terminal 2: Genkit AI flows
   npm run genkit:watch
   ```

### Development Tools

**Recommended VS Code Extensions**:
- TypeScript and JavaScript Language Features
- Tailwind CSS IntelliSense
- ESLint
- Prettier
- GitLens

**Browser Extensions**:
- React Developer Tools
- Redux DevTools (if applicable)

## Project Structure

### Directory Organization

```
synapse-ai/
├── ai/                     # AI orchestration layer
│   ├── flows/             # Genkit AI flow definitions
│   │   ├── ai-assisted-diagnosis.ts
│   │   ├── chat.ts
│   │   ├── generate-structured-report.ts
│   │   └── summarize-reports.ts
│   ├── prompts/           # AI prompt templates
│   ├── tools/             # AI tool definitions
│   ├── genkit.ts          # Genkit configuration
│   └── types.ts           # TypeScript type definitions
├── app/                   # Next.js app directory
│   ├── api/              # API route handlers
│   ├── app/              # Main application interface
│   ├── about/            # Static pages
│   └── globals.css       # Global styles
├── components/           # Reusable UI components
│   └── ui/              # ShadCN UI components
├── lib/                 # Utility functions
├── services/            # External service integrations
├── docs/                # Documentation
└── .kiro/              # Kiro IDE configuration
```

### File Naming Conventions

- **Components**: PascalCase (`ImageViewer.tsx`)
- **Utilities**: camelCase (`imageUtils.ts`)
- **API Routes**: kebab-case (`ai-diagnosis.ts`)
- **Types**: PascalCase with suffix (`DiagnosisTypes.ts`)
- **Constants**: UPPER_SNAKE_CASE (`API_ENDPOINTS.ts`)

## Coding Standards

### TypeScript Guidelines

**Type Safety**
```typescript
// ✅ Good: Explicit types
interface DiagnosisResult {
  primarySuggestion: string;
  confidence: number;
  measurements: Measurement[];
}

// ❌ Avoid: Any types
function processResult(result: any) { ... }

// ✅ Good: Proper error handling
try {
  const diagnosis = await aiAssistedDiagnosis(input);
  return diagnosis;
} catch (error) {
  if (error instanceof Error) {
    throw new Error(`Diagnosis failed: ${error.message}`);
  }
  throw new Error('Unknown diagnosis error');
}
```

**Zod Schema Validation**
```typescript
// ✅ Good: Schema-first approach
export const DiagnosisInputSchema = z.object({
  radiologyMediaDataUris: z.array(z.string()),
  mediaType: z.enum(['image', 'video']),
  isDicom: z.boolean().optional(),
});

export type DiagnosisInput = z.infer<typeof DiagnosisInputSchema>;
```

### React Component Guidelines

**Component Structure**
```typescript
// ✅ Good: Well-structured component
interface ImageViewerProps {
  images: string[];
  onImageSelect: (index: number) => void;
  className?: string;
}

export function ImageViewer({ 
  images, 
  onImageSelect, 
  className 
}: ImageViewerProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  
  // Event handlers
  const handleImageClick = useCallback((index: number) => {
    setCurrentIndex(index);
    onImageSelect(index);
  }, [onImageSelect]);
  
  // Render
  return (
    <div className={cn("image-viewer", className)}>
      {/* Component JSX */}
    </div>
  );
}
```

**Hooks Usage**
```typescript
// ✅ Good: Custom hooks for complex logic
function useImageProcessing() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const processImage = useCallback(async (imageUri: string) => {
    setIsProcessing(true);
    setError(null);
    
    try {
      // Processing logic
      return result;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Processing failed');
      throw err;
    } finally {
      setIsProcessing(false);
    }
  }, []);
  
  return { processImage, isProcessing, error };
}
```

### CSS and Styling

**Tailwind CSS Best Practices**
```typescript
// ✅ Good: Semantic class organization
<div className={cn(
  // Layout
  "flex flex-col gap-4",
  // Sizing
  "w-full h-screen",
  // Styling
  "bg-background text-foreground",
  // Responsive
  "md:flex-row lg:gap-6",
  // Conditional
  isActive && "border-primary",
  className
)}>
```

**Component Variants**
```typescript
// ✅ Good: Using class-variance-authority
const buttonVariants = cva(
  "inline-flex items-center justify-center rounded-md text-sm font-medium",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline: "border border-input hover:bg-accent hover:text-accent-foreground",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);
```

## AI Flow Development

### Genkit Flow Structure

**Flow Definition Template**
```typescript
// ✅ Good: Complete flow structure
import { ai } from '@/ai/genkit';
import { z } from 'genkit';

// Input/Output schemas
const InputSchema = z.object({
  // Define input structure
});

const OutputSchema = z.object({
  // Define output structure
});

// Tool definitions
const exampleTool = ai.defineTool({
  name: 'exampleTool',
  description: 'Clear description of tool purpose',
  inputSchema: z.object({
    query: z.string().describe('What to search for')
  }),
  outputSchema: z.string(),
}, async (input) => {
  // Tool implementation
  return result;
});

// Prompt definition
const prompt = ai.definePrompt({
  name: 'examplePrompt',
  input: { schema: InputSchema },
  output: { schema: OutputSchema },
  tools: [exampleTool],
  config: {
    temperature: 0.1,
    safetySettings: [
      // Safety configuration
    ],
  },
  system: `System prompt with clear instructions...`,
  prompt: `User prompt template...`,
});

// Flow implementation
const exampleFlow = ai.defineFlow({
  name: 'exampleFlow',
  inputSchema: InputSchema,
  outputSchema: OutputSchema,
}, async (input) => {
  // Retry logic with fallback models
  const primaryModel = 'googleai/gemini-1.5-pro-latest';
  const fallbackModel = 'googleai/gemini-1.5-flash-latest';
  
  try {
    const result = await prompt(input, { model: primaryModel });
    return result.output;
  } catch (error) {
    console.warn('Primary model failed, using fallback:', error);
    const result = await prompt(input, { model: fallbackModel });
    return result.output;
  }
});

// Export function
export async function exampleFunction(input: InputType): Promise<OutputType> {
  return exampleFlow(input);
}
```

### AI Tool Development

**Tool Best Practices**
```typescript
// ✅ Good: Robust tool implementation
const searchKnowledgeBaseTool = ai.defineTool({
  name: 'searchClinicalKnowledgeBase',
  description: 'Searches medical knowledge base for radiological term definitions. Use for clarifying medical terminology.',
  inputSchema: z.object({
    term: z.string().describe('The radiological term to search for (e.g., "pneumothorax")')
  }),
  outputSchema: z.string(),
}, async (input) => {
  try {
    // Validate input
    if (!input.term?.trim()) {
      return 'No search term provided';
    }
    
    // Call external service
    const result = await searchClinicalKnowledgeBase(input.term);
    
    // Validate output
    if (!result) {
      return `No information found for "${input.term}"`;
    }
    
    return result;
  } catch (error) {
    console.error('Knowledge base search failed:', error);
    return `Search failed for "${input.term}". Please try again.`;
  }
});
```

### Prompt Engineering

**Effective Prompt Structure**
```typescript
const systemPrompt = `You are Synapse AI, an expert radiologist assistant.

ROLE: Assist radiologists with medical imaging analysis and reporting.

CAPABILITIES:
- Analyze medical images (DICOM, CT, MRI, X-ray)
- Generate diagnostic suggestions with reasoning
- Look up medical terminology and references
- Create structured reports

CONSTRAINTS:
- Always provide reasoning for diagnostic suggestions
- Use precise medical terminology
- Cite sources when using external knowledge
- Acknowledge limitations and uncertainties
- Never provide definitive diagnoses without radiologist review

OUTPUT FORMAT:
- Primary suggestion with confidence level
- Supporting observations and measurements
- Step-by-step reasoning process
- Relevant knowledge base references`;

const userPrompt = `Analyze the provided medical imaging data:

{{#if mediaType}}
Media Type: {{mediaType}}
{{/if}}

{{#if isDicom}}
Format: DICOM medical imaging
{{/if}}

Images: {{radiologyMediaDataUris.length}} image(s) provided

Please provide a comprehensive analysis including:
1. Primary diagnostic suggestion
2. Key observations and measurements
3. Areas of interest or concern
4. Reasoning process
5. Relevant medical references`;
```

## Testing Guidelines

### Unit Testing

**Test Structure**
```typescript
// tests/ai/flows/diagnosis.test.ts
import { describe, it, expect, vi } from 'vitest';
import { aiAssistedDiagnosis } from '@/ai/flows/ai-assisted-diagnosis';

describe('AI Assisted Diagnosis', () => {
  it('should process valid DICOM image', async () => {
    const mockInput = {
      radiologyMediaDataUris: ['data:image/jpeg;base64,/9j/4AAQ...'],
      mediaType: 'image' as const,
      isDicom: true,
    };
    
    const result = await aiAssistedDiagnosis(mockInput);
    
    expect(result).toBeDefined();
    expect(result.primarySuggestion).toBeTruthy();
    expect(result.reasoningProcess).toBeDefined();
  });
  
  it('should handle invalid input gracefully', async () => {
    const mockInput = {
      radiologyMediaDataUris: [],
      mediaType: 'image' as const,
    };
    
    await expect(aiAssistedDiagnosis(mockInput))
      .rejects
      .toThrow('No media provided');
  });
});
```

### Integration Testing

**API Route Testing**
```typescript
// tests/api/diagnosis.test.ts
import { POST } from '@/app/api/diagnosis/route';
import { NextRequest } from 'next/server';

describe('/api/diagnosis', () => {
  it('should return diagnosis for valid image', async () => {
    const request = new NextRequest('http://localhost:3000/api/diagnosis', {
      method: 'POST',
      body: JSON.stringify({
        radiologyMediaDataUris: ['data:image/jpeg;base64,validimage'],
        mediaType: 'image',
      }),
    });
    
    const response = await POST(request);
    const data = await response.json();
    
    expect(response.status).toBe(200);
    expect(data.primarySuggestion).toBeDefined();
  });
});
```

### Medical Image Testing

**Test Data Requirements**
- Use anonymized, synthetic, or public domain medical images
- Test with various DICOM formats and modalities
- Include edge cases (corrupted files, unusual formats)
- Validate HIPAA compliance in test data

```typescript
// tests/utils/testData.ts
export const TEST_IMAGES = {
  validDicom: 'data:application/dicom;base64,valid_dicom_data',
  validJpeg: 'data:image/jpeg;base64,valid_jpeg_data',
  corruptedFile: 'data:image/jpeg;base64,corrupted_data',
  emptyFile: '',
};

export const EXPECTED_DIAGNOSES = {
  normalChest: {
    primarySuggestion: expect.stringContaining('normal'),
    confidence: expect.any(Number),
  },
  pneumonia: {
    primarySuggestion: expect.stringContaining('pneumonia'),
    measurements: expect.arrayContaining([
      expect.objectContaining({
        structure: expect.any(String),
        measurement: expect.any(String),
      }),
    ]),
  },
};
```

## Pull Request Process

### Before Submitting

1. **Code Quality Checks**
   ```bash
   npm run lint          # ESLint checks
   npm run typecheck     # TypeScript validation
   npm test             # Run test suite
   npm run build        # Verify build success
   ```

2. **Medical Validation**
   - Test with various medical image formats
   - Verify diagnostic accuracy with known cases
   - Ensure HIPAA compliance
   - Validate error handling

3. **Documentation Updates**
   - Update API documentation for new endpoints
   - Add inline code comments for complex logic
   - Update README if adding new features
   - Include usage examples

### PR Template

```markdown
## Description
Brief description of changes and motivation.

## Type of Change
- [ ] Bug fix (non-breaking change that fixes an issue)
- [ ] New feature (non-breaking change that adds functionality)
- [ ] Breaking change (fix or feature that would cause existing functionality to not work as expected)
- [ ] Documentation update

## Medical AI Considerations
- [ ] Tested with various medical image formats
- [ ] Validated diagnostic accuracy
- [ ] Ensured patient data privacy
- [ ] Added appropriate error handling

## Testing
- [ ] Unit tests pass
- [ ] Integration tests pass
- [ ] Manual testing completed
- [ ] Medical image validation performed

## Checklist
- [ ] Code follows project style guidelines
- [ ] Self-review completed
- [ ] Documentation updated
- [ ] No breaking changes without migration guide
```

### Review Process

1. **Automated Checks**
   - CI/CD pipeline validation
   - Code quality metrics
   - Security vulnerability scanning
   - Test coverage analysis

2. **Peer Review**
   - Code quality and maintainability
   - Medical accuracy validation
   - Security considerations
   - Performance implications

3. **Medical Review** (for diagnostic features)
   - Clinical accuracy assessment
   - Regulatory compliance check
   - Patient safety considerations
   - Ethical AI practices

## Security Considerations

### Medical Data Privacy

**HIPAA Compliance**
```typescript
// ✅ Good: No persistent storage of medical images
function processImage(imageUri: string) {
  // Process in memory only
  const result = analyzeImage(imageUri);
  // No storage to disk or database
  return result;
}

// ✅ Good: Sanitized logging
console.log('Processing image', {
  format: getImageFormat(imageUri),
  size: getImageSize(imageUri),
  // Never log actual image data
});
```

**Data Handling**
```typescript
// ✅ Good: Secure data transmission
const secureHeaders = {
  'Strict-Transport-Security': 'max-age=31536000',
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'Content-Security-Policy': "default-src 'self'",
};

// ✅ Good: Input validation
function validateMedicalImage(imageUri: string): boolean {
  // Validate format, size, and content
  if (!imageUri.startsWith('data:')) return false;
  if (imageUri.length > MAX_IMAGE_SIZE) return false;
  return true;
}
```

### API Security

**Authentication & Authorization**
```typescript
// ✅ Good: API key validation
async function validateApiKey(request: Request): Promise<boolean> {
  const apiKey = request.headers.get('Authorization');
  if (!apiKey) return false;
  
  // Validate against secure storage
  return await verifyApiKey(apiKey);
}

// ✅ Good: Rate limiting
const rateLimiter = new Map();
function checkRateLimit(clientId: string): boolean {
  const now = Date.now();
  const requests = rateLimiter.get(clientId) || [];
  
  // Remove old requests
  const recentRequests = requests.filter(
    (time: number) => now - time < 60000 // 1 minute window
  );
  
  if (recentRequests.length >= 10) return false; // Max 10 requests per minute
  
  recentRequests.push(now);
  rateLimiter.set(clientId, recentRequests);
  return true;
}
```

### Vulnerability Prevention

**Input Sanitization**
```typescript
// ✅ Good: Sanitize user inputs
function sanitizeReportText(text: string): string {
  return text
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/javascript:/gi, '')
    .trim()
    .substring(0, MAX_REPORT_LENGTH);
}

// ✅ Good: Validate file uploads
function validateFileUpload(file: File): boolean {
  const allowedTypes = ['image/jpeg', 'image/png', 'application/dicom'];
  const maxSize = 50 * 1024 * 1024; // 50MB
  
  return allowedTypes.includes(file.type) && file.size <= maxSize;
}
```

## Getting Help

### Resources
- **Documentation**: Check `/docs` directory
- **API Reference**: See `docs/API_DOCUMENTATION.md`
- **Architecture**: Review `docs/ARCHITECTURE.md`
- **Deployment**: Follow `docs/DEPLOYMENT_GUIDE.md`

### Communication Channels
- **Issues**: GitHub Issues for bugs and feature requests
- **Discussions**: GitHub Discussions for questions
- **Security**: Private security reporting for vulnerabilities
- **Medical Questions**: Consult with medical professionals

### Development Support
- **Code Reviews**: Request reviews from team members
- **Pair Programming**: Schedule sessions for complex features
- **Medical Validation**: Collaborate with medical experts
- **Testing**: Use comprehensive test suites

---

Thank you for contributing to Synapse AI! Your contributions help advance medical AI technology and improve patient care.