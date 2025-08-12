import { NextRequest, NextResponse } from 'next/server';
import { GPTOSSManager } from '@/services/gpt-oss-integration';
import { gptOssDiagnosis } from '@/ai/flows/gpt-oss-diagnosis';

/**
 * @fileOverview GPT-OSS API endpoints
 * Provides REST API for GPT-OSS-120B model interactions
 */

const gptOssManager = GPTOSSManager.getInstance();

// POST /api/gpt-oss - Generate text using GPT-OSS
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, prompt, options, ...data } = body;

    switch (action) {
      case 'generate':
        return await handleGenerate(prompt, options);
      
      case 'diagnose':
        return await handleDiagnose(data);
      
      case 'status':
        return await handleStatus();
      
      default:
        return NextResponse.json(
          { error: 'Invalid action. Use: generate, diagnose, or status' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('GPT-OSS API error:', error);
    return NextResponse.json(
      { error: 'GPT-OSS processing failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// GET /api/gpt-oss - Get GPT-OSS status
export async function GET() {
  try {
    const status = await handleStatus();
    return status;
  } catch (error) {
    console.error('GPT-OSS status error:', error);
    return NextResponse.json(
      { error: 'Failed to get GPT-OSS status' },
      { status: 500 }
    );
  }
}

// Handle text generation
async function handleGenerate(prompt: string, options: any = {}) {
  if (!prompt) {
    return NextResponse.json(
      { error: 'Prompt is required' },
      { status: 400 }
    );
  }

  try {
    const response = await gptOssManager.generate(prompt, {
      maxTokens: options.maxTokens || 1024,
      temperature: options.temperature || 0.1,
      topP: options.topP || 0.9,
      topK: options.topK || 40,
      repetitionPenalty: options.repetitionPenalty || 1.1
    });

    return NextResponse.json({
      success: true,
      response: {
        text: response.text,
        tokens: response.tokens,
        processingTime: response.processingTime,
        confidence: response.confidence,
        finishReason: response.finishReason
      }
    });
  } catch (error) {
    console.error('GPT-OSS generation error:', error);
    return NextResponse.json(
      { error: 'Text generation failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// Handle medical diagnosis
async function handleDiagnose(data: any) {
  try {
    if (!data.radiologyMediaDataUris || !Array.isArray(data.radiologyMediaDataUris)) {
      return NextResponse.json(
        { error: 'radiologyMediaDataUris array is required' },
        { status: 400 }
      );
    }

    const diagnosisInput = {
      radiologyMediaDataUris: data.radiologyMediaDataUris,
      mediaType: data.mediaType || 'image',
      isDicom: data.isDicom || false,
      segmentationData: data.segmentationData
    };

    const diagnosis = await gptOssDiagnosis(diagnosisInput);

    return NextResponse.json({
      success: true,
      diagnosis,
      model: 'gpt-oss-120b',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('GPT-OSS diagnosis error:', error);
    return NextResponse.json(
      { error: 'Medical diagnosis failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// Handle status check
async function handleStatus() {
  try {
    // Check if model is available
    const modelPath = process.env.GPT_OSS_MODEL_PATH || './gpt-oss-120b/original';
    
    let modelStatus = 'unknown';
    let modelSize = 0;
    
    try {
      const fs = await import('fs/promises');
      const stats = await fs.stat(modelPath);
      modelStatus = 'available';
      modelSize = stats.size;
    } catch (error) {
      modelStatus = 'not_found';
    }

    return NextResponse.json({
      success: true,
      status: {
        modelPath,
        modelStatus,
        modelSize,
        isInitialized: true, // GPTOSSManager tracks this
        configuration: {
          maxTokens: 2048,
          temperature: 0.1,
          contextLength: 8192,
          gpuLayers: parseInt(process.env.GPT_OSS_GPU_LAYERS || '50'),
          threads: parseInt(process.env.GPT_OSS_THREADS || '8')
        },
        systemInfo: {
          platform: process.platform,
          nodeVersion: process.version,
          memoryUsage: process.memoryUsage()
        }
      }
    });
  } catch (error) {
    console.error('GPT-OSS status check error:', error);
    return NextResponse.json(
      { error: 'Status check failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}