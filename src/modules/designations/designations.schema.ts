import { z } from 'zod';

export const createDesignationSchema = z.object({
  name: z.string().min(1, 'Designation name is required').max(100).trim(),
  description: z.string().max(255).trim().optional(),
});

export const updateDesignationSchema = z.object({
  name: z.string().min(1).max(100).trim().optional(),
  description: z.string().max(255).trim().optional(),
});

export const designationIdParamSchema = z.object({
  id: z.string().uuid('Invalid designation ID'),
});

export const setDesignationPermissionsSchema = z.object({
  permissionIds: z.array(z.string().uuid()).min(1, 'At least one permission ID is required'),
});

export type CreateDesignationInput = z.infer<typeof createDesignationSchema>;
export type UpdateDesignationInput = z.infer<typeof updateDesignationSchema>;
export type SetDesignationPermissionsInput = z.infer<typeof setDesignationPermissionsSchema>;

