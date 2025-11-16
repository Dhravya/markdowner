import NodeCache from 'node-cache';

/**
 * MarkdownCache - In-memory caching layer
 * Replaces Cloudflare KV storage from original Markdowner
 * Default TTL: 3600 seconds (1 hour) matching src/index.ts:261
 */
class MarkdownCache {
  private cache: NodeCache;

  constructor() {
    this.cache = new NodeCache({
      stdTTL: 3600, // 1 hour default TTL
      checkperiod: 600, // Check for expired keys every 10 minutes
      useClones: false // Better performance, we don't mutate cached values
    });

    // Log cache stats periodically
    setInterval(() => {
      const stats = this.cache.getStats();
      console.log(`Cache stats - Keys: ${stats.keys}, Hits: ${stats.hits}, Misses: ${stats.misses}`);
    }, 300000); // Every 5 minutes
  }

  /**
   * Get cached markdown by key
   */
  get(key: string): string | undefined {
    return this.cache.get<string>(key);
  }

  /**
   * Store markdown with optional custom TTL
   * @param key - Cache key
   * @param value - Markdown content
   * @param ttl - Optional TTL in seconds (default: 3600)
   */
  put(key: string, value: string, ttl?: number): boolean {
    return this.cache.set(key, value, ttl || 3600);
  }

  /**
   * Delete a cached entry
   */
  delete(key: string): number {
    return this.cache.del(key);
  }

  /**
   * Clear all cached entries
   */
  flush(): void {
    this.cache.flushAll();
    console.log('Cache flushed');
  }

  /**
   * Get cache statistics
   */
  getStats() {
    return this.cache.getStats();
  }
}

// Singleton instance
export const mdCache = new MarkdownCache();
