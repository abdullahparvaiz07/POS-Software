import { z } from "zod";
import { UnitType } from "@prisma/client";

export const createUnitSchema = z.object({
  body: z.object({
    name: z.string().min(2).max(50),
    shortName: z.string().min(1).max(20),
    unitType: z.nativeEnum(UnitType),
    isBaseUnit: z.boolean().optional(),
    conversionFactor: z.number().positive().optional(),
    displayOrder: z.number().min(0).optional(),
    isActive: z.boolean().optional(),
  }),
});

export const updateUnitSchema = z.object({
  body: z.object({
    name: z.string().min(2).max(50).optional(),
    shortName: z.string().min(1).max(20).optional(),
    unitType: z.nativeEnum(UnitType).optional(),
    isBaseUnit: z.boolean().optional(),
    conversionFactor: z.number().positive().optional(),
    displayOrder: z.number().min(0).optional(),
    isActive: z.boolean().optional(),
  }).refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be provided for update.",
  }),
});
