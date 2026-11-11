import { z } from 'zod';

export const createProjectSchema = z
  .object({
    name: z.string().min(1, 'Project name is required').max(100).trim(),
    description: z.string().max(1000).trim().optional(),
    status: z.enum(['ACTIVE', 'ARCHIVED']).default('ACTIVE'),
    startDate: z.string().date().optional().nullable(),
    endDate: z.string().date().optional().nullable(),
  })
  .refine(
    (data) => {
      if (data.startDate && data.endDate) {
        return new Date(data.endDate) >= new Date(data.startDate);
      }
      return true;
    },
    {
      message: 'End date must be greater than or equal to start date',
      path: ['endDate'],
    },
  );

export const updateProjectSchema = z
  .object({
    name: z.string().min(1).max(100).trim().optional(),
    description: z.string().max(1000).trim().optional().nullable(),
    status: z.enum(['ACTIVE', 'ARCHIVED']).optional(),
    startDate: z.string().date().optional().nullable(),
    endDate: z.string().date().optional().nullable(),
  })
  .refine(
    (data) => {
      if (data.startDate && data.endDate) {
        return new Date(data.endDate) >= new Date(data.startDate);
      }
      return true;
    },
    {
      message: 'End date must be greater than or equal to start date',
      path: ['endDate'],
    },
  );

export const projectIdParamSchema = z.object({
  id: z.string().uuid('Invalid project ID'),
});

export type CreateProjectInput = z.infer<typeof createProjectSchema>;
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>;

