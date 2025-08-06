import { applicationMonitoring } from './applicationMonitoring';
import { realTimeAnalytics } from './realTimeAnalytics';
import { logInfo, Component } from './logger';

export type ReportFormat = 'json' | 'pdf' | 'csv';
export type ReportType =
  | 'daily-summary'
  | 'weekly-summary'
  | 'monthly-summary'
  | 'anomaly-report'
  | 'business-insights';

export interface ReportingSchedule {
  type: ReportType;
  cron: string; // simplified cron expression e.g., '0 0 * * *'
  recipients: string[];
  format: ReportFormat;
  enabled: boolean;
}

export interface Report {
  id: string;
  type: ReportType;
  generatedAt: number;
  format: ReportFormat;
  content: string;
  recipients: string[];
}

export interface ReportingConfig {
  schedules: ReportingSchedule[];
  retentionDays: number;
  enabled: boolean;
}

class ReportingSystem {
  private config: ReportingConfig;
  private reports: Report[] = [];
  private timerHandles: Record<string, NodeJS.Timeout> = {};

  constructor(config?: Partial<ReportingConfig>) {
    this.config = {
      schedules: [],
      retentionDays: 30,
      enabled: true,
      ...config,
    } as ReportingConfig;

    if (this.config.enabled) {
      this.initializeSchedules();
    }
  }

  /**
   * Initialize all report schedules
   */
  private initializeSchedules(): void {
    this.config.schedules.forEach((schedule) => {
      if (schedule.enabled) {
        this.scheduleReport(schedule);
      }
    });
  }

  /**
   * Schedule individual report using setInterval (simplified cron)
   */
  private scheduleReport(schedule: ReportingSchedule): void {
    // For demo purposes, translate simple cron to milliseconds (daily, weekly, monthly)
    let intervalMs = 24 * 60 * 60 * 1000; // default daily
    if (schedule.type === 'weekly-summary') intervalMs *= 7;
    if (schedule.type === 'monthly-summary') intervalMs *= 30;

    const timerId = `${schedule.type}-${Date.now()}`;
    this.timerHandles[timerId] = setInterval(() => {
      const report = this.generateReport(schedule.type, schedule.format, schedule.recipients);
      this.dispatchReport(report);
    }, intervalMs);

    logInfo(Component.APP, 'ReportingSystem schedule initialized', {
      schedule,
      timerId,
    });
  }

  /**
   * Generate a report synchronously
   */
  public generateReport(
    type: ReportType,
    format: ReportFormat = 'json',
    recipients: string[] = []
  ): Report {
    const generatedAt = Date.now();
    let content: string;

    switch (type) {
      case 'daily-summary':
      case 'weekly-summary':
      case 'monthly-summary':
        content = this.generateSummaryReport(format, type);
        break;
      case 'anomaly-report':
        content = this.generateAnomalyReport(format);
        break;
      case 'business-insights':
        content = this.generateBusinessInsightsReport(format);
        break;
      default:
        throw new Error(`Unsupported report type: ${type}`);
    }

    const report: Report = {
      id: `${type}-${generatedAt}`,
      type,
      generatedAt,
      format,
      content,
      recipients,
    };

    this.reports.push(report);
    this.cleanupOldReports();

    logInfo(Component.APP, 'Report generated', {
      reportId: report.id,
      type,
      format,
    });

    return report;
  }

  /**
   * Dispatch report via email or other channels (placeholder)
   */
  private dispatchReport(report: Report): void {
    // Placeholder implementation (e.g., email, webhook)
    logInfo(Component.APP, 'Report dispatched', {
      reportId: report.id,
      recipients: report.recipients,
    });
  }

  /**
   * Generate summary reports (daily/weekly/monthly)
   */
  private generateSummaryReport(format: ReportFormat, period: string): string {
    const analyticsSummary = realTimeAnalytics.getSummary();
    const apmSummary = applicationMonitoring.getSummary();

    const summary = {
      period,
      generatedAt: new Date().toISOString(),
      analytics: analyticsSummary,
      apm: apmSummary,
    };

    return this.serialize(summary, format);
  }

  /**
   * Generate anomaly report
   */
  private generateAnomalyReport(format: ReportFormat): string {
    const anomalies = [
      ...applicationMonitoring.getAlerts().filter((a) => a.severity !== 'info'),
      ...realTimeAnalytics.getAnomalies(),
    ];

    const report = {
      generatedAt: new Date().toISOString(),
      totalAnomalies: anomalies.length,
      anomalies,
    };

    return this.serialize(report, format);
  }

  /**
   * Generate business insights report
   */
  private generateBusinessInsightsReport(format: ReportFormat): string {
    const metrics = realTimeAnalytics.getBusinessMetrics();

    const topGrowth = metrics.sort((a, b) => b.change - a.change).slice(0, 5);
    const declining = metrics.sort((a, b) => a.change - b.change).slice(0, 5);

    const insights = {
      generatedAt: new Date().toISOString(),
      topGrowth,
      declining,
      recommendations: topGrowth.map((m) => ({
        metric: m.name,
        suggestion: `Increase focus on ${m.name} to capitalize on growth.`,
      })),
    };

    return this.serialize(insights, format);
  }

  /**
   * Serialize report content
   */
  private serialize(data: any, format: ReportFormat): string {
    switch (format) {
      case 'json':
        return JSON.stringify(data, null, 2);
      case 'csv':
        return this.toCSV(data);
      case 'pdf':
        // Placeholder: convert JSON string to a simple PDF base64 data URL
        return `data:application/pdf;base64,${Buffer.from(JSON.stringify(data, null, 2)).toString('base64')}`;
      default:
        throw new Error(`Unsupported format: ${format}`);
    }
  }

  /**
   * Simple CSV serializer (flattens JSON array or object)
   */
  private toCSV(data: any): string {
    const rows: string[] = [];

    if (Array.isArray(data)) {
      if (data.length === 0) return '';
      const headers = Object.keys(data[0]);
      rows.push(headers.join(','));
      data.forEach((item) => {
        rows.push(headers.map((h) => JSON.stringify(item[h] ?? '')).join(','));
      });
    } else {
      Object.entries(data).forEach(([key, value]) => {
        rows.push(`${key},${JSON.stringify(value)}`);
      });
    }

    return rows.join('\n');
  }

  /**
   * Remove reports older than retentionDays
   */
  private cleanupOldReports(): void {
    const cutoff = Date.now() - this.config.retentionDays * 24 * 60 * 60 * 1000;
    this.reports = this.reports.filter((r) => r.generatedAt >= cutoff);
  }

  // Public getters
  public getReports(): Report[] {
    return [...this.reports];
  }

  public getConfig(): ReportingConfig {
    return { ...this.config };
  }

  public updateConfig(config: Partial<ReportingConfig>): void {
    this.config = { ...this.config, ...config } as ReportingConfig;
  }
}

// Export singleton instance
export const reportingSystem = new ReportingSystem({
  schedules: [
    {
      type: 'daily-summary',
      cron: '0 0 * * *',
      recipients: [],
      format: 'json',
      enabled: true,
    },
  ],
  retentionDays: 14,
  enabled: true,
});

export { ReportingSystem }; 