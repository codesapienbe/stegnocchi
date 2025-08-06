import { realTimeAnalytics } from './realTimeAnalytics';
import { applicationMonitoring } from './applicationMonitoring';
import { logInfo, Component } from './logger';

export interface Insight {
  id: string;
  title: string;
  description: string;
  severity: 'info' | 'warning' | 'critical';
  impactedMetric: string;
  timestamp: number;
  suggestions: string[];
}

export interface InsightsConfig {
  enabled: boolean;
  pollingInterval: number; // in ms
  predictionWindowDays: number;
}

class InsightsEngine {
  private config: InsightsConfig;
  private insights: Insight[] = [];
  private timer?: NodeJS.Timeout;

  constructor(config?: Partial<InsightsConfig>) {
    this.config = {
      enabled: true,
      pollingInterval: 60_000, // every minute
      predictionWindowDays: 30,
      ...config,
    } as InsightsConfig;

    if (this.config.enabled) {
      this.start();
    }
  }

  /**
   * Start insights polling
   */
  private start(): void {
    this.timer = setInterval(() => {
      this.generateInsights();
    }, this.config.pollingInterval);
  }

  /**
   * Stop polling
   */
  public stop(): void {
    if (this.timer) clearInterval(this.timer);
  }

  /**
   * Generate insights from analytics and monitoring data
   */
  public generateInsights(): Insight[] {
    const newInsights: Insight[] = [];

    // Example insight: High error rate
    const summary = applicationMonitoring.getSummary();
    if (summary.errorRate > 0.05) {
      newInsights.push({
        id: `error-rate-${Date.now()}`,
        title: 'High Error Rate Detected',
        description: `Error rate is ${summary.errorRate * 100}%, exceeding acceptable threshold.`,
        severity: 'critical',
        impactedMetric: 'error_rate',
        timestamp: Date.now(),
        suggestions: [
          'Investigate recent deployments for regressions.',
          'Check dependency versions and compatibility.',
          'Review server logs for common error patterns.',
        ],
      });
    }

    // Example insight: User engagement decline
    const analyticsSummary = realTimeAnalytics.getSummary();
    if (analyticsSummary.conversionRate < 0.02) {
      newInsights.push({
        id: `conversion-rate-${Date.now()}`,
        title: 'Low Conversion Rate',
        description: `Conversion rate dropped to ${(
          analyticsSummary.conversionRate * 100
        ).toFixed(2)}%.`,
        severity: 'warning',
        impactedMetric: 'conversion_rate',
        timestamp: Date.now(),
        suggestions: [
          'Optimize user onboarding flow.',
          'Review UI/UX for potential friction points.',
          'Consider A/B testing to improve conversions.',
        ],
      });
    }

    // Example insight: Predict traffic surge
    const nextWeekPrediction = this.predictTraffic(7);
    if (nextWeekPrediction.predictedValue > nextWeekPrediction.currentValue * 1.5) {
      newInsights.push({
        id: `traffic-surge-${Date.now()}`,
        title: 'Projected Traffic Surge',
        description: 'Traffic predicted to surge by more than 50% next week.',
        severity: 'info',
        impactedMetric: 'traffic',
        timestamp: Date.now(),
        suggestions: [
          'Ensure auto-scaling policies can handle increased load.',
          'Pre-warm caches and CDN edges.',
          'Review rate limiting thresholds.',
        ],
      });
    }

    if (newInsights.length > 0) {
      this.insights.push(...newInsights);
      logInfo(Component.APP, 'Insights generated', {
        count: newInsights.length,
      });
    }

    return newInsights;
  }

  /**
   * Predict traffic based on historical data (simple linear projection)
   */
  private predictTraffic(daysAhead: number): {
    currentValue: number;
    predictedValue: number;
  } {
    const metrics = applicationMonitoring
      .getMetrics('7d')
      .filter((m) => m.name === 'throughput');

    const currentValue = metrics.length > 0 ? metrics[metrics.length - 1].value : 0;
    // Simple projection: average daily growth rate * daysAhead
    const dailyGrowth = this.calculateDailyGrowth(metrics);
    const predictedValue = currentValue + dailyGrowth * daysAhead;

    return { currentValue, predictedValue };
  }

  /**
   * Calculate average daily growth
   */
  private calculateDailyGrowth(metrics: any[]): number {
    if (metrics.length < 2) return 0;
    const first = metrics[0].value;
    const last = metrics[metrics.length - 1].value;
    const days = (metrics[metrics.length - 1].timestamp - metrics[0].timestamp) / (24 * 60 * 60 * 1000);
    return days > 0 ? (last - first) / days : 0;
  }

  // Public getters
  public getInsights(): Insight[] {
    return [...this.insights];
  }

  public getConfig(): InsightsConfig {
    return { ...this.config };
  }

  public updateConfig(config: Partial<InsightsConfig>): void {
    this.config = { ...this.config, ...config } as InsightsConfig;
    if (this.timer) {
      this.stop();
      if (this.config.enabled) this.start();
    }
  }
}

export const insightsEngine = new InsightsEngine();
export { InsightsEngine }; 