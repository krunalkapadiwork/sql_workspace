import bcrypt from 'bcrypt';
import { env } from '../../config/env';
import { sequelize } from '../../config/database';
import { User, Role, Designation, Invitation } from '../../models';
import { hashToken, generateRandomToken } from '../../common/utils/crypto';
import { enqueueEmailJob } from '../../jobs/queues';
import {
  ValidationError,
  NotFoundError,
  ForbiddenError,
  ConflictError,
} from '../../common/errors';
import { AuthenticatedUser } from '../../common/types';
import { AcceptInvitationInput } from './invitations.schema';

export class InvitationService {
  /**
   * Internal helper: Issues an invitation, stores hash in DB, and enqueues invitation email
   */
  public async issueInvitation(
    user: User,
    inviter: AuthenticatedUser,
    roleOrDesignationName: string,
  ): Promise<Invitation> {
    const rawToken = generateRandomToken(32);
    const tokenHash = hashToken(rawToken);

    const ttlHours = env.INVITE_TTL_HOURS;
    const expiresAt = new Date(Date.now() + ttlHours * 60 * 60 * 1000);

    const invitation = await Invitation.create({
      userId: user.id,
      invitedBy: inviter.id,
      tokenHash,
      status: 'PENDING',
      expiresAt,
    });

    const inviteLink = `${env.FRONTEND_URL}/accept-invite?token=${rawToken}`;

    await enqueueEmailJob({
      to: user.email,
      subject: 'You have been invited to SQL Workspace',
      template: 'invitation',
      data: {
        recipientName: `${user.firstName} ${user.lastName}`,
        inviterName: inviter.email,
        roleOrDesignation: roleOrDesignationName,
        inviteLink,
        expiresInHours: ttlHours,
      },
    });

    return invitation;
  }

  /**
   * Verifies an invitation token without accepting it (for frontend landing page)
   */
  public async verifyToken(token: string): Promise<{
    email: string;
    firstName: string;
    lastName: string;
    expiresAt: Date;
  }> {
    const tokenHash = hashToken(token);
    const invitation = await Invitation.findOne({
      where: { tokenHash },
      include: [{ model: User, as: 'user' }],
    });

    if (!invitation || !invitation.user) {
      throw new NotFoundError('Invalid invitation token');
    }

    // Lazy expiration check (BR-34, ARCHITECTURE.md §8)
    if (invitation.status === 'PENDING' && new Date() > invitation.expiresAt) {
      await invitation.update({ status: 'EXPIRED' });
      throw new ValidationError('Invitation link has expired');
    }

    if (invitation.status !== 'PENDING') {
      throw new ValidationError(`Invitation is already ${invitation.status.toLowerCase()}`);
    }

    return {
      email: invitation.user.email,
      firstName: invitation.user.firstName,
      lastName: invitation.user.lastName,
      expiresAt: invitation.expiresAt,
    };
  }

  /**
   * Accepts invitation and sets password
   */
  public async acceptInvitation(input: AcceptInvitationInput): Promise<void> {
    const tokenHash = hashToken(input.token);

    const invitation = await Invitation.findOne({
      where: { tokenHash },
      include: [
        {
          model: User,
          as: 'user',
          include: [{ model: User, as: 'admin', attributes: ['status'] }],
        },
      ],
    });

    if (!invitation || !invitation.user) {
      throw new NotFoundError('Invalid invitation token');
    }

    // Lazy expiry check
    if (invitation.status === 'PENDING' && new Date() > invitation.expiresAt) {
      await invitation.update({ status: 'EXPIRED' });
      throw new ValidationError('Invitation link has expired');
    }

    if (invitation.status !== 'PENDING') {
      throw new ValidationError(`Invitation is already ${invitation.status.toLowerCase()}`);
    }

    // Check workspace status (BR-41)
    if (
      invitation.user.adminId &&
      invitation.user.admin &&
      invitation.user.admin.status !== 'ACTIVE'
    ) {
      throw new ForbiddenError(
        'Workspace is deactivated. You cannot accept this invitation at this time.',
      );
    }

    const saltRounds = env.BCRYPT_ROUNDS;
    const passwordHash = await bcrypt.hash(input.password, saltRounds);

    await sequelize.transaction(async (t) => {
      await invitation.update(
        {
          status: 'ACCEPTED',
          acceptedAt: new Date(),
        },
        { transaction: t },
      );

      await invitation.user!.update(
        {
          passwordHash,
          status: 'ACTIVE',
          mustChangePassword: false,
          passwordChangedAt: new Date(),
        },
        { transaction: t },
      );
    });
  }

  /**
   * Resends an invitation (BR-37, BR-38, D9)
   */
  public async resendInvitation(
    invitationId: string,
    currentUser: AuthenticatedUser,
  ): Promise<void> {
    const invitation = await Invitation.findByPk(invitationId, {
      include: [
        {
          model: User,
          as: 'user',
          include: [
            { model: Role, as: 'role' },
            { model: Designation, as: 'designation' },
          ],
        },
      ],
    });

    if (!invitation || !invitation.user) {
      throw new NotFoundError('Invitation not found');
    }

    // Authorization check (BR-38)
    if (currentUser.role === 'ADMIN') {
      if (invitation.user.adminId !== currentUser.id) {
        throw new NotFoundError('Invitation not found');
      }
    } else if (currentUser.role !== 'SUPER_ADMIN') {
      throw new ForbiddenError('Unauthorized to resend invitations');
    }

    if (invitation.status === 'ACCEPTED') {
      throw new ConflictError('Invitation has already been accepted');
    }

    const rawToken = generateRandomToken(32);
    const tokenHash = hashToken(rawToken);
    const ttlHours = env.INVITE_TTL_HOURS;
    const expiresAt = new Date(Date.now() + ttlHours * 60 * 60 * 1000);

    // Invalidate old invitation and create new one in transaction (BR-37, D9)
    await sequelize.transaction(async (t) => {
      await invitation.update(
        {
          status: 'REVOKED',
          revokedAt: new Date(),
        },
        { transaction: t },
      );

      await Invitation.create(
        {
          userId: invitation.userId,
          invitedBy: currentUser.id,
          tokenHash,
          status: 'PENDING',
          expiresAt,
        },
        { transaction: t },
      );
    });

    const roleOrDesignation =
      invitation.user.designation?.name || invitation.user.role?.name || 'Member';
    const inviteLink = `${env.FRONTEND_URL}/accept-invite?token=${rawToken}`;

    await enqueueEmailJob({
      to: invitation.user.email,
      subject: 'Your new invitation to SQL Workspace',
      template: 'invitation',
      data: {
        recipientName: `${invitation.user.firstName} ${invitation.user.lastName}`,
        inviterName: currentUser.email,
        roleOrDesignation,
        inviteLink,
        expiresInHours: ttlHours,
      },
    });
  }

  /**
   * Revokes a pending invitation (BR-39, D10)
   */
  public async revokeInvitation(
    invitationId: string,
    currentUser: AuthenticatedUser,
  ): Promise<void> {
    const invitation = await Invitation.findByPk(invitationId, {
      include: [{ model: User, as: 'user' }],
    });

    if (!invitation || !invitation.user) {
      throw new NotFoundError('Invitation not found');
    }

    if (currentUser.role === 'ADMIN') {
      if (invitation.user.adminId !== currentUser.id) {
        throw new NotFoundError('Invitation not found');
      }
    } else if (currentUser.role !== 'SUPER_ADMIN') {
      throw new ForbiddenError('Unauthorized to revoke invitations');
    }

    if (invitation.status !== 'PENDING') {
      throw new ValidationError(`Cannot revoke invitation with status '${invitation.status}'`);
    }

    await invitation.update({
      status: 'REVOKED',
      revokedAt: new Date(),
    });
  }

  /**
   * Lists invitations with filtering
   */
  public async listInvitations(
    currentUser: AuthenticatedUser,
    options: { status?: string; page?: number; limit?: number },
  ): Promise<{ rows: Invitation[]; total: number }> {
    const page = Math.max(1, options.page || 1);
    const limit = Math.min(100, Math.max(1, options.limit || 20));
    const offset = (page - 1) * limit;

    const userWhere: Record<string, unknown> = {};
    if (currentUser.role === 'ADMIN') {
      userWhere.adminId = currentUser.id;
    }

    const inviteWhere: Record<string, unknown> = {};
    if (options.status) {
      inviteWhere.status = options.status;
    }

    const { rows, count } = await Invitation.findAndCountAll({
      where: inviteWhere,
      include: [
        {
          model: User,
          as: 'user',
          where: userWhere,
          attributes: ['id', 'email', 'firstName', 'lastName', 'status'],
        },
        {
          model: User,
          as: 'inviter',
          attributes: ['id', 'email', 'firstName', 'lastName'],
        },
      ],
      order: [['createdAt', 'DESC']],
      limit,
      offset,
    });

    return { rows, total: count };
  }
}

export const invitationService = new InvitationService();

