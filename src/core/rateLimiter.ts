/**
 * Rate Limiter for Cryptographic Operations
 * Prevents abuse and ensures fair usage of system resources
 */

import { Platform } from 'react-native';

export interface RateLimitConfig {
  maxOperations: number;
  timeWindowMs: number;
  burstLimit: number;
  cooldownMs: number;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetTime: number;
  retryAfter?: number;
}

export interface RateLimitEntry {
  count: number;
  firstRequest: number;
  lastRequest: number;
  burstCount: number;
  lastBurstReset: number;
}

class RateLimiter {
  private limits: Map<string, RateLimitEntry> = new Map();
  private config: RateLimitConfig;

  constructor(config: RateLimitConfig) {
    this.config = config;
  }

  /**
   * Check if an operation is allowed for a given identifier
   */
  checkLimit(identifier: string): RateLimitResult {
    const now = Date.now();
    const entry = this.limits.get(identifier) || this.createNewEntry(now);
    
    // Clean up old entries
    if (now - entry.lastRequest > this.config.timeWindowMs) {
      this.limits.delete(identifier);
      return this.checkLimit(identifier);
    }

    // Check burst limit
    if (now - entry.lastBurstReset > this.config.cooldownMs) {
      entry.burstCount = 0;
      entry.lastBurstReset = now;
    }

    if (entry.burstCount >= this.config.burstLimit) {
      const retryAfter = this.config.cooldownMs - (now - entry.lastBurstReset);
      return {
        allowed: false,
        remaining: 0,
        resetTime: entry.lastBurstReset + this.config.cooldownMs,
        retryAfter: Math.max(0, retryAfter),
      };
    }

    // Check overall limit
    if (entry.count >= this.config.maxOperations) {
      const resetTime = entry.firstRequest + this.config.timeWindowMs;
      const retryAfter = resetTime - now;
      return {
        allowed: false,
        remaining: 0,
        resetTime,
        retryAfter: Math.max(0, retryAfter),
      };
    }

    // Update entry
    entry.count++;
    entry.lastRequest = now;
    entry.burstCount++;
    this.limits.set(identifier, entry);

    return {
      allowed: true,
      remaining: this.config.maxOperations - entry.count,
      resetTime: entry.firstRequest + this.config.timeWindowMs,
    };
  }

  /**
   * Reset limits for a specific identifier
   */
  reset(identifier: string): void {
    this.limits.delete(identifier);
  }

  /**
   * Get current usage for an identifier
   */
  getUsage(identifier: string): RateLimitResult | null {
    const entry = this.limits.get(identifier);
    if (!entry) {
      return {
        allowed: true,
        remaining: this.config.maxOperations,
        resetTime: Date.now() + this.config.timeWindowMs,
      };
    }

    const now = Date.now();
    const resetTime = entry.firstRequest + this.config.timeWindowMs;
    
    if (now > resetTime) {
      this.limits.delete(identifier);
      return {
        allowed: true,
        remaining: this.config.maxOperations,
        resetTime: now + this.config.timeWindowMs,
      };
    }

    return {
      allowed: entry.count < this.config.maxOperations,
      remaining: Math.max(0, this.config.maxOperations - entry.count),
      resetTime,
    };
  }

  /**
   * Clean up expired entries
   */
  cleanup(): void {
    const now = Date.now();
    for (const [identifier, entry] of this.limits.entries()) {
      if (now - entry.lastRequest > this.config.timeWindowMs) {
        this.limits.delete(identifier);
      }
    }
  }

  private createNewEntry(timestamp: number): RateLimitEntry {
    return {
      count: 0,
      firstRequest: timestamp,
      lastRequest: timestamp,
      burstCount: 0,
      lastBurstReset: timestamp,
    };
  }
}

// Platform-specific rate limit configurations
const getPlatformConfig = (): RateLimitConfig => {
  switch (Platform.OS) {
    case 'web':
      return {
        maxOperations: 100, // Higher limit for web
        timeWindowMs: 60 * 1000, // 1 minute
        burstLimit: 20, // Allow bursts on web
        cooldownMs: 5000, // 5 second cooldown
      };
    case 'ios':
    case 'android':
      return {
        maxOperations: 50, // Lower limit for mobile
        timeWindowMs: 60 * 1000, // 1 minute
        burstLimit: 10, // Smaller bursts on mobile
        cooldownMs: 10000, // 10 second cooldown
      };
    default:
      return {
        maxOperations: 75,
        timeWindowMs: 60 * 1000,
        burstLimit: 15,
        cooldownMs: 7500,
      };
  }
};

// Global rate limiter instance
export const cryptoRateLimiter = new RateLimiter(getPlatformConfig());

// Cleanup expired entries every 5 minutes
setInterval(() => {
  cryptoRateLimiter.cleanup();
}, 5 * 60 * 1000);

export default RateLimiter; 