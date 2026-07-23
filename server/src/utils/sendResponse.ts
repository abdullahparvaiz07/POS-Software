import { Response } from "express";

interface SendResponseOptions<T> {
  statusCode: number;
  success: boolean;
  message: string;
  data?: T;
  meta?: Record<string, any>;
}

export function sendResponse<T>(
  res: Response,
  options: SendResponseOptions<T>
) {
  const { statusCode, success, message, data, meta } = options;

  return res.status(statusCode).json({
    success,
    statusCode,
    message,
    meta,
    data,
  });
}
