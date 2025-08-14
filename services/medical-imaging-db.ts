/**
 * @fileOverview Medical Imaging Database Service
 * Handles database operations for NHS-X open source imaging datasets
 */

import { createClient } from '@supabase/supabase-js';

// Database types based on NHS-X imaging datasets structure
export interface ImagingDataset {
  id: string;
  name: string;
  description: string;
  modality: string; // CT, MRI, X-Ray, Ultrasound, etc.
  body_part: string;
  disease_condition?: string;
  dataset_size: number;
  file_format: string; // DICOM, NIfTI, PNG, etc.
  license: string;
  source_url: string;
  download_url?: string;
  paper_reference?: string;
  created_at: string;
  updated_at: string;
  tags: string[];
  metadata: Record<string, any>;
}

export interface DatasetStats {
  total_datasets: number;
  by_modality: Record<string, number>;
  by_body_part: Record<string, number>;
  by_condition: Record<string, number>;
  total_images: number;
  avg_dataset_size: number;
}

export class MedicalImagingDB {
  private static instance: MedicalImagingDB;
  private supabase: any;

  private constructor() {
    // Initialize Supabase client
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    if (supabaseUrl && supabaseKey) {
      this.supabase = createClient(supabaseUrl, supabaseKey);
    } else {
      console.warn('Supabase credentials not found, using mock data');
    }
  }

  public static getInstance(): MedicalImagingDB {
    if (!MedicalImagingDB.instance) {
      MedicalImagingDB.instance = new MedicalImagingDB();
    }
    return MedicalImagingDB.instance;
  }

  // Get all datasets with optional filtering
  async getDatasets(filters?: {
    modality?: string;
    body_part?: string;
    condition?: string;
    limit?: number;
    offset?: number;
  }): Promise<ImagingDataset[]> {
    if (!this.supabase) {
      return this.getMockDatasets();
    }

    try {
      let query = this.supabase
        .from('imaging_datasets')
        .select('*');

      if (filters?.modality) {
        query = query.eq('modality', filters.modality);
      }
      if (filters?.body_part) {
        query = query.eq('body_part', filters.body_part);
      }
      if (filters?.condition) {
        query = query.eq('disease_condition', filters.condition);
      }
      if (filters?.limit) {
        query = query.limit(filters.limit);
      }
      if (filters?.offset) {
        query = query.range(filters.offset, (filters.offset + (filters.limit || 10)) - 1);
      }

      const { data, error } = await query;
      
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching datasets:', error);
      return this.getMockDatasets();
    }
  }

  // Get dataset by ID
  async getDatasetById(id: string): Promise<ImagingDataset | null> {
    if (!this.supabase) {
      const mockData = this.getMockDatasets();
      return mockData.find(d => d.id === id) || null;
    }

    try {
      const { data, error } = await this.supabase
        .from('imaging_datasets')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching dataset:', error);
      return null;
    }
  }

  // Search datasets
  async searchDatasets(query: string, filters?: {
    modality?: string;
    body_part?: string;
  }): Promise<ImagingDataset[]> {
    if (!this.supabase) {
      const mockData = this.getMockDatasets();
      return mockData.filter(d => 
        d.name.toLowerCase().includes(query.toLowerCase()) ||
        d.description.toLowerCase().includes(query.toLowerCase())
      );
    }

    try {
      let dbQuery = this.supabase
        .from('imaging_datasets')
        .select('*')
        .or(`name.ilike.%${query}%,description.ilike.%${query}%,tags.cs.{${query}}`);

      if (filters?.modality) {
        dbQuery = dbQuery.eq('modality', filters.modality);
      }
      if (filters?.body_part) {
        dbQuery = dbQuery.eq('body_part', filters.body_part);
      }

      const { data, error } = await dbQuery;
      
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error searching datasets:', error);
      return [];
    }
  }

  // Get dataset statistics
  async getStats(): Promise<DatasetStats> {
    if (!this.supabase) {
      return this.getMockStats();
    }

    try {
      const { data, error } = await this.supabase
        .from('imaging_datasets')
        .select('modality, body_part, disease_condition, dataset_size');

      if (error) throw error;

      const stats: DatasetStats = {
        total_datasets: data.length,
        by_modality: {},
        by_body_part: {},
        by_condition: {},
        total_images: 0,
        avg_dataset_size: 0
      };

      data.forEach((dataset: any) => {
        // Count by modality
        stats.by_modality[dataset.modality] = (stats.by_modality[dataset.modality] || 0) + 1;
        
        // Count by body part
        stats.by_body_part[dataset.body_part] = (stats.by_body_part[dataset.body_part] || 0) + 1;
        
        // Count by condition
        if (dataset.disease_condition) {
          stats.by_condition[dataset.disease_condition] = (stats.by_condition[dataset.disease_condition] || 0) + 1;
        }
        
        // Sum total images
        stats.total_images += dataset.dataset_size || 0;
      });

      stats.avg_dataset_size = stats.total_images / stats.total_datasets;

      return stats;
    } catch (error) {
      console.error('Error fetching stats:', error);
      return this.getMockStats();
    }
  }

  // Add new dataset
  async addDataset(dataset: Omit<ImagingDataset, 'id' | 'created_at' | 'updated_at'>): Promise<ImagingDataset | null> {
    if (!this.supabase) {
      console.log('Mock: Would add dataset:', dataset.name);
      return null;
    }

    try {
      const { data, error } = await this.supabase
        .from('imaging_datasets')
        .insert([{
          ...dataset,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }])
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error adding dataset:', error);
      return null;
    }
  }

  // Mock data for development
  private getMockDatasets(): ImagingDataset[] {
    return [
      {
        id: '1',
        name: 'COVID-19 Chest X-ray Dataset',
        description: 'Large dataset of chest X-rays from COVID-19 patients and healthy controls',
        modality: 'X-Ray',
        body_part: 'Chest',
        disease_condition: 'COVID-19',
        dataset_size: 15000,
        file_format: 'PNG',
        license: 'CC BY 4.0',
        source_url: 'https://github.com/ieee8023/covid-chestxray-dataset',
        paper_reference: 'Cohen et al. 2020',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
        tags: ['covid-19', 'pneumonia', 'chest', 'x-ray'],
        metadata: { resolution: '1024x1024', age_range: '18-90' }
      },
      {
        id: '2',
        name: 'Brain MRI Segmentation Dataset',
        description: 'MRI brain scans with tumor segmentation masks',
        modality: 'MRI',
        body_part: 'Brain',
        disease_condition: 'Brain Tumor',
        dataset_size: 3000,
        file_format: 'NIfTI',
        license: 'CC BY-NC 4.0',
        source_url: 'https://www.med.upenn.edu/cbica/brats2020/',
        paper_reference: 'Menze et al. 2015',
        created_at: '2024-01-02T00:00:00Z',
        updated_at: '2024-01-02T00:00:00Z',
        tags: ['brain', 'tumor', 'segmentation', 'mri'],
        metadata: { slice_thickness: '1mm', field_strength: '3T' }
      },
      {
        id: '3',
        name: 'Skin Lesion Classification Dataset',
        description: 'Dermoscopic images of skin lesions for melanoma detection',
        modality: 'Dermoscopy',
        body_part: 'Skin',
        disease_condition: 'Melanoma',
        dataset_size: 10000,
        file_format: 'JPEG',
        license: 'CC BY-NC 4.0',
        source_url: 'https://www.isic-archive.com/',
        paper_reference: 'Codella et al. 2018',
        created_at: '2024-01-03T00:00:00Z',
        updated_at: '2024-01-03T00:00:00Z',
        tags: ['skin', 'melanoma', 'dermoscopy', 'classification'],
        metadata: { image_size: '600x450', magnification: '10x' }
      }
    ];
  }

  private getMockStats(): DatasetStats {
    return {
      total_datasets: 3,
      by_modality: { 'X-Ray': 1, 'MRI': 1, 'Dermoscopy': 1 },
      by_body_part: { 'Chest': 1, 'Brain': 1, 'Skin': 1 },
      by_condition: { 'COVID-19': 1, 'Brain Tumor': 1, 'Melanoma': 1 },
      total_images: 28000,
      avg_dataset_size: 9333
    };
  }
}