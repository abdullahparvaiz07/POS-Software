import rateLimit from "express-rate-limit";
import RedisStore from "rate-limit-redis";
import { redis } from "./redis.client";

/**
 * Creates a rate limiter backed by Redis.
 * Useful for distributed setups.
 * 
 * @param windowMs Timeframe for which requests are checked/remembered
 * @param max Max number of connections during windowMs milliseconds before sending a 429 response
 * @param prefix Redis key prefix
 */
export const createRateLimiter = (windowMs: number, max: number, prefix: string = "rate-limit") => {
  return rateLimit({
    windowMs,
    max,
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
    message: {
      success: false,
      message: "Too many requests, please try again later.",
    },
    passOnStoreError: true, // If Redis is down, allow the request instead of throwing 500
  });
};

// Common limiters
export const authRateLimiter = createRateLimiter(
  15 * 60 * 1000, // 15 minutes
  10, // Limit each IP to 10 login requests per windowMs
  "auth"
);

export const globalRateLimiter = createRateLimiter(
  60 * 1000, // 1 minute
  100, // Limit each IP to 100 requests per windowMs
  "global"
);
