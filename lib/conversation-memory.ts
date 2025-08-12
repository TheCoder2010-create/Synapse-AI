/**
 * @fileOverview Conversation memory management for enhanced chat interactions
 */

export interface ConversationContext {
  sessionId: string;
  userId?: string;
  currentCase?: {
    caseId: string;
    modality: string;
    anatomy: string;
    primaryDiagnosis?: string;
    confidence?: number;
    keyFindings: string[];
    measurements: Array<{
      structure: string;
      value: string;
      significance: string;
    }>;
  };
  recentFindings: string[];
  conversationSummary: string;
  medicalHistory: string[];
  preferences: {
    voiceConfig?: {
      voiceName: string;
      speed: number;
      medicalTerminologyMode: boolean;
    };
    reportTemplate?: string;
    preferredUnits: 'metric' | 'imperial';
  };
  lastActivity: Date;
  messageCount: number;
}

export interface ConversationMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  timestamp: Date;
  context?: {
    caseId?: string;
    toolsUsed?: string[];
    confidence?: number;
    mediaAttached?: boolean;
  };
  metadata?: {
    processingTime?: number;
    modelUsed?: string;
    tokenCount?: number;
  };
}

export interface ConversationSummary {
  sessionId: string;
  totalMessages: number;
  duration: number; // in minutes
  casesDiscussed: string[];
  keyTopics: string[];
  diagnosticDecisions: Array<{
    finding: string;
    decision: string;
    confidence: number;
  }>;
  followUpItems: string[];
  lastUpdated: Date;
}

export class ConversationMemoryManager {
  private static instance: ConversationMemoryManager;
  private conversations = new Map<string, ConversationContext>();
  private messages = new Map<string, ConversationMessage[]>();
  private summaries = new Map<string, ConversationSummary>();
  
  // Memory management settings
  private readonly MAX_MESSAGES_PER_SESSION = 100;
  private readonly MAX_SESSIONS = 1000;
  private readonly SESSION_TIMEOUT_HOURS = 24;
  private readonly SUMMARY_TRIGGER_MESSAGES = 20;

  static getInstance(): ConversationMemoryManager {
    if (!ConversationMemoryManager.instance) {
      ConversationMemoryManager.instance = new ConversationMemoryManager();
    }
    return ConversationMemoryManager.instance;
  }

  /**
   * Initialize or retrieve conversation context
   */
  getOrCreateContext(sessionId: string, userId?: string): ConversationContext {
    if (!this.conversations.has(sessionId)) {
      const context: ConversationContext = {
        sessionId,
        userId,
        recentFindings: [],
        conversationSummary: '',
        medicalHistory: [],
        preferences: {
          preferredUnits: 'metric'
        },
        lastActivity: new Date(),
        messageCount: 0
      };
      
      this.conversations.set(sessionId, context);
      this.messages.set(sessionId, []);
    }
    
    const context = this.conversations.get(sessionId)!;
    context.lastActivity = new Date();
    return context;
  }

  /**
   * Update conversation context with new case information
   */
  updateCaseContext(
    sessionId: string, 
    caseInfo: {
      caseId: string;
      modality: string;
      anatomy: string;
      primaryDiagnosis?: string;
      confidence?: number;
      keyFindings: string[];
      measurements: Array<{
        structure: string;
        value: string;
        significance: string;
      }>;
    }
  ): void {
    const context = this.getOrCreateContext(sessionId);
    
    context.currentCase = caseInfo;
    context.recentFindings = [...new Set([...context.recentFindings, ...caseInfo.keyFindings])].slice(-10);
    
    // Update conversation summary
    const caseSummary = `Analyzed ${caseInfo.modality} of ${caseInfo.anatomy}`;
    if (caseInfo.primaryDiagnosis) {
      context.conversationSummary += ` ${caseSummary}: ${caseInfo.primaryDiagnosis}. `;
    } else {
      context.conversationSummary += ` ${caseSummary}. `;
    }
    
    // Trim summary if too long
    if (context.conversationSummary.length > 500) {
      context.conversationSummary = context.conversationSummary.slice(-400);
    }
  }

  /**
   * Add message to conversation history
   */
  addMessage(
    sessionId: string,
    message: Omit<ConversationMessage, 'id' | 'timestamp'>
  ): ConversationMessage {
    const context = this.getOrCreateContext(sessionId);
    const fullMessage: ConversationMessage = {
      ...message,
      id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date()
    };
    
    const messages = this.messages.get(sessionId) || [];
    messages.push(fullMessage);
    
    // Limit message history
    if (messages.length > this.MAX_MESSAGES_PER_SESSION) {
      messages.splice(0, messages.length - this.MAX_MESSAGES_PER_SESSION);
    }
    
    this.messages.set(sessionId, messages);
    context.messageCount++;
    context.lastActivity = new Date();
    
    // Trigger summary generation if needed
    if (messages.length % this.SUMMARY_TRIGGER_MESSAGES === 0) {
      this.generateConversationSummary(sessionId);
    }
    
    return fullMessage;
  }

  /**
   * Get conversation messages with optional filtering
   */
  getMessages(
    sessionId: string,
    options: {
      limit?: number;
      since?: Date;
      includeContext?: boolean;
    } = {}
  ): ConversationMessage[] {
    const messages = this.messages.get(sessionId) || [];
    
    let filteredMessages = messages;
    
    if (options.since) {
      filteredMessages = messages.filter(m => m.timestamp >= options.since!);
    }
    
    if (options.limit) {
      filteredMessages = filteredMessages.slice(-options.limit);
    }
    
    return filteredMessages;
  }

  /**
   * Get contextual information for AI prompt enhancement
   */
  getContextualPrompt(sessionId: string): string {
    const context = this.getOrCreateContext(sessionId);
    const messages = this.messages.get(sessionId) || [];
    
    let contextPrompt = '';
    
    // Current case context
    if (context.currentCase) {
      contextPrompt += `Current Case Context:
- Case ID: ${context.currentCase.caseId}
- Modality: ${context.currentCase.modality}
- Anatomy: ${context.currentCase.anatomy}`;
      
      if (context.currentCase.primaryDiagnosis) {
        contextPrompt += `
- Primary Diagnosis: ${context.currentCase.primaryDiagnosis} (Confidence: ${(context.currentCase.confidence || 0) * 100}%)`;
      }
      
      if (context.currentCase.keyFindings.length > 0) {
        contextPrompt += `
- Key Findings: ${context.currentCase.keyFindings.join(', ')}`;
      }
      
      contextPrompt += '\n\n';
    }
    
    // Recent conversation summary
    if (context.conversationSummary) {
      contextPrompt += `Recent Discussion: ${context.conversationSummary}\n\n`;
    }
    
    // Recent findings across cases
    if (context.recentFindings.length > 0) {
      contextPrompt += `Recent Findings Discussed: ${context.recentFindings.join(', ')}\n\n`;
    }
    
    // User preferences
    if (context.preferences.preferredUnits) {
      contextPrompt += `User Preferences: Units - ${context.preferences.preferredUnits}\n\n`;
    }
    
    // Recent message context (last 3 messages for immediate context)
    const recentMessages = messages.slice(-3);
    if (recentMessages.length > 0) {
      contextPrompt += 'Recent Messages:\n';
      recentMessages.forEach(msg => {
        contextPrompt += `${msg.role}: ${msg.text.substring(0, 100)}${msg.text.length > 100 ? '...' : ''}\n`;
      });
    }
    
    return contextPrompt;
  }

  /**
   * Generate conversation summary for long-term memory
   */
  private generateConversationSummary(sessionId: string): void {
    const context = this.conversations.get(sessionId);
    const messages = this.messages.get(sessionId) || [];
    
    if (!context || messages.length === 0) return;
    
    // Extract key information from messages
    const casesDiscussed = [...new Set(
      messages
        .filter(m => m.context?.caseId)
        .map(m => m.context!.caseId!)
    )];
    
    const keyTopics = this.extractKeyTopics(messages);
    const diagnosticDecisions = this.extractDiagnosticDecisions(messages);
    const followUpItems = this.extractFollowUpItems(messages);
    
    const summary: ConversationSummary = {
      sessionId,
      totalMessages: messages.length,
      duration: this.calculateSessionDuration(messages),
      casesDiscussed,
      keyTopics,
      diagnosticDecisions,
      followUpItems,
      lastUpdated: new Date()
    };
    
    this.summaries.set(sessionId, summary);
    
    console.log(`Generated conversation summary for session ${sessionId}:`, {
      messages: summary.totalMessages,
      cases: summary.casesDiscussed.length,
      topics: summary.keyTopics.length
    });
  }

  private extractKeyTopics(messages: ConversationMessage[]): string[] {
    // Simple keyword extraction - in production, this could use NLP
    const medicalKeywords = [
      'pneumothorax', 'pneumonia', 'atelectasis', 'pleural effusion',
      'mass', 'nodule', 'consolidation', 'opacity', 'enhancement',
      'hemorrhage', 'infarct', 'edema', 'fracture', 'dislocation'
    ];
    
    const topics = new Set<string>();
    const allText = messages.map(m => m.text.toLowerCase()).join(' ');
    
    medicalKeywords.forEach(keyword => {
      if (allText.includes(keyword)) {
        topics.add(keyword);
      }
    });
    
    return Array.from(topics);
  }

  private extractDiagnosticDecisions(messages: ConversationMessage[]): Array<{
    finding: string;
    decision: string;
    confidence: number;
  }> {
    // Extract diagnostic decisions from assistant messages
    const decisions: Array<{ finding: string; decision: string; confidence: number }> = [];
    
    messages
      .filter(m => m.role === 'assistant' && m.context?.confidence)
      .forEach(m => {
        // Simple pattern matching - in production, this could be more sophisticated
        const diagnosisMatch = m.text.match(/diagnosis[:\s]+([^.]+)/i);
        if (diagnosisMatch) {
          decisions.push({
            finding: diagnosisMatch[1].trim(),
            decision: 'diagnosed',
            confidence: m.context?.confidence || 0
          });
        }
      });
    
    return decisions;
  }

  private extractFollowUpItems(messages: ConversationMessage[]): string[] {
    const followUpKeywords = [
      'follow up', 'follow-up', 'recommend', 'suggest', 'consider',
      'repeat', 'monitor', 'track', 'reassess'
    ];
    
    const followUps = new Set<string>();
    
    messages
      .filter(m => m.role === 'assistant')
      .forEach(m => {
        followUpKeywords.forEach(keyword => {
          const regex = new RegExp(`${keyword}[^.]*`, 'gi');
          const matches = m.text.match(regex);
          if (matches) {
            matches.forEach(match => followUps.add(match.trim()));
          }
        });
      });
    
    return Array.from(followUps).slice(0, 5); // Limit to 5 items
  }

  private calculateSessionDuration(messages: ConversationMessage[]): number {
    if (messages.length < 2) return 0;
    
    const firstMessage = messages[0];
    const lastMessage = messages[messages.length - 1];
    
    return Math.round((lastMessage.timestamp.getTime() - firstMessage.timestamp.getTime()) / (1000 * 60));
  }

  /**
   * Update user preferences
   */
  updatePreferences(
    sessionId: string,
    preferences: Partial<ConversationContext['preferences']>
  ): void {
    const context = this.getOrCreateContext(sessionId);
    context.preferences = { ...context.preferences, ...preferences };
  }

  /**
   * Clean up expired sessions
   */
  cleanupExpiredSessions(): void {
    const now = new Date();
    const expiredSessions: string[] = [];
    
    this.conversations.forEach((context, sessionId) => {
      const hoursSinceLastActivity = (now.getTime() - context.lastActivity.getTime()) / (1000 * 60 * 60);
      
      if (hoursSinceLastActivity > this.SESSION_TIMEOUT_HOURS) {
        expiredSessions.push(sessionId);
      }
    });
    
    expiredSessions.forEach(sessionId => {
      this.conversations.delete(sessionId);
      this.messages.delete(sessionId);
      this.summaries.delete(sessionId);
    });
    
    if (expiredSessions.length > 0) {
      console.log(`Cleaned up ${expiredSessions.length} expired conversation sessions`);
    }
  }

  /**
   * Get conversation statistics
   */
  getStats(): {
    activeSessions: number;
    totalMessages: number;
    averageSessionLength: number;
    topTopics: Array<{ topic: string; count: number }>;
  } {
    const activeSessions = this.conversations.size;
    const totalMessages = Array.from(this.messages.values()).reduce((sum, msgs) => sum + msgs.length, 0);
    
    const sessionLengths = Array.from(this.messages.values()).map(msgs => msgs.length);
    const averageSessionLength = sessionLengths.length > 0 ? 
      sessionLengths.reduce((sum, len) => sum + len, 0) / sessionLengths.length : 0;
    
    // Count topic frequency across all summaries
    const topicCounts = new Map<string, number>();
    this.summaries.forEach(summary => {
      summary.keyTopics.forEach(topic => {
        topicCounts.set(topic, (topicCounts.get(topic) || 0) + 1);
      });
    });
    
    const topTopics = Array.from(topicCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([topic, count]) => ({ topic, count }));
    
    return {
      activeSessions,
      totalMessages,
      averageSessionLength: Math.round(averageSessionLength),
      topTopics
    };
  }

  /**
   * Export conversation data for analysis
   */
  exportConversationData(sessionId: string): {
    context: ConversationContext;
    messages: ConversationMessage[];
    summary?: ConversationSummary;
  } | null {
    const context = this.conversations.get(sessionId);
    const messages = this.messages.get(sessionId);
    const summary = this.summaries.get(sessionId);
    
    if (!context || !messages) {
      return null;
    }
    
    return { context, messages, summary };
  }
}