import { NextRequest, NextResponse } from 'next/server';
import { DiagnosisStorage } from '@/services/diagnosis-storage';

/**
 * @fileOverview Diagnosis Management API
 * GET /api/medical-imaging/diagnoses - Get diagnosis statistics
 * GET /api/medical-imaging/diagnoses?patient_id=xxx - Get diagnoses by patient
 */

const diagnosisStorage = DiagnosisStorage.getInstance();

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const patientId = searchParams.get('patient_id');
    
    if (patientId) {
      // Get diagnoses for specific patient
      const diagnoses = await diagnosisStorage.getDiagnosesByPatient(patientId);
      
      return NextResponse.json({
        success: true,
        data: diagnoses,
        count: diagnoses.length
      });
    } else {
      // Get diagnosis statistics
      const stats = await diagnosisStorage.getDiagnosisStats();
      
      return NextResponse.json({
        success: true,
        data: stats
      });
    }
  } catch (error) {
    console.error('Diagnoses API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch diagnoses' },
      { status: 500 }
    );
  }
}