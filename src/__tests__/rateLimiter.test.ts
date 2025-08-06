/**
 * Rate Limiter Tests
 * Tests for rate limiting functionality
 */

import RateLimiter, { RateLimitConfig } from '@/core/rateLimiter';

describe('RateLimiter', () => {
  let rateLimiter: RateLimiter;
  const testConfig: RateLimitConfig = {
    maxOperations: 5,
    timeWindowMs: 1000, // 1 second
    burstLimit: 2,
    cooldownMs: 500, // 0.5 seconds
  };

  beforeEach(() => {
    rateLimiter = new RateLimiter(testConfig);
  });

  describe('checkLimit', () => {
    it('should allow operations within limits', () => {
      const identifier = 'test-user';
      
      // First 5 operations should be allowed
      for (let i = 0; i < 5; i++) {
        const result = rateLimiter.checkLimit(identifier);
        expect(result.allowed).toBe(true);
        expect(result.remaining).toBe(4 - i);
      }
    });

    it('should block operations when limit exceeded', () => {
      const identifier = 'test-user';
      
      // Exceed the limit
      for (let i = 0; i < 6; i++) {
        const result = rateLimiter.checkLimit(identifier);
        if (i < 5) {
          expect(result.allowed).toBe(true);
        } else {
          expect(result.allowed).toBe(false);
          expect(result.retryAfter).toBeDefined();
        }
      }
    });

    it('should handle burst limits', () => {
      const identifier = 'test-user';
      
      // First 2 operations should be allowed (burst limit)
      for (let i = 0; i < 2; i++) {
        const result = rateLimiter.checkLimit(identifier);
        expect(result.allowed).toBe(true);
      }
      
      // Third operation should be blocked due to burst limit
      const result = rateLimiter.checkLimit(identifier);
      expect(result.allowed).toBe(false);
      expect(result.retryAfter).toBeDefined();
    });

    it('should reset after time window', async () => {
      const identifier = 'test-user';
      
      // Use up all operations
      for (let i = 0; i < 5; i++) {
        rateLimiter.checkLimit(identifier);
      }
      
      // Wait for time window to expire
      await new Promise(resolve => setTimeout(resolve, 1100));
      
      // Should be allowed again
      const result = rateLimiter.checkLimit(identifier);
      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(4);
    });

    it('should handle multiple identifiers independently', () => {
      const user1 = 'user-1';
      const user2 = 'user-2';
      
      // User 1 uses 3 operations
      for (let i = 0; i < 3; i++) {
        const result = rateLimiter.checkLimit(user1);
        expect(result.allowed).toBe(true);
      }
      
      // User 2 should still have full limit
      const result = rateLimiter.checkLimit(user2);
      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(4);
    });
  });

  describe('reset', () => {
    it('should reset limits for specific identifier', () => {
      const identifier = 'test-user';
      
      // Use some operations
      rateLimiter.checkLimit(identifier);
      rateLimiter.checkLimit(identifier);
      
      // Reset
      rateLimiter.reset(identifier);
      
      // Should have full limit again
      const result = rateLimiter.checkLimit(identifier);
      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(4);
    });
  });

  describe('getUsage', () => {
    it('should return current usage', () => {
      const identifier = 'test-user';
      
      // No usage initially
      let usage = rateLimiter.getUsage(identifier);
      expect(usage?.allowed).toBe(true);
      expect(usage?.remaining).toBe(5);
      
      // Use some operations
      rateLimiter.checkLimit(identifier);
      rateLimiter.checkLimit(identifier);
      
      // Check usage
      usage = rateLimiter.getUsage(identifier);
      expect(usage?.allowed).toBe(true);
      expect(usage?.remaining).toBe(3);
    });

    it('should return null for non-existent identifier', () => {
      const usage = rateLimiter.getUsage('non-existent');
      expect(usage?.allowed).toBe(true);
      expect(usage?.remaining).toBe(5);
    });
  });

  describe('cleanup', () => {
    it('should clean up expired entries', async () => {
      const identifier = 'test-user';
      
      // Use some operations
      rateLimiter.checkLimit(identifier);
      
      // Wait for time window to expire
      await new Promise(resolve => setTimeout(resolve, 1100));
      
      // Cleanup
      rateLimiter.cleanup();
      
      // Should be reset
      const usage = rateLimiter.getUsage(identifier);
      expect(usage?.allowed).toBe(true);
      expect(usage?.remaining).toBe(5);
    });
  });
}); 