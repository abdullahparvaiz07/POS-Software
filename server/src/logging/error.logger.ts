import { Request, Response, NextFunction } from "express";
import { logger } from "./logger";

export const errorLogger = (err: Error, req: Request, res: Response, next: NextFunction) => {
  logger.error({
    message: err.message,
    stack: err.stack,
    correlationId: req.correlationId,
    method: req.method,
    url: req.url,
    body: req.body, // Be careful not to log sensitive data in production
  });

  // Pass it down to the central error handler
  next(err);
};
