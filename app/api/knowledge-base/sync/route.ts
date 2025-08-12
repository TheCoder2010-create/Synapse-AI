import { NextRequest, NextResponse } from 'next/server';
import { RadiopaediaKnowledgeBase } from '@/services/radiopaedia-knowledge-base';
import { KnowledgeBaseDB } from '@/services/knowledge-base-db';

/**
 * @fileOverview Knowledge Base Sync API
 * Handles syncing data from external sources like Radiopaedia
 */

const radiopaediaKB = RadiopaediaKnowledgeBase.getInstance();
const knowledgeDB = KnowledgeBaseDB.getInstance();

// POST /api/knowledge-base/sync - Start sync process
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      source = 'radiopaedia',
      systems = [],
      modalities = [],
      pathologies = [],
      maxArticles = 100,
      downloadImages = false
    } = body;

    if (source !== 'radiopaedia') {
      return NextResponse.json(
        { error: 'Only Radiopaedia sync is currently supported' },
        { status: 400 }
      );
    }

    // Start sync process
    console.log('Starting knowledge base sync from Radiopaedia...');
    
    const syncResults = await radiopaediaKB.syncByCategory({
      systems: systems.length > 0 ? systems : undefined,
      modalities: modalities.length > 0 ? modalities : undefined,
      pathologies: pathologies.length > 0 ? pathologies : undefined,
      maxArticles,
      downloadImages,
      onProgress: (status, current, total) => {
        console.log(`Sync progress: ${status} - ${current}/${total}`);
        // In a real implementation, you might emit progress via WebSocket or Server-Sent Events
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Sync completed successfully',
      results: syncResults
    });

  } catch (error) {
    console.error('Knowledge base sync error:', error);
    return NextResponse.json(
      { error: `Sync failed: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500 }
    );
  }
}

// GET /api/knowledge-base/sync - Get sync status
export async function GET() {
  try {
    const stats = knowledgeDB.getStats();
    
    return NextResponse.json({
      success: true,
      syncStatus: stats.syncStatus,
      lastUpdated: stats.lastUpdated,
      totalEntries: stats.totalArticles + stats.totalCases + stats.totalImages
    });
  } catch (error) {
    console.error('Sync status error:', error);
    return NextResponse.json(
      { error: 'Failed to get sync status' },
      { status: 500 }
    );
  }
}