import winston from "winston";
import DailyRotateFile from "winston-daily-rotate-file";

const { combine, timestamp, json, printf, errors } = winston.format;

// Custom format for local console output
const consoleFormat = printf(({ level, message, timestamp, stack, correlationId }) => {
  const cid = correlationId ? `[${correlationId}] ` : "";
  return `${timestamp} ${level.toUpperCase()}: ${cid}${stack || message}`;
});

export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || "info",
  format: combine(
    errors({ stack: true }), // capture stack traces
    timestamp(),
    json()
  ),
  transports: [
    // Console transport
    new winston.transports.Console({
      format: combine(
        timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
        consoleFormat
      ),
    }),
    
    // Daily Rotate File for standard logs
    new DailyRotateFile({
      filename: "logs/application-%DATE%.log",
      datePattern: "YYYY-MM-DD",
      zippedArchive: true,
      maxSize: "20m",
      maxFiles: "30d",
      level: "info",
    }),

    // Daily Rotate File for errors
    new DailyRotateFile({
      filename: "logs/error-%DATE%.log",
      datePattern: "YYYY-MM-DD",
      zippedArchive: true,
      maxSize: "20m",
      maxFiles: "30d",
      level: "error",
    }),
  ],
});
