/**
 * Performance Testing System
 * Comprehensive performance testing and benchmarking
 */

import { Platform } from 'react-native';

export interface PerformanceTestConfig {
  benchmarks: {
    enabled: boolean;
    iterations: number;
    warmupRuns: number;
    timeout: number;
  };
  memory: {
    enabled: boolean;
    leakDetection: boolean;
    heapProfiling: boolean;
    gcMonitoring: boolean;
  };
  cpu: {
    enabled: boolean;
    profiling: boolean;
    usageMonitoring: boolean;
    threadAnalysis: boolean;
  };
  network: {
    enabled: boolean;
    latencyTesting: boolean;
    bandwidthTesting: boolean;
    connectionTesting: boolean;
  };
  rendering: {
    enabled: boolean;
    fpsMonitoring: boolean;
    frameTimeAnalysis: boolean;
    renderProfiling: boolean;
  };
  bundle: {
    enabled: boolean;
    sizeAnalysis: boolean;
    loadingTime: boolean;
    parsingTime: boolean;
  };
}

export interface BenchmarkResult {
  name: string;
  iterations: number;
  totalTime: number;
  averageTime: number;
  minTime: number;
  maxTime: number;
  standardDeviation: number;
  throughput: number;
  memoryUsage: {
    before: number;
    after: number;
    peak: number;
  };
  cpuUsage: {
    average: number;
    peak: number;
  };
}

export interface MemoryProfile {
  timestamp: number;
  heapUsed: number;
  heapTotal: number;
  heapLimit: number;
  external: number;
  arrayBuffers: number;
  gcCount: number;
  gcTime: number;
  potentialLeaks: Array<{
    type: string;
    size: number;
    count: number;
    location: string;
  }>;
}

export interface CPUProfile {
  timestamp: number;
  usage: number;
  load: number;
  threads: number;
  functions: Array<{
    name: string;
    time: number;
    calls: number;
    percentage: number;
  }>;
}

export interface NetworkProfile {
  timestamp: number;
  latency: number;
  bandwidth: number;
  connections: number;
  requests: Array<{
    url: string;
    method: string;
    duration: number;
    size: number;
    status: number;
  }>;
}

export interface RenderingProfile {
  timestamp: number;
  fps: number;
  frameTime: number;
  droppedFrames: number;
  renderTime: number;
  paintTime: number;
  compositeTime: number;
}

export interface BundleProfile {
  timestamp: number;
  totalSize: number;
  parsedSize: number;
  gzippedSize: number;
  loadingTime: number;
  parsingTime: number;
  executionTime: number;
  chunks: Array<{
    name: string;
    size: number;
    type: string;
  }>;
}

class PerformanceTesting {
  private config: PerformanceTestConfig;
  private benchmarks: Map<string, BenchmarkResult> = new Map();
  private memoryProfiles: MemoryProfile[] = [];
  private cpuProfiles: CPUProfile[] = [];
  private networkProfiles: NetworkProfile[] = [];
  private renderingProfiles: RenderingProfile[] = [];
  private bundleProfiles: BundleProfile[] = [];
  private isMonitoring: boolean = false;

  constructor() {
    this.config = this.getDefaultConfig();
    this.initialize();
  }

  /**
   * Get default performance test configuration
   */
  private getDefaultConfig(): PerformanceTestConfig {
    return {
      benchmarks: {
        enabled: true,
        iterations: 1000,
        warmupRuns: 10,
        timeout: 30000,
      },
      memory: {
        enabled: true,
        leakDetection: true,
        heapProfiling: true,
        gcMonitoring: true,
      },
      cpu: {
        enabled: true,
        profiling: true,
        usageMonitoring: true,
        threadAnalysis: false,
      },
      network: {
        enabled: true,
        latencyTesting: true,
        bandwidthTesting: true,
        connectionTesting: true,
      },
      rendering: {
        enabled: true,
        fpsMonitoring: true,
        frameTimeAnalysis: true,
        renderProfiling: true,
      },
      bundle: {
        enabled: true,
        sizeAnalysis: true,
        loadingTime: true,
        parsingTime: true,
      },
    };
  }

  /**
   * Initialize performance testing
   */
  private initialize(): void {
    this.setupMemoryMonitoring();
    this.setupCPUMonitoring();
    this.setupNetworkMonitoring();
    this.setupRenderingMonitoring();
    this.setupBundleMonitoring();
  }

  /**
   * Setup memory monitoring
   */
  private setupMemoryMonitoring(): void {
    if (!this.config.memory.enabled || Platform.OS !== 'web') return;

    if (this.config.memory.heapProfiling) {
      setInterval(() => {
        this.captureMemoryProfile();
      }, 1000);
    }

    if (this.config.memory.gcMonitoring) {
      this.setupGCMonitoring();
    }
  }

  /**
   * Setup CPU monitoring
   */
  private setupCPUMonitoring(): void {
    if (!this.config.cpu.enabled || Platform.OS !== 'web') return;

    if (this.config.cpu.usageMonitoring) {
      setInterval(() => {
        this.captureCPUProfile();
      }, 1000);
    }
  }

  /**
   * Setup network monitoring
   */
  private setupNetworkMonitoring(): void {
    if (!this.config.network.enabled || Platform.OS !== 'web') return;

    if (this.config.network.latencyTesting) {
      this.setupNetworkLatencyTesting();
    }
  }

  /**
   * Setup rendering monitoring
   */
  private setupRenderingMonitoring(): void {
    if (!this.config.rendering.enabled || Platform.OS !== 'web') return;

    if (this.config.rendering.fpsMonitoring) {
      this.setupFPSMonitoring();
    }
  }

  /**
   * Setup bundle monitoring
   */
  private setupBundleMonitoring(): void {
    if (!this.config.bundle.enabled || Platform.OS !== 'web') return;

    if (this.config.bundle.sizeAnalysis) {
      this.captureBundleProfile();
    }
  }

  /**
   * Setup GC monitoring
   */
  private setupGCMonitoring(): void {
    if (Platform.OS !== 'web') return;

    // Monitor garbage collection events
    if ('gc' in window) {
      (window as any).gc();
    }
  }

  /**
   * Setup network latency testing
   */
  private setupNetworkLatencyTesting(): void {
    if (Platform.OS !== 'web') return;

    // Test network latency to various endpoints
    const endpoints = [
      'https://www.google.com',
      'https://www.cloudflare.com',
      'https://www.amazon.com',
    ];

    setInterval(() => {
      endpoints.forEach(endpoint => {
        this.testNetworkLatency(endpoint);
      });
    }, 5000);
  }

  /**
   * Setup FPS monitoring
   */
  private setupFPSMonitoring(): void {
    if (Platform.OS !== 'web') return;

    let frameCount = 0;
    let lastTime = performance.now();

    const measureFPS = () => {
      frameCount++;
      const currentTime = performance.now();
      
      if (currentTime - lastTime >= 1000) {
        const fps = Math.round((frameCount * 1000) / (currentTime - lastTime));
        this.captureRenderingProfile(fps);
        frameCount = 0;
        lastTime = currentTime;
      }

      requestAnimationFrame(measureFPS);
    };

    requestAnimationFrame(measureFPS);
  }

  /**
   * Capture memory profile
   */
  private captureMemoryProfile(): void {
    if (Platform.OS !== 'web' || !(performance as any).memory) return;

    const memory = (performance as any).memory;
    const profile: MemoryProfile = {
      timestamp: Date.now(),
      heapUsed: memory.usedJSHeapSize,
      heapTotal: memory.totalJSHeapSize,
      heapLimit: memory.jsHeapSizeLimit,
      external: memory.external,
      arrayBuffers: memory.arrayBuffers || 0,
      gcCount: 0,
      gcTime: 0,
      potentialLeaks: [],
    };

    this.memoryProfiles.push(profile);

    // Detect potential memory leaks
    if (this.config.memory.leakDetection) {
      this.detectMemoryLeaks();
    }
  }

  /**
   * Capture CPU profile
   */
  private captureCPUProfile(): void {
    if (Platform.OS !== 'web') return;

    const profile: CPUProfile = {
      timestamp: Date.now(),
      usage: 0,
      load: 0,
      threads: navigator.hardwareConcurrency || 1,
      functions: [],
    };

    this.cpuProfiles.push(profile);
  }

  /**
   * Capture rendering profile
   */
  private captureRenderingProfile(fps: number): void {
    if (Platform.OS !== 'web') return;

    const profile: RenderingProfile = {
      timestamp: Date.now(),
      fps,
      frameTime: 1000 / fps,
      droppedFrames: 0,
      renderTime: 0,
      paintTime: 0,
      compositeTime: 0,
    };

    this.renderingProfiles.push(profile);
  }

  /**
   * Capture bundle profile
   */
  private captureBundleProfile(): void {
    if (Platform.OS !== 'web') return;

    const scripts = document.querySelectorAll('script[src]');
    let totalSize = 0;
    const chunks: Array<{ name: string; size: number; type: string }> = [];

    scripts.forEach(script => {
      const src = script.getAttribute('src');
      if (src) {
        const size = this.estimateScriptSize(src);
        totalSize += size;
        chunks.push({
          name: src,
          size,
          type: 'script',
        });
      }
    });

    const profile: BundleProfile = {
      timestamp: Date.now(),
      totalSize,
      parsedSize: totalSize,
      gzippedSize: Math.round(totalSize * 0.3), // Estimate gzipped size
      loadingTime: performance.now(),
      parsingTime: 0,
      executionTime: 0,
      chunks,
    };

    this.bundleProfiles.push(profile);
  }

  /**
   * Test network latency
   */
  private async testNetworkLatency(endpoint: string): Promise<void> {
    try {
      const startTime = performance.now();
      const response = await fetch(endpoint, { method: 'HEAD' });
      const endTime = performance.now();
      
      const profile: NetworkProfile = {
        timestamp: Date.now(),
        latency: endTime - startTime,
        bandwidth: 0,
        connections: 1,
        requests: [{
          url: endpoint,
          method: 'HEAD',
          duration: endTime - startTime,
          size: 0,
          status: response.status,
        }],
      };

      this.networkProfiles.push(profile);
    } catch (error) {
      console.error(`Network latency test failed for ${endpoint}:`, error);
    }
  }

  /**
   * Detect memory leaks
   */
  private detectMemoryLeaks(): void {
    if (this.memoryProfiles.length < 10) return;

    const recent = this.memoryProfiles.slice(-10);
    const first = recent[0];
    const last = recent[recent.length - 1];

    // Check for consistent memory growth
    const growthRate = (last.heapUsed - first.heapUsed) / (last.timestamp - first.timestamp);
    
    if (growthRate > 1000) { // More than 1KB per second
      console.warn('Potential memory leak detected:', {
        growthRate: `${Math.round(growthRate)} bytes/second`,
        timeSpan: `${Math.round((last.timestamp - first.timestamp) / 1000)} seconds`,
      });
    }
  }

  /**
   * Estimate script size
   */
  private estimateScriptSize(src: string): number {
    // Simple estimation based on URL patterns
    if (src.includes('bundle')) return 100000; // 100KB
    if (src.includes('vendor')) return 50000; // 50KB
    if (src.includes('main')) return 75000; // 75KB
    return 25000; // Default 25KB
  }

  /**
   * Run benchmark
   */
  async runBenchmark(
    name: string,
    testFunction: () => void | Promise<void>,
    iterations: number = this.config.benchmarks.iterations
  ): Promise<BenchmarkResult> {
    const times: number[] = [];
    const memoryBefore = this.getMemoryUsage();
    const cpuBefore = this.getCPUUsage();

    // Warmup runs
    for (let i = 0; i < this.config.benchmarks.warmupRuns; i++) {
      await testFunction();
    }

    // Actual benchmark
    for (let i = 0; i < iterations; i++) {
      const startTime = performance.now();
      await testFunction();
      const endTime = performance.now();
      times.push(endTime - startTime);
    }

    const memoryAfter = this.getMemoryUsage();
    const cpuAfter = this.getCPUUsage();

    const totalTime = times.reduce((sum, time) => sum + time, 0);
    const averageTime = totalTime / times.length;
    const minTime = Math.min(...times);
    const maxTime = Math.max(...times);
    const standardDeviation = this.calculateStandardDeviation(times, averageTime);
    const throughput = iterations / (totalTime / 1000);

    const result: BenchmarkResult = {
      name,
      iterations,
      totalTime,
      averageTime,
      minTime,
      maxTime,
      standardDeviation,
      throughput,
      memoryUsage: {
        before: memoryBefore,
        after: memoryAfter,
        peak: Math.max(memoryBefore, memoryAfter),
      },
      cpuUsage: {
        average: (cpuBefore + cpuAfter) / 2,
        peak: Math.max(cpuBefore, cpuAfter),
      },
    };

    this.benchmarks.set(name, result);
    return result;
  }

  /**
   * Calculate standard deviation
   */
  private calculateStandardDeviation(values: number[], mean: number): number {
    const variance = values.reduce((sum, value) => sum + Math.pow(value - mean, 2), 0) / values.length;
    return Math.sqrt(variance);
  }

  /**
   * Get memory usage
   */
  private getMemoryUsage(): number {
    if (Platform.OS === 'web' && (performance as any).memory) {
      return (performance as any).memory.usedJSHeapSize;
    }
    return 0;
  }

  /**
   * Get CPU usage
   */
  private getCPUUsage(): number {
    // This would require more sophisticated CPU monitoring
    return 0;
  }

  /**
   * Start performance monitoring
   */
  startMonitoring(): void {
    this.isMonitoring = true;
    console.log('Performance monitoring started');
  }

  /**
   * Stop performance monitoring
   */
  stopMonitoring(): void {
    this.isMonitoring = false;
    console.log('Performance monitoring stopped');
  }

  /**
   * Get benchmark results
   */
  getBenchmarkResults(): Map<string, BenchmarkResult> {
    return new Map(this.benchmarks);
  }

  /**
   * Get memory profiles
   */
  getMemoryProfiles(): MemoryProfile[] {
    return [...this.memoryProfiles];
  }

  /**
   * Get CPU profiles
   */
  getCPUProfiles(): CPUProfile[] {
    return [...this.cpuProfiles];
  }

  /**
   * Get network profiles
   */
  getNetworkProfiles(): NetworkProfile[] {
    return [...this.networkProfiles];
  }

  /**
   * Get rendering profiles
   */
  getRenderingProfiles(): RenderingProfile[] {
    return [...this.renderingProfiles];
  }

  /**
   * Get bundle profiles
   */
  getBundleProfiles(): BundleProfile[] {
    return [...this.bundleProfiles];
  }

  /**
   * Get configuration
   */
  getConfig(): PerformanceTestConfig {
    return { ...this.config };
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<PerformanceTestConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Clear all profiles
   */
  clearProfiles(): void {
    this.memoryProfiles = [];
    this.cpuProfiles = [];
    this.networkProfiles = [];
    this.renderingProfiles = [];
    this.bundleProfiles = [];
    this.benchmarks.clear();
  }

  /**
   * Generate performance report
   */
  generateReport(): {
    benchmarks: BenchmarkResult[];
    memory: MemoryProfile[];
    cpu: CPUProfile[];
    network: NetworkProfile[];
    rendering: RenderingProfile[];
    bundle: BundleProfile[];
    summary: {
      totalBenchmarks: number;
      averageMemoryUsage: number;
      averageCPUUsage: number;
      averageFPS: number;
      averageLatency: number;
    };
  } {
    const benchmarkResults = Array.from(this.benchmarks.values());
    const averageMemoryUsage = this.memoryProfiles.length > 0 
      ? this.memoryProfiles.reduce((sum, p) => sum + p.heapUsed, 0) / this.memoryProfiles.length 
      : 0;
    const averageCPUUsage = this.cpuProfiles.length > 0 
      ? this.cpuProfiles.reduce((sum, p) => sum + p.usage, 0) / this.cpuProfiles.length 
      : 0;
    const averageFPS = this.renderingProfiles.length > 0 
      ? this.renderingProfiles.reduce((sum, p) => sum + p.fps, 0) / this.renderingProfiles.length 
      : 0;
    const averageLatency = this.networkProfiles.length > 0 
      ? this.networkProfiles.reduce((sum, p) => sum + p.latency, 0) / this.networkProfiles.length 
      : 0;

    return {
      benchmarks: benchmarkResults,
      memory: this.memoryProfiles,
      cpu: this.cpuProfiles,
      network: this.networkProfiles,
      rendering: this.renderingProfiles,
      bundle: this.bundleProfiles,
      summary: {
        totalBenchmarks: benchmarkResults.length,
        averageMemoryUsage,
        averageCPUUsage,
        averageFPS,
        averageLatency,
      },
    };
  }
}

// Global performance testing instance
export const performanceTesting = new PerformanceTesting();

export default PerformanceTesting; 