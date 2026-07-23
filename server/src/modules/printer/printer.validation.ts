import { z } from "zod";
import { PrinterType } from "@prisma/client";

export const createPrinterSchema = z.object({
  body: z.object({
    name: z.string().min(1).max(100),
    type: z.nativeEnum(PrinterType),
    ipAddress: z.string().max(50).optional().nullable(),
    port: z.number().int().positive().optional().nullable(),
    isDefault: z.boolean().optional(),
    isActive: z.boolean().optional(),
  }),
});

export const updatePrinterSchema = z.object({
  body: z.object({
    name: z.string().min(1).max(100).optional(),
    type: z.nativeEnum(PrinterType).optional(),
    ipAddress: z.string().max(50).optional().nullable(),
    port: z.number().int().positive().optional().nullable(),
    isDefault: z.boolean().optional(),
    isActive: z.boolean().optional(),
  }).refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be provided for update.",
  }),
});

export const printReceiptSchema = z.object({
  params: z.object({
    orderId: z.string().regex(/^\d+$/).transform(Number),
  }),
});

export const printKitchenTicketSchema = z.object({
  params: z.object({
    orderId: z.string().regex(/^\d+$/).transform(Number),
  }),
});

export const printBarTicketSchema = z.object({
  params: z.object({
    orderId: z.string().regex(/^\d+$/).transform(Number),
  }),
});

export const reprintSchema = z.object({
  params: z.object({
    receiptId: z.string(),
  }),
});
