import { logInfo, logError, Component } from '../core/logger';

export interface BatchJob {
  id: string;
  file: File;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  result?: any;
  error?: string;
  startTime?: number;
  endTime?: number;
}

export interface BatchProcessorConfig {
  maxConcurrent: number;
  onJobStart?: (job: BatchJob) => void;
  onJobProgress?: (job: BatchJob) => void;
  onJobComplete?: (job: BatchJob) => void;
  onJobError?: (job: BatchJob, error: Error) => void;
  onBatchComplete?: (jobs: BatchJob[]) => void;
}

export interface BatchResult {
  totalJobs: number;
  completedJobs: number;
  failedJobs: number;
  totalTime: number;
  averageTime: number;
  jobs: BatchJob[];
}

/**
 * Batch processor for multiple image operations
 */
export class BatchProcessor {
  private config: BatchProcessorConfig;
  private jobs: BatchJob[] = [];
  private activeJobs: Set<string> = new Set();
  private isProcessing: boolean = false;
  private startTime: number = 0;

  constructor(config: BatchProcessorConfig) {
    this.config = {
      maxConcurrent: 3,
      ...config,
    };
  }

  /**
   * Add files to batch
   */
  addFiles(files: File[]): void {
    const newJobs: BatchJob[] = files.map((file) => ({
      id: `job-${Date.now()}-${Math.random()}`,
      file,
      status: 'pending',
      progress: 0,
    }));

    this.jobs.push(...newJobs);
    
    logInfo(Component.FILE_SYSTEM, 'Files added to batch', {
      count: files.length,
      totalJobs: this.jobs.length,
    });
  }

  /**
   * Start batch processing
   */
  async startProcessing(processor: (file: File) => Promise<any>): Promise<BatchResult> {
    if (this.isProcessing) {
      throw new Error('Batch processing already in progress');
    }

    this.isProcessing = true;
    this.startTime = Date.now();

    logInfo(Component.FILE_SYSTEM, 'Batch processing started', {
      totalJobs: this.jobs.length,
      maxConcurrent: this.config.maxConcurrent,
    });

    // Process jobs with concurrency limit
    const promises: Promise<void>[] = [];
    
    for (let i = 0; i < this.config.maxConcurrent; i++) {
      promises.push(this.processJobs(processor));
    }

    await Promise.all(promises);

    const endTime = Date.now();
    const totalTime = endTime - this.startTime;
    const completedJobs = this.jobs.filter(job => job.status === 'completed').length;
    const failedJobs = this.jobs.filter(job => job.status === 'failed').length;

    const result: BatchResult = {
      totalJobs: this.jobs.length,
      completedJobs,
      failedJobs,
      totalTime,
      averageTime: this.jobs.length > 0 ? totalTime / this.jobs.length : 0,
      jobs: [...this.jobs],
    };

    this.isProcessing = false;
    this.config.onBatchComplete?.(this.jobs);

    logInfo(Component.FILE_SYSTEM, 'Batch processing completed', {
      totalJobs: result.totalJobs,
      completedJobs: result.completedJobs,
      failedJobs: result.failedJobs,
      totalTime,
      averageTime: result.averageTime,
    });

    return result;
  }

  /**
   * Process jobs with concurrency control
   */
  private async processJobs(processor: (file: File) => Promise<any>): Promise<void> {
    while (this.jobs.some(job => job.status === 'pending')) {
      const pendingJob = this.jobs.find(job => job.status === 'pending');
      
      if (!pendingJob) {
        break;
      }

      if (this.activeJobs.size >= this.config.maxConcurrent) {
        await this.waitForJobCompletion();
        continue;
      }

      this.activeJobs.add(pendingJob.id);
      this.processJob(pendingJob, processor);
    }
  }

  /**
   * Process individual job
   */
  private async processJob(job: BatchJob, processor: (file: File) => Promise<any>): Promise<void> {
    try {
      job.status = 'processing';
      job.startTime = Date.now();
      job.progress = 0;

      this.config.onJobStart?.(job);

      // Simulate progress updates
      const progressInterval = setInterval(() => {
        if (job.progress < 90) {
          job.progress += Math.random() * 10;
          this.config.onJobProgress?.(job);
        }
      }, 100);

      // Process the file
      const result = await processor(job.file);

      clearInterval(progressInterval);
      job.progress = 100;
      job.status = 'completed';
      job.result = result;
      job.endTime = Date.now();

      this.config.onJobProgress?.(job);
      this.config.onJobComplete?.(job);

      logInfo(Component.FILE_SYSTEM, 'Job completed', {
        jobId: job.id,
        filename: job.file.name,
        duration: job.endTime - job.startTime!,
      });
    } catch (error) {
      job.status = 'failed';
      job.error = error instanceof Error ? error.message : 'Unknown error';
      job.endTime = Date.now();

      this.config.onJobError?.(job, error instanceof Error ? error : new Error(job.error));
      
      logError(Component.FILE_SYSTEM, 'Job failed', {
        jobId: job.id,
        filename: job.file.name,
        error: job.error,
      });
    } finally {
      this.activeJobs.delete(job.id);
    }
  }

  /**
   * Wait for a job to complete
   */
  private async waitForJobCompletion(): Promise<void> {
    return new Promise((resolve) => {
      const checkInterval = setInterval(() => {
        if (this.activeJobs.size < this.config.maxConcurrent) {
          clearInterval(checkInterval);
          resolve();
        }
      }, 100);
    });
  }

  /**
   * Get current batch status
   */
  getStatus(): {
    totalJobs: number;
    pendingJobs: number;
    processingJobs: number;
    completedJobs: number;
    failedJobs: number;
    progress: number;
  } {
    const pendingJobs = this.jobs.filter(job => job.status === 'pending').length;
    const processingJobs = this.jobs.filter(job => job.status === 'processing').length;
    const completedJobs = this.jobs.filter(job => job.status === 'completed').length;
    const failedJobs = this.jobs.filter(job => job.status === 'failed').length;
    
    const progress = this.jobs.length > 0 
      ? ((completedJobs + failedJobs) / this.jobs.length) * 100 
      : 0;

    return {
      totalJobs: this.jobs.length,
      pendingJobs,
      processingJobs,
      completedJobs,
      failedJobs,
      progress,
    };
  }

  /**
   * Clear completed jobs
   */
  clearCompleted(): void {
    this.jobs = this.jobs.filter(job => job.status === 'pending' || job.status === 'processing');
    
    logInfo(Component.FILE_SYSTEM, 'Completed jobs cleared', {
      remainingJobs: this.jobs.length,
    });
  }

  /**
   * Stop processing
   */
  stop(): void {
    this.isProcessing = false;
    
    logInfo(Component.FILE_SYSTEM, 'Batch processing stopped', {
      activeJobs: this.activeJobs.size,
    });
  }
} 

export interface VectorBatchOptions {
  onVectorProgress?: (jobId: string, progress0to1: number) => void;
}

export type VectorInjectFn = (file: File, opts: { onProgress?: (p: number) => void }) => Promise<any>;

export async function processVectorBatch(
  files: File[],
  injectFn: VectorInjectFn,
  options: VectorBatchOptions = {}
): Promise<BatchResult> {
  const bp = new BatchProcessor({
    maxConcurrent: 3,
    onJobProgress: (job) => options.onVectorProgress?.(job.id, Math.min(1, job.progress / 100)),
  });
  bp.addFiles(files);
  return bp.startProcessing((file) => injectFn(file, { onProgress: (p) => {/* hook for fine-grained */} }));
} 