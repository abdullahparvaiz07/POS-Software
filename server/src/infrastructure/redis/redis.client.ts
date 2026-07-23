import Redis, { RedisOptions } from "ioredis";

class RedisClient {
  private static instance: Redis;

  public static getInstance(): Redis {
    if (!RedisClient.instance) {
      const redisUrl = process.env.REDIS_URL || "redis://127.0.0.1:6379";
      
      const options: RedisOptions = {
        retryStrategy(times) {
          if (times > 3) {
            console.log("[Redis] Redis is offline. Running in fail-open memory mode.");
            return null; // Stop retrying after 3 attempts
          }
          return Math.min(times * 100, 1000);
        },
        maxRetriesPerRequest: 0,
        enableOfflineQueue: false,
        enableReadyCheck: false,
      };

      RedisClient.instance = new Redis(redisUrl, options);

      RedisClient.instance.on("connect", () => {
        console.log("[Redis] Successfully connected to Redis instance");
      });

      RedisClient.instance.on("error", (error) => {
        // Suppress repeated connection error spam when Redis is offline
        if ((error as any).code === "ECONNREFUSED") {
          return;
        }
        console.error("[Redis] Connection error:", error.message);
      });
      
      // Graceful shutdown handling
      process.on("SIGINT", () => {
        RedisClient.instance.quit().catch(() => {}).then(() => {
          console.log("[Redis] Connection closed via app termination");
        });
      });
    }

    return RedisClient.instance;
  }
}

export const redis = RedisClient.getInstance();
