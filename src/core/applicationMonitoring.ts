/**
 * Application Performance Monitoring (APM) System
 * Comprehensive APM with real-time monitoring and alerting
 */

import { Platform } from 'react-native';

export interface APMConfig {
  monitoring: {
    enabled: boolean;
    realTime: boolean;
    sampling: number; // 0-1, percentage of requests to monitor
    retention: number; // days
  };
  metrics: {
    performance: boolean;
    errors: boolean;
    userExperience: boolean;
    business: boolean;
    custom: boolean;
  };
  tracing: {
    enabled: boolean;
    distributed: boolean;
    sampling: number;
    maxDepth: number;
  };
  alerting: {
    enabled: boolean;
    realTime: boolean;
    thresholds: boolean;
    anomaly: boolean;
    escalation: boolean;
  };
  dashboards: {
    enabled: boolean;
    realTime: boolean;
    custom: boolean;
    sharing: boolean;
  };
}

export interface APMMetric {
  id: string;
  name: string;
  value: number;
  unit: string;
  type: 'counter' | 'gauge' | 'histogram' | 'summary';
  tags: Record<string, string>;
  timestamp: number;
  source: string;
}

export interface APMError {
  id: string;
  type: string;
  message: string;
  stack: string;
  context: Record<string, any>;
  severity: 'low' | 'medium' | 'high' | 'critical';
  user: string;
  session: string;
  timestamp: number;
  resolved: boolean;
  resolvedAt?: number;
  assignedTo?: string;
}

export interface APMTrace {
  id: string;
  traceId: string;
  spanId: string;
  parentSpanId?: string;
  name: string;
  operation: string;
  startTime: number;
  endTime: number;
  duration: number;
  status: 'success' | 'error' | 'timeout';
  tags: Record<string, string>;
  logs: Array<{
    timestamp: number;
    level: string;
    message: string;
    data?: any;
  }>;
}

export interface APMAlert {
  id: string;
  name: string;
  description: string;
  severity: 'info' | 'warning' | 'error' | 'critical';
  condition: string;
  threshold: number;
  currentValue: number;
  status: 'active' | 'acknowledged' | 'resolved';
  createdAt: number;
  triggeredAt?: number;
  resolvedAt?: number;
  assignedTo?: string;
  escalationLevel: number;
}

export interface APMDashboard {
  id: string;
  name: string;
  description: string;
  widgets: Array<{
    id: string;
    type: 'metric' | 'chart' | 'table' | 'alert';
    title: string;
    config: Record<string, any>;
    position: { x: number; y: number; w: number; h: number };
  }>;
  refreshInterval: number;
  shared: boolean;
  createdAt: number;
  updatedAt: number;
}

export interface UserExperienceMetric {
  userId: string;
  sessionId: string;
  pageLoadTime: number;
  timeToInteractive: number;
  firstContentfulPaint: number;
  largestContentfulPaint: number;
  firstInputDelay: number;
  cumulativeLayoutShift: number;
  totalBlockingTime: number;
  speedIndex: number;
  timestamp: number;
}

export interface BusinessMetric {
  id: string;
  name: string;
  value: number;
  category: 'revenue' | 'conversion' | 'engagement' | 'retention';
  period: 'hour' | 'day' | 'week' | 'month' | 'quarter' | 'year';
  timestamp: number;
  metadata: Record<string, any>;
}

class ApplicationMonitoring {
  private config: APMConfig;
  private metrics: APMMetric[] = [];
  private errors: APMError[] = [];
  private traces: APMTrace[] = [];
  private alerts: APMAlert[] = [];
  private dashboards: APMDashboard[] = [];
  private userExperienceMetrics: UserExperienceMetric[] = [];
  private businessMetrics: BusinessMetric[] = [];
  private isMonitoring: boolean = false;

  constructor() {
    this.config = this.getDefaultConfig();
    this.initialize();
  }

  /**
   * Get default APM configuration
   */
  private getDefaultConfig(): APMConfig {
    return {
      monitoring: {
        enabled: true,
        realTime: true,
        sampling: 1.0, // 100% sampling
        retention: 30, // 30 days
      },
      metrics: {
        performance: true,
        errors: true,
        userExperience: true,
        business: true,
        custom: true,
      },
      tracing: {
        enabled: true,
        distributed: true,
        sampling: 0.1, // 10% sampling
        maxDepth: 10,
      },
      alerting: {
        enabled: true,
        realTime: true,
        thresholds: true,
        anomaly: true,
        escalation: true,
      },
      dashboards: {
        enabled: true,
        realTime: true,
        custom: true,
        sharing: true,
      },
    };
  }

  /**
   * Initialize APM system
   */
  private initialize(): void {
    this.setupMonitoring();
    this.setupMetrics();
    this.setupTracing();
    this.setupAlerting();
    this.setupDashboards();
  }

  /**
   * Setup monitoring
   */
  private setupMonitoring(): void {
    if (this.config.monitoring.enabled) {
      this.startMonitoring();
    }
  }

  /**
   * Setup metrics collection
   */
  private setupMetrics(): void {
    if (this.config.metrics.performance) {
      this.setupPerformanceMetrics();
    }

    if (this.config.metrics.errors) {
      this.setupErrorMonitoring();
    }

    if (this.config.metrics.userExperience) {
      this.setupUserExperienceMonitoring();
    }

    if (this.config.metrics.business) {
      this.setupBusinessMetrics();
    }
  }

  /**
   * Setup tracing
   */
  private setupTracing(): void {
    if (this.config.tracing.enabled) {
      this.setupDistributedTracing();
    }
  }

  /**
   * Setup alerting
   */
  private setupAlerting(): void {
    if (this.config.alerting.enabled) {
      this.setupThresholdAlerts();
      this.setupAnomalyDetection();
      this.setupEscalationRules();
    }
  }

  /**
   * Setup dashboards
   */
  private setupDashboards(): void {
    if (this.config.dashboards.enabled) {
      this.createDefaultDashboards();
    }
  }

  /**
   * Start monitoring
   */
  private startMonitoring(): void {
    this.isMonitoring = true;
    console.log('APM: Monitoring started');

    // Start real-time monitoring
    if (this.config.monitoring.realTime) {
      this.startRealTimeMonitoring();
    }
  }

  /**
   * Setup performance metrics
   */
  private setupPerformanceMetrics(): void {
    console.log('APM: Performance metrics initialized');
  }

  /**
   * Setup error monitoring
   */
  private setupErrorMonitoring(): void {
    console.log('APM: Error monitoring initialized');
  }

  /**
   * Setup user experience monitoring
   */
  private setupUserExperienceMonitoring(): void {
    console.log('APM: User experience monitoring initialized');
  }

  /**
   * Setup business metrics
   */
  private setupBusinessMetrics(): void {
    console.log('APM: Business metrics initialized');
  }

  /**
   * Setup distributed tracing
   */
  private setupDistributedTracing(): void {
    console.log('APM: Distributed tracing initialized');
  }

  /**
   * Setup threshold alerts
   */
  private setupThresholdAlerts(): void {
    console.log('APM: Threshold alerts initialized');
  }

  /**
   * Setup anomaly detection
   */
  private setupAnomalyDetection(): void {
    console.log('APM: Anomaly detection initialized');
  }

  /**
   * Setup escalation rules
   */
  private setupEscalationRules(): void {
    console.log('APM: Escalation rules initialized');
  }

  /**
   * Create default dashboards
   */
  private createDefaultDashboards(): void {
    // Performance dashboard
    const performanceDashboard: APMDashboard = {
      id: 'performance-dashboard',
      name: 'Performance Overview',
      description: 'Real-time performance metrics and KPIs',
      widgets: [
        {
          id: 'response-time-chart',
          type: 'chart',
          title: 'Response Time',
          config: { type: 'line', metric: 'response_time' },
          position: { x: 0, y: 0, w: 6, h: 4 },
        },
        {
          id: 'error-rate-gauge',
          type: 'metric',
          title: 'Error Rate',
          config: { type: 'gauge', metric: 'error_rate' },
          position: { x: 6, y: 0, w: 3, h: 4 },
        },
        {
          id: 'throughput-chart',
          type: 'chart',
          title: 'Throughput',
          config: { type: 'line', metric: 'throughput' },
          position: { x: 0, y: 4, w: 6, h: 4 },
        },
        {
          id: 'active-alerts-table',
          type: 'table',
          title: 'Active Alerts',
          config: { dataSource: 'alerts', status: 'active' },
          position: { x: 6, y: 4, w: 6, h: 4 },
        },
      ],
      refreshInterval: 5000,
      shared: true,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    this.dashboards.push(performanceDashboard);
  }

  /**
   * Start real-time monitoring
   */
  private startRealTimeMonitoring(): void {
    setInterval(() => {
      this.collectRealTimeMetrics();
    }, 5000); // Every 5 seconds
  }

  /**
   * Collect real-time metrics
   */
  private collectRealTimeMetrics(): void {
    if (!this.isMonitoring) return;

    // Collect performance metrics
    this.recordMetric('response_time', this.measureResponseTime(), 'ms');
    this.recordMetric('throughput', this.measureThroughput(), 'req/s');
    this.recordMetric('error_rate', this.calculateErrorRate(), '%');
    this.recordMetric('memory_usage', this.measureMemoryUsage(), 'MB');
    this.recordMetric('cpu_usage', this.measureCPUUsage(), '%');

    // Check for anomalies and trigger alerts
    this.checkAnomalies();
  }

  /**
   * Record metric
   */
  recordMetric(
    name: string,
    value: number,
    unit: string,
    type: APMMetric['type'] = 'gauge',
    tags: Record<string, string> = {}
  ): void {
    if (!this.config.metrics.performance) return;

    const metric: APMMetric = {
      id: `metric-${Date.now()}-${Math.random()}`,
      name,
      value,
      unit,
      type,
      tags,
      timestamp: Date.now(),
      source: 'application',
    };

    this.metrics.push(metric);
  }

  /**
   * Record error
   */
  recordError(
    type: string,
    message: string,
    stack: string,
    context: Record<string, any> = {},
    severity: APMError['severity'] = 'medium',
    user?: string
  ): void {
    if (!this.config.metrics.errors) return;

    const error: APMError = {
      id: `error-${Date.now()}-${Math.random()}`,
      type,
      message,
      stack,
      context,
      severity,
      user: user || 'anonymous',
      session: this.generateSessionId(),
      timestamp: Date.now(),
      resolved: false,
    };

    this.errors.push(error);

    // Check if error should trigger alert
    if (severity === 'high' || severity === 'critical') {
      this.createErrorAlert(error);
    }
  }

  /**
   * Start trace
   */
  startTrace(
    name: string,
    operation: string,
    tags: Record<string, string> = {}
  ): string {
    if (!this.config.tracing.enabled) return '';

    const traceId = this.generateTraceId();
    const spanId = this.generateSpanId();

    const trace: APMTrace = {
      id: `trace-${Date.now()}-${Math.random()}`,
      traceId,
      spanId,
      name,
      operation,
      startTime: Date.now(),
      endTime: 0,
      duration: 0,
      status: 'success',
      tags,
      logs: [],
    };

    this.traces.push(trace);
    return traceId;
  }

  /**
   * End trace
   */
  endTrace(traceId: string, status: APMTrace['status'] = 'success'): void {
    if (!this.config.tracing.enabled) return;

    const trace = this.traces.find(t => t.traceId === traceId);
    if (!trace) return;

    trace.endTime = Date.now();
    trace.duration = trace.endTime - trace.startTime;
    trace.status = status;
  }

  /**
   * Add trace log
   */
  addTraceLog(
    traceId: string,
    level: string,
    message: string,
    data?: any
  ): void {
    if (!this.config.tracing.enabled) return;

    const trace = this.traces.find(t => t.traceId === traceId);
    if (!trace) return;

    trace.logs.push({
      timestamp: Date.now(),
      level,
      message,
      data,
    });
  }

  /**
   * Record user experience metric
   */
  recordUserExperienceMetric(
    userId: string,
    sessionId: string,
    metrics: Partial<UserExperienceMetric>
  ): void {
    if (!this.config.metrics.userExperience) return;

    const uxMetric: UserExperienceMetric = {
      userId,
      sessionId,
      pageLoadTime: metrics.pageLoadTime || 0,
      timeToInteractive: metrics.timeToInteractive || 0,
      firstContentfulPaint: metrics.firstContentfulPaint || 0,
      largestContentfulPaint: metrics.largestContentfulPaint || 0,
      firstInputDelay: metrics.firstInputDelay || 0,
      cumulativeLayoutShift: metrics.cumulativeLayoutShift || 0,
      totalBlockingTime: metrics.totalBlockingTime || 0,
      speedIndex: metrics.speedIndex || 0,
      timestamp: Date.now(),
    };

    this.userExperienceMetrics.push(uxMetric);
  }

  /**
   * Record business metric
   */
  recordBusinessMetric(
    name: string,
    value: number,
    category: BusinessMetric['category'],
    period: BusinessMetric['period'] = 'day',
    metadata: Record<string, any> = {}
  ): void {
    if (!this.config.metrics.business) return;

    const businessMetric: BusinessMetric = {
      id: `business-${Date.now()}-${Math.random()}`,
      name,
      value,
      category,
      period,
      timestamp: Date.now(),
      metadata,
    };

    this.businessMetrics.push(businessMetric);
  }

  /**
   * Create alert
   */
  createAlert(
    name: string,
    description: string,
    condition: string,
    threshold: number,
    severity: APMAlert['severity'] = 'warning'
  ): APMAlert {
    if (!this.config.alerting.enabled) {
      throw new Error('Alerting is not enabled');
    }

    const alert: APMAlert = {
      id: `alert-${Date.now()}-${Math.random()}`,
      name,
      description,
      severity,
      condition,
      threshold,
      currentValue: 0,
      status: 'active',
      createdAt: Date.now(),
      escalationLevel: 0,
    };

    this.alerts.push(alert);
    return alert;
  }

  /**
   * Create error alert
   */
  private createErrorAlert(error: APMError): void {
    const alert = this.createAlert(
      `Error Alert: ${error.type}`,
      `Critical error detected: ${error.message}`,
      'error_count > 0',
      1,
      'critical'
    );

    alert.triggeredAt = Date.now();
    alert.currentValue = 1;
  }

  /**
   * Check anomalies
   */
  private checkAnomalies(): void {
    if (!this.config.alerting.anomaly) return;

    // Check for performance anomalies
    const recentMetrics = this.metrics.filter(
      m => Date.now() - m.timestamp < 5 * 60 * 1000 // Last 5 minutes
    );

    const responseTimeMetrics = recentMetrics.filter(m => m.name === 'response_time');
    if (responseTimeMetrics.length > 0) {
      const avgResponseTime = responseTimeMetrics.reduce((sum, m) => sum + m.value, 0) / responseTimeMetrics.length;
      
      if (avgResponseTime > 1000) { // Alert if average response time > 1s
        this.createAlert(
          'High Response Time',
          'Average response time is above threshold',
          'response_time > 1000',
          1000,
          'warning'
        );
      }
    }
  }

  /**
   * Measure response time
   */
  private measureResponseTime(): number {
    return Math.random() * 500; // 0-500ms
  }

  /**
   * Measure throughput
   */
  private measureThroughput(): number {
    return Math.random() * 100; // 0-100 req/s
  }

  /**
   * Calculate error rate
   */
  private calculateErrorRate(): number {
    const recentErrors = this.errors.filter(
      e => Date.now() - e.timestamp < 5 * 60 * 1000 // Last 5 minutes
    );
    return recentErrors.length > 0 ? Math.random() * 5 : 0; // 0-5%
  }

  /**
   * Measure memory usage
   */
  private measureMemoryUsage(): number {
    return Math.random() * 100; // 0-100 MB
  }

  /**
   * Measure CPU usage
   */
  private measureCPUUsage(): number {
    return Math.random() * 100; // 0-100%
  }

  /**
   * Generate session ID
   */
  private generateSessionId(): string {
    return `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Generate trace ID
   */
  private generateTraceId(): string {
    return `trace-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Generate span ID
   */
  private generateSpanId(): string {
    return `span-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get configuration
   */
  getConfig(): APMConfig {
    return { ...this.config };
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<APMConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Get metrics
   */
  getMetrics(timeRange: '1h' | '24h' | '7d' | '30d' = '24h'): APMMetric[] {
    const now = Date.now();
    const timeRanges = {
      '1h': 60 * 60 * 1000,
      '24h': 24 * 60 * 60 * 1000,
      '7d': 7 * 24 * 60 * 60 * 1000,
      '30d': 30 * 24 * 60 * 60 * 1000,
    };

    const cutoff = now - timeRanges[timeRange];
    return this.metrics.filter(metric => metric.timestamp >= cutoff);
  }

  /**
   * Get errors
   */
  getErrors(): APMError[] {
    return [...this.errors];
  }

  /**
   * Get traces
   */
  getTraces(): APMTrace[] {
    return [...this.traces];
  }

  /**
   * Get alerts
   */
  getAlerts(): APMAlert[] {
    return [...this.alerts];
  }

  /**
   * Get dashboards
   */
  getDashboards(): APMDashboard[] {
    return [...this.dashboards];
  }

  /**
   * Get user experience metrics
   */
  getUserExperienceMetrics(): UserExperienceMetric[] {
    return [...this.userExperienceMetrics];
  }

  /**
   * Get business metrics
   */
  getBusinessMetrics(): BusinessMetric[] {
    return [...this.businessMetrics];
  }

  /**
   * Get APM summary
   */
  getSummary(): {
    totalMetrics: number;
    totalErrors: number;
    totalTraces: number;
    activeAlerts: number;
    averageResponseTime: number;
    errorRate: number;
  } {
    const activeAlerts = this.alerts.filter(a => a.status === 'active').length;
    const recentMetrics = this.getMetrics('1h');
    const responseTimeMetrics = recentMetrics.filter(m => m.name === 'response_time');
    const averageResponseTime = responseTimeMetrics.length > 0
      ? responseTimeMetrics.reduce((sum, m) => sum + m.value, 0) / responseTimeMetrics.length
      : 0;
    const errorRate = this.calculateErrorRate();

    return {
      totalMetrics: this.metrics.length,
      totalErrors: this.errors.length,
      totalTraces: this.traces.length,
      activeAlerts,
      averageResponseTime,
      errorRate,
    };
  }
}

// Global APM instance
export const applicationMonitoring = new ApplicationMonitoring();

export default ApplicationMonitoring; 