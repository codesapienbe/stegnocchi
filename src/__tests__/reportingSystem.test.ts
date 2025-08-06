import { ReportingSystem } from '../core/reportingSystem';
import { applicationMonitoring } from '../core/applicationMonitoring';
import { realTimeAnalytics } from '../core/realTimeAnalytics';

describe('ReportingSystem', () => {
  let reporting: ReportingSystem;

  beforeEach(() => {
    reporting = new ReportingSystem({
      schedules: [],
      retentionDays: 1,
      enabled: false,
    });
  });

  it('should generate daily summary report in JSON format', () => {
    const report = reporting.generateReport('daily-summary', 'json');
    expect(report).toBeDefined();
    expect(report.format).toBe('json');

    const parsed = JSON.parse(report.content);
    expect(parsed.analytics).toBeDefined();
    expect(parsed.apm).toBeDefined();
  });

  it('should generate anomaly report in CSV format', () => {
    // Create dummy anomaly
    applicationMonitoring.createAlert(
      'High Memory Usage',
      'Memory usage exceeds threshold',
      'memory_usage > 90',
      90,
      'warning'
    );

    const report = reporting.generateReport('anomaly-report', 'csv');
    expect(report).toBeDefined();
    expect(report.format).toBe('csv');
    expect(report.content).toContain('totalAnomalies');
  });

  it('should generate business insights report in PDF format', () => {
    // Insert dummy business metric
    realTimeAnalytics.recordBusinessMetric('sales', 1000, 'revenue');

    const report = reporting.generateReport('business-insights', 'pdf');
    expect(report).toBeDefined();
    expect(report.format).toBe('pdf');
    expect(report.content.startsWith('data:application/pdf;base64,')).toBe(true);
  });
}); 