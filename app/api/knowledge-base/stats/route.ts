import { NextResponse } from 'next/server';
import { KnowledgeBaseDB } from '@/services/knowledge-base-db';

/**
 * @fileOverview Knowledge Base Statistics API
 */

const knowledgeDB = KnowledgeBaseDB.getInstance();

// GET /api/knowledge-base/stats - Get knowledge base statistics
export async function GET() {
  try {
    const stats = knowledgeDB.getStats();
    
    return NextResponse.json({
      success: true,
      stats
    });
  } catch (error) {
    console.error('Knowledge base stats error:', error);
    return NextResponse.json(
      { error: 'Failed to get statistics' },
      { status: 500 }
    );
  }
}