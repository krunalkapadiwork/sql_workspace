import { z } from 'zod';

export const addProjectMemberSchema = z.object({
  userId: z.string().uuid('Invalid user ID'),
  permissionIds: z.array(z.string().uuid()).optional(),
});

export const updateMemberPermissionsSchema = z.object({
  permissionIds: z.array(z.string().uuid()).min(1, 'At least one permission ID is required'),
});

export const projectMemberParamsSchema = z.object({
  projectId: z.string().uuid('Invalid project ID'),
  memberId: z.string().uuid('Invalid member ID').optional(),
});

export type AddProjectMemberInput = z.infer<typeof addProjectMemberSchema>;
export type UpdateMemberPermissionsInput = z.infer<typeof updateMemberPermissionsSchema>;

