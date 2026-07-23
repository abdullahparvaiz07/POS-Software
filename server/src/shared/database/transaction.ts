import { Prisma } from "@prisma/client";
import prisma from "../../config/prisma";

/**
 * Standardized database transaction wrapper.
 * Enables centralized logging, retries, and domain event triggering across all modules.
 */
export async function executeTransaction<T>(
  action: (tx: Prisma.TransactionClient) => Promise<T>,
  options?: {
    maxWait?: number;
    timeout?: number;
    isolationLevel?: Prisma.TransactionIsolationLevel;
  }
): Promise<T> {
  try {
    return await prisma.$transaction(action, {
      maxWait: options?.maxWait ?? 5000, 
      timeout: options?.timeout ?? 10000, 
      isolationLevel: options?.isolationLevel,
    });
  } catch (error) {
    console.error("[Transaction Failed]:", error);
    throw error;
  }
}
