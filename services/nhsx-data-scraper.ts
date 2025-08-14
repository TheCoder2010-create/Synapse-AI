/**
 * @fileOverview NHS-X Data Scraper Service
 * Scrapes and processes data from NHS-X open source imaging datasets repository
 */

import { MedicalImagingDB, ImagingDataset } from './medical-imaging-db';

export interface NHSXDatasetEntry {
  name: string;
  description: string;
  url: string;
  category: string;
  modality?: string;
  bodyPart?: string;
  condition?: string;
  size?: number;
  format?: string;
  license?: string;
}

export class NHSXDataScraper {
  private imagingDB: MedicalImagingDB;

  constructor() {
    this.imagingDB = MedicalImagingDB.getInstance();
  }

  // Parse NHS-X repository data and convert to our format
  async processNHSXData(): Promise<void> {
    try {
      const nhsxDatasets = await this.fetchNHSXDatasets();
      
      for (const entry of nhsxDatasets) {
        const dataset = this.convertToImagingDataset(entry);
        await this.imagingDB.addDataset(dataset);
      }
      
      console.log(`Processed ${nhsxDatasets.length} NHS-X datasets`);
    } catch (error) {
      console.error('Error processing NHS-X data:', error);
    }
  }

  // Fetch datasets from NHS-X repository (mock implementation)
  private async fetchNHSXDatasets(): Promise<NHSXDatasetEntry[]> {
    // In a real implementation, this would scrape the NHS-X GitHub repository
    // or fetch from their API if available
    return this.getMockNHSXData();
  }

  // Convert NHS-X format to our database format
  private convertToImagingDataset(entry: NHSXDatasetEntry): Omit<ImagingDataset, 'id' | 'created_at' | 'updated_at'> {
    return {
      name: entry.name,
      description: entry.description,
      modality: entry.modality || this.inferModality(entry.name, entry.description),
      body_part: entry.bodyPart || this.inferBodyPart(entry.name, entry.description),
      disease_condition: entry.condition,
      dataset_size: entry.size || 0,
      file_format: entry.format || 'DICOM',
      license: entry.license || 'Unknown',
      source_url: entry.url,
      tags: this.generateTags(entry),
      metadata: {
        category: entry.category,
        source: 'NHS-X'
      }
    };
  }

  // Infer modality from dataset name/description
  private inferModality(name: string, description: string): string {
    const text = (name + ' ' + description).toLowerCase();
    
    if (text.includes('ct') || text.includes('computed tomography')) return 'CT';
    if (text.includes('mri') || text.includes('magnetic resonance')) return 'MRI';
    if (text.includes('x-ray') || text.includes('xray') || text.includes('radiograph')) return 'X-Ray';
    if (text.includes('ultrasound') || text.includes('us') || text.includes('echo')) return 'Ultrasound';
    if (text.includes('pet') || text.includes('positron emission')) return 'PET';
    if (text.includes('mammography') || text.includes('mammogram')) return 'Mammography';
    if (text.includes('endoscopy') || text.includes('endoscopic')) return 'Endoscopy';
    if (text.includes('dermoscopy') || text.includes('dermatology')) return 'Dermoscopy';
    if (text.includes('fundus') || text.includes('retinal')) return 'Fundus';
    if (text.includes('oct') || text.includes('optical coherence')) return 'OCT';
    
    return 'Other';
  }

  // Infer body part from dataset name/description
  private inferBodyPart(name: string, description: string): string {
    const text = (name + ' ' + description).toLowerCase();
    
    if (text.includes('brain') || text.includes('head') || text.includes('neurological')) return 'Brain';
    if (text.includes('chest') || text.includes('lung') || text.includes('pulmonary')) return 'Chest';
    if (text.includes('heart') || text.includes('cardiac') || text.includes('cardiovascular')) return 'Heart';
    if (text.includes('abdomen') || text.includes('abdominal') || text.includes('liver') || text.includes('kidney')) return 'Abdomen';
    if (text.includes('spine') || text.includes('spinal') || text.includes('vertebral')) return 'Spine';
    if (text.includes('breast') || text.includes('mammary')) return 'Breast';
    if (text.includes('skin') || text.includes('dermatology')) return 'Skin';
    if (text.includes('eye') || text.includes('retinal') || text.includes('ophthalmic')) return 'Eye';
    if (text.includes('bone') || text.includes('skeletal') || text.includes('orthopedic')) return 'Bone';
    if (text.includes('pelvis') || text.includes('pelvic')) return 'Pelvis';
    
    return 'Other';
  }

  // Generate relevant tags
  private generateTags(entry: NHSXDatasetEntry): string[] {
    const tags: string[] = [];
    
    // Add category as tag
    if (entry.category) {
      tags.push(entry.category.toLowerCase());
    }
    
    // Add modality as tag
    if (entry.modality) {
      tags.push(entry.modality.toLowerCase());
    }
    
    // Add body part as tag
    if (entry.bodyPart) {
      tags.push(entry.bodyPart.toLowerCase());
    }
    
    // Add condition as tag
    if (entry.condition) {
      tags.push(entry.condition.toLowerCase());
    }
    
    // Add NHS-X source tag
    tags.push('nhsx', 'open-source');
    
    return tags;
  }

  // Mock NHS-X data for development
  private getMockNHSXData(): NHSXDatasetEntry[] {
    return [
      {
        name: 'UK Biobank Brain MRI',
        description: 'Large-scale brain MRI dataset from UK Biobank participants',
        url: 'https://www.ukbiobank.ac.uk/',
        category: 'Neuroimaging',
        modality: 'MRI',
        bodyPart: 'Brain',
        size: 50000,
        format: 'NIfTI',
        license: 'UK Biobank'
      },
      {
        name: 'MIMIC-CXR Chest X-rays',
        description: 'Chest radiographs from MIMIC-III database',
        url: 'https://physionet.org/content/mimic-cxr/',
        category: 'Chest Imaging',
        modality: 'X-Ray',
        bodyPart: 'Chest',
        size: 377110,
        format: 'DICOM',
        license: 'PhysioNet Credentialed Health Data License'
      },
      {
        name: 'ADNI Alzheimer\'s MRI',
        description: 'MRI scans from Alzheimer\'s Disease Neuroimaging Initiative',
        url: 'http://adni.loni.usc.edu/',
        category: 'Neuroimaging',
        modality: 'MRI',
        bodyPart: 'Brain',
        condition: 'Alzheimer\'s Disease',
        size: 15000,
        format: 'NIfTI',
        license: 'ADNI Data Use Agreement'
      },
      {
        name: 'ISIC Skin Lesion Archive',
        description: 'International Skin Imaging Collaboration melanoma dataset',
        url: 'https://www.isic-archive.com/',
        category: 'Dermatology',
        modality: 'Dermoscopy',
        bodyPart: 'Skin',
        condition: 'Melanoma',
        size: 25000,
        format: 'JPEG',
        license: 'CC BY-NC'
      },
      {
        name: 'LIDC-IDRI Lung CT',
        description: 'Lung Image Database Consortium CT scans with nodule annotations',
        url: 'https://wiki.cancerimagingarchive.net/display/Public/LIDC-IDRI',
        category: 'Chest Imaging',
        modality: 'CT',
        bodyPart: 'Chest',
        condition: 'Lung Cancer',
        size: 1018,
        format: 'DICOM',
        license: 'CC BY 3.0'
      }
    ];
  }
}