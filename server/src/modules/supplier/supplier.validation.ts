import { z } from "zod";
import { SupplierStatus } from "@prisma/client";

export const createSupplierSchema = z.object({
  body: z.object({
    code: z.string().min(1).max(30),
    name: z.string().min(2).max(150),
    contactPerson: z.string().max(150).optional().nullable(),
    phone: z.string().max(20).optional().nullable(),
    email: z.string().email().max(150).optional().nullable().or(z.literal("")),
    address: z.string().optional().nullable(),
    city: z.string().max(100).optional().nullable(),
    taxNumber: z.string().max(50).optional().nullable(),
    notes: z.string().optional().nullable(),
  }),
});

export const updateSupplierSchema = z.object({
  body: z.object({
    code: z.string().min(1).max(30).optional(),
    name: z.string().min(2).max(150).optional(),
    contactPerson: z.string().max(150).optional().nullable(),
    phone: z.string().max(20).optional().nullable(),
    email: z.string().email().max(150).optional().nullable().or(z.literal("")),
    address: z.string().optional().nullable(),
    city: z.string().max(100).optional().nullable(),
    taxNumber: z.string().max(50).optional().nullable(),
    notes: z.string().optional().nullable(),
    status: z.nativeEnum(SupplierStatus).optional(),
  }).refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be provided for update.",
  }),
});
