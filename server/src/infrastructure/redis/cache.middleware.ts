import { Request, Response, NextFunction } from "express";
import { cacheService } from "./cache.service";

/**
 * Cache Middleware
 * Intercepts the response to cache it, and returns cached data if available.
 * ONLY caches GET requests.
 * 
 * @param keyPrefix Optional prefix to override standard route-based key
 * @param ttl Time to live in seconds
 */
export const cacheMiddleware = (ttl: number, keyPrefix?: string) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    // Only cache GET requests
    if (req.method !== "GET") {
      return next();
    }

    const key = keyPrefix ? `${keyPrefix}:${req.originalUrl}` : `cache:${req.originalUrl}`;

    try {
      const cachedData = await cacheService.get(key);
      if (cachedData) {
        // Return cached response
        console.log(`[Cache] HIT: ${key}`);
        return res.json(cachedData);
      }

      console.log(`[Cache] MISS: ${key}`);

      // Hook into res.json to capture the response body
      const originalJson = res.json.bind(res);
      res.json = (body: any) => {
        // We only cache successful responses
        if (res.statusCode >= 200 && res.statusCode < 300) {
          cacheService.set(key, body, ttl).catch(err => {
            console.error(`[Cache] Failed to set cache for ${key}:`, err);
          });
        }
        return originalJson(body);
      };

      next();
    } catch (error) {
      console.error("[Cache] Middleware error:", error);
      // Fallback to normal execution if Redis fails
      next();
    }
  };
};
