/**
 * @fileOverview Diagnosis Storage Service
 * Handles storing and retrieving AI diagnosis results
 */

import { createClient } from '@supabase/supabase-js';
import { DiagnosisResult } from './ai-diagnosis';

export interface StoredDiagnosis extends DiagnosisResult {
  patientId?: string;
  imageUrl?: string;
  reviewedBy?: string;
  reviewedAt?: string;
  status: 'pending' | 'reviewed' | 'approved' | 'rejected';
}

export class DiagnosisStorage {
  private static instance: DiagnosisStorage;
  private supabase: any;

  private constructor() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    if (supabaseUrl && supabaseKey) {
      this.supabase = createClient(supabaseUrl, supabaseKey);
    } else {
      console.warn('Supabase credentials not found for diagnosis storage');
    }
  }

  public static getInstance(): DiagnosisStorage {
    if (!DiagnosisStorage.instance) {
      DiagnosisStorage.instance = new DiagnosisStorage();
    }
    return DiagnosisStorage.instance;
  }

  // Store diagnosis result
  async storeDiagnosis(diagnosis: DiagnosisResult, patientId?: string): Promise<StoredDiagnosis | null> {
    if (!this.supabase) {
      console.log('Mock: Would store diagnosis:', diagnosis.id);
      return { ...diagnosis, status: 'pending' };
    }

    try {
      const storedDiagnosis: Omit<StoredDiagnosis, 'id'> = {
        ...diagnosis,
        patientId,
        status: 'pending'
      };

      const { data, error } = await this.supabase
        .from('ai_diagnoses')
        .insert([storedDiagnosis])
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error storing diagnosis:', error);
      return null;
    }
  }

  // Get diagnosis by ID
  async getDiagnosis(id: string): Promise<StoredDiagnosis | null> {
    if (!this.supabase) {
      return null;
    }

    try {
      const { data, error } = await this.supabase
        .from('ai_diagnoses')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching diagnosis:', error);
      return null;
    }
  }

  // Get diagnoses by patient
  async getDiagnosesByPatient(patientId: string): Promise<StoredDiagnosis[]> {
    if (!this.supabase) {
      return [];
    }

    try {
      const { data, error } = await this.supabase
        .from('ai_diagnoses')
        .select('*')
        .eq('patientId', patientId)
        .order('createdAt', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching patient diagnoses:', error);
      return [];
    }
  }

  // Update diagnosis status
  async updateDiagnosisStatus(
    id: string, 
    status: StoredDiagnosis['status'], 
    reviewedBy?: string
  ): Promise<boolean> {
    if (!this.supabase) {
      console.log('Mock: Would update diagnosis status:', id, status);
      return true;
    }

    try {
      const updateData: any = { 
        status,
        reviewedAt: new Date().toISOString()
      };
      
      if (reviewedBy) {
        updateData.reviewedBy = reviewedBy;
      }

      const { error } = await this.supabase
        .from('ai_diagnoses')
        .update(updateData)
        .eq('id', id);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error updating diagnosis status:', error);
      return false;
    }
  }

  // Get diagnosis statistics
  async getDiagnosisStats(): Promise<{
    total: number;
    byStatus: Record<string, number>;
    byModality: Record<string, number>;
    byUrgency: Record<string, number>;
    avgConfidence: number;
  }> {
    if (!this.supabase) {
      return {
        total: 0,
        byStatus: {},
        byModality: {},
        byUrgency: {},
        avgConfidence: 0
      };
    }

    try {
      const { data, error } = await this.supabase
        .from('ai_diagnoses')
        .select('status, urgency, confidence, metadata');

      if (error) throw error;

      const stats = {
        total: data.length,
        byStatus: {} as Record<string, number>,
        byModality: {} as Record<string, number>,
        byUrgency: {} as Record<string, number>,
        avgConfidence: 0
      };

      let totalConfidence = 0;

      data.forEach((diagnosis: any) => {
        // Count by status
        stats.byStatus[diagnosis.status] = (stats.byStatus[diagnosis.status] || 0) + 1;
        
        // Count by urgency
        stats.byUrgency[diagnosis.urgency] = (stats.byUrgency[diagnosis.urgency] || 0) + 1;
        
        // Count by modality
        if (diagnosis.metadata?.modality) {
          const modality = diagnosis.metadata.modality;
          stats.byModality[modality] = (stats.byModality[modality] || 0) + 1;
        }
        
        // Sum confidence
        totalConfidence += diagnosis.confidence || 0;
      });

      stats.avgConfidence = data.length > 0 ? totalConfidence / data.length : 0;

      return stats;
    } catch (error) {
      console.error('Error fetching diagnosis stats:', error);
      return {
        total: 0,
        byStatus: {},
        byModality: {},
        byUrgency: {},
        avgConfidence: 0
      };
    }
  }
}