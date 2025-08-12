import { NextRequest, NextResponse } from 'next/server';
import { KnowledgeBaseDB } from '@/services/knowledge-base-db';

/**
 * @fileOverview Individual Knowledge Base Entry API
 */

const knowledgeDB = KnowledgeBaseDB.getInstance();

// GET /api/knowledge-base/[id] - Get specific entry
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const entry = await knowledgeDB.getEntry(params.id);
    
    if (!entry) {
      return NextResponse.json(
        { error: 'Entry not found' },
        { status: 404 }
      );
    }

    // Get related entries
    const relatedEntries = await knowledgeDB.getRelatedEntries(params.id, 5);

    return NextResponse.json({
      success: true,
      entry,
      related: relatedEntries
    });
  } catch (error) {
    console.error('Knowledge base entry error:', error);
    return NextResponse.json(
      { error: 'Failed to get entry' },
      { status: 500 }
    );
  }
}