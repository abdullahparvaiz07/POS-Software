import { redis } from "./redis.client";
import { CACHE_KEYS } from "./cache.keys";

export class CacheService {
  /**
   * Set a value in the cache with an optional TTL (in seconds)
   */
  async set(key: string, value: any, ttl?: number): Promise<void> {
    if (redis.status !== "ready") return; // Fail-open if Redis is down
    const stringValue = JSON.stringify(value);
    if (ttl) {
      await redis.set(key, stringValue, "EX", ttl);
    } else {
      await redis.set(key, stringValue);
    }
  }

  /**
   * Get a value from the cache
   */
  async get<T>(key: string): Promise<T | null> {
    if (redis.status !== "ready") return null;
    const value = await redis.get(key);
    if (!value) return null;
    try {
      return JSON.parse(value) as T;
    } catch {
      return value as any;
    }
  }

  /**
   * Delete a specific key
   */
  async del(key: string): Promise<void> {
    if (redis.status !== "ready") return;
    await redis.del(key);
  }

  /**
   * Delete keys matching a pattern (e.g. "menu:*")
   */
  async delByPattern(pattern: string): Promise<void> {
    if (redis.status !== "ready") return;
    const stream = redis.scanStream({ match: pattern, count: 100 });
    const pipeline = redis.pipeline();
    let count = 0;

    return new Promise((resolve, reject) => {
      stream.on("data", (keys: string[]) => {
        if (keys.length) {
          keys.forEach((key) => pipeline.del(key));
          count += keys.length;
        }
      });
      stream.on("end", async () => {
        if (count > 0) {
          await pipeline.exec();
        }
        resolve();
      });
      stream.on("error", reject);
    });
  }

  /**
   * Distributed Lock - Acquire
   * Returns true if lock was acquired, false if it's already locked.
   */
  async acquireLock(key: string, ttlSeconds: number = 30): Promise<boolean> {
    if (redis.status !== "ready") return true; // Fail-open: assume lock acquired if Redis is down
    const lockKey = CACHE_KEYS.lock(key);
    // SET NX returns "OK" if key was set, or null if it already exists
    const result = await redis.set(lockKey, "LOCKED", "EX", ttlSeconds, "NX");
    return result === "OK";
  }

  /**
   * Distributed Lock - Release
   */
  async releaseLock(key: string): Promise<void> {
    if (redis.status !== "ready") return;
    await redis.del(CACHE_KEYS.lock(key));
  }

  /**
   * Blacklist a JWT token (until it naturally expires)
   */
  async blacklistToken(token: string, expiresInSeconds: number): Promise<void> {
    await this.set(CACHE_KEYS.jwtBlacklist(token), "revoked", expiresInSeconds);
  }

  /**
   * Check if a token is blacklisted
   */
  async isTokenBlacklisted(token: string): Promise<boolean> {
    if (redis.status !== "ready") return false; // Fail-open
    const exists = await redis.exists(CACHE_KEYS.jwtBlacklist(token));
    return exists === 1;
  }
}

export const cacheService = new CacheService();
