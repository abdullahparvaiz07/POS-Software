import { ConnectionOptions } from "bullmq";

// Use same Redis connection configuration
export const queueConnectionOptions: ConnectionOptions = {
  host: process.env.REDIS_HOST || "localhost",
  port: Number(process.env.REDIS_PORT) || 6379,
  password: process.env.REDIS_PASSWORD || undefined,
  maxRetriesPerRequest: null,
};

export const defaultJobOptions = {
  attempts: 3,
  backoff: {
    type: "exponential",
    delay: 2000, // 2s, 4s, 8s
  },
  removeOnComplete: {
    age: 24 * 3600, // keep for 24 hours
    count: 1000,
  },
  removeOnFail: {
    age: 7 * 24 * 3600, // keep failed jobs for 7 days
  },
};
