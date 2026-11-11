import { z } from 'zod';

export const createUserSchema = z.object({
  email: z.string().email('Invalid email address').trim().toLowerCase(),
  firstName: z.string().min(1, 'First name is required').trim(),
  lastName: z.string().min(1, 'Last name is required').trim(),
  designationId: z.string().uuid('Valid designationId is required'),
});

export const updateUserSchema = z.object({
  firstName: z.string().min(1).trim().optional(),
  lastName: z.string().min(1).trim().optional(),
  designationId: z.string().uuid().optional(),
});

export const userIdParamSchema = z.object({
  id: z.string().uuid('Invalid user ID'),
});

export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;

