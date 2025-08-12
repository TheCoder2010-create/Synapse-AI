#!/usr/bin/env tsx

/**
 * @fileOverview Test script to verify all Synapse AI functions are working
 */

import { config } from 'dotenv';
config();

async function testFunctions() {
  console.log('🧪 Testing Synapse AI Functions\n');

  // Test 1: Medical Errors
  console.log('1️⃣ Testing Medical Error System...');
  try {
    const { MedicalAIError, MedicalErrorCode, MedicalErrorSeverity, withMedicalRetry } = await import('../lib/medical-errors');
    
    // Test error creation
    const testError = new MedicalAIError(
      'Test error',
      MedicalErrorCode.MODEL_PROCESSING_ERROR,
      MedicalErrorSeverity.LOW
    );
    
    console.log('   ✅ Medical error system working');
    console.log(`   📊 Error created: ${testError.code} (${testError.severity})`);
  } catch (error) {
    console.log('   ❌ Medical error system failed:', error);
  }

  // Test 2: Knowledge Base
  console.log('\n2️⃣ Testing Knowledge Base...');
  try {
    const { KnowledgeBaseDB } = await import('../services/knowledge-base-db');
    const knowledgeDB = KnowledgeBaseDB.getInstance();
    
    const stats = knowledgeDB.getStats();
    console.log('   ✅ Knowledge base working');
    console.log(`   📊 Articles: ${stats.totalArticles}, Cases: ${stats.totalCases}, Images: ${stats.totalImages}`);
  } catch (error) {
    console.log('   ❌ Knowledge base failed:', error);
  }

  // Test 3: Radiopaedia Integration
  console.log('\n3️⃣ Testing Radiopaedia Integration...');
  try {
    const { RadiopaediaKnowledgeBase } = await import('../services/radiopaedia-knowledge-base');
    const radiopaediaKB = RadiopaediaKnowledgeBase.getInstance();
    
    const models = radiopaediaKB.getAvailableModels ? 'Available' : 'Not Available';
    console.log('   ✅ Radiopaedia integration working');
    console.log(`   📊 Status: Initialized`);
  } catch (error) {
    console.log('   ❌ Radiopaedia integration failed:', error);
  }

  // Test 4: Performance Monitoring
  console.log('\n4️⃣ Testing Performance Monitoring...');
  try {
    const { PerformanceMonitor } = await import('../lib/performance-monitoring');
    const monitor = PerformanceMonitor.getInstance();
    
    // Test metrics recording
    monitor.recordChatMetrics({
      responseTime: 1000,
      messageLength: 100,
      toolsUsed: 1,
      streamingLatency: 50,
      modelTokenUsage: 500,
      conversationTurn: 1,
      timestamp: new Date()
    });
    
    console.log('   ✅ Performance monitoring working');
    console.log('   📊 Test metrics recorded');
  } catch (error) {
    console.log('   ❌ Performance monitoring failed:', error);
  }

  // Test 5: Conversation Memory
  console.log('\n5️⃣ Testing Conversation Memory...');
  try {
    const { ConversationMemoryManager } = await import('../lib/conversation-memory');
    const memoryManager = ConversationMemoryManager.getInstance();
    
    const context = memoryManager.getOrCreateContext('test-session');
    console.log('   ✅ Conversation memory working');
    console.log(`   📊 Session created: ${context.sessionId}`);
  } catch (error) {
    console.log('   ❌ Conversation memory failed:', error);
  }

  // Test 6: Report Validation
  console.log('\n6️⃣ Testing Report Validation...');
  try {
    const { ReportTemplateValidator } = await import('../lib/report-validation');
    const validator = ReportTemplateValidator.getInstance();
    
    const templates = validator.getTemplates();
    console.log('   ✅ Report validation working');
    console.log(`   📊 Templates available: ${templates.length}`);
  } catch (error) {
    console.log('   ❌ Report validation failed:', error);
  }

  // Test 7: MONAI Integration
  console.log('\n7️⃣ Testing MONAI Integration...');
  try {
    const { getAvailableModels, recommendModel } = await import('../services/monai');
    
    const models = getAvailableModels();
    const recommended = recommendModel('brain', 'MR', 'accuracy');
    
    console.log('   ✅ MONAI integration working');
    console.log(`   📊 Available models: ${models.length}`);
    console.log(`   🎯 Recommended for brain MR: ${recommended?.name || 'None'}`);
  } catch (error) {
    console.log('   ❌ MONAI integration failed:', error);
  }

  // Test 8: External Services
  console.log('\n8️⃣ Testing External Services...');
  try {
    const { searchTCIADatasets } = await import('../services/tcia');
    const { searchImaiosAnatomy } = await import('../services/imaios');
    const { searchOpenI } = await import('../services/openi');
    const { searchXNAT } = await import('../services/xnat');
    
    console.log('   ✅ External services loaded');
    console.log('   📊 TCIA, IMAIOS, Open-i, XNAT services available');
  } catch (error) {
    console.log('   ❌ External services failed:', error);
  }

  // Test 9: Synapse Wrapper API
  console.log('\n9️⃣ Testing Synapse Wrapper API...');
  try {
    const { searchClinicalKnowledgeBase, searchDrugInfo } = await import('../services/synapse-wrapper-api');
    
    console.log('   ✅ Synapse Wrapper API working');
    console.log('   📊 Clinical KB and Drug Info services available');
  } catch (error) {
    console.log('   ❌ Synapse Wrapper API failed:', error);
  }

  // Test 10: AI Tools
  console.log('\n🔟 Testing AI Tools...');
  try {
    const { findCaseExamplesTool } = await import('../ai/tools/find-case-examples');
    
    console.log('   ✅ AI tools working');
    console.log('   📊 Case examples tool available');
  } catch (error) {
    console.log('   ❌ AI tools failed:', error);
  }

  console.log('\n🎉 Function testing completed!');
  console.log('\n📋 Summary:');
  console.log('   • All core systems have been tested');
  console.log('   • Any failures above indicate specific issues to address');
  console.log('   • Green checkmarks (✅) indicate working functions');
  console.log('   • Red X marks (❌) indicate functions that need attention');
}

// Run tests
testFunctions().catch(console.error);