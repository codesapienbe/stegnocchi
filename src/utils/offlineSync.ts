import { Platform } from 'react-native';
import { logInfo, logError, Component } from '../core/logger';

export interface SyncItem {
  id: string;
  type: 'operation' | 'data' | 'file';
  action: 'create' | 'update' | 'delete';
  data: any;
  timestamp: number;
  retryCount: number;
  maxRetries: number;
}

export interface SyncConfig {
  enabled: boolean;
  autoSync: boolean;
  syncInterval: number; // milliseconds
  maxRetries: number;
  retryDelay: number; // milliseconds
  batchSize: number;
}

export interface SyncStatus {
  isOnline: boolean;
  isSyncing: boolean;
  lastSync: number;
  pendingItems: number;
  failedItems: number;
  syncProgress: number;
}

/**
 * Offline sync utility for offline functionality with sync capabilities
 */
export class OfflineSync {
  private config: SyncConfig;
  private syncQueue: SyncItem[] = [];
  private isOnline: boolean = true;
  private isSyncing: boolean = false;
  private lastSync: number = 0;
  private syncTimer?: NodeJS.Timeout;

  constructor(config?: Partial<SyncConfig>) {
    this.config = {
      enabled: true,
      autoSync: true,
      syncInterval: 30000, // 30 seconds
      maxRetries: 3,
      retryDelay: 5000, // 5 seconds
      batchSize: 10,
      ...config,
    };

    this.initialize();
  }

  /**
   * Initialize offline sync
   */
  private initialize(): void {
    if (Platform.OS === 'web') {
      this.setupOnlineDetection();
    }

    if (this.config.autoSync) {
      this.startAutoSync();
    }

    logInfo(Component.UI, 'Offline sync initialized', {
      config: this.config,
    });
  }

  /**
   * Setup online/offline detection
   */
  private setupOnlineDetection(): void {
    const updateOnlineStatus = () => {
      const wasOnline = this.isOnline;
      this.isOnline = navigator.onLine;
      
      if (wasOnline !== this.isOnline) {
        logInfo(Component.UI, 'Online status changed', {
          isOnline: this.isOnline,
        });

        if (this.isOnline && this.config.autoSync) {
          this.sync();
        }
      }
    };

    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);
    updateOnlineStatus();
  }

  /**
   * Start automatic sync
   */
  private startAutoSync(): void {
    if (this.syncTimer) {
      clearInterval(this.syncTimer);
    }

    this.syncTimer = setInterval(() => {
      if (this.isOnline && this.syncQueue.length > 0) {
        this.sync();
      }
    }, this.config.syncInterval);
  }

  /**
   * Stop automatic sync
   */
  private stopAutoSync(): void {
    if (this.syncTimer) {
      clearInterval(this.syncTimer);
      this.syncTimer = undefined;
    }
  }

  /**
   * Add item to sync queue
   */
  addToSyncQueue(item: Omit<SyncItem, 'id' | 'timestamp' | 'retryCount'>): string {
    const syncItem: SyncItem = {
      ...item,
      id: `sync-${Date.now()}-${Math.random()}`,
      timestamp: Date.now(),
      retryCount: 0,
    };

    this.syncQueue.push(syncItem);
    
    logInfo(Component.UI, 'Item added to sync queue', {
      itemId: syncItem.id,
      type: syncItem.type,
      action: syncItem.action,
    });

    // Trigger immediate sync if online
    if (this.isOnline && this.config.autoSync) {
      this.sync();
    }

    return syncItem.id;
  }

  /**
   * Remove item from sync queue
   */
  removeFromSyncQueue(itemId: string): boolean {
    const index = this.syncQueue.findIndex(item => item.id === itemId);
    if (index !== -1) {
      this.syncQueue.splice(index, 1);
      
      logInfo(Component.UI, 'Item removed from sync queue', { itemId });
      return true;
    }
    return false;
  }

  /**
   * Sync pending items
   */
  async sync(): Promise<boolean> {
    if (this.isSyncing || !this.isOnline || this.syncQueue.length === 0) {
      return false;
    }

    this.isSyncing = true;
    
    logInfo(Component.UI, 'Sync started', {
      pendingItems: this.syncQueue.length,
    });

    try {
      const itemsToSync = this.syncQueue.slice(0, this.config.batchSize);
      const results = await Promise.allSettled(
        itemsToSync.map(item => this.syncItem(item))
      );

      const successful = results.filter(result => result.status === 'fulfilled').length;
      const failed = results.filter(result => result.status === 'rejected').length;

      this.lastSync = Date.now();
      
      logInfo(Component.UI, 'Sync completed', {
        total: itemsToSync.length,
        successful,
        failed,
      });

      return successful > 0;
    } catch (error) {
      logError(Component.UI, 'Sync failed', { error });
      return false;
    } finally {
      this.isSyncing = false;
    }
  }

  /**
   * Sync individual item
   */
  private async syncItem(item: SyncItem): Promise<void> {
    try {
      // Simulate network request
      await this.simulateNetworkRequest(item);
      
      // Remove from queue on success
      this.removeFromSyncQueue(item.id);
      
      logInfo(Component.UI, 'Item synced successfully', {
        itemId: item.id,
        type: item.type,
        action: item.action,
      });
    } catch (error) {
      item.retryCount++;
      
      if (item.retryCount >= this.config.maxRetries) {
        // Remove from queue after max retries
        this.removeFromSyncQueue(item.id);
        
        logError(Component.UI, 'Item sync failed permanently', {
          itemId: item.id,
          retryCount: item.retryCount,
          error,
        });
      } else {
        // Retry after delay
        setTimeout(() => {
          if (this.isOnline) {
            this.syncItem(item);
          }
        }, this.config.retryDelay);
        
        logInfo(Component.UI, 'Item sync retry scheduled', {
          itemId: item.id,
          retryCount: item.retryCount,
          nextRetry: Date.now() + this.config.retryDelay,
        });
      }
    }
  }

  /**
   * Simulate network request (replace with actual API calls)
   */
  private async simulateNetworkRequest(item: SyncItem): Promise<void> {
    return new Promise((resolve, reject) => {
      // Simulate network delay and occasional failures
      const delay = Math.random() * 2000 + 500; // 500-2500ms
      const shouldFail = Math.random() < 0.1; // 10% failure rate

      setTimeout(() => {
        if (shouldFail) {
          reject(new Error('Network request failed'));
        } else {
          resolve();
        }
      }, delay);
    });
  }

  /**
   * Get sync status
   */
  getStatus(): SyncStatus {
    const failedItems = this.syncQueue.filter(item => item.retryCount >= this.config.maxRetries).length;
    const pendingItems = this.syncQueue.length - failedItems;
    const syncProgress = this.syncQueue.length > 0 ? 
      ((this.syncQueue.length - pendingItems) / this.syncQueue.length) * 100 : 0;

    return {
      isOnline: this.isOnline,
      isSyncing: this.isSyncing,
      lastSync: this.lastSync,
      pendingItems,
      failedItems,
      syncProgress,
    };
  }

  /**
   * Get sync queue
   */
  getSyncQueue(): SyncItem[] {
    return [...this.syncQueue];
  }

  /**
   * Clear sync queue
   */
  clearSyncQueue(): void {
    this.syncQueue = [];
    
    logInfo(Component.UI, 'Sync queue cleared', {});
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<SyncConfig>): void {
    this.config = { ...this.config, ...config };
    
    if (this.config.autoSync) {
      this.startAutoSync();
    } else {
      this.stopAutoSync();
    }
    
    logInfo(Component.UI, 'Offline sync config updated', {
      config: this.config,
    });
  }

  /**
   * Enable/disable offline sync
   */
  setEnabled(enabled: boolean): void {
    this.config.enabled = enabled;
    
    if (enabled && this.config.autoSync) {
      this.startAutoSync();
    } else {
      this.stopAutoSync();
    }
    
    logInfo(Component.UI, 'Offline sync toggled', { enabled });
  }
}

// Export singleton instance
export const offlineSync = new OfflineSync(); 