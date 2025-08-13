'use server';

/**
 * @fileOverview Knowledge Base Database Service
 * Manages local storage and retrieval of medical knowledge base data
 */

import { RadiopaediaArticle, RadiopaediaImage, RadiopaediaCase, KnowledgeBaseStats } from './radiopaedia-knowledge-base';

export interface KnowledgeBaseEntry {
  id: string;
  type: 'article' | 'case' | 'image';
  title: string;
  content: string;
  metadata: {
    system?: string;
    modality?: string[];
    pathology?: string[];
    body_part?: string;
    difficulty?: string;
    tags?: string[];
    source: 'radiopaedia' | 'manual' | 'generated';
    source_id?: number;
    created_at: Date;
    updated_at: Date;
    views: number;
    relevance_score?: number;
  };
  embeddings?: number[]; // Vector embeddings for semantic search
  images?: {
    id: string;
    url: string;
    thumbnail_url?: string;
    caption: string;
    annotations?: any[];
  }[];
  related_entries?: string[]; // IDs of related entries
}

export interface SearchQuery {
  text: string;
  filters?: {
    type?: 'article' | 'case' | 'image';
    system?: string;
    modality?: string;
    pathology?: string;
    body_part?: string;
    difficulty?: string;
    source?: string;
  };
  limit?: number;
  offset?: number;
  semantic_search?: boolean;
}

export interface SearchResult {
  entries: KnowledgeBaseEntry[];
  total_count: number;
  search_time_ms: number;
  suggestions?: string[];
}

export class KnowledgeBaseDB {
  private static instance: KnowledgeBaseDB;
  private entries = new Map<string, KnowledgeBaseEntry>();
  private searchIndex = new Map<string, Set<string>>(); // term -> entry IDs
  private stats: KnowledgeBaseStats;

  static getInstance(): KnowledgeBaseDB {
    if (!KnowledgeBaseDB.instance) {
      KnowledgeBaseDB.instance = new KnowledgeBaseDB();
    }
    return KnowledgeBaseDB.instance;
  }

  constructor() {
    this.stats = {
      totalArticles: 0,
      totalImages: 0,
      totalCases: 0,
      modalityBreakdown: {},
      systemBreakdown: {},
      pathologyBreakdown: {},
      lastUpdated: new Date(),
      syncStatus: 'idle'
    };
    this.initializeDatabase();
  }

  /**
   * Initialize database with sample data
   */
  private async initializeDatabase(): Promise<void> {
    // Add some sample entries for demonstration
    const sampleEntries: KnowledgeBaseEntry[] = [
      {
        id: 'pneumothorax_001',
        type: 'article',
        title: 'Pneumothorax',
        content: 'Pneumothorax is the presence of air in the pleural space, which can cause partial or complete lung collapse. It can be spontaneous, traumatic, or iatrogenic.',
        metadata: {
          system: 'respiratory',
          modality: ['X-ray', 'CT'],
          pathology: ['pneumothorax'],
          body_part: 'chest',
          difficulty: 'intermediate',
          tags: ['emergency', 'chest', 'lung'],
          source: 'radiopaedia',
          source_id: 123,
          created_at: new Date(),
          updated_at: new Date(),
          views: 1250
        },
        images: [
          {
            id: 'pneumothorax_xray_001',
            url: 'https://example.com/pneumothorax_xray.jpg',
            thumbnail_url: 'https://example.com/pneumothorax_xray_thumb.jpg',
            caption: 'Chest X-ray showing right-sided pneumothorax with visible pleural line',
            annotations: [
              { x: 300, y: 200, width: 100, height: 150, label: 'Pleural line', type: 'abnormal' }
            ]
          }
        ],
        related_entries: ['pleural_effusion_001', 'chest_trauma_001']
      },
      {
        id: 'glioblastoma_001',
        type: 'article',
        title: 'Glioblastoma Multiforme',
        content: 'Glioblastoma multiforme (GBM) is the most common and aggressive primary brain tumor in adults. It typically shows heterogeneous enhancement with central necrosis.',
        metadata: {
          system: 'neurological',
          modality: ['MR'],
          pathology: ['glioblastoma', 'brain tumor'],
          body_part: 'brain',
          difficulty: 'advanced',
          tags: ['oncology', 'brain', 'malignant'],
          source: 'radiopaedia',
          source_id: 456,
          created_at: new Date(),
          updated_at: new Date(),
          views: 2100
        },
        images: [
          {
            id: 'gbm_mri_001',
            url: 'https://example.com/gbm_mri.jpg',
            caption: 'T1-weighted post-contrast MRI showing heterogeneously enhancing mass with central necrosis',
            annotations: [
              { x: 150, y: 100, width: 80, height: 90, label: 'Enhancing tumor', type: 'abnormal' },
              { x: 170, y: 120, width: 40, height: 50, label: 'Central necrosis', type: 'abnormal' }
            ]
          }
        ],
        related_entries: ['brain_metastases_001', 'meningioma_001']
      }
    ];

    for (const entry of sampleEntries) {
      await this.addEntry(entry);
    }
  }

  /**
   * Add a new entry to the knowledge base
   */
  async addEntry(entry: KnowledgeBaseEntry): Promise<void> {
    this.entries.set(entry.id, entry);
    this.updateSearchIndex(entry);
    this.updateStats(entry, 'add');

    console.log(`Added knowledge base entry: ${entry.title} (${entry.type})`);
  }

  /**
   * Update an existing entry
   */
  async updateEntry(id: string, updates: Partial<KnowledgeBaseEntry>): Promise<boolean> {
    const existing = this.entries.get(id);
    if (!existing) {
      return false;
    }

    const updated = { ...existing, ...updates, metadata: { ...existing.metadata, ...updates.metadata } };
    updated.metadata.updated_at = new Date();

    this.entries.set(id, updated);
    this.updateSearchIndex(updated);

    console.log(`Updated knowledge base entry: ${id}`);
    return true;
  }

  /**
   * Delete an entry
   */
  async deleteEntry(id: string): Promise<boolean> {
    const entry = this.entries.get(id);
    if (!entry) {
      return false;
    }

    this.entries.delete(id);
    this.removeFromSearchIndex(entry);
    this.updateStats(entry, 'remove');

    console.log(`Deleted knowledge base entry: ${id}`);
    return true;
  }

  /**
   * Get entry by ID
   */
  async getEntry(id: string): Promise<KnowledgeBaseEntry | null> {
    const entry = this.entries.get(id);
    if (entry) {
      // Increment view count
      entry.metadata.views++;
      this.entries.set(id, entry);
    }
    return entry || null;
  }

  /**
   * Search entries
   */
  async search(query: SearchQuery): Promise<SearchResult> {
    const startTime = performance.now();
    let matchingEntries: KnowledgeBaseEntry[] = [];

    if (query.semantic_search && query.text) {
      // Semantic search using embeddings (mock implementation)
      matchingEntries = await this.semanticSearch(query.text, query.filters);
    } else {
      // Keyword-based search
      matchingEntries = await this.keywordSearch(query.text, query.filters);
    }

    // Apply pagination
    const offset = query.offset || 0;
    const limit = query.limit || 50;
    const paginatedEntries = matchingEntries.slice(offset, offset + limit);

    const searchTime = performance.now() - startTime;

    return {
      entries: paginatedEntries,
      total_count: matchingEntries.length,
      search_time_ms: Math.round(searchTime),
      suggestions: this.generateSearchSuggestions(query.text)
    };
  }

  /**
   * Keyword-based search
   */
  private async keywordSearch(text: string, filters?: SearchQuery['filters']): Promise<KnowledgeBaseEntry[]> {
    if (!text && !filters) {
      return Array.from(this.entries.values());
    }

    let candidates = new Set<string>();

    // Text search
    if (text) {
      const searchTerms = text.toLowerCase().split(/\s+/);

      for (const term of searchTerms) {
        const matchingIds = this.searchIndex.get(term) || new Set();
        if (candidates.size === 0) {
          candidates = new Set(matchingIds);
        } else {
          // Intersection for AND search
          candidates = new Set([...candidates].filter(id => matchingIds.has(id)));
        }
      }
    } else {
      // No text search, start with all entries
      candidates = new Set(this.entries.keys());
    }

    // Apply filters
    const results: KnowledgeBaseEntry[] = [];

    for (const id of candidates) {
      const entry = this.entries.get(id);
      if (!entry) continue;

      if (this.matchesFilters(entry, filters)) {
        results.push(entry);
      }
    }

    // Sort by relevance (views, recency, etc.)
    return results.sort((a, b) => {
      // Primary sort: relevance score if available
      if (a.metadata.relevance_score && b.metadata.relevance_score) {
        return b.metadata.relevance_score - a.metadata.relevance_score;
      }

      // Secondary sort: views
      return b.metadata.views - a.metadata.views;
    });
  }

  /**
   * Semantic search using embeddings (mock implementation)
   */
  private async semanticSearch(text: string, filters?: SearchQuery['filters']): Promise<KnowledgeBaseEntry[]> {
    // In a real implementation, this would:
    // 1. Generate embeddings for the search text
    // 2. Calculate similarity with stored embeddings
    // 3. Return results sorted by similarity

    console.log(`Semantic search for: "${text}" (mock implementation)`);

    // For now, fall back to keyword search
    return this.keywordSearch(text, filters);
  }

  /**
   * Check if entry matches filters
   */
  private matchesFilters(entry: KnowledgeBaseEntry, filters?: SearchQuery['filters']): boolean {
    if (!filters) return true;

    if (filters.type && entry.type !== filters.type) return false;
    if (filters.system && entry.metadata.system !== filters.system) return false;
    if (filters.modality && entry.metadata.modality && !entry.metadata.modality.includes(filters.modality)) return false;
    if (filters.pathology && entry.metadata.pathology && !entry.metadata.pathology.some(p => p.includes(filters.pathology!))) return false;
    if (filters.body_part && entry.metadata.body_part !== filters.body_part) return false;
    if (filters.difficulty && entry.metadata.difficulty !== filters.difficulty) return false;
    if (filters.source && entry.metadata.source !== filters.source) return false;

    return true;
  }

  /**
   * Update search index for an entry
   */
  private updateSearchIndex(entry: KnowledgeBaseEntry): void {
    // Remove old index entries if updating
    this.removeFromSearchIndex(entry);

    // Index title and content
    const textToIndex = [
      entry.title,
      entry.content,
      ...(entry.metadata.tags || []),
      ...(entry.metadata.pathology || []),
      entry.metadata.system || '',
      entry.metadata.body_part || ''
    ].join(' ').toLowerCase();

    const terms = textToIndex.split(/\s+/).filter(term => term.length > 2);

    for (const term of terms) {
      if (!this.searchIndex.has(term)) {
        this.searchIndex.set(term, new Set());
      }
      this.searchIndex.get(term)!.add(entry.id);
    }
  }

  /**
   * Remove entry from search index
   */
  private removeFromSearchIndex(entry: KnowledgeBaseEntry): void {
    for (const [term, ids] of this.searchIndex.entries()) {
      ids.delete(entry.id);
      if (ids.size === 0) {
        this.searchIndex.delete(term);
      }
    }
  }

  /**
   * Update statistics
   */
  private updateStats(entry: KnowledgeBaseEntry, operation: 'add' | 'remove'): void {
    const multiplier = operation === 'add' ? 1 : -1;

    // Update counts
    if (entry.type === 'article') {
      this.stats.totalArticles += multiplier;
    } else if (entry.type === 'case') {
      this.stats.totalCases += multiplier;
    } else if (entry.type === 'image') {
      this.stats.totalImages += multiplier;
    }

    // Update breakdowns
    if (entry.metadata.system) {
      this.stats.systemBreakdown[entry.metadata.system] =
        (this.stats.systemBreakdown[entry.metadata.system] || 0) + multiplier;
    }

    if (entry.metadata.modality) {
      for (const modality of entry.metadata.modality) {
        this.stats.modalityBreakdown[modality] =
          (this.stats.modalityBreakdown[modality] || 0) + multiplier;
      }
    }

    if (entry.metadata.pathology) {
      for (const pathology of entry.metadata.pathology) {
        this.stats.pathologyBreakdown[pathology] =
          (this.stats.pathologyBreakdown[pathology] || 0) + multiplier;
      }
    }

    this.stats.lastUpdated = new Date();
  }

  /**
   * Generate search suggestions
   */
  private generateSearchSuggestions(query: string): string[] {
    if (!query || query.length < 3) return [];

    const suggestions = new Set<string>();
    const queryLower = query.toLowerCase();

    // Find terms that start with the query
    for (const term of this.searchIndex.keys()) {
      if (term.startsWith(queryLower) && term !== queryLower) {
        suggestions.add(term);
      }
    }

    // Add common medical terms
    const commonTerms = [
      'pneumothorax', 'pneumonia', 'atelectasis', 'consolidation',
      'glioblastoma', 'meningioma', 'stroke', 'hemorrhage',
      'fracture', 'dislocation', 'arthritis', 'stenosis'
    ];

    for (const term of commonTerms) {
      if (term.includes(queryLower)) {
        suggestions.add(term);
      }
    }

    return Array.from(suggestions).slice(0, 5);
  }

  /**
   * Import Radiopaedia articles
   */
  async importRadiopaediaArticles(articles: RadiopaediaArticle[]): Promise<{
    imported: number;
    updated: number;
    errors: string[];
  }> {
    const results = { imported: 0, updated: 0, errors: [] };

    for (const article of articles) {
      try {
        const entryId = `radiopaedia_article_${article.id}`;
        const existingEntry = this.entries.get(entryId);

        const entry: KnowledgeBaseEntry = {
          id: entryId,
          type: 'article',
          title: article.title,
          content: `${article.synopsis}\n\n${article.body}`,
          metadata: {
            system: article.system,
            modality: article.modality,
            pathology: article.pathology,
            difficulty: article.difficulty,
            tags: article.tags,
            source: 'radiopaedia',
            source_id: article.id,
            created_at: new Date(article.created_at),
            updated_at: new Date(article.updated_at),
            views: article.views
          },
          images: article.images.map(img => ({
            id: `radiopaedia_image_${img.id}`,
            url: img.image_url,
            thumbnail_url: img.thumbnail_url,
            caption: img.caption,
            annotations: img.annotations
          })),
          related_entries: [] // Would be populated based on similar content
        };

        if (existingEntry) {
          await this.updateEntry(entryId, entry);
          results.updated++;
        } else {
          await this.addEntry(entry);
          results.imported++;
        }

        // Import cases as separate entries
        for (const case_ of article.cases) {
          const caseEntryId = `radiopaedia_case_${case_.id}`;
          const caseEntry: KnowledgeBaseEntry = {
            id: caseEntryId,
            type: 'case',
            title: case_.title,
            content: `${case_.patient_data.presentation}\n\nDiagnosis: ${case_.diagnosis}\n\nDiscussion: ${case_.discussion}`,
            metadata: {
              system: article.system,
              modality: case_.studies.map(s => s.modality),
              pathology: [case_.diagnosis, ...case_.differential_diagnosis],
              source: 'radiopaedia',
              source_id: case_.id,
              created_at: new Date(),
              updated_at: new Date(),
              views: 0
            },
            images: case_.studies.flatMap(study =>
              study.images.map(img => ({
                id: `radiopaedia_case_image_${img.id}`,
                url: img.image_url,
                thumbnail_url: img.thumbnail_url,
                caption: img.caption,
                annotations: img.annotations
              }))
            ),
            related_entries: [entryId] // Link to parent article
          };

          await this.addEntry(caseEntry);
        }

      } catch (error) {
        results.errors.push(`Failed to import article ${article.id}: ${error}`);
      }
    }

    return results;
  }

  /**
   * Get knowledge base statistics
   */
  getStats(): KnowledgeBaseStats {
    return { ...this.stats };
  }

  /**
   * Get related entries
   */
  async getRelatedEntries(entryId: string, limit: number = 5): Promise<KnowledgeBaseEntry[]> {
    const entry = this.entries.get(entryId);
    if (!entry) return [];

    // Get explicitly related entries
    const relatedIds = entry.related_entries || [];
    const related = relatedIds.map(id => this.entries.get(id)).filter(Boolean) as KnowledgeBaseEntry[];

    // If we need more, find similar entries based on metadata
    if (related.length < limit) {
      const similar = await this.findSimilarEntries(entry, limit - related.length);
      related.push(...similar);
    }

    return related.slice(0, limit);
  }

  /**
   * Find similar entries based on metadata
   */
  private async findSimilarEntries(entry: KnowledgeBaseEntry, limit: number): Promise<KnowledgeBaseEntry[]> {
    const candidates: Array<{ entry: KnowledgeBaseEntry; score: number }> = [];

    for (const [id, candidate] of this.entries.entries()) {
      if (id === entry.id) continue;

      let score = 0;

      // Same system
      if (candidate.metadata.system === entry.metadata.system) score += 3;

      // Overlapping modalities
      const candidateModalities = candidate.metadata.modality || [];
      const entryModalities = entry.metadata.modality || [];
      const modalityOverlap = candidateModalities.filter(m => entryModalities.includes(m)).length;
      score += modalityOverlap * 2;

      // Overlapping pathologies
      const candidatePathologies = candidate.metadata.pathology || [];
      const entryPathologies = entry.metadata.pathology || [];
      const pathologyOverlap = candidatePathologies.filter(p => entryPathologies.some(ep => ep.includes(p) || p.includes(ep))).length;
      score += pathologyOverlap * 2;

      // Same body part
      if (candidate.metadata.body_part === entry.metadata.body_part) score += 1;

      if (score > 0) {
        candidates.push({ entry: candidate, score });
      }
    }

    return candidates
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map(c => c.entry);
  }

  /**
   * Export knowledge base data
   */
  async exportData(): Promise<{
    entries: KnowledgeBaseEntry[];
    stats: KnowledgeBaseStats;
    exportDate: Date;
  }> {
    return {
      entries: Array.from(this.entries.values()),
      stats: this.getStats(),
      exportDate: new Date()
    };
  }

  /**
   * Clear all data
   */
  async clearAll(): Promise<void> {
    this.entries.clear();
    this.searchIndex.clear();
    this.stats = {
      totalArticles: 0,
      totalImages: 0,
      totalCases: 0,
      modalityBreakdown: {},
      systemBreakdown: {},
      pathologyBreakdown: {},
      lastUpdated: new Date(),
      syncStatus: 'idle'
    };

    console.log('Knowledge base cleared');
  }
}