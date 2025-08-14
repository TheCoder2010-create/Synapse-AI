/**
 * @fileOverview AI-Powered Medical Image Diagnosis Service
 * Uses OpenAI GPT-4 Vision to analyze medical images and generate diagnostic reports
 */

import OpenAI from 'openai';

export interface DiagnosisRequest {
  imageUrl: string;
  imageBase64?: string;
  modality: string; // CT, MRI, X-Ray, etc.
  bodyPart: string;
  patientAge?: number;
  patientSex?: 'M' | 'F';
  clinicalHistory?: string;
  symptoms?: string[];
}

export interface DiagnosisResult {
  id: string;
  findings: string[];
  impression: string;
  recommendations: string[];
  confidence: number; // 0-1 scale
  urgency: 'low' | 'medium' | 'high' | 'critical';
  differential_diagnosis: string[];
  report: string;
  created_at: string;
  metadata: {
    modality: string;
    body_part: string;
    ai_model: string;
    processing_time_ms: number;
  };
}

export class AIDiagnosisService {
  private openai: OpenAI;
  private static instance: AIDiagnosisService;

  private constructor() {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error('OpenAI API key not found in environment variables');
    }
    this.openai = new OpenAI({ apiKey });
  }

  public static getInstance(): AIDiagnosisService {
    if (!AIDiagnosisService.instance) {
      AIDiagnosisService.instance = new AIDiagnosisService();
    }
    return AIDiagnosisService.instance;
  }

  async analyzeMedicalImage(request: DiagnosisRequest): Promise<DiagnosisResult> {
    const startTime = Date.now();
    
    try {
      const prompt = this.buildDiagnosisPrompt(request);
      const imageContent = request.imageBase64 
        ? `data:image/jpeg;base64,${request.imageBase64}`
        : request.imageUrl;

      const response = await this.openai.chat.completions.create({
        model: "gpt-4-vision-preview",
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: prompt
              },
              {
                type: "image_url",
                image_url: {
                  url: imageContent,
                  detail: "high"
                }
              }
            ]
          }
        ],
        max_tokens: 2000,
        temperature: 0.1 // Low temperature for medical accuracy
      });

      const aiResponse = response.choices[0]?.message?.content;
      if (!aiResponse) {
        throw new Error('No response from AI model');
      }

      const diagnosis = this.parseAIResponse(aiResponse, request);
      diagnosis.metadata.processing_time_ms = Date.now() - startTime;

      return diagnosis;
    } catch (error) {
      console.error('AI diagnosis error:', error);
      throw new Error(`Failed to analyze medical image: ${error}`);
    }
  }

  private buildDiagnosisPrompt(request: DiagnosisRequest): string {
    const { modality, bodyPart, patientAge, patientSex, clinicalHistory, symptoms } = request;

    return `You are an expert radiologist analyzing a ${modality} image of the ${bodyPart}. 

PATIENT INFORMATION:
- Age: ${patientAge || 'Not provided'}
- Sex: ${patientSex || 'Not provided'}
- Clinical History: ${clinicalHistory || 'Not provided'}
- Symptoms: ${symptoms?.join(', ') || 'Not provided'}

INSTRUCTIONS:
1. Analyze the medical image carefully
2. Identify any abnormal findings
3. Provide a differential diagnosis
4. Assess urgency level
5. Give recommendations

Please provide your analysis in the following JSON format:
{
  "findings": ["List of specific findings observed in the image"],
  "impression": "Primary diagnostic impression",
  "differential_diagnosis": ["List of possible diagnoses in order of likelihood"],
  "recommendations": ["List of recommended next steps or treatments"],
  "confidence": 0.85,
  "urgency": "medium",
  "report": "Detailed radiological report in professional medical language"
}

IMPORTANT DISCLAIMERS:
- This is an AI-assisted analysis for educational/research purposes
- Always consult with qualified medical professionals
- Do not use for actual patient care without physician review
- Confidence should reflect uncertainty in diagnosis

Analyze the image now:`;
  }

  private parseAIResponse(aiResponse: string, request: DiagnosisRequest): DiagnosisResult {
    try {
      // Try to extract JSON from the response
      const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in AI response');
      }

      const parsed = JSON.parse(jsonMatch[0]);
      
      return {
        id: this.generateDiagnosisId(),
        findings: parsed.findings || [],
        impression: parsed.impression || 'Unable to determine',
        recommendations: parsed.recommendations || [],
        confidence: Math.min(Math.max(parsed.confidence || 0.5, 0), 1),
        urgency: this.validateUrgency(parsed.urgency),
        differential_diagnosis: parsed.differential_diagnosis || [],
        report: parsed.report || aiResponse,
        created_at: new Date().toISOString(),
        metadata: {
          modality: request.modality,
          body_part: request.bodyPart,
          ai_model: 'gpt-4-vision-preview',
          processing_time_ms: 0 // Will be set by caller
        }
      };
    } catch (error) {
      console.error('Error parsing AI response:', error);
      
      // Fallback: create diagnosis from raw response
      return {
        id: this.generateDiagnosisId(),
        findings: ['AI analysis completed'],
        impression: 'See detailed report',
        recommendations: ['Consult with radiologist for interpretation'],
        confidence: 0.5,
        urgency: 'medium',
        differential_diagnosis: [],
        report: aiResponse,
        created_at: new Date().toISOString(),
        metadata: {
          modality: request.modality,
          body_part: request.bodyPart,
          ai_model: 'gpt-4-vision-preview',
          processing_time_ms: 0
        }
      };
    }
  }

  private validateUrgency(urgency: string): 'low' | 'medium' | 'high' | 'critical' {
    const validUrgencies = ['low', 'medium', 'high', 'critical'];
    return validUrgencies.includes(urgency) ? urgency as any : 'medium';
  }

  private generateDiagnosisId(): string {
    return `diag_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Batch analysis for multiple images
  async analyzeBatch(requests: DiagnosisRequest[]): Promise<DiagnosisResult[]> {
    const results: DiagnosisResult[] = [];
    
    for (const request of requests) {
      try {
        const result = await this.analyzeMedicalImage(request);
        results.push(result);
      } catch (error) {
        console.error(`Batch analysis failed for image:`, error);
        // Continue with other images
      }
    }
    
    return results;
  }

  // Get diagnosis templates for different modalities
  getModalityGuidelines(modality: string): string[] {
    const guidelines: Record<string, string[]> = {
      'X-Ray': [
        'Assess bone alignment and fractures',
        'Check for pneumothorax or pleural effusion',
        'Evaluate cardiac silhouette',
        'Look for signs of infection or masses'
      ],
      'CT': [
        'Evaluate tissue density and contrast enhancement',
        'Assess for hemorrhage, infarction, or masses',
        'Check organ morphology and size',
        'Look for fluid collections or abscesses'
      ],
      'MRI': [
        'Analyze signal intensity on different sequences',
        'Assess tissue characterization',
        'Evaluate for edema, inflammation, or tumors',
        'Check vascular structures and flow'
      ],
      'Ultrasound': [
        'Assess echogenicity and texture',
        'Evaluate organ size and morphology',
        'Check for fluid collections',
        'Assess blood flow with Doppler'
      ]
    };

    return guidelines[modality] || [
      'Perform systematic image analysis',
      'Document all abnormal findings',
      'Consider clinical correlation',
      'Provide clear recommendations'
    ];
  }
}