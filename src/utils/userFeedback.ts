import { Platform } from 'react-native';
import { logInfo, logError, Component } from '../core/logger';

export interface FeedbackItem {
  id: string;
  type: 'bug' | 'feature' | 'improvement' | 'question' | 'rating';
  title: string;
  description: string;
  category: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'new' | 'in-progress' | 'resolved' | 'closed';
  rating?: number; // 1-5 for rating type
  tags: string[];
  attachments?: string[];
  userAgent: string;
  platform: string;
  timestamp: number;
  userId?: string;
}

export interface FeedbackConfig {
  enabled: boolean;
  autoCollect: boolean;
  enableRatings: boolean;
  enableBugReports: boolean;
  enableFeatureRequests: boolean;
  enableAnalytics: boolean;
  feedbackEndpoint?: string;
}

export interface FeedbackAnalytics {
  totalFeedback: number;
  averageRating: number;
  topCategories: Array<{ category: string; count: number }>;
  recentActivity: Array<{ date: string; count: number }>;
  userSatisfaction: number;
}

/**
 * User feedback and rating system utility
 */
export class UserFeedback {
  private config: FeedbackConfig;
  private feedbackItems: FeedbackItem[] = [];
  private analytics: FeedbackAnalytics;

  constructor(config?: Partial<FeedbackConfig>) {
    this.config = {
      enabled: true,
      autoCollect: true,
      enableRatings: true,
      enableBugReports: true,
      enableFeatureRequests: true,
      enableAnalytics: true,
      ...config,
    };

    this.analytics = this.initializeAnalytics();
  }

  /**
   * Initialize analytics
   */
  private initializeAnalytics(): FeedbackAnalytics {
    return {
      totalFeedback: 0,
      averageRating: 0,
      topCategories: [],
      recentActivity: [],
      userSatisfaction: 0,
    };
  }

  /**
   * Submit feedback
   */
  async submitFeedback(feedback: Omit<FeedbackItem, 'id' | 'timestamp' | 'userAgent' | 'platform'>): Promise<string> {
    if (!this.config.enabled) {
      throw new Error('Feedback system is disabled');
    }

    const feedbackItem: FeedbackItem = {
      ...feedback,
      id: `feedback-${Date.now()}-${Math.random()}`,
      timestamp: Date.now(),
      userAgent: Platform.OS === 'web' ? navigator.userAgent : 'React Native',
      platform: Platform.OS,
    };

    this.feedbackItems.push(feedbackItem);
    this.updateAnalytics();

    logInfo(Component.UI, 'Feedback submitted', {
      feedbackId: feedbackItem.id,
      type: feedbackItem.type,
      category: feedbackItem.category,
      priority: feedbackItem.priority,
    });

    // Send to backend if endpoint is configured
    if (this.config.feedbackEndpoint) {
      await this.sendToBackend(feedbackItem);
    }

    return feedbackItem.id;
  }

  /**
   * Submit rating
   */
  async submitRating(rating: number, category: string, comment?: string): Promise<string> {
    if (!this.config.enableRatings) {
      throw new Error('Rating system is disabled');
    }

    if (rating < 1 || rating > 5) {
      throw new Error('Rating must be between 1 and 5');
    }

    return this.submitFeedback({
      type: 'rating',
      title: `Rating: ${rating}/5`,
      description: comment || `User rated ${category} with ${rating} stars`,
      category,
      priority: 'low',
      status: 'new',
      rating,
      tags: ['rating', category],
    });
  }

  /**
   * Submit bug report
   */
  async submitBugReport(
    title: string,
    description: string,
    steps: string[],
    expectedBehavior: string,
    actualBehavior: string,
    priority: 'low' | 'medium' | 'high' | 'critical' = 'medium'
  ): Promise<string> {
    if (!this.config.enableBugReports) {
      throw new Error('Bug reporting is disabled');
    }

    const fullDescription = `
Description: ${description}

Steps to reproduce:
${steps.map((step, index) => `${index + 1}. ${step}`).join('\n')}

Expected behavior: ${expectedBehavior}
Actual behavior: ${actualBehavior}
    `.trim();

    return this.submitFeedback({
      type: 'bug',
      title,
      description: fullDescription,
      category: 'bug-report',
      priority,
      status: 'new',
      tags: ['bug', 'reproduction-steps'],
    });
  }

  /**
   * Submit feature request
   */
  async submitFeatureRequest(
    title: string,
    description: string,
    useCase: string,
    priority: 'low' | 'medium' | 'high' | 'critical' = 'medium'
  ): Promise<string> {
    if (!this.config.enableFeatureRequests) {
      throw new Error('Feature requests are disabled');
    }

    const fullDescription = `
Description: ${description}

Use case: ${useCase}
    `.trim();

    return this.submitFeedback({
      type: 'feature',
      title,
      description: fullDescription,
      category: 'feature-request',
      priority,
      status: 'new',
      tags: ['feature', 'enhancement'],
    });
  }

  /**
   * Get feedback by ID
   */
  getFeedback(feedbackId: string): FeedbackItem | null {
    return this.feedbackItems.find(item => item.id === feedbackId) || null;
  }

  /**
   * Get feedback by type
   */
  getFeedbackByType(type: FeedbackItem['type']): FeedbackItem[] {
    return this.feedbackItems
      .filter(item => item.type === type)
      .sort((a, b) => b.timestamp - a.timestamp);
  }

  /**
   * Get feedback by category
   */
  getFeedbackByCategory(category: string): FeedbackItem[] {
    return this.feedbackItems
      .filter(item => item.category === category)
      .sort((a, b) => b.timestamp - a.timestamp);
  }

  /**
   * Get feedback by status
   */
  getFeedbackByStatus(status: FeedbackItem['status']): FeedbackItem[] {
    return this.feedbackItems
      .filter(item => item.status === status)
      .sort((a, b) => b.timestamp - a.timestamp);
  }

  /**
   * Update feedback status
   */
  updateFeedbackStatus(feedbackId: string, status: FeedbackItem['status']): boolean {
    const feedback = this.getFeedback(feedbackId);
    if (!feedback) {
      return false;
    }

    feedback.status = status;
    
    logInfo(Component.UI, 'Feedback status updated', {
      feedbackId,
      status,
    });

    return true;
  }

  /**
   * Add attachment to feedback
   */
  addAttachment(feedbackId: string, attachmentUrl: string): boolean {
    const feedback = this.getFeedback(feedbackId);
    if (!feedback) {
      return false;
    }

    if (!feedback.attachments) {
      feedback.attachments = [];
    }

    feedback.attachments.push(attachmentUrl);
    
    logInfo(Component.UI, 'Attachment added to feedback', {
      feedbackId,
      attachmentUrl,
    });

    return true;
  }

  /**
   * Get analytics
   */
  getAnalytics(): FeedbackAnalytics {
    return { ...this.analytics };
  }

  /**
   * Update analytics
   */
  private updateAnalytics(): void {
    if (!this.config.enableAnalytics) {
      return;
    }

    const totalFeedback = this.feedbackItems.length;
    const ratings = this.feedbackItems.filter(item => item.type === 'rating' && item.rating);
    const averageRating = ratings.length > 0 
      ? ratings.reduce((sum, item) => sum + item.rating!, 0) / ratings.length 
      : 0;

    // Calculate top categories
    const categoryCounts = new Map<string, number>();
    this.feedbackItems.forEach(item => {
      const count = categoryCounts.get(item.category) || 0;
      categoryCounts.set(item.category, count + 1);
    });

    const topCategories = Array.from(categoryCounts.entries())
      .map(([category, count]) => ({ category, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // Calculate recent activity (last 30 days)
    const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
    const recentItems = this.feedbackItems.filter(item => item.timestamp > thirtyDaysAgo);
    
    const activityByDay = new Map<string, number>();
    recentItems.forEach(item => {
      const date = new Date(item.timestamp).toISOString().split('T')[0];
      const count = activityByDay.get(date) || 0;
      activityByDay.set(date, count + 1);
    });

    const recentActivity = Array.from(activityByDay.entries())
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date));

    // Calculate user satisfaction (percentage of ratings >= 4)
    const satisfactionRatings = ratings.filter(item => item.rating! >= 4);
    const userSatisfaction = ratings.length > 0 
      ? (satisfactionRatings.length / ratings.length) * 100 
      : 0;

    this.analytics = {
      totalFeedback,
      averageRating,
      topCategories,
      recentActivity,
      userSatisfaction,
    };
  }

  /**
   * Send feedback to backend
   */
  private async sendToBackend(feedback: FeedbackItem): Promise<void> {
    if (!this.config.feedbackEndpoint) {
      return;
    }

    try {
      const response = await fetch(this.config.feedbackEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(feedback),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      logInfo(Component.UI, 'Feedback sent to backend', {
        feedbackId: feedback.id,
        status: response.status,
      });
    } catch (error) {
      logError(Component.UI, 'Failed to send feedback to backend', {
        feedbackId: feedback.id,
        error,
      });
    }
  }

  /**
   * Export feedback data
   */
  exportFeedback(): string {
    const exportData = {
      feedback: this.feedbackItems,
      analytics: this.analytics,
      metadata: {
        exportedAt: new Date().toISOString(),
        totalItems: this.feedbackItems.length,
        platform: Platform.OS,
      },
    };

    return JSON.stringify(exportData, null, 2);
  }

  /**
   * Import feedback data
   */
  importFeedback(feedbackJson: string): boolean {
    try {
      const importData = JSON.parse(feedbackJson);
      
      if (importData.feedback && Array.isArray(importData.feedback)) {
        this.feedbackItems = importData.feedback;
        this.updateAnalytics();
        
        logInfo(Component.UI, 'Feedback data imported', {
          importedCount: importData.feedback.length,
        });
        
        return true;
      }
      
      return false;
    } catch (error) {
      logError(Component.UI, 'Failed to import feedback data', { error });
      return false;
    }
  }

  /**
   * Clear all feedback
   */
  clearFeedback(): void {
    this.feedbackItems = [];
    this.analytics = this.initializeAnalytics();
    
    logInfo(Component.UI, 'All feedback cleared', {});
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<FeedbackConfig>): void {
    this.config = { ...this.config, ...config };
    
    logInfo(Component.UI, 'Feedback config updated', {
      config: this.config,
    });
  }
}

// Export singleton instance
export const userFeedback = new UserFeedback(); 