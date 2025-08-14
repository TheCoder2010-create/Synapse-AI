import { NextResponse } from 'next/server';
import { MedicalImagingDB } from '@/services/medical-imaging-db';

/**
 * @fileOverview Medical Imaging Statistics API
 * GET /api/medical-imaging/stats - Get dataset statistics
 */

const imagingDB = MedicalImagingDB.getInstance();

export async function GET() {
  try {
    const stats = await imagingDB.getStats();
    
    return NextResponse.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Medical imaging stats error:', error);
    return NextResponse.json(
      { error: 'Failed to get statistics' },
      { status: 500 }
    );
  }
}