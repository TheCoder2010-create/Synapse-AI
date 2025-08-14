import { NextRequest, NextResponse } from 'next/server';
import { DiagnosisStorage } from '@/services/diagnosis-storage';

/**
 * @fileOverview Individual Diagnosis API
 * GET /api/medical-imaging/diagnoses/[id] - Get diagnosis by ID
 * PATCH /api/medical-imaging/diagnoses/[id] - Update diagnosis status
 */

const diagnosisStorage = DiagnosisStorage.getInstance();

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    
    if (!id) {
      return NextResponse.json(
        { error: 'Diagnosis ID is required' },
        { status: 400 }
      );
    }

    const diagnosis = await diagnosisStorage.getDiagnosis(id);
    
    if (!diagnosis) {
      return NextResponse.json(
        { error: 'Diagnosis not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: diagnosis
    });
  } catch (error) {
    console.error('Get diagnosis API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch diagnosis' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await request.json();
    
    if (!id) {
      return NextResponse.json(
        { error: 'Diagnosis ID is required' },
        { status: 400 }
      );
    }

    const { status, reviewedBy } = body;
    
    if (!status) {
      return NextResponse.json(
        { error: 'Status is required' },
        { status: 400 }
      );
    }

    const validStatuses = ['pending', 'reviewed', 'approved', 'rejected'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` },
        { status: 400 }
      );
    }

    const success = await diagnosisStorage.updateDiagnosisStatus(id, status, reviewedBy);
    
    if (!success) {
      return NextResponse.json(
        { error: 'Failed to update diagnosis status' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Diagnosis status updated successfully'
    });
  } catch (error) {
    console.error('Update diagnosis API error:', error);
    return NextResponse.json(
      { error: 'Failed to update diagnosis' },
      { status: 500 }
    );
  }
}