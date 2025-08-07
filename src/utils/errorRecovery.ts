import { logInfo, logError, Component } from '../core/logger';

export interface ErrorContext {
  operation: string;
  timestamp: number;
  userAgent: string;
  platform: string;
  error: Error;
  retryCount: number;
  maxRetries: number;
  retryDelay: number;
}

export interface RetryStrategy {
  maxRetries: number;
  baseDelay: number;
  maxDelay: number;
  backoffMultiplier: number;
  jitter: boolean;
}

export interface ErrorRecoveryConfig {
  enabled: boolean;
  defaultRetryStrategy: RetryStrategy;
  enableAutoRecovery: boolean;
  enableErrorReporting: boolean;
  enableCircuitBreaker: boolean;
  circuitBreakerThreshold: number;
  circuitBreakerTimeout: number;
}

export interface RecoveryAction {
  id: string;
  name: string;
  description: string;
  action: () => Promise<void>;
  priority: number;
  category: string;
}

/**
 * Advanced error recovery and retry mechanisms utility
 */
export class ErrorRecovery {
  private config: ErrorRecoveryConfig;
  private recoveryActions: Map<string, RecoveryAction> = new Map();
  private errorHistory: ErrorContext[] = [];
  private circuitBreakerState: Map<string, { failures: number; lastFailure: number; isOpen: boolean }> = new Map();

  constructor(config?: Partial<ErrorRecoveryConfig>) {
    this.config = {
      enabled: true,
      defaultRetryStrategy: {
        maxRetries: 3,
        baseDelay: 1000,
        maxDelay: 10000,
        backoffMultiplier: 2,
        jitter: true,
      },
      enableAutoRecovery: true,
      enableErrorReporting: true,
      enableCircuitBreaker: true,
      circuitBreakerThreshold: 5,
      circuitBreakerTimeout: 60000, // 1 minute
      ...config,
    };

    this.initializeDefaultRecoveryActions();
  }

  /**
   * Initialize default recovery actions
   */
  private initializeDefaultRecoveryActions(): void {
    const defaultActions: RecoveryAction[] = [
      {
        id: 'retry-operation',
        name: 'Retry Operation',
        description: 'Retry the failed operation with exponential backoff',
        action: async () => this.performRetry(),
        priority: 10,
        category: 'retry',
      },
      {
        id: 'clear-cache',
        name: 'Clear Cache',
        description: 'Clear application cache to resolve data corruption issues',
        action: async () => this.clearCache(),
        priority: 8,
        category: 'maintenance',
      },
      {
        id: 'reset-state',
        name: 'Reset State',
        description: 'Reset application state to resolve state-related errors',
        action: async () => this.resetState(),
        priority: 7,
        category: 'state',
      },
      {
        id: 'reload-data',
        name: 'Reload Data',
        description: 'Reload data from source to resolve data-related errors',
        action: async () => this.reloadData(),
        priority: 6,
        category: 'data',
      },
      {
        id: 'fallback-mode',
        name: 'Enable Fallback Mode',
        description: 'Switch to fallback mode for degraded functionality',
        action: async () => this.enableFallbackMode(),
        priority: 5,
        category: 'fallback',
      },
    ];

    defaultActions.forEach(action => {
      this.recoveryActions.set(action.id, action);
    });
  }

  /**
   * Execute operation with retry mechanism
   */
  async executeWithRetry<T>(
    operation: () => Promise<T>,
    operationName: string,
    retryStrategy?: Partial<RetryStrategy>
  ): Promise<T> {
    if (!this.config.enabled) {
      return operation();
    }

    const strategy = { ...this.config.defaultRetryStrategy, ...retryStrategy };
    let lastError: Error;

    for (let attempt = 0; attempt <= strategy.maxRetries; attempt++) {
      try {
        // Check circuit breaker
        if (this.isCircuitBreakerOpen(operationName)) {
          throw new Error(`Circuit breaker is open for operation: ${operationName}`);
        }

        const result = await operation();
        
        // Reset circuit breaker on success
        this.resetCircuitBreaker(operationName);
        
        return result;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        
        // Record error
        this.recordError(operationName, lastError, attempt);
        
        // Update circuit breaker
        this.recordCircuitBreakerFailure(operationName);

        if (attempt === strategy.maxRetries) {
          // Max retries reached, try recovery actions
          if (this.config.enableAutoRecovery) {
            await this.attemptRecovery(operationName, lastError);
          }
          
          throw lastError;
        }

        // Calculate delay with exponential backoff and jitter
        const delay = this.calculateRetryDelay(attempt, strategy);
        
        logInfo(Component.UI, 'Retry attempt scheduled', {
          operation: operationName,
          attempt: attempt + 1,
          maxRetries: strategy.maxRetries,
          delay,
        });

        await this.sleep(delay);
      }
    }

    throw lastError!;
  }

  /**
   * Calculate retry delay with exponential backoff and jitter
   */
  private calculateRetryDelay(attempt: number, strategy: RetryStrategy): number {
    let delay = strategy.baseDelay * Math.pow(strategy.backoffMultiplier, attempt);
    
    // Cap at max delay
    delay = Math.min(delay, strategy.maxDelay);
    
    // Add jitter if enabled
    if (strategy.jitter) {
      const jitter = delay * 0.1 * Math.random();
      delay += jitter;
    }
    
    return delay;
  }

  /**
   * Record error for analysis
   */
  private recordError(operation: string, error: Error, retryCount: number): void {
    const errorContext: ErrorContext = {
      operation,
      timestamp: Date.now(),
      userAgent: navigator.userAgent,
      platform: 'web',
      error,
      retryCount,
      maxRetries: this.config.defaultRetryStrategy.maxRetries,
      retryDelay: this.calculateRetryDelay(retryCount, this.config.defaultRetryStrategy),
    };

    this.errorHistory.push(errorContext);
    
    // Keep only recent errors
    if (this.errorHistory.length > 100) {
      this.errorHistory = this.errorHistory.slice(-50);
    }

    logError(Component.UI, 'Error recorded', {
      operation,
      retryCount,
      errorMessage: error.message,
    });
  }

  /**
   * Circuit breaker implementation
   */
  private isCircuitBreakerOpen(operation: string): boolean {
    if (!this.config.enableCircuitBreaker) {
      return false;
    }

    const state = this.circuitBreakerState.get(operation);
    if (!state) {
      return false;
    }

    if (state.isOpen) {
      const timeSinceLastFailure = Date.now() - state.lastFailure;
      if (timeSinceLastFailure > this.config.circuitBreakerTimeout) {
        // Half-open the circuit breaker
        state.isOpen = false;
        state.failures = 0;
        return false;
      }
      return true;
    }

    return false;
  }

  /**
   * Record circuit breaker failure
   */
  private recordCircuitBreakerFailure(operation: string): void {
    if (!this.config.enableCircuitBreaker) {
      return;
    }

    let state = this.circuitBreakerState.get(operation);
    if (!state) {
      state = { failures: 0, lastFailure: 0, isOpen: false };
      this.circuitBreakerState.set(operation, state);
    }

    state.failures++;
    state.lastFailure = Date.now();

    if (state.failures >= this.config.circuitBreakerThreshold) {
      state.isOpen = true;
      
      logInfo(Component.UI, 'Circuit breaker opened', {
        operation,
        failures: state.failures,
        threshold: this.config.circuitBreakerThreshold,
      });
    }
  }

  /**
   * Reset circuit breaker
   */
  private resetCircuitBreaker(operation: string): void {
    if (!this.config.enableCircuitBreaker) {
      return;
    }

    const state = this.circuitBreakerState.get(operation);
    if (state) {
      state.failures = 0;
      state.isOpen = false;
    }
  }

  /**
   * Attempt recovery actions
   */
  private async attemptRecovery(operation: string, error: Error): Promise<void> {
    const actions = Array.from(this.recoveryActions.values())
      .sort((a, b) => b.priority - a.priority);

    for (const action of actions) {
      try {
        logInfo(Component.UI, 'Attempting recovery action', {
          actionId: action.id,
          actionName: action.name,
          operation,
        });

        await action.action();
        
        logInfo(Component.UI, 'Recovery action completed', {
          actionId: action.id,
          actionName: action.name,
        });

        return;
      } catch (recoveryError) {
        logError(Component.UI, 'Recovery action failed', {
          actionId: action.id,
          actionName: action.name,
          error: recoveryError,
        });
      }
    }
  }

  /**
   * Add custom recovery action
   */
  addRecoveryAction(action: RecoveryAction): void {
    this.recoveryActions.set(action.id, action);
    
    logInfo(Component.UI, 'Recovery action added', {
      actionId: action.id,
      actionName: action.name,
      category: action.category,
    });
  }

  /**
   * Get recovery actions by category
   */
  getRecoveryActionsByCategory(category: string): RecoveryAction[] {
    return Array.from(this.recoveryActions.values())
      .filter(action => action.category === category)
      .sort((a, b) => b.priority - a.priority);
  }

  /**
   * Get error history
   */
  getErrorHistory(): ErrorContext[] {
    return [...this.errorHistory];
  }

  /**
   * Clear error history
   */
  clearErrorHistory(): void {
    this.errorHistory = [];
    
    logInfo(Component.UI, 'Error history cleared', {});
  }

  /**
   * Get circuit breaker status
   */
  getCircuitBreakerStatus(): Record<string, { failures: number; isOpen: boolean; lastFailure: number }> {
    const status: Record<string, { failures: number; isOpen: boolean; lastFailure: number }> = {};
    
    for (const [operation, state] of this.circuitBreakerState.entries()) {
      status[operation] = { ...state };
    }
    
    return status;
  }

  /**
   * Reset circuit breaker for operation
   */
  resetCircuitBreakerForOperation(operation: string): void {
    this.circuitBreakerState.delete(operation);
    
    logInfo(Component.UI, 'Circuit breaker reset', { operation });
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<ErrorRecoveryConfig>): void {
    this.config = { ...this.config, ...config };
    
    logInfo(Component.UI, 'Error recovery config updated', {
      config: this.config,
    });
  }

  // Placeholder recovery action implementations
  private async performRetry(): Promise<void> {
    // Implementation would retry the last failed operation
    await this.sleep(1000);
  }

  private async clearCache(): Promise<void> {
    // Implementation would clear application cache
    if ('caches' in window) {
      const cacheNames = await caches.keys();
      await Promise.all(cacheNames.map(name => caches.delete(name)));
    }
  }

  private async resetState(): Promise<void> {
    // Implementation would reset application state
    await this.sleep(500);
  }

  private async reloadData(): Promise<void> {
    // Implementation would reload data from source
    await this.sleep(1000);
  }

  private async enableFallbackMode(): Promise<void> {
    // Implementation would enable fallback mode
    await this.sleep(500);
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Export singleton instance
export const errorRecovery = new ErrorRecovery(); 