import { NextRequest, NextResponse } from 'next/server';
import { RadiopaediaKnowledgeBase } from '@/services/radiopaedia-knowledge-base';
import { KnowledgeBaseDB } from '@/services/knowledge-base-db';

/**
 * @fileOverview Knowledge Base API endpoints
 * Provides REST API for managing and querying the medical knowledge base
 */

const radiopaediaKB = RadiopaediaKnowledgeBase.getInstance();
const knowledgeDB = KnowledgeBaseDB.getInstance();

// GET /api/knowledge-base - Search knowledge base
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q') || '';
    const type = searchParams.get('type') as 'article' | 'case' | 'image' | undefined;
    const system = searchParams.get('system') || undefined;
    const modality = searchParams.get('modality') || undefined;
    const pathology = searchParams.get('pathology') || undefined;
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');
    const semantic = searchParams.get('semantic') === 'true';

    const results = await knowledgeDB.search({
      text: query,
      filters: {
        type,
        system,
        modality,
        pathology
      },
      limit,
      offset,
      semantic_search: semantic
    });

    return NextResponse.json(results);
  } catch (error) {
    console.error('Knowledge base search error:', error);
    return NextResponse.json(
      { error: 'Failed to search knowledge base' },
      { status: 500 }
    );
  }
}

// POST /api/knowledge-base - Add new entry or sync from Radiopaedia
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, ...data } = body;

    switch (action) {
      case 'sync_radiopaedia':
        return await handleRadiopaediaSync(data);
      
      case 'add_entry':
        return await handleAddEntry(data);
      
      case 'import_articles':
        return await handleImportArticles(data);
      
      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Knowledge base operation error:', error);
    return NextResponse.json(
      { error: 'Failed to perform operation' },
      { status: 500 }
    );
  }
}

// PUT /api/knowledge-base - Update entry
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'Entry ID is required' },
        { status: 400 }
      );
    }

    const success = await knowledgeDB.updateEntry(id, updates);
    
    if (!success) {
      return NextResponse.json(
        { error: 'Entry not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Knowledge base update error:', error);
    return NextResponse.json(
      { error: 'Failed to update entry' },
      { status: 500 }
    );
  }
}

// DELETE /api/knowledge-base - Delete entry
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Entry ID is required' },
        { status: 400 }
      );
    }

    const success = await knowledgeDB.deleteEntry(id);
    
    if (!success) {
      return NextResponse.json(
        { error: 'Entry not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Knowledge base delete error:', error);
    return NextResponse.json(
      { error: 'Failed to delete entry' },
      { status: 500 }
    );
  }
}

// Handle Radiopaedia sync
async function handleRadiopaediaSync(data: {
  systems?: string[];
  modalities?: string[];
  pathologies?: string[];
  maxArticles?: number;
  downloadImages?: boolean;
}) {
  try {
    const results = await radiopaediaKB.syncByCategory({
      systems: data.systems,
      modalities: data.modalities,
      pathologies: data.pathologies,
      maxArticles: data.maxArticles || 100,
      downloadImages: data.downloadImages || false,
      onProgress: (status, current, total) => {
        console.log(`Sync progress: ${status} - ${current}/${total}`);
      }
    });

    return NextResponse.json({
      success: true,
      results
    });
  } catch (error) {
    console.error('Radiopaedia sync error:', error);
    return NextResponse.json(
      { error: 'Failed to sync from Radiopaedia' },
      { status: 500 }
    );
  }
}

// Handle adding new entry
async function handleAddEntry(data: any) {
  try {
    await knowledgeDB.addEntry(data);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Add entry error:', error);
    return NextResponse.json(
      { error: 'Failed to add entry' },
      { status: 500 }
    );
  }
}

// Handle importing articles
async function handleImportArticles(data: { articles: any[] }) {
  try {
    const results = await knowledgeDB.importRadiopaediaArticles(data.articles);
    return NextResponse.json({
      success: true,
      results
    });
  } catch (error) {
    console.error('Import articles error:', error);
    return NextResponse.json(
      { error: 'Failed to import articles' },
      { status: 500 }
    );
  }
}