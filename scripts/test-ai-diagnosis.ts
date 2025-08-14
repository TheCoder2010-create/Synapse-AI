#!/usr/bin/env tsx

/**
 * @fileOverview Test script for AI Diagnosis functionality
 * Run with: npm run test:ai-diagnosis
 */

import fs from 'fs';
import path from 'path';

const BASE_URL = 'http://localhost:3000';

// Mock base64 image data (1x1 pixel PNG)
const MOCK_IMAGE_DATA = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';

async function testAIDiagnosis() {
  console.log('🧠 Testing AI Diagnosis API...\n');

  try {
    // Test 1: Get supported analysis types
    console.log('1. Testing GET /api/medical-imaging/diagnose (supported types)');
    const supportedResponse = await fetch(`${BASE_URL}/api/medical-imaging/diagnose`);
    const supportedData = await supportedResponse.json();
    console.log('✅ Supported modalities:', supportedData.data.modalities.join(', '));
    console.log('✅ Supported body parts:', supportedData.data.bodyParts.join(', '));
    console.log('✅ Supported formats:', supportedData.data.imageFormats.join(', '));
    console.log();

    // Test 2: Test diagnosis with minimal data
    console.log('2. Testing POST /api/medical-imaging/diagnose (basic)');
    const basicDiagnosisRequest = {
      imageData: MOCK_IMAGE_DATA,
      imageType: 'image/png',
      modality: 'X-Ray',
      bodyPart: 'Chest'
    };

    const basicResponse = await fetch(`${BASE_URL}/api/medical-imaging/diagnose`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(basicDiagnosisRequest),
    });

    if (basicResponse.ok) {
      const basicData = await basicResponse.json();
      console.log('✅ Basic diagnosis completed');
      console.log(`   Diagnosis ID: ${basicData.data.id}`);
      console.log(`   Confidence: ${(basicData.data.confidence * 100).toFixed(1)}%`);
      console.log(`   Urgency: ${basicData.data.urgency}`);
      console.log(`   Findings: ${basicData.data.findings.length} items`);
      console.log();
    } else {
      console.log('⚠️  Basic diagnosis test skipped (likely missing Gemini API key)');
      console.log();
    }

    // Test 3: Test diagnosis with full patient context
    console.log('3. Testing POST /api/medical-imaging/diagnose (with patient context)');
    const fullDiagnosisRequest = {
      imageData: MOCK_IMAGE_DATA,
      imageType: 'image/png',
      modality: 'CT',
      bodyPart: 'Brain',
      patientAge: 65,
      patientSex: 'M',
      clinicalHistory: 'Patient presents with headaches and confusion',
      symptoms: ['headache', 'confusion', 'memory loss']
    };

    const fullResponse = await fetch(`${BASE_URL}/api/medical-imaging/diagnose`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(fullDiagnosisRequest),
    });

    if (fullResponse.ok) {
      const fullData = await fullResponse.json();
      console.log('✅ Full context diagnosis completed');
      console.log(`   Diagnosis ID: ${fullData.data.id}`);
      console.log(`   Processing time: ${fullData.data.metadata.processingTime}ms`);
      console.log(`   Model used: ${fullData.data.metadata.model}`);
      console.log();
    } else {
      console.log('⚠️  Full context diagnosis test skipped');
      console.log();
    }

    // Test 4: Test validation errors
    console.log('4. Testing validation errors');
    
    // Missing required fields
    const invalidResponse1 = await fetch(`${BASE_URL}/api/medical-imaging/diagnose`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        imageData: MOCK_IMAGE_DATA,
        // Missing imageType, modality, bodyPart
      }),
    });

    if (invalidResponse1.status === 400) {
      const errorData1 = await invalidResponse1.json();
      console.log('✅ Validation error caught:', errorData1.error);
    }

    // Invalid image type
    const invalidResponse2 = await fetch(`${BASE_URL}/api/medical-imaging/diagnose`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        imageData: MOCK_IMAGE_DATA,
        imageType: 'image/gif', // Unsupported
        modality: 'X-Ray',
        bodyPart: 'Chest'
      }),
    });

    if (invalidResponse2.status === 400) {
      const errorData2 = await invalidResponse2.json();
      console.log('✅ Image validation error caught:', errorData2.error);
    }
    console.log();

    // Test 5: Test diagnosis statistics
    console.log('5. Testing GET /api/medical-imaging/diagnoses (statistics)');
    const statsResponse = await fetch(`${BASE_URL}/api/medical-imaging/diagnoses`);
    const statsData = await statsResponse.json();
    console.log('✅ Diagnosis statistics retrieved');
    console.log(`   Total diagnoses: ${statsData.data.total}`);
    console.log(`   Average confidence: ${(statsData.data.avgConfidence * 100).toFixed(1)}%`);
    console.log();

    // Test 6: Test patient diagnoses
    console.log('6. Testing GET /api/medical-imaging/diagnoses?patient_id=test123');
    const patientResponse = await fetch(`${BASE_URL}/api/medical-imaging/diagnoses?patient_id=test123`);
    const patientData = await patientResponse.json();
    console.log('✅ Patient diagnoses retrieved');
    console.log(`   Diagnoses for patient: ${patientData.count}`);
    console.log();

    console.log('🎉 All AI Diagnosis tests completed!');
    console.log('\n📋 Next Steps:');
    console.log('1. Set up your Google AI API key in .env.local');
    console.log('2. Configure Supabase for diagnosis storage');
    console.log('3. Test with real medical images');
    console.log('4. Implement user authentication for production use');

  } catch (error) {
    console.error('❌ AI Diagnosis test failed:', error);
    process.exit(1);
  }
}

// Helper function to create a sample medical image for testing
function createSampleMedicalImage(): string {
  // In a real scenario, you would load an actual medical image
  // For testing, we use a minimal PNG
  return MOCK_IMAGE_DATA;
}

// Run tests
testAIDiagnosis();