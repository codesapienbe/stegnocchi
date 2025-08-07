import { logInfo, logError, Component } from '../core/logger';

export interface WorkflowStep {
  id: string;
  name: string;
  description: string;
  type: 'action' | 'condition' | 'loop' | 'delay' | 'input' | 'output';
  action: (context: WorkflowContext) => Promise<any>;
  condition?: (context: WorkflowContext) => boolean;
  parameters: Record<string, any>;
  order: number;
  required: boolean;
  timeout?: number;
}

export interface WorkflowContext {
  workflowId: string;
  executionId: string;
  variables: Record<string, any>;
  results: Record<string, any>;
  stepResults: Record<string, any>;
  startTime: number;
  currentStep: string;
  status: 'running' | 'completed' | 'failed' | 'paused';
}

export interface CustomWorkflow {
  id: string;
  name: string;
  description: string;
  version: string;
  author: string;
  steps: WorkflowStep[];
  triggers: WorkflowTrigger[];
  enabled: boolean;
  maxExecutionTime: number;
  retryPolicy: RetryPolicy;
}

export interface WorkflowTrigger {
  type: 'manual' | 'schedule' | 'event' | 'webhook';
  name: string;
  parameters: Record<string, any>;
}

export interface RetryPolicy {
  maxRetries: number;
  retryDelay: number;
  backoffMultiplier: number;
  maxRetryDelay: number;
}

export interface WorkflowExecution {
  id: string;
  workflowId: string;
  context: WorkflowContext;
  startTime: number;
  endTime?: number;
  duration?: number;
  status: 'running' | 'completed' | 'failed' | 'paused';
  error?: string;
  logs: WorkflowLog[];
}

export interface WorkflowLog {
  timestamp: number;
  level: 'info' | 'warn' | 'error' | 'debug';
  stepId: string;
  message: string;
  data?: any;
}

export interface WorkflowConfig {
  enabled: boolean;
  maxConcurrentExecutions: number;
  enableLogging: boolean;
  enableMetrics: boolean;
  defaultTimeout: number;
  maxExecutionTime: number;
}

/**
 * Custom workflows and automation utility
 */
export class CustomWorkflows {
  private config: WorkflowConfig;
  private workflows: Map<string, CustomWorkflow> = new Map();
  private executions: Map<string, WorkflowExecution> = new Map();
  private activeExecutions: Set<string> = new Set();

  constructor(config?: Partial<WorkflowConfig>) {
    this.config = {
      enabled: true,
      maxConcurrentExecutions: 5,
      enableLogging: true,
      enableMetrics: true,
      defaultTimeout: 300000, // 5 minutes
      maxExecutionTime: 3600000, // 1 hour
      ...config,
    };

    this.initializeDefaultWorkflows();
  }

  /**
   * Initialize default workflows
   */
  private initializeDefaultWorkflows(): void {
    const batchProcessingWorkflow: CustomWorkflow = {
      id: 'batch-processing',
      name: 'Batch Image Processing',
      description: 'Process multiple images with steganography operations',
      version: '1.0.0',
      author: 'System',
      enabled: true,
      maxExecutionTime: 1800000, // 30 minutes
      retryPolicy: {
        maxRetries: 3,
        retryDelay: 5000,
        backoffMultiplier: 2,
        maxRetryDelay: 30000,
      },
      steps: [
        {
          id: 'validate-input',
          name: 'Validate Input',
          description: 'Validate input files and parameters',
          type: 'action',
          action: async (context) => {
            const files = context.variables.files || [];
            if (files.length === 0) {
              throw new Error('No files provided for batch processing');
            }
            return { validFiles: files.length };
          },
          parameters: {},
          order: 1,
          required: true,
        },
        {
          id: 'process-images',
          name: 'Process Images',
          description: 'Apply steganography operations to images',
          type: 'loop',
          action: async (context) => {
            const files = context.variables.files || [];
            const results = [];
            
            for (const file of files) {
              try {
                // Simulate image processing
                await this.delay(1000);
                results.push({ file: file.name, status: 'processed' });
              } catch (error) {
                results.push({ file: file.name, status: 'failed', error: error.message });
              }
            }
            
            return { processedCount: results.length, results };
          },
          parameters: {},
          order: 2,
          required: true,
        },
        {
          id: 'generate-report',
          name: 'Generate Report',
          description: 'Generate processing report',
          type: 'action',
          action: async (context) => {
            const results = context.stepResults['process-images']?.results || [];
            const successCount = results.filter(r => r.status === 'processed').length;
            const failureCount = results.filter(r => r.status === 'failed').length;
            
            return {
              totalFiles: results.length,
              successCount,
              failureCount,
              successRate: (successCount / results.length) * 100,
            };
          },
          parameters: {},
          order: 3,
          required: true,
        },
      ],
      triggers: [
        {
          type: 'manual',
          name: 'Manual Trigger',
          parameters: {},
        },
      ],
    };

    const backupWorkflow: CustomWorkflow = {
      id: 'auto-backup',
      name: 'Automatic Backup',
      description: 'Automatically backup processed images and data',
      version: '1.0.0',
      author: 'System',
      enabled: true,
      maxExecutionTime: 600000, // 10 minutes
      retryPolicy: {
        maxRetries: 2,
        retryDelay: 10000,
        backoffMultiplier: 1.5,
        maxRetryDelay: 20000,
      },
      steps: [
        {
          id: 'check-backup-needed',
          name: 'Check Backup Needed',
          description: 'Check if backup is needed',
          type: 'condition',
          action: async (context) => {
            const lastBackup = context.variables.lastBackup || 0;
            const now = Date.now();
            const backupInterval = 24 * 60 * 60 * 1000; // 24 hours
            
            return now - lastBackup > backupInterval;
          },
          parameters: {},
          order: 1,
          required: true,
        },
        {
          id: 'create-backup',
          name: 'Create Backup',
          description: 'Create backup of data',
          type: 'action',
          action: async (context) => {
            // Simulate backup creation
            await this.delay(2000);
            return { backupId: `backup-${Date.now()}`, timestamp: Date.now() };
          },
          parameters: {},
          order: 2,
          required: true,
        },
      ],
      triggers: [
        {
          type: 'schedule',
          name: 'Daily Schedule',
          parameters: { cron: '0 2 * * *' }, // 2 AM daily
        },
      ],
    };

    this.workflows.set('batch-processing', batchProcessingWorkflow);
    this.workflows.set('auto-backup', backupWorkflow);
  }

  /**
   * Create custom workflow
   */
  createWorkflow(workflow: CustomWorkflow): void {
    this.workflows.set(workflow.id, workflow);
    
    logInfo(Component.UI, 'Custom workflow created', {
      workflowId: workflow.id,
      workflowName: workflow.name,
      stepsCount: workflow.steps.length,
      author: workflow.author,
    });
  }

  /**
   * Execute workflow
   */
  async executeWorkflow(workflowId: string, variables: Record<string, any> = {}): Promise<string> {
    if (!this.config.enabled) {
      throw new Error('Workflows are disabled');
    }

    const workflow = this.workflows.get(workflowId);
    if (!workflow || !workflow.enabled) {
      throw new Error(`Workflow not found or disabled: ${workflowId}`);
    }

    if (this.activeExecutions.size >= this.config.maxConcurrentExecutions) {
      throw new Error('Maximum concurrent executions reached');
    }

    const executionId = `exec-${Date.now()}-${Math.random()}`;
    const context: WorkflowContext = {
      workflowId,
      executionId,
      variables,
      results: {},
      stepResults: {},
      startTime: Date.now(),
      currentStep: '',
      status: 'running',
    };

    const execution: WorkflowExecution = {
      id: executionId,
      workflowId,
      context,
      startTime: Date.now(),
      status: 'running',
      logs: [],
    };

    this.executions.set(executionId, execution);
    this.activeExecutions.add(executionId);

    // Start execution in background
    this.executeWorkflowSteps(execution, workflow).catch(error => {
      logError(Component.UI, 'Workflow execution failed', {
        executionId,
        workflowId,
        error: error.message,
      });
    });

    logInfo(Component.UI, 'Workflow execution started', {
      executionId,
      workflowId,
      workflowName: workflow.name,
    });

    return executionId;
  }

  /**
   * Execute workflow steps
   */
  private async executeWorkflowSteps(execution: WorkflowExecution, workflow: CustomWorkflow): Promise<void> {
    const { context } = execution;
    const sortedSteps = workflow.steps.sort((a, b) => a.order - b.order);

    try {
      for (const step of sortedSteps) {
        if (context.status !== 'running') {
          break;
        }

        context.currentStep = step.id;
        this.logExecution(execution, 'info', step.id, `Executing step: ${step.name}`);

        try {
          const startTime = Date.now();
          const result = await this.executeStepWithTimeout(step, context, workflow.retryPolicy);
          const duration = Date.now() - startTime;

          context.stepResults[step.id] = result;
          this.logExecution(execution, 'info', step.id, `Step completed in ${duration}ms`, result);

          // Handle conditional steps
          if (step.type === 'condition' && step.condition) {
            const shouldContinue = step.condition(context);
            if (!shouldContinue) {
              this.logExecution(execution, 'info', step.id, 'Condition not met, stopping workflow');
              break;
            }
          }

          // Handle loop steps
          if (step.type === 'loop') {
            // For simplicity, we'll just execute the action once
            // In a real implementation, this would handle actual loops
          }

        } catch (error) {
          this.logExecution(execution, 'error', step.id, `Step failed: ${error.message}`, error);
          
          if (step.required) {
            throw error;
          }
        }
      }

      context.status = 'completed';
      execution.status = 'completed';
      execution.endTime = Date.now();
      execution.duration = execution.endTime - execution.startTime;

      this.logExecution(execution, 'info', 'workflow', 'Workflow completed successfully');

    } catch (error) {
      context.status = 'failed';
      execution.status = 'failed';
      execution.endTime = Date.now();
      execution.duration = execution.endTime - execution.startTime;
      execution.error = error.message;

      this.logExecution(execution, 'error', 'workflow', `Workflow failed: ${error.message}`, error);
    } finally {
      this.activeExecutions.delete(execution.id);
    }
  }

  /**
   * Execute step with timeout and retry
   */
  private async executeStepWithTimeout(
    step: WorkflowStep,
    context: WorkflowContext,
    retryPolicy: RetryPolicy
  ): Promise<any> {
    const timeout = step.timeout || this.config.defaultTimeout;
    let lastError: Error;

    for (let attempt = 0; attempt <= retryPolicy.maxRetries; attempt++) {
      try {
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Step timeout')), timeout);
        });

        const result = await Promise.race([
          step.action(context),
          timeoutPromise,
        ]);

        return result;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        
        if (attempt === retryPolicy.maxRetries) {
          throw lastError;
        }

        const delay = Math.min(
          retryPolicy.retryDelay * Math.pow(retryPolicy.backoffMultiplier, attempt),
          retryPolicy.maxRetryDelay
        );

        await this.delay(delay);
      }
    }
  }

  /**
   * Log execution event
   */
  private logExecution(execution: WorkflowExecution, level: WorkflowLog['level'], stepId: string, message: string, data?: any): void {
    if (!this.config.enableLogging) {
      return;
    }

    const log: WorkflowLog = {
      timestamp: Date.now(),
      level,
      stepId,
      message,
      data,
    };

    execution.logs.push(log);
  }

  /**
   * Get workflow execution
   */
  getExecution(executionId: string): WorkflowExecution | null {
    return this.executions.get(executionId) || null;
  }

  /**
   * Get workflow executions
   */
  getExecutions(workflowId?: string): WorkflowExecution[] {
    let executions = Array.from(this.executions.values());
    
    if (workflowId) {
      executions = executions.filter(exec => exec.workflowId === workflowId);
    }
    
    return executions.sort((a, b) => b.startTime - a.startTime);
  }

  /**
   * Stop workflow execution
   */
  stopExecution(executionId: string): boolean {
    const execution = this.executions.get(executionId);
    if (!execution || execution.status !== 'running') {
      return false;
    }

    execution.context.status = 'paused';
    execution.status = 'paused';
    execution.endTime = Date.now();
    execution.duration = execution.endTime - execution.startTime;

    this.activeExecutions.delete(executionId);
    
    this.logExecution(execution, 'info', 'workflow', 'Workflow execution stopped by user');

    logInfo(Component.UI, 'Workflow execution stopped', {
      executionId,
      workflowId: execution.workflowId,
    });

    return true;
  }

  /**
   * Get all workflows
   */
  getAllWorkflows(): CustomWorkflow[] {
    return Array.from(this.workflows.values());
  }

  /**
   * Get workflow by ID
   */
  getWorkflow(workflowId: string): CustomWorkflow | null {
    return this.workflows.get(workflowId) || null;
  }

  /**
   * Update workflow
   */
  updateWorkflow(workflowId: string, updates: Partial<CustomWorkflow>): boolean {
    const workflow = this.workflows.get(workflowId);
    if (!workflow) {
      return false;
    }

    const updatedWorkflow = { ...workflow, ...updates };
    this.workflows.set(workflowId, updatedWorkflow);
    
    logInfo(Component.UI, 'Workflow updated', {
      workflowId,
      updates: Object.keys(updates),
    });

    return true;
  }

  /**
   * Delete workflow
   */
  deleteWorkflow(workflowId: string): boolean {
    const deleted = this.workflows.delete(workflowId);
    
    if (deleted) {
      logInfo(Component.UI, 'Workflow deleted', { workflowId });
    }
    
    return deleted;
  }

  /**
   * Get workflow statistics
   */
  getStatistics(): {
    totalWorkflows: number;
    enabledWorkflows: number;
    totalExecutions: number;
    activeExecutions: number;
    successfulExecutions: number;
    failedExecutions: number;
  } {
    const totalWorkflows = this.workflows.size;
    const enabledWorkflows = Array.from(this.workflows.values()).filter(w => w.enabled).length;
    const totalExecutions = this.executions.size;
    const activeExecutions = this.activeExecutions.size;
    const successfulExecutions = Array.from(this.executions.values()).filter(e => e.status === 'completed').length;
    const failedExecutions = Array.from(this.executions.values()).filter(e => e.status === 'failed').length;

    return {
      totalWorkflows,
      enabledWorkflows,
      totalExecutions,
      activeExecutions,
      successfulExecutions,
      failedExecutions,
    };
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<WorkflowConfig>): void {
    this.config = { ...this.config, ...config };
    
    logInfo(Component.UI, 'Workflow config updated', {
      config: this.config,
    });
  }

  /**
   * Utility delay function
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Export singleton instance
export const customWorkflows = new CustomWorkflows(); 