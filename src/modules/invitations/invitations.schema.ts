import { z } from 'zod';
import { passwordSchema } from '../auth/auth.schema';

export const acceptInvitationSchema = z.object({
  token: z.string().min(1, 'Invitation token is required'),
  password: passwordSchema,
});

export const resendInvitationSchema = z.object({
  id: z.string().uuid('Invalid invitation ID'),
});

export const revokeInvitationSchema = z.object({
  id: z.string().uuid('Invalid invitation ID'),
});

export type AcceptInvitationInput = z.infer<typeof acceptInvitationSchema>;

