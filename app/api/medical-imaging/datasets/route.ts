import { NextRequest, NextResponse } from 'next/server';
import { MedicalImagingDB } from '@/services/medical-imaging-db';

/**
 * @fileOverview Medical Imaging Datasets API
 * GET /api/medical-imaging/datasets - Get all datasets with optional filtering
 * POST /api/medical-imaging/datasets - Add new dataset
 */

const imagingDB = MedicalImagingDB.getInstance();

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    const filters = {
      modality: searchParams.get('modality') || undefined,
      body_part: searchParams.get('body_part') || undefined,
      condition: searchParams.get('condition') || undefined,
      limit: searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : undefined,
      offset: searchParams.get('offset') ? parseInt(searchParams.get('offset')!) : undefined,
    };

    const datasets = await imagingDB.getDatasets(filters);

    return NextResponse.json({
      success: true,
      data: datasets,
      count: datasets.length,
      filters: Object.fromEntries(
        Object.entries(filters).filter(([_, value]) => value !== undefined)
      )
    });
  } catch (error) {
    console.error('Datasets API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch datasets' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate required fields
    const requiredFields = ['name', 'description', 'modality', 'body_part', 'dataset_size', 'file_format', 'license', 'source_url'];
    const missingFields = requiredFields.filter(field => !body[field]);
    
    if (missingFields.length > 0) {
      return NextResponse.json(
        { error: `Missing required fields: ${missingFields.join(', ')}` },
        { status: 400 }
      );
    }

    const dataset = await imagingDB.addDataset(body);
    
    if (!dataset) {
      return NextResponse.json(
        { error: 'Failed to create dataset' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: dataset
    }, { status: 201 });
  } catch (error) {
    console.error('Create dataset API error:', error);
    return NextResponse.json(
      { error: 'Failed to create dataset' },
      { status: 500 }
    );
  }
}