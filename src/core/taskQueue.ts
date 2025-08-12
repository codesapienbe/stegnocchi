import { logInfo, logWarn, logError, Component } from './logger';

export type TaskFn<T = any> = () => Promise<T> | T;

export interface EnqueueOptions {
  priority?: number; // higher runs first
  id?: string;
  metadata?: Record<string, any>;
}

export interface TaskHandle<T = any> {
  id: string;
  createdAt: string;
  status: 'queued' | 'running' | 'completed' | 'failed' | 'cancelled';
  priority: number;
  metadata?: Record<string, any>;
  result?: T;
  error?: string;
}

interface InternalTask<T = any> extends TaskHandle<T> {
  fn: TaskFn<T>;
}

export class TaskQueue {
  private readonly concurrency: number;
  private running: number = 0;
  private paused: boolean = false;
  private queue: InternalTask[] = [];

  constructor(concurrency: number = 2) {
    this.concurrency = Math.max(1, concurrency);
  }

  enqueue<T>(fn: TaskFn<T>, options: EnqueueOptions = {}): TaskHandle<T> {
    const task: InternalTask<T> = {
      id: options.id || `task_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      createdAt: new Date().toISOString(),
      status: 'queued',
      priority: options.priority ?? 0,
      metadata: options.metadata,
      fn,
    };
    this.queue.push(task);
    this.queue.sort((a, b) => b.priority - a.priority);
    logInfo(Component.APP, 'Task enqueued', { id: task.id, priority: task.priority });
    this.pump();
    return task;
  }

  pause(): void {
    this.paused = true;
    logWarn(Component.APP, 'Task queue paused', {});
  }

  resume(): void {
    if (!this.paused) return;
    this.paused = false;
    logInfo(Component.APP, 'Task queue resumed', {});
    this.pump();
  }

  clear(): void {
    const dropped = this.queue.length;
    this.queue = [];
    logWarn(Component.APP, 'Cleared pending tasks', { dropped });
  }

  getStats(): { pending: number; running: number; concurrency: number; paused: boolean } {
    return { pending: this.queue.length, running: this.running, concurrency: this.concurrency, paused: this.paused };
  }

  private pump(): void {
    if (this.paused) return;
    while (this.running < this.concurrency && this.queue.length > 0) {
      const task = this.queue.shift()!;
      this.run(task);
    }
  }

  private async run<T>(task: InternalTask<T>): Promise<void> {
    this.running += 1;
    task.status = 'running';
    logInfo(Component.APP, 'Task started', { id: task.id });
    try {
      const res = await task.fn();
      task.result = res as any;
      task.status = 'completed';
      logInfo(Component.APP, 'Task completed', { id: task.id });
    } catch (error) {
      task.error = error instanceof Error ? error.message : 'Task failed';
      task.status = 'failed';
      logError(Component.APP, 'Task failed', { id: task.id, error: task.error });
    } finally {
      this.running -= 1;
      this.pump();
    }
  }
}

export const backgroundTasks = new TaskQueue(Math.min(4, Math.max(1, typeof navigator !== 'undefined' ? (navigator as any).hardwareConcurrency || 2 : 2))); 