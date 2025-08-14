import { NextRequest, NextResponse } from 'next/server';
import { MedicalImagingDB } from '@/services/medical-imaging-db';

/**
 * @fileOverview Individual Dataset API
 * GET /api/medical-imaging/datasets/[id] - Get dataset by ID
 */

const imagingDB = MedicalImagingDB.getInstance();

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    
    if (!id) {
      return NextResponse.json(
        { error: 'Dataset ID is required' },
        { status: 400 }
      );
    }

    const dataset = await imagingDB.getDatasetById(id);
    
    if (!dataset) {
      return NextResponse.json(
        { error: 'Dataset not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: dataset
    });
  } catch (error) {
    console.error('Dataset by ID API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch dataset' },
      { status: 500 }
    );
  }
}