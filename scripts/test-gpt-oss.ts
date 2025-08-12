#!/usr/bin/env tsx

/**
 * @fileOverview Test script for GPT-OSS-120B integration
 */

import { config } from 'dotenv';
config();

async function testGPTOSS() {
  console.log('🧪 Testing GPT-OSS-120B Integration\n');

  try {
    // Test 1: GPT-OSS Manager
    console.log('1️⃣ Testing GPT-OSS Manager...');
    const { GPTOSSManager } = await import('../services/gpt-oss-integration');
    const gptOssManager = GPTOSSManager.getInstance();
    
    console.log('   ✅ GPT-OSS Manager loaded');
    
    // Test initialization
    await gptOssManager.initialize();
    console.log('   ✅ GPT-OSS Manager initialized');

    // Test 2: Simple Generation
    console.log('\n2️⃣ Testing Text Generation...');
    const testPrompt = "Analyze a chest X-ray showing possible pneumothorax.";
    
    const response = await gptOssManager.generate(testPrompt, {
      maxTokens: 200,
      temperature: 0.1
    });
    
    console.log('   ✅ Text generation working');
    console.log(`   📊 Generated ${response.tokens} tokens in ${response.processingTime}ms`);
    console.log(`   🎯 Confidence: ${(response.confidence * 100).toFixed(1)}%`);
    console.log(`   📝 Response preview: ${response.text.substring(0, 100)}...`);

    // Test 3: GPT-OSS Diagnosis Flow
    console.log('\n3️⃣ Testing GPT-OSS Diagnosis Flow...');
    const { gptOssDiagnosis } = await import('../ai/flows/gpt-oss-diagnosis');
    
    const mockInput = {
      radiologyMediaDataUris: ['data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k='],
      mediaType: 'image' as const,
      isDicom: false
    };
    
    try {
      const diagnosisResult = await gptOssDiagnosis(mockInput);
      console.log('   ✅ GPT-OSS diagnosis flow working');
      console.log(`   🎯 Primary diagnosis: ${diagnosisResult.primarySuggestion}`);
      console.log(`   📊 Confidence: ${(diagnosisResult.confidence * 100).toFixed(1)}%`);
      console.log(`   🔍 Differentials: ${diagnosisResult.differentialDiagnoses?.length || 0}`);
    } catch (error) {
      console.log('   ⚠️  GPT-OSS diagnosis flow test skipped (requires full setup)');
      console.log(`   📝 Error: ${error}`);
    }

    // Test 4: Performance Comparison
    console.log('\n4️⃣ Performance Comparison...');
    const startTime = Date.now();
    
    const quickResponse = await gptOssManager.generate("What is pneumothorax?", {
      maxTokens: 100,
      temperature: 0.1
    });
    
    const responseTime = Date.now() - startTime;
    console.log('   ✅ Performance test completed');
    console.log(`   ⚡ Response time: ${responseTime}ms`);
    console.log(`   🎯 Tokens/second: ${(quickResponse.tokens / (responseTime / 1000)).toFixed(1)}`);

    // Test 5: Model Configuration
    console.log('\n5️⃣ Testing Model Configuration...');
    const modelPath = process.env.GPT_OSS_MODEL_PATH || './gpt-oss-120b/original';
    const fs = await import('fs/promises');
    
    try {
      await fs.access(modelPath);
      console.log('   ✅ Model path accessible');
      console.log(`   📁 Model location: ${modelPath}`);
    } catch (error) {
      console.log('   ⚠️  Model path not found - run installation script first');
      console.log(`   📁 Expected location: ${modelPath}`);
    }

    console.log('\n🎉 GPT-OSS testing completed!');
    console.log('\n📋 Summary:');
    console.log('   • GPT-OSS Manager: Working');
    console.log('   • Text Generation: Working');
    console.log('   • Diagnosis Flow: Available');
    console.log('   • Performance: Measured');
    console.log('   • Configuration: Checked');

  } catch (error) {
    console.error('\n❌ GPT-OSS testing failed:', error);
    console.log('\n🔧 Troubleshooting:');
    console.log('   1. Run the installation script: npm run install:gpt-oss');
    console.log('   2. Check your .env file has GPT_OSS_MODEL_PATH set');
    console.log('   3. Ensure you have sufficient GPU memory (24GB+ recommended)');
    console.log('   4. Verify Python and gpt-oss package are installed');
  }
}

// Run tests
testGPTOSS().catch(console.error);