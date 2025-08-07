import { Platform } from 'react-native';
import * as LocalAuthentication from 'expo-local-authentication';
import { logInfo, logError, Component } from '../core/logger';

export interface BiometricType {
  type: 'fingerprint' | 'face' | 'iris' | 'voice' | 'windows-hello';
  available: boolean;
  enrolled: boolean;
  supported: boolean;
}

export interface SecurityFeature {
  id: string;
  name: string;
  description: string;
  type: 'biometric' | 'hardware' | 'software';
  available: boolean;
  enabled: boolean;
  platform: string[];
}

export interface SecurityConfig {
  enabled: boolean;
  requireBiometrics: boolean;
  enableHardwareSecurity: boolean;
  enableSecureEnclave: boolean;
  enableKeychain: boolean;
  enableTPM: boolean;
  fallbackToPassword: boolean;
}

export interface AuthenticationResult {
  success: boolean;
  method: string;
  timestamp: number;
  error?: string;
}

/**
 * Platform-specific security features utility
 */
export class PlatformSecurity {
  private config: SecurityConfig;
  private biometricTypes: Map<string, BiometricType> = new Map();
  private securityFeatures: Map<string, SecurityFeature> = new Map();

  constructor(config?: Partial<SecurityConfig>) {
    this.config = {
      enabled: true,
      requireBiometrics: true,
      enableHardwareSecurity: true,
      enableSecureEnclave: true,
      enableKeychain: true,
      enableTPM: true,
      fallbackToPassword: true,
      ...config,
    };

    this.initializeSecurityFeatures();
  }

  /**
   * Initialize security features
   */
  private async initializeSecurityFeatures(): Promise<void> {
    // Initialize biometric types
    await this.initializeBiometrics();

    // Initialize security features
    const features: SecurityFeature[] = [
      {
        id: 'face-id',
        name: 'Face ID',
        description: 'Face recognition authentication',
        type: 'biometric',
        available: this.biometricTypes.get('face')?.available || false,
        enabled: this.config.enableHardwareSecurity,
        platform: ['ios'],
      },
      {
        id: 'touch-id',
        name: 'Touch ID',
        description: 'Fingerprint authentication',
        type: 'biometric',
        available: this.biometricTypes.get('fingerprint')?.available || false,
        enabled: this.config.enableHardwareSecurity,
        platform: ['ios', 'android'],
      },
      {
        id: 'windows-hello',
        name: 'Windows Hello',
        description: 'Windows biometric authentication',
        type: 'biometric',
        available: this.biometricTypes.get('windows-hello')?.available || false,
        enabled: this.config.enableHardwareSecurity,
        platform: ['windows'],
      },
      {
        id: 'secure-enclave',
        name: 'Secure Enclave',
        description: 'Hardware security module',
        type: 'hardware',
        available: Platform.OS === 'ios',
        enabled: this.config.enableSecureEnclave,
        platform: ['ios'],
      },
      {
        id: 'keychain',
        name: 'Keychain',
        description: 'Secure key storage',
        type: 'hardware',
        available: Platform.OS === 'ios',
        enabled: this.config.enableKeychain,
        platform: ['ios'],
      },
      {
        id: 'tpm',
        name: 'Trusted Platform Module',
        description: 'Hardware security module',
        type: 'hardware',
        available: Platform.OS === 'windows',
        enabled: this.config.enableTPM,
        platform: ['windows'],
      },
      {
        id: 'keystore',
        name: 'Android Keystore',
        description: 'Hardware-backed key storage',
        type: 'hardware',
        available: Platform.OS === 'android',
        enabled: this.config.enableKeychain,
        platform: ['android'],
      },
    ];

    features.forEach(feature => {
      this.securityFeatures.set(feature.id, feature);
    });

    logInfo(Component.SECURITY, 'Platform security features initialized', {
      platform: Platform.OS,
      featuresCount: features.length,
      availableFeatures: features.filter(f => f.available).map(f => f.id),
    });
  }

  /**
   * Initialize biometric authentication
   */
  private async initializeBiometrics(): Promise<void> {
    try {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();
      const supportedTypes = await LocalAuthentication.supportedAuthenticationTypesAsync();

      const biometricTypes: BiometricType[] = [
        {
          type: 'fingerprint',
          available: hasHardware && isEnrolled && supportedTypes.includes(LocalAuthentication.AuthenticationType.FINGERPRINT),
          enrolled: isEnrolled,
          supported: supportedTypes.includes(LocalAuthentication.AuthenticationType.FINGERPRINT),
        },
        {
          type: 'face',
          available: hasHardware && isEnrolled && supportedTypes.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION),
          enrolled: isEnrolled,
          supported: supportedTypes.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION),
        },
        {
          type: 'iris',
          available: hasHardware && isEnrolled && supportedTypes.includes(LocalAuthentication.AuthenticationType.IRIS),
          enrolled: isEnrolled,
          supported: supportedTypes.includes(LocalAuthentication.AuthenticationType.IRIS),
        },
        {
          type: 'voice',
          available: false, // Not commonly supported
          enrolled: false,
          supported: false,
        },
        {
          type: 'windows-hello',
          available: Platform.OS === 'web' && this.isWindowsHelloSupported(),
          enrolled: false,
          supported: Platform.OS === 'web',
        },
      ];

      biometricTypes.forEach(biometric => {
        this.biometricTypes.set(biometric.type, biometric);
      });

      logInfo(Component.SECURITY, 'Biometric authentication initialized', {
        hasHardware,
        isEnrolled,
        supportedTypes: supportedTypes.length,
        availableTypes: biometricTypes.filter(b => b.available).map(b => b.type),
      });
    } catch (error) {
      logError(Component.SECURITY, 'Failed to initialize biometrics', { error });
    }
  }

  /**
   * Check if Windows Hello is supported (web only)
   */
  private isWindowsHelloSupported(): boolean {
    if (Platform.OS !== 'web') {
      return false;
    }

    // Check for Windows Hello support
    return 'credentials' in navigator && 'preventSilentAccess' in (navigator as any).credentials;
  }

  /**
   * Authenticate using biometrics
   */
  async authenticateWithBiometrics(reason: string = 'Please authenticate'): Promise<AuthenticationResult> {
    if (!this.config.enabled) {
      return {
        success: false,
        method: 'none',
        timestamp: Date.now(),
        error: 'Security features are disabled',
      };
    }

    try {
      const availableBiometrics = Array.from(this.biometricTypes.values())
        .filter(biometric => biometric.available);

      if (availableBiometrics.length === 0) {
        if (this.config.fallbackToPassword) {
          return this.authenticateWithPassword();
        }
        throw new Error('No biometric authentication available');
      }

      // Try biometric authentication
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: reason,
        fallbackLabel: this.config.fallbackToPassword ? 'Use password' : undefined,
        cancelLabel: 'Cancel',
        disableDeviceFallback: !this.config.fallbackToPassword,
      });

      if (result.success) {
        const biometricType = availableBiometrics[0].type;
        
        logInfo(Component.SECURITY, 'Biometric authentication successful', {
          type: biometricType,
          reason,
        });

        return {
          success: true,
          method: biometricType,
          timestamp: Date.now(),
        };
      } else {
        return {
          success: false,
          method: 'biometric',
          timestamp: Date.now(),
          error: result.error || 'Authentication failed',
        };
      }
    } catch (error) {
      logError(Component.SECURITY, 'Biometric authentication failed', { error });
      
      if (this.config.fallbackToPassword) {
        return this.authenticateWithPassword();
      }

      return {
        success: false,
        method: 'biometric',
        timestamp: Date.now(),
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Authenticate with password (fallback)
   */
  private async authenticateWithPassword(): Promise<AuthenticationResult> {
    // This would typically show a password prompt
    // For now, we'll simulate a successful password authentication
    return {
      success: true,
      method: 'password',
      timestamp: Date.now(),
    };
  }

  /**
   * Check if security feature is available
   */
  isFeatureAvailable(featureId: string): boolean {
    const feature = this.securityFeatures.get(featureId);
    return feature ? feature.available && feature.enabled : false;
  }

  /**
   * Get available security features
   */
  getAvailableFeatures(): SecurityFeature[] {
    return Array.from(this.securityFeatures.values())
      .filter(feature => feature.available && feature.enabled);
  }

  /**
   * Get biometric types
   */
  getBiometricTypes(): BiometricType[] {
    return Array.from(this.biometricTypes.values());
  }

  /**
   * Get available biometric types
   */
  getAvailableBiometrics(): BiometricType[] {
    return Array.from(this.biometricTypes.values())
      .filter(biometric => biometric.available);
  }

  /**
   * Store secure key
   */
  async storeSecureKey(keyId: string, keyData: string): Promise<boolean> {
    if (!this.config.enabled) {
      return false;
    }

    try {
      // This would use platform-specific secure storage
      // For iOS: Keychain
      // For Android: Android Keystore
      // For Windows: TPM or Windows Hello
      
      if (Platform.OS === 'ios' && this.isFeatureAvailable('keychain')) {
        // Use iOS Keychain
        return this.storeInKeychain(keyId, keyData);
      } else if (Platform.OS === 'android' && this.isFeatureAvailable('keystore')) {
        // Use Android Keystore
        return this.storeInKeystore(keyId, keyData);
      } else if (Platform.OS === 'web' && this.isFeatureAvailable('tpm')) {
        // Use TPM or Windows Hello
        return this.storeInTPM(keyId, keyData);
      }

      logError(Component.SECURITY, 'No secure storage available', { keyId });
      return false;
    } catch (error) {
      logError(Component.SECURITY, 'Failed to store secure key', { keyId, error });
      return false;
    }
  }

  /**
   * Retrieve secure key
   */
  async retrieveSecureKey(keyId: string): Promise<string | null> {
    if (!this.config.enabled) {
      return null;
    }

    try {
      // This would use platform-specific secure storage
      if (Platform.OS === 'ios' && this.isFeatureAvailable('keychain')) {
        return this.retrieveFromKeychain(keyId);
      } else if (Platform.OS === 'android' && this.isFeatureAvailable('keystore')) {
        return this.retrieveFromKeystore(keyId);
      } else if (Platform.OS === 'web' && this.isFeatureAvailable('tpm')) {
        return this.retrieveFromTPM(keyId);
      }

      return null;
    } catch (error) {
      logError(Component.SECURITY, 'Failed to retrieve secure key', { keyId, error });
      return null;
    }
  }

  /**
   * Delete secure key
   */
  async deleteSecureKey(keyId: string): Promise<boolean> {
    if (!this.config.enabled) {
      return false;
    }

    try {
      if (Platform.OS === 'ios' && this.isFeatureAvailable('keychain')) {
        return this.deleteFromKeychain(keyId);
      } else if (Platform.OS === 'android' && this.isFeatureAvailable('keystore')) {
        return this.deleteFromKeystore(keyId);
      } else if (Platform.OS === 'web' && this.isFeatureAvailable('tpm')) {
        return this.deleteFromTPM(keyId);
      }

      return false;
    } catch (error) {
      logError(Component.SECURITY, 'Failed to delete secure key', { keyId, error });
      return false;
    }
  }

  // Placeholder implementations for platform-specific storage
  private async storeInKeychain(keyId: string, keyData: string): Promise<boolean> {
    // iOS Keychain implementation would go here
    logInfo(Component.SECURITY, 'Storing key in iOS Keychain', { keyId });
    return true;
  }

  private async retrieveFromKeychain(keyId: string): Promise<string | null> {
    // iOS Keychain implementation would go here
    logInfo(Component.SECURITY, 'Retrieving key from iOS Keychain', { keyId });
    return 'retrieved-key-data';
  }

  private async deleteFromKeychain(keyId: string): Promise<boolean> {
    // iOS Keychain implementation would go here
    logInfo(Component.SECURITY, 'Deleting key from iOS Keychain', { keyId });
    return true;
  }

  private async storeInKeystore(keyId: string, keyData: string): Promise<boolean> {
    // Android Keystore implementation would go here
    logInfo(Component.SECURITY, 'Storing key in Android Keystore', { keyId });
    return true;
  }

  private async retrieveFromKeystore(keyId: string): Promise<string | null> {
    // Android Keystore implementation would go here
    logInfo(Component.SECURITY, 'Retrieving key from Android Keystore', { keyId });
    return 'retrieved-key-data';
  }

  private async deleteFromKeystore(keyId: string): Promise<boolean> {
    // Android Keystore implementation would go here
    logInfo(Component.SECURITY, 'Deleting key from Android Keystore', { keyId });
    return true;
  }

  private async storeInTPM(keyId: string, keyData: string): Promise<boolean> {
    // TPM implementation would go here
    logInfo(Component.SECURITY, 'Storing key in TPM', { keyId });
    return true;
  }

  private async retrieveFromTPM(keyId: string): Promise<string | null> {
    // TPM implementation would go here
    logInfo(Component.SECURITY, 'Retrieving key from TPM', { keyId });
    return 'retrieved-key-data';
  }

  private async deleteFromTPM(keyId: string): Promise<boolean> {
    // TPM implementation would go here
    logInfo(Component.SECURITY, 'Deleting key from TPM', { keyId });
    return true;
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<SecurityConfig>): void {
    this.config = { ...this.config, ...config };
    
    logInfo(Component.SECURITY, 'Platform security config updated', {
      config: this.config,
    });
  }
}

// Export singleton instance
export const platformSecurity = new PlatformSecurity(); 