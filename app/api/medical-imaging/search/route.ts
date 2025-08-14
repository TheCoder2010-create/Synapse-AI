import { NextRequest, NextResponse } from 'next/server';
import { MedicalImagingDB } from '@/services/medical-imaging-db';

/**
 * @fileOverview Medical Imaging Search API
 * GET /api/medical-imaging/search - Search datasets by query
 */

const imagingDB = MedicalImagingDB.getInstance();

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');
    
    if (!query) {
      return NextResponse.json(
        { error: 'Search query parameter "q" is required' },
        { status: 400 }
      );
    }

    const filters = {
      modality: searchParams.get('modality') || undefined,
      body_part: searchParams.get('body_part') || undefined,
    };

    const results = await imagingDB.searchDatasets(query, filters);

    return NextResponse.json({
      success: true,
      data: results,
      count: results.length,
      query,
      filters: Object.fromEntries(
        Object.entries(filters).filter(([_, value]) => value !== undefined)
      )
    });
  } catch (error) {
    console.error('Search API error:', error);
    return NextResponse.json(
      { error: 'Failed to search datasets' },
      { status: 500 }
    );
  }
}