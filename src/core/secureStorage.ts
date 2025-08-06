/**
 * Secure Storage Abstraction
 * Platform-specific secure storage for sensitive data
 */

import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

export interface SecureStorageConfig {
  serviceName: string;
  accessControl?: string;
  accessible?: string;
  authenticationType?: string;
  authenticationPrompt?: string;
}

export interface SecureStorageItem {
  key: string;
  value: string;
  options?: SecureStorageConfig;
}

export interface SecureStorageResult {
  success: boolean;
  error?: string;
  data?: any;
}

class SecureStorage {
  private config: SecureStorageConfig;

  constructor(config: SecureStorageConfig) {
    this.config = {
      serviceName: 'stegnocchi',
      ...config,
    };
  }

  /**
   * Store sensitive data securely
   */
  async setItem(key: string, value: string, options?: SecureStorageConfig): Promise<SecureStorageResult> {
    try {
      const fullKey = this.getFullKey(key);
      const storageOptions = { ...this.config, ...options };

      if (Platform.OS === 'web') {
        // For web, use a more secure approach with encryption
        const encryptedValue = await this.encryptForWeb(value);
        localStorage.setItem(fullKey, encryptedValue);
      } else {
        // For native platforms, use expo-secure-store
        await SecureStore.setItemAsync(fullKey, value, {
          keychainAccessible: SecureStore.WHEN_UNLOCKED,
          requireAuthentication: true,
          authenticationType: SecureStore.AUTHENTICATION_TYPE_BIOMETRICS,
        });
      }

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Retrieve sensitive data securely
   */
  async getItem(key: string, options?: SecureStorageConfig): Promise<SecureStorageResult> {
    try {
      const fullKey = this.getFullKey(key);
      const storageOptions = { ...this.config, ...options };

      let value: string | null = null;

      if (Platform.OS === 'web') {
        const encryptedValue = localStorage.getItem(fullKey);
        if (encryptedValue) {
          value = await this.decryptForWeb(encryptedValue);
        }
      } else {
        value = await SecureStore.getItemAsync(fullKey, {
          keychainAccessible: SecureStore.WHEN_UNLOCKED,
          requireAuthentication: true,
          authenticationType: SecureStore.AUTHENTICATION_TYPE_BIOMETRICS,
        });
      }

      if (value === null) {
        return {
          success: false,
          error: 'Item not found',
        };
      }

      return {
        success: true,
        data: value,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Remove sensitive data
   */
  async removeItem(key: string): Promise<SecureStorageResult> {
    try {
      const fullKey = this.getFullKey(key);

      if (Platform.OS === 'web') {
        localStorage.removeItem(fullKey);
      } else {
        await SecureStore.deleteItemAsync(fullKey);
      }

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Check if item exists
   */
  async hasItem(key: string): Promise<boolean> {
    try {
      const fullKey = this.getFullKey(key);

      if (Platform.OS === 'web') {
        return localStorage.getItem(fullKey) !== null;
      } else {
        const value = await SecureStore.getItemAsync(fullKey);
        return value !== null;
      }
    } catch (error) {
      return false;
    }
  }

  /**
   * Clear all stored data
   */
  async clear(): Promise<SecureStorageResult> {
    try {
      if (Platform.OS === 'web') {
        // Remove only our app's items
        const keys = Object.keys(localStorage);
        keys.forEach(key => {
          if (key.startsWith(this.config.serviceName)) {
            localStorage.removeItem(key);
          }
        });
      } else {
        // For native, we can't clear all items easily, so we'll remove known keys
        const knownKeys = [
          'encryption_key',
          'user_preferences',
          'session_token',
          'biometric_enabled',
        ];
        
        for (const key of knownKeys) {
          await SecureStore.deleteItemAsync(this.getFullKey(key));
        }
      }

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Store encryption key securely
   */
  async storeEncryptionKey(key: ArrayBuffer, salt: ArrayBuffer): Promise<SecureStorageResult> {
    try {
      const keyData = {
        key: ArrayBufferToBase64(key),
        salt: ArrayBufferToBase64(salt),
        timestamp: Date.now(),
      };

      return await this.setItem('encryption_key', JSON.stringify(keyData));
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Retrieve encryption key securely
   */
  async getEncryptionKey(): Promise<SecureStorageResult> {
    try {
      const result = await this.getItem('encryption_key');
      if (!result.success || !result.data) {
        return {
          success: false,
          error: 'Encryption key not found',
        };
      }

      const keyData = JSON.parse(result.data);
      return {
        success: true,
        data: {
          key: Base64ToArrayBuffer(keyData.key),
          salt: Base64ToArrayBuffer(keyData.salt),
          timestamp: keyData.timestamp,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Store user preferences securely
   */
  async storeUserPreferences(preferences: any): Promise<SecureStorageResult> {
    try {
      const preferencesData = {
        ...preferences,
        timestamp: Date.now(),
        version: '1.0',
      };

      return await this.setItem('user_preferences', JSON.stringify(preferencesData));
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Retrieve user preferences securely
   */
  async getUserPreferences(): Promise<SecureStorageResult> {
    try {
      const result = await this.getItem('user_preferences');
      if (!result.success || !result.data) {
        return {
          success: true,
          data: {},
        };
      }

      const preferences = JSON.parse(result.data);
      return {
        success: true,
        data: preferences,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Check if biometric authentication is available
   */
  async isBiometricAvailable(): Promise<boolean> {
    try {
      if (Platform.OS === 'web') {
        return false; // Web doesn't support biometric auth
      }

      // For native platforms, check if biometric auth is available
      const result = await SecureStore.isAvailableAsync();
      return result;
    } catch (error) {
      return false;
    }
  }

  /**
   * Enable or disable biometric authentication
   */
  async setBiometricEnabled(enabled: boolean): Promise<SecureStorageResult> {
    try {
      return await this.setItem('biometric_enabled', JSON.stringify({ enabled, timestamp: Date.now() }));
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Check if biometric authentication is enabled
   */
  async isBiometricEnabled(): Promise<boolean> {
    try {
      const result = await this.getItem('biometric_enabled');
      if (!result.success || !result.data) {
        return false;
      }

      const data = JSON.parse(result.data);
      return data.enabled === true;
    } catch (error) {
      return false;
    }
  }

  private getFullKey(key: string): string {
    return `${this.config.serviceName}:${key}`;
  }

  // Web-specific encryption (simple XOR for demo - use proper encryption in production)
  private async encryptForWeb(value: string): Promise<string> {
    if (Platform.OS !== 'web') return value;
    
    // Simple base64 encoding for demo purposes
    // In production, use proper encryption like AES-GCM
    return btoa(value);
  }

  private async decryptForWeb(encryptedValue: string): Promise<string> {
    if (Platform.OS !== 'web') return encryptedValue;
    
    // Simple base64 decoding for demo purposes
    // In production, use proper decryption
    return atob(encryptedValue);
  }
}

// Utility functions for ArrayBuffer conversion
const ArrayBufferToBase64 = (buffer: ArrayBuffer): string => {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
};

const Base64ToArrayBuffer = (base64: string): ArrayBuffer => {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
};

// Global secure storage instance
export const secureStorage = new SecureStorage({
  serviceName: 'stegnocchi',
});

export default SecureStorage; 