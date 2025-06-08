/**
 * Cache Service for StoryMap API
 * 
 * This service provides caching capabilities to improve performance
 * when dealing with large datasets from the StoryMap API.
 */

import Redis from 'ioredis';
import NodeCache from 'node-cache';

// Cache TTL values (in seconds)
const DEFAULT_CACHE_TTL = 3600; // 1 hour
const ARTICLE_CACHE_TTL = 7200; // 2 hours
const ENTITY_CACHE_TTL = 14400; // 4 hours

/**
 * Cache Strategy Interface
 */
export interface CacheStrategy {
  get(key: string): Promise<any>;
  set(key: string, value: any, ttl?: number): Promise<void>;
  del(key: string): Promise<void>;
  flush(): Promise<void>;
}

/**
 * Redis Cache Strategy
 */
class RedisCacheStrategy implements CacheStrategy {
  private client: Redis;
  
  constructor() {
    const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
    this.client = new Redis(redisUrl);
    
    this.client.on('error', (err) => {
      console.error('Redis connection error:', err);
    });
    
    this.client.on('connect', () => {
      console.log('Connected to Redis cache server');
    });
  }
  
  async get(key: string): Promise<any> {
    const data = await this.client.get(key);
    if (data) {
      try {
        return JSON.parse(data);
      } catch (err) {
        return data;
      }
    }
    return null;
  }
  
  async set(key: string, value: any, ttl?: number): Promise<void> {
    const serializedValue = typeof value === 'string' ? value : JSON.stringify(value);
    if (ttl) {
      await this.client.setex(key, ttl, serializedValue);
    } else {
      await this.client.set(key, serializedValue);
    }
  }
  
  async del(key: string): Promise<void> {
    await this.client.del(key);
  }
  
  async flush(): Promise<void> {
    await this.client.flushdb();
  }
}

/**
 * In-Memory Cache Strategy
 */
class MemoryCacheStrategy implements CacheStrategy {
  private cache: NodeCache;
  
  constructor() {
    this.cache = new NodeCache({
      stdTTL: DEFAULT_CACHE_TTL,
      checkperiod: 600 // 10 minutes
    });
  }
  
  async get(key: string): Promise<any> {
    return this.cache.get(key);
  }
  
  async set(key: string, value: any, ttl?: number): Promise<void> {
    this.cache.set(key, value, ttl || DEFAULT_CACHE_TTL);
  }
  
  async del(key: string): Promise<void> {
    this.cache.del(key);
  }
  
  async flush(): Promise<void> {
    this.cache.flushAll();
  }
}

/**
 * Cache Service
 */
export class CacheService {
  private strategy: CacheStrategy;
  private enabled: boolean;
  
  constructor() {
    this.enabled = process.env.CACHE_ENABLED === 'true';
    
    // Select cache strategy based on environment
    if (process.env.REDIS_URL && this.enabled) {
      this.strategy = new RedisCacheStrategy();
    } else if (this.enabled) {
      this.strategy = new MemoryCacheStrategy();
    } else {
      // No-op cache when disabled
      this.strategy = new MemoryCacheStrategy();
    }
  }
  
  /**
   * Generate cache key
   */
  generateKey(prefix: string, params: Record<string, any> = {}): string {
    const sortedParams = Object.keys(params)
      .sort()
      .reduce((obj: Record<string, any>, key) => {
        obj[key] = params[key];
        return obj;
      }, {});
    
    return `${prefix}:${JSON.stringify(sortedParams)}`;
  }
  
  /**
   * Get cached data
   */
  async get(key: string): Promise<any> {
    if (!this.enabled) return null;
    return this.strategy.get(key);
  }
  
  /**
   * Cache data
   */
  async set(key: string, value: any, ttl?: number): Promise<void> {
    if (!this.enabled) return;
    await this.strategy.set(key, value, ttl);
  }
  
  /**
   * Delete cached data
   */
  async del(key: string): Promise<void> {
    if (!this.enabled) return;
    await this.strategy.del(key);
  }
  
  /**
   * Flush all cached data
   */
  async flush(): Promise<void> {
    if (!this.enabled) return;
    await this.strategy.flush();
  }
  
  /**
   * Wrap API call with caching
   */
  async wrap<T>(
    cacheKey: string, 
    apiFn: () => Promise<T>, 
    ttl: number = DEFAULT_CACHE_TTL
  ): Promise<T & { _cachedResult?: boolean }> {
    if (!this.enabled) {
      const result = await apiFn();
      return { ...result as any, _cachedResult: false };
    }
    
    const cachedData = await this.get(cacheKey);
    if (cachedData) {
      // Mark this as a cached result
      return { ...cachedData, _cachedResult: true };
    }
    
    const freshData = await apiFn();
    await this.set(cacheKey, freshData, ttl);
    return { ...freshData as any, _cachedResult: false };
  }
}

// Export singleton instance
export const cacheService = new CacheService(); 