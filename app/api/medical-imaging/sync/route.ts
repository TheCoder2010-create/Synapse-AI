import { NextResponse } from 'next/server';
import { NHSXDataScraper } from '@/services/nhsx-data-scraper';

/**
 * @fileOverview NHS-X Data Sync API
 * POST /api/medical-imaging/sync - Sync data from NHS-X repository
 */

export async function POST() {
  try {
    const scraper = new NHSXDataScraper();
    await scraper.processNHSXData();
    
    return NextResponse.json({
      success: true,
      message: 'NHS-X data sync completed successfully'
    });
  } catch (error) {
    console.error('NHS-X sync error:', error);
    return NextResponse.json(
      { error: 'Failed to sync NHS-X data' },
      { status: 500 }
    );
  }
}