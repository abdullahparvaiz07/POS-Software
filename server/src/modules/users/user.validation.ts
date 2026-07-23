import { z } from "zod";

export const createUserSchema = z.object({
  fullName: z.string().trim().min(1, "Name is required").max(150, "Name is too long"),
  phone: z.string().trim().min(5, "Phone is required").max(20),
  email: z.string().email("Invalid email format").max(255).optional().nullable(),
  password: z.string().min(6, "Password must be at least 6 characters").max(255).optional().nullable(),
  address: z.string().max(1000).optional().nullable(),
  salary: z.number().min(0).optional().nullable(),
  joiningDate: z.string().datetime().or(z.string()).optional().nullable(), // Simplified date validation
  status: z.enum(['ACTIVE', 'INACTIVE']).optional(),
  profilePhoto: z.string().max(255).optional().nullable(),
  roles: z.array(z.number().int().positive()).optional(),
});

export const updateUserSchema = createUserSchema.partial();
