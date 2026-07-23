import { Request, Response, NextFunction } from "express";
import morgan from "morgan";
import { v4 as uuidv4 } from "uuid";
import { logger } from "./logger";

// Extend Express Request interface to hold correlation ID
declare global {
  namespace Express {
    interface Request {
      correlationId: string;
    }
  }
}

// 1. Middleware to inject Correlation ID
export const correlationIdMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const correlationId = (req.headers["x-correlation-id"] as string) || uuidv4();
  req.correlationId = correlationId;
  res.setHeader("X-Correlation-ID", correlationId);
  next();
};

// 2. Morgan stream that redirects logs to Winston
const stream = {
  write: (message: string) => {
    // Morgan outputs end with a newline, we trim it
    logger.info(message.trim());
  },
};

// 3. Setup morgan middleware with a custom format capturing the correlationId
export const requestLogger = morgan(
  (tokens, req: Request, res: Response) => {
    return JSON.stringify({
      method: tokens.method(req, res),
      url: tokens.url(req, res),
      status: Number(tokens.status(req, res)),
      contentLength: tokens.res(req, res, "content-length"),
      responseTime: Number(tokens["response-time"](req, res)),
      correlationId: req.correlationId,
      ip: req.ip,
      userAgent: tokens["user-agent"](req, res),
    });
  },
  { stream }
);
