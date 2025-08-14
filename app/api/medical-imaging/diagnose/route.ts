import { NextRequest, NextResponse } from 'next/server';
import { AIDiagnosisService } from '@/services/ai-diagnosis';

/**
 * @fileOverview AI Medical Diagnosis API
 * POST /api/medical-imaging/diagnose - Analyze medical image and generate diagnosis
 */

const diagnosisService = AIDiagnosisService.getInstance();

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate required fields
    const requiredFields = ['imageData', 'imageType', 'modality', 'bodyPart'];
    const missingFields = requiredFields.filter(field => !body[field]);
    
    if (missingFields.length > 0) {
      return NextResponse.json(
        { error: `Missing required fields: ${missingFields.join(', ')}` },
        { status: 400 }
      );
    }

    // Validate image
    const validation = diagnosisService.validateMedicalImage(body.imageData, body.imageType);
    if (!validation.valid) {
      return NextResponse.json(
        { error: validation.error },
        { status: 400 }
      );
    }

    // Perform AI diagnosis
    const diagnosis = await diagnosisService.analyzeMedicalImage({
      imageData: body.imageData,
      imageType: body.imageType,
      modality: body.modality,
      bodyPart: body.bodyPart,
      patientAge: body.patientAge,
      patientSex: body.patientSex,
      clinicalHistory: body.clinicalHistory,
      symptoms: body.symptoms
    });

    return NextResponse.json({
      success: true,
      data: diagnosis
    });

  } catch (error) {
    console.error('AI Diagnosis API error:', error);
    return NextResponse.json(
      { error: 'Failed to analyze medical image' },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const supportedAnalysis = diagnosisService.getSupportedAnalysis();
    
    return NextResponse.json({
      success: true,
      data: supportedAnalysis
    });
  } catch (error) {
    console.error('Get supported analysis error:', error);
    return NextResponse.json(
      { error: 'Failed to get supported analysis types' },
      { status: 500 }
    );
  }
}