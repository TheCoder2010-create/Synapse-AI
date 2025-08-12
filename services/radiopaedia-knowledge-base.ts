'use server';

/**
 * @fileOverview Radiopaedia Knowledge Base Builder
 * Creates and maintains a local knowledge base by fetching data from Radiopaedia API
 */

export interface RadiopaediaArticle {
  id: number;
  title: string;
  slug: string;
  public_url: string;
  synopsis: string;
  body: string;
  system: string;
  modality: string[];
  pathology: string[];
  images: RadiopaediaImage[];
  cases: RadiopaediaCase[];
  created_at: string;
  updated_at: string;
  views: number;
  likes: number;
  difficulty: 'basic' | 'intermediate' | 'advanced';
  tags: string[];
}

export interface RadiopaediaImage {
  id: number;
  article_id: number;
  filename: string;
  caption: string;
  modality: string;
  plane: string;
  body_part: string;
  pathology: string;
  image_url: string;
  thumbnail_url: string;
  annotations: ImageAnnotation[];
  metadata: {
    width: number;
    height: number;
    file_size: number;
    format: string;
  };
}

export interface ImageAnnotation {
  id: number;
  x: number;
  y: number;
  width: number;
  height: number;
  label: string;
  description: string;
  finding_type: 'normal' | 'abnormal' | 'variant';
}

export interface RadiopaediaCase {
  id: number;
  title: string;
  patient_data: {
    age: number;
    sex: 'M' | 'F';
    presentation: string;
    history: string;
  };
  studies: CaseStudy[];
  diagnosis: string;
  discussion: string;
  differential_diagnosis: string[];
  teaching_points: string[];
  references: string[];
}

export interface CaseStudy {
  id: number;
  modality: string;
  body_part: string;
  technique: string;
  findings: string;
  images: RadiopaediaImage[];
}

export interface KnowledgeBaseStats {
  totalArticles: number;
  totalImages: number;
  totalCases: number;
  modalityBreakdown: Record<string, number>;
  systemBreakdown: Record<string, number>;
  pathologyBreakdown: Record<string, number>;
  lastUpdated: Date;
  syncStatus: 'idle' | 'syncing' | 'error';
}

export class RadiopaediaKnowledgeBase {
  private static instance: RadiopaediaKnowledgeBase;
  private apiKey: string;
  private baseUrl = 'https://radiopaedia.org/api/v1';
  private rateLimitDelay = 1000; // 1 second between requests
  private maxRetries = 3;

  static getInstance(): RadiopaediaKnowledgeBase {
    if (!RadiopaediaKnowledgeBase.instance) {
      RadiopaediaKnowledgeBase.instance = new RadiopaediaKnowledgeBase();
    }
    return RadiopaediaKnowledgeBase.instance;
  }

  constructor() {
    this.apiKey = process.env.RADIOPAEDIA_API_KEY || '';
    if (!this.apiKey) {
      console.warn('Radiopaedia API key not configured');
    }
  }

  /**
   * Fetch all articles with pagination
   */
  async fetchAllArticles(options: {
    limit?: number;
    system?: string;
    modality?: string;
    pathology?: string;
    onProgress?: (current: number, total: number) => void;
  } = {}): Promise<RadiopaediaArticle[]> {
    if (!this.apiKey) {
      throw new Error('Radiopaedia API key not configured');
    }

    const articles: RadiopaediaArticle[] = [];
    let page = 1;
    let hasMore = true;
    const perPage = 50;

    console.log('Starting Radiopaedia knowledge base sync...');

    while (hasMore && (!options.limit || articles.length < options.limit)) {
      try {
        const params = new URLSearchParams({
          page: page.toString(),
          per_page: perPage.toString(),
          ...(options.system && { system: options.system }),
          ...(options.modality && { modality: options.modality }),
          ...(options.pathology && { pathology: options.pathology })
        });

        const response = await this.makeApiRequest(`/articles?${params}`);
        const data = await response.json();

        if (!data.articles || data.articles.length === 0) {
          hasMore = false;
          break;
        }

        // Process each article to get full details
        for (const articleSummary of data.articles) {
          try {
            const fullArticle = await this.fetchArticleDetails(articleSummary.id);
            if (fullArticle) {
              articles.push(fullArticle);
              options.onProgress?.(articles.length, data.total_count || articles.length);
            }

            // Rate limiting
            await this.delay(this.rateLimitDelay);
          } catch (error) {
            console.error(`Failed to fetch article ${articleSummary.id}:`, error);
          }
        }

        page++;
        
        // Check if we've reached the limit
        if (options.limit && articles.length >= options.limit) {
          break;
        }

      } catch (error) {
        console.error(`Failed to fetch articles page ${page}:`, error);
        break;
      }
    }

    console.log(`Fetched ${articles.length} articles from Radiopaedia`);
    return articles;
  }

  /**
   * Fetch detailed article information including images and cases
   */
  async fetchArticleDetails(articleId: number): Promise<RadiopaediaArticle | null> {
    try {
      const response = await this.makeApiRequest(`/articles/${articleId}`);
      const articleData = await response.json();

      // Fetch associated images
      const images = await this.fetchArticleImages(articleId);
      
      // Fetch associated cases
      const cases = await this.fetchArticleCases(articleId);

      const article: RadiopaediaArticle = {
        id: articleData.id,
        title: articleData.title,
        slug: articleData.slug,
        public_url: articleData.public_url,
        synopsis: this.cleanHtml(articleData.synopsis || ''),
        body: this.cleanHtml(articleData.body || ''),
        system: articleData.system,
        modality: articleData.modality || [],
        pathology: articleData.pathology || [],
        images,
        cases,
        created_at: articleData.created_at,
        updated_at: articleData.updated_at,
        views: articleData.views || 0,
        likes: articleData.likes || 0,
        difficulty: articleData.difficulty || 'intermediate',
        tags: articleData.tags || []
      };

      return article;
    } catch (error) {
      console.error(`Failed to fetch article details for ${articleId}:`, error);
      return null;
    }
  }

  /**
   * Fetch images for a specific article
   */
  async fetchArticleImages(articleId: number): Promise<RadiopaediaImage[]> {
    try {
      const response = await this.makeApiRequest(`/articles/${articleId}/images`);
      const data = await response.json();

      return (data.images || []).map((img: any) => ({
        id: img.id,
        article_id: articleId,
        filename: img.filename,
        caption: this.cleanHtml(img.caption || ''),
        modality: img.modality,
        plane: img.plane,
        body_part: img.body_part,
        pathology: img.pathology,
        image_url: img.image_url,
        thumbnail_url: img.thumbnail_url,
        annotations: img.annotations || [],
        metadata: {
          width: img.width || 0,
          height: img.height || 0,
          file_size: img.file_size || 0,
          format: img.format || 'unknown'
        }
      }));
    } catch (error) {
      console.error(`Failed to fetch images for article ${articleId}:`, error);
      return [];
    }
  }

  /**
   * Fetch cases for a specific article
   */
  async fetchArticleCases(articleId: number): Promise<RadiopaediaCase[]> {
    try {
      const response = await this.makeApiRequest(`/articles/${articleId}/cases`);
      const data = await response.json();

      const cases: RadiopaediaCase[] = [];
      
      for (const caseData of data.cases || []) {
        const caseStudies = await this.fetchCaseStudies(caseData.id);
        
        cases.push({
          id: caseData.id,
          title: caseData.title,
          patient_data: {
            age: caseData.patient_age || 0,
            sex: caseData.patient_sex || 'M',
            presentation: this.cleanHtml(caseData.presentation || ''),
            history: this.cleanHtml(caseData.history || '')
          },
          studies: caseStudies,
          diagnosis: this.cleanHtml(caseData.diagnosis || ''),
          discussion: this.cleanHtml(caseData.discussion || ''),
          differential_diagnosis: caseData.differential_diagnosis || [],
          teaching_points: caseData.teaching_points || [],
          references: caseData.references || []
        });
      }

      return cases;
    } catch (error) {
      console.error(`Failed to fetch cases for article ${articleId}:`, error);
      return [];
    }
  }

  /**
   * Fetch studies for a specific case
   */
  async fetchCaseStudies(caseId: number): Promise<CaseStudy[]> {
    try {
      const response = await this.makeApiRequest(`/cases/${caseId}/studies`);
      const data = await response.json();

      const studies: CaseStudy[] = [];
      
      for (const studyData of data.studies || []) {
        const studyImages = await this.fetchStudyImages(studyData.id);
        
        studies.push({
          id: studyData.id,
          modality: studyData.modality,
          body_part: studyData.body_part,
          technique: this.cleanHtml(studyData.technique || ''),
          findings: this.cleanHtml(studyData.findings || ''),
          images: studyImages
        });
      }

      return studies;
    } catch (error) {
      console.error(`Failed to fetch studies for case ${caseId}:`, error);
      return [];
    }
  }

  /**
   * Fetch images for a specific study
   */
  async fetchStudyImages(studyId: number): Promise<RadiopaediaImage[]> {
    try {
      const response = await this.makeApiRequest(`/studies/${studyId}/images`);
      const data = await response.json();

      return (data.images || []).map((img: any) => ({
        id: img.id,
        article_id: 0, // Study images don't belong to articles
        filename: img.filename,
        caption: this.cleanHtml(img.caption || ''),
        modality: img.modality,
        plane: img.plane,
        body_part: img.body_part,
        pathology: img.pathology,
        image_url: img.image_url,
        thumbnail_url: img.thumbnail_url,
        annotations: img.annotations || [],
        metadata: {
          width: img.width || 0,
          height: img.height || 0,
          file_size: img.file_size || 0,
          format: img.format || 'unknown'
        }
      }));
    } catch (error) {
      console.error(`Failed to fetch images for study ${studyId}:`, error);
      return [];
    }
  }

  /**
   * Search articles by term
   */
  async searchArticles(
    query: string,
    filters: {
      system?: string;
      modality?: string;
      pathology?: string;
      limit?: number;
    } = {}
  ): Promise<RadiopaediaArticle[]> {
    try {
      const params = new URLSearchParams({
        q: query,
        scope: 'articles',
        ...(filters.system && { system: filters.system }),
        ...(filters.modality && { modality: filters.modality }),
        ...(filters.pathology && { pathology: filters.pathology }),
        ...(filters.limit && { limit: filters.limit.toString() })
      });

      const response = await this.makeApiRequest(`/search?${params}`);
      const data = await response.json();

      const articles: RadiopaediaArticle[] = [];
      
      for (const articleSummary of data.articles || []) {
        const fullArticle = await this.fetchArticleDetails(articleSummary.id);
        if (fullArticle) {
          articles.push(fullArticle);
        }
        await this.delay(this.rateLimitDelay);
      }

      return articles;
    } catch (error) {
      console.error('Failed to search articles:', error);
      return [];
    }
  }

  /**
   * Download and store images locally
   */
  async downloadImage(imageUrl: string, filename: string): Promise<string | null> {
    try {
      const response = await fetch(imageUrl);
      if (!response.ok) {
        throw new Error(`Failed to download image: ${response.statusText}`);
      }

      const buffer = await response.arrayBuffer();
      const base64 = Buffer.from(buffer).toString('base64');
      const mimeType = response.headers.get('content-type') || 'image/jpeg';
      
      return `data:${mimeType};base64,${base64}`;
    } catch (error) {
      console.error(`Failed to download image ${filename}:`, error);
      return null;
    }
  }

  /**
   * Get knowledge base statistics
   */
  async getStats(): Promise<KnowledgeBaseStats> {
    // This would typically query your local database
    // For now, return mock stats
    return {
      totalArticles: 0,
      totalImages: 0,
      totalCases: 0,
      modalityBreakdown: {},
      systemBreakdown: {},
      pathologyBreakdown: {},
      lastUpdated: new Date(),
      syncStatus: 'idle'
    };
  }

  /**
   * Sync specific categories of content
   */
  async syncByCategory(options: {
    systems?: string[];
    modalities?: string[];
    pathologies?: string[];
    maxArticles?: number;
    downloadImages?: boolean;
    onProgress?: (status: string, current: number, total: number) => void;
  }): Promise<{
    articlesProcessed: number;
    imagesDownloaded: number;
    casesProcessed: number;
    errors: string[];
  }> {
    const results = {
      articlesProcessed: 0,
      imagesDownloaded: 0,
      casesProcessed: 0,
      errors: []
    };

    try {
      options.onProgress?.('Starting sync...', 0, 0);

      // Sync articles for each system/modality combination
      for (const system of options.systems || ['']) {
        for (const modality of options.modalities || ['']) {
          try {
            const articles = await this.fetchAllArticles({
              system,
              modality,
              limit: options.maxArticles,
              onProgress: (current, total) => {
                options.onProgress?.(`Syncing ${system || 'all systems'} - ${modality || 'all modalities'}`, current, total);
              }
            });

            results.articlesProcessed += articles.length;
            
            // Process images if requested
            if (options.downloadImages) {
              for (const article of articles) {
                for (const image of article.images) {
                  try {
                    const imageData = await this.downloadImage(image.image_url, image.filename);
                    if (imageData) {
                      results.imagesDownloaded++;
                    }
                    await this.delay(this.rateLimitDelay);
                  } catch (error) {
                    results.errors.push(`Failed to download image ${image.filename}: ${error}`);
                  }
                }
              }
            }

            // Count cases
            results.casesProcessed += articles.reduce((sum, article) => sum + article.cases.length, 0);

          } catch (error) {
            results.errors.push(`Failed to sync ${system}/${modality}: ${error}`);
          }
        }
      }

      options.onProgress?.('Sync completed', results.articlesProcessed, results.articlesProcessed);

    } catch (error) {
      results.errors.push(`Sync failed: ${error}`);
    }

    return results;
  }

  /**
   * Make authenticated API request with retry logic
   */
  private async makeApiRequest(endpoint: string): Promise<Response> {
    const url = `${this.baseUrl}${endpoint}`;
    const headers = {
      'Authorization': this.apiKey,
      'Accept': 'application/json',
      'User-Agent': 'Synapse-AI/1.0'
    };

    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        const response = await fetch(url, { headers });
        
        if (response.status === 429) {
          // Rate limited, wait longer
          await this.delay(this.rateLimitDelay * 2);
          continue;
        }
        
        if (!response.ok) {
          throw new Error(`API request failed: ${response.status} ${response.statusText}`);
        }
        
        return response;
      } catch (error) {
        if (attempt === this.maxRetries) {
          throw error;
        }
        await this.delay(this.rateLimitDelay * attempt);
      }
    }

    throw new Error('Max retries exceeded');
  }

  /**
   * Clean HTML content
   */
  private cleanHtml(html: string): string {
    return html
      .replace(/<[^>]*>/g, '') // Remove HTML tags
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .trim();
  }

  /**
   * Delay helper for rate limiting
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}