import bcrypt from 'bcrypt';
import { env } from '../../config/env';
import { redis } from '../../config/redis';
import { User, Role } from '../../models';
import {
  UnauthorizedError,
  ForbiddenError,
  TooManyRequestsError,
  ValidationError,
  NotFoundError,
} from '../../common/errors';
import {
  signAccessToken,
  createRefreshToken,
  rotateRefreshToken,
  revokeRefreshToken,
  revokeAllUserSessions,
} from '../../common/utils/tokens';
import { hashToken, generateRandomToken } from '../../common/utils/crypto';
import { enqueueEmailJob } from '../../jobs/queues';
import {
  LoginInput,
  ChangePasswordInput,
  ForgotPasswordInput,
  ResetPasswordInput,
} from './auth.schema';

const LOCKOUT_THRESHOLD = 5;
const LOCKOUT_TTL_SECONDS = 15 * 60; // 15 minutes (BR-45, D19)
const RESET_TOKEN_TTL_SECONDS = env.RESET_TTL_MINUTES * 60; // 60 minutes (BR-48)

export class AuthService {
  public async login(input: LoginInput): Promise<{
    accessToken: string;
    refreshToken: string;
    user: {
      id: string;
      email: string;
      firstName: string;
      lastName: string;
      role: string;
      mustChangePassword: boolean;
    };
  }> {
    const lockKey = `login_fail:${input.email}`;
    const failedAttempts = parseInt((await redis.get(lockKey)) || '0', 10);

    if (failedAttempts >= LOCKOUT_THRESHOLD) {
      throw new TooManyRequestsError(
        'Account locked due to consecutive failed login attempts. Please try again in 15 minutes.',
      );
    }

    const user = await User.findOne({
      where: { email: input.email },
      include: [
        { model: Role, as: 'role' },
        { model: User, as: 'admin', attributes: ['status'] },
      ],
    });

    if (!user || !user.passwordHash) {
      await this.recordFailedLogin(lockKey);
      throw new UnauthorizedError('Invalid email or password');
    }

    const passwordMatch = await bcrypt.compare(input.password, user.passwordHash);
    if (!passwordMatch) {
      await this.recordFailedLogin(lockKey);
      throw new UnauthorizedError('Invalid email or password');
    }

    // Reset failed counter on successful password verification
    await redis.del(lockKey);

    // Account status check (BR-43)
    if (user.status !== 'ACTIVE') {
      throw new UnauthorizedError('Account is not active');
    }

    // Admin workspace status check (BR-9, BR-43)
    if (user.adminId && user.admin && user.admin.status !== 'ACTIVE') {
      throw new ForbiddenError('Workspace is deactivated');
    }

    const authUser = {
      id: user.id,
      email: user.email,
      role: user.role!.name,
      adminId: user.adminId,
      designationId: user.designationId,
      mustChangePassword: user.mustChangePassword,
    };

    const accessToken = signAccessToken(authUser);
    const { token: refreshToken } = await createRefreshToken(user.id);

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role!.name,
        mustChangePassword: user.mustChangePassword,
      },
    };
  }

  public async refresh(oldRefreshToken: string): Promise<{
    accessToken: string;
    newRefreshToken: string;
  }> {
    const { userId, newRefreshToken } = await rotateRefreshToken(oldRefreshToken);

    const user = await User.findByPk(userId, {
      include: [
        { model: Role, as: 'role' },
        { model: User, as: 'admin', attributes: ['status'] },
      ],
    });

    if (!user || user.status !== 'ACTIVE') {
      throw new UnauthorizedError('Account is no longer active');
    }

    if (user.adminId && user.admin && user.admin.status !== 'ACTIVE') {
      throw new ForbiddenError('Workspace is deactivated');
    }

    const accessToken = signAccessToken({
      id: user.id,
      email: user.email,
      role: user.role!.name,
      adminId: user.adminId,
      designationId: user.designationId,
      mustChangePassword: user.mustChangePassword,
    });

    return { accessToken, newRefreshToken };
  }

  public async logout(refreshToken?: string): Promise<void> {
    if (refreshToken) {
      await revokeRefreshToken(refreshToken);
    }
  }

  public async getProfile(userId: string): Promise<User> {
    const user = await User.findByPk(userId, {
      attributes: { exclude: ['passwordHash'] },
      include: [
        { model: Role, as: 'role', attributes: ['id', 'name'] },
        { model: User, as: 'admin', attributes: ['id', 'firstName', 'lastName', 'email'] },
      ],
    });

    if (!user) {
      throw new NotFoundError('User not found');
    }

    return user;
  }

  public async changePassword(userId: string, input: ChangePasswordInput): Promise<void> {
    const user = await User.findByPk(userId);
    if (!user || !user.passwordHash) {
      throw new NotFoundError('User not found');
    }

    const isMatch = await bcrypt.compare(input.currentPassword, user.passwordHash);
    if (!isMatch) {
      throw new ValidationError('Current password is incorrect');
    }

    const saltRounds = env.BCRYPT_ROUNDS;
    const newHash = await bcrypt.hash(input.newPassword, saltRounds);

    await user.update({
      passwordHash: newHash,
      mustChangePassword: false,
      passwordChangedAt: new Date(),
    });

    // Invalidate other active sessions (BR-49)
    await revokeAllUserSessions(user.id);
  }

  public async forgotPassword(input: ForgotPasswordInput): Promise<void> {
    const user = await User.findOne({
      where: { email: input.email, status: 'ACTIVE' },
    });

    if (!user) {
      // Neutral response: Do not leak whether the email exists (BR-45, BR-48)
      return;
    }

    const rawToken = generateRandomToken(32);
    const tokenHash = hashToken(rawToken);

    // Store in Redis (pwreset:{hash} -> userId) with 1h TTL (BR-48)
    await redis.set(`pwreset:${tokenHash}`, user.id, 'EX', RESET_TOKEN_TTL_SECONDS);

    const resetLink = `${env.FRONTEND_URL}/reset-password?token=${rawToken}`;

    await enqueueEmailJob({
      to: user.email,
      subject: 'Password Reset Request',
      template: 'password-reset',
      data: {
        recipientName: `${user.firstName} ${user.lastName}`,
        resetLink,
        expiresInMinutes: env.RESET_TTL_MINUTES,
      },
    });
  }

  public async resetPassword(input: ResetPasswordInput): Promise<void> {
    const tokenHash = hashToken(input.token);
    const redisKey = `pwreset:${tokenHash}`;

    const userId = await redis.get(redisKey);
    if (!userId) {
      throw new ValidationError('Invalid or expired password reset token');
    }

    // Invalidate reset token immediately (single use, BR-48)
    await redis.del(redisKey);

    const user = await User.findByPk(userId);
    if (!user) {
      throw new NotFoundError('User not found');
    }

    const saltRounds = env.BCRYPT_ROUNDS;
    const newHash = await bcrypt.hash(input.newPassword, saltRounds);

    await user.update({
      passwordHash: newHash,
      mustChangePassword: false,
      passwordChangedAt: new Date(),
    });

    // Revoke all existing sessions for this user (BR-49)
    await revokeAllUserSessions(user.id);
  }

  private async recordFailedLogin(key: string): Promise<void> {
    const current = await redis.incr(key);
    if (current === 1) {
      await redis.expire(key, LOCKOUT_TTL_SECONDS);
    }
  }
}

export const authService = new AuthService();

