import { z } from 'zod';

export const createAdminSchema = z.object({
  email: z.string().email('Invalid email address').trim().toLowerCase(),
  firstName: z.string().min(1, 'First name is required').trim(),
  lastName: z.string().min(1, 'Last name is required').trim(),
});

export const updateAdminSchema = z.object({
  firstName: z.string().min(1).trim().optional(),
  lastName: z.string().min(1).trim().optional(),
});

export const adminIdParamSchema = z.object({
  id: z.string().uuid('Invalid admin ID'),
});

export type CreateAdminInput = z.infer<typeof createAdminSchema>;
export type UpdateAdminInput = z.infer<typeof updateAdminSchema>;

