/**
 * @fileOverview Performance monitoring and metrics collection for Synapse AI
 */

export interface DiagnosisMetrics {
  // Timing metrics
  totalProcessingTime: number;
  imageAnalysisTime: number;
  knowledgeBaseLookupTime: number;
  aiInferenceTime: number;
  reportGenerationTime: number;
  
  // Usage metrics
  toolUsageCount: number;
  knowledgeBaseLookups: number;
  externalServiceCalls: number;
  modelTokenUsage: number;
  
  // Quality metrics
  confidenceScore: number;
  imageQualityScore: number;
  diagnosticComplexity: number;
  
  // Resource metrics
  memoryUsage: number;
  cpuUsage: number;
  
  // Context
  modality: string;
  anatomy: string;
  caseId?: string;
  userId?: string;
  timestamp: Date;
}

export interface ChatMetrics {
  responseTime: number;
  messageLength: number;
  toolsUsed: number;
  streamingLatency: number;
  audioGenerationTime?: number;
  modelTokenUsage: number;
  conversationTurn: number;
  timestamp: Date;
}

export interface ReportMetrics {
  generationTime: number;
  reportLength: number;
  sectionsGenerated: number;
  templateUsed: boolean;
  qualityScore: number;
  completenessScore: number;
  timestamp: Date;
}

export interface SystemMetrics {
  activeUsers: number;
  concurrentSessions: number;
  queueLength: number;
  errorRate: number;
  averageResponseTime: number;
  throughput: number; // requests per minute
  timestamp: Date;
}

export class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private diagnosisMetrics: DiagnosisMetrics[] = [];
  private chatMetrics: ChatMetrics[] = [];
  private reportMetrics: ReportMetrics[] = [];
  private systemMetrics: SystemMetrics[] = [];
  
  // Performance thresholds
  private readonly THRESHOLDS = {
    diagnosis: {
      maxProcessingTime: 30000, // 30 seconds
      minConfidence: 0.7,
      maxMemoryUsage: 1024 * 1024 * 1024, // 1GB
    },
    chat: {
      maxResponseTime: 5000, // 5 seconds
      maxStreamingLatency: 1000, // 1 second
    },
    report: {
      maxGenerationTime: 10000, // 10 seconds
      minQualityScore: 0.8,
    },
    system: {
      maxErrorRate: 0.05, // 5%
      maxResponseTime: 15000, // 15 seconds
      maxQueueLength: 100,
    }
  };

  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }

  // Diagnosis performance tracking
  startDiagnosisTimer(context: { modality: string; anatomy: string; caseId?: string; userId?: string }) {
    const startTime = performance.now();
    const startMemory = this.getMemoryUsage();
    
    return {
      context,
      startTime,
      startMemory,
      toolUsageCount: 0,
      knowledgeBaseLookups: 0,
      externalServiceCalls: 0,
      
      recordToolUsage: () => {
        return {
          toolUsageCount: ++this.toolUsageCount,
          timestamp: performance.now()
        };
      },
      
      recordKnowledgeLookup: (service: string, duration: number) => {
        return {
          knowledgeBaseLookups: ++this.knowledgeBaseLookups,
          externalServiceCalls: ++this.externalServiceCalls,
          service,
          duration
        };
      },
      
      finish: (result: {
        confidenceScore: number;
        imageQualityScore: number;
        diagnosticComplexity: number;
        modelTokenUsage: number;
      }) => {
        const endTime = performance.now();
        const endMemory = this.getMemoryUsage();
        
        const metrics: DiagnosisMetrics = {
          totalProcessingTime: endTime - startTime,
          imageAnalysisTime: 0, // Would be measured separately
          knowledgeBaseLookupTime: 0, // Would be measured separately
          aiInferenceTime: 0, // Would be measured separately
          reportGenerationTime: 0, // Would be measured separately
          toolUsageCount: this.toolUsageCount,
          knowledgeBaseLookups: this.knowledgeBaseLookups,
          externalServiceCalls: this.externalServiceCalls,
          modelTokenUsage: result.modelTokenUsage,
          confidenceScore: result.confidenceScore,
          imageQualityScore: result.imageQualityScore,
          diagnosticComplexity: result.diagnosticComplexity,
          memoryUsage: endMemory - startMemory,
          cpuUsage: this.getCpuUsage(),
          modality: context.modality,
          anatomy: context.anatomy,
          caseId: context.caseId,
          userId: context.userId,
          timestamp: new Date()
        };
        
        this.recordDiagnosisMetrics(metrics);
        return metrics;
      }
    };
  }

  recordDiagnosisMetrics(metrics: DiagnosisMetrics): void {
    this.diagnosisMetrics.push(metrics);
    
    // Check performance thresholds
    this.checkDiagnosisThresholds(metrics);
    
    // Keep only last 1000 entries to prevent memory issues
    if (this.diagnosisMetrics.length > 1000) {
      this.diagnosisMetrics = this.diagnosisMetrics.slice(-1000);
    }
    
    console.log('Diagnosis Performance Metrics:', {
      processingTime: `${metrics.totalProcessingTime.toFixed(0)}ms`,
      confidence: `${(metrics.confidenceScore * 100).toFixed(1)}%`,
      toolsUsed: metrics.toolUsageCount,
      memoryUsed: `${(metrics.memoryUsage / 1024 / 1024).toFixed(1)}MB`,
      modality: metrics.modality,
      anatomy: metrics.anatomy
    });
  }

  recordChatMetrics(metrics: ChatMetrics): void {
    this.chatMetrics.push(metrics);
    this.checkChatThresholds(metrics);
    
    if (this.chatMetrics.length > 1000) {
      this.chatMetrics = this.chatMetrics.slice(-1000);
    }
  }

  recordReportMetrics(metrics: ReportMetrics): void {
    this.reportMetrics.push(metrics);
    this.checkReportThresholds(metrics);
    
    if (this.reportMetrics.length > 1000) {
      this.reportMetrics = this.reportMetrics.slice(-1000);
    }
  }

  recordSystemMetrics(metrics: SystemMetrics): void {
    this.systemMetrics.push(metrics);
    this.checkSystemThresholds(metrics);
    
    if (this.systemMetrics.length > 1000) {
      this.systemMetrics = this.systemMetrics.slice(-1000);
    }
  }

  // Threshold checking and alerting
  private checkDiagnosisThresholds(metrics: DiagnosisMetrics): void {
    const alerts: string[] = [];
    
    if (metrics.totalProcessingTime > this.THRESHOLDS.diagnosis.maxProcessingTime) {
      alerts.push(`Slow diagnosis processing: ${metrics.totalProcessingTime}ms`);
    }
    
    if (metrics.confidenceScore < this.THRESHOLDS.diagnosis.minConfidence) {
      alerts.push(`Low confidence diagnosis: ${(metrics.confidenceScore * 100).toFixed(1)}%`);
    }
    
    if (metrics.memoryUsage > this.THRESHOLDS.diagnosis.maxMemoryUsage) {
      alerts.push(`High memory usage: ${(metrics.memoryUsage / 1024 / 1024).toFixed(1)}MB`);
    }
    
    if (alerts.length > 0) {
      console.warn('Diagnosis Performance Alerts:', alerts);
    }
  }

  private checkChatThresholds(metrics: ChatMetrics): void {
    const alerts: string[] = [];
    
    if (metrics.responseTime > this.THRESHOLDS.chat.maxResponseTime) {
      alerts.push(`Slow chat response: ${metrics.responseTime}ms`);
    }
    
    if (metrics.streamingLatency > this.THRESHOLDS.chat.maxStreamingLatency) {
      alerts.push(`High streaming latency: ${metrics.streamingLatency}ms`);
    }
    
    if (alerts.length > 0) {
      console.warn('Chat Performance Alerts:', alerts);
    }
  }

  private checkReportThresholds(metrics: ReportMetrics): void {
    const alerts: string[] = [];
    
    if (metrics.generationTime > this.THRESHOLDS.report.maxGenerationTime) {
      alerts.push(`Slow report generation: ${metrics.generationTime}ms`);
    }
    
    if (metrics.qualityScore < this.THRESHOLDS.report.minQualityScore) {
      alerts.push(`Low report quality: ${(metrics.qualityScore * 100).toFixed(1)}%`);
    }
    
    if (alerts.length > 0) {
      console.warn('Report Performance Alerts:', alerts);
    }
  }

  private checkSystemThresholds(metrics: SystemMetrics): void {
    const alerts: string[] = [];
    
    if (metrics.errorRate > this.THRESHOLDS.system.maxErrorRate) {
      alerts.push(`High error rate: ${(metrics.errorRate * 100).toFixed(1)}%`);
    }
    
    if (metrics.averageResponseTime > this.THRESHOLDS.system.maxResponseTime) {
      alerts.push(`Slow system response: ${metrics.averageResponseTime}ms`);
    }
    
    if (metrics.queueLength > this.THRESHOLDS.system.maxQueueLength) {
      alerts.push(`High queue length: ${metrics.queueLength}`);
    }
    
    if (alerts.length > 0) {
      console.warn('System Performance Alerts:', alerts);
    }
  }

  // Analytics and reporting
  getDiagnosisAnalytics(timeRange?: { start: Date; end: Date }) {
    const filteredMetrics = timeRange ? 
      this.diagnosisMetrics.filter(m => m.timestamp >= timeRange.start && m.timestamp <= timeRange.end) :
      this.diagnosisMetrics;

    if (filteredMetrics.length === 0) {
      return null;
    }

    const totalMetrics = filteredMetrics.length;
    const avgProcessingTime = filteredMetrics.reduce((sum, m) => sum + m.totalProcessingTime, 0) / totalMetrics;
    const avgConfidence = filteredMetrics.reduce((sum, m) => sum + m.confidenceScore, 0) / totalMetrics;
    const avgToolUsage = filteredMetrics.reduce((sum, m) => sum + m.toolUsageCount, 0) / totalMetrics;
    
    const modalityBreakdown = filteredMetrics.reduce((acc, m) => {
      acc[m.modality] = (acc[m.modality] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const anatomyBreakdown = filteredMetrics.reduce((acc, m) => {
      acc[m.anatomy] = (acc[m.anatomy] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      totalDiagnoses: totalMetrics,
      averageProcessingTime: Math.round(avgProcessingTime),
      averageConfidence: Math.round(avgConfidence * 100) / 100,
      averageToolUsage: Math.round(avgToolUsage * 10) / 10,
      modalityBreakdown,
      anatomyBreakdown,
      performanceDistribution: {
        fast: filteredMetrics.filter(m => m.totalProcessingTime < 10000).length,
        medium: filteredMetrics.filter(m => m.totalProcessingTime >= 10000 && m.totalProcessingTime < 20000).length,
        slow: filteredMetrics.filter(m => m.totalProcessingTime >= 20000).length
      },
      confidenceDistribution: {
        high: filteredMetrics.filter(m => m.confidenceScore >= 0.8).length,
        medium: filteredMetrics.filter(m => m.confidenceScore >= 0.6 && m.confidenceScore < 0.8).length,
        low: filteredMetrics.filter(m => m.confidenceScore < 0.6).length
      }
    };
  }

  getChatAnalytics(timeRange?: { start: Date; end: Date }) {
    const filteredMetrics = timeRange ? 
      this.chatMetrics.filter(m => m.timestamp >= timeRange.start && m.timestamp <= timeRange.end) :
      this.chatMetrics;

    if (filteredMetrics.length === 0) {
      return null;
    }

    const totalChats = filteredMetrics.length;
    const avgResponseTime = filteredMetrics.reduce((sum, m) => sum + m.responseTime, 0) / totalChats;
    const avgMessageLength = filteredMetrics.reduce((sum, m) => sum + m.messageLength, 0) / totalChats;
    
    return {
      totalChats,
      averageResponseTime: Math.round(avgResponseTime),
      averageMessageLength: Math.round(avgMessageLength),
      withAudio: filteredMetrics.filter(m => m.audioGenerationTime !== undefined).length,
      averageConversationTurn: Math.round(filteredMetrics.reduce((sum, m) => sum + m.conversationTurn, 0) / totalChats)
    };
  }

  // System resource monitoring
  private getMemoryUsage(): number {
    // In Node.js environment
    if (typeof process !== 'undefined' && process.memoryUsage) {
      return process.memoryUsage().heapUsed;
    }
    
    // In browser environment (approximate)
    if (typeof performance !== 'undefined' && (performance as any).memory) {
      return (performance as any).memory.usedJSHeapSize;
    }
    
    return 0;
  }

  private getCpuUsage(): number {
    // Mock implementation - in production, this would use actual CPU monitoring
    return Math.random() * 100;
  }

  // Export metrics for external monitoring systems
  exportMetrics(format: 'json' | 'prometheus' = 'json') {
    if (format === 'json') {
      return {
        diagnosis: this.diagnosisMetrics,
        chat: this.chatMetrics,
        report: this.reportMetrics,
        system: this.systemMetrics,
        analytics: {
          diagnosis: this.getDiagnosisAnalytics(),
          chat: this.getChatAnalytics()
        },
        timestamp: new Date().toISOString()
      };
    }
    
    // Prometheus format would be implemented here
    return 'Prometheus format not implemented';
  }

  // Clear old metrics to prevent memory leaks
  clearOldMetrics(olderThanDays: number = 7): void {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);
    
    this.diagnosisMetrics = this.diagnosisMetrics.filter(m => m.timestamp > cutoffDate);
    this.chatMetrics = this.chatMetrics.filter(m => m.timestamp > cutoffDate);
    this.reportMetrics = this.reportMetrics.filter(m => m.timestamp > cutoffDate);
    this.systemMetrics = this.systemMetrics.filter(m => m.timestamp > cutoffDate);
    
    console.log(`Cleared metrics older than ${olderThanDays} days`);
  }
}

// Utility functions for performance measurement
export function measureAsync<T>(
  operation: () => Promise<T>,
  label: string
): Promise<{ result: T; duration: number }> {
  const start = performance.now();
  
  return operation().then(result => {
    const duration = performance.now() - start;
    console.log(`${label} completed in ${duration.toFixed(2)}ms`);
    return { result, duration };
  });
}

export function createPerformanceTimer(label: string) {
  const start = performance.now();
  
  return {
    lap: (lapLabel: string) => {
      const lapTime = performance.now() - start;
      console.log(`${label} - ${lapLabel}: ${lapTime.toFixed(2)}ms`);
      return lapTime;
    },
    
    finish: () => {
      const total = performance.now() - start;
      console.log(`${label} total: ${total.toFixed(2)}ms`);
      return total;
    }
  };
}