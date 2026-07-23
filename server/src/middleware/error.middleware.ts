import { Request, Response, NextFunction } from "express";
import { AppError } from "../errors/AppError";

export function errorHandler(
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
): any {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      success: false,
      statusCode: err.statusCode,
      message: err.message,
      errors: [],
    });
  }

  if (err.code === "P2002") {
    const field = err.meta?.target ? ` on field(s): ${err.meta.target}` : "";
    return res.status(400).json({
      success: false,
      statusCode: 400,
      message: `A record with this value already exists${field}.`,
      errors: [],
    });
  }

  console.error("GLOBAL ERROR HANDLER CAUGHT:", err?.stack || err);

  return res.status(500).json({
    success: false,
    statusCode: 500,
    message: "Internal Server Error",
    errors: [],
  });
}