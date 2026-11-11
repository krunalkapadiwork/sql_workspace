import jwt, { SignOptions } from 'jsonwebtoken';
import { env } from '../../config/env';
import { redis } from '../../config/redis';
import { hashToken, generateRandomToken } from './crypto';
import { AuthenticatedUser } from '../types';
import { UnauthorizedError } from '../errors';

const REFRESH_PREFIX = 'refresh:';
const USER_SESSIONS_PREFIX = 'user_sessions:';
const REFRESH_TTL_SECONDS = env.REFRESH_TTL_DAYS * 24 * 60 * 60;

export const signAccessToken = (user: AuthenticatedUser): string => {
  const options: SignOptions = {
    expiresIn: env.JWT_ACCESS_TTL as unknown as number,
    subject: user.id,
  };

  return jwt.sign(
    {
      role: user.role,
      adminId: user.adminId || null,
      designationId: user.designationId || null,
      mustChangePassword: user.mustChangePassword || false,
    },
    env.JWT_ACCESS_SECRET,
    options,
  );
};

export const verifyAccessToken = (token: string): AuthenticatedUser => {
  try {
    const decoded = jwt.verify(token, env.JWT_ACCESS_SECRET) as jwt.JwtPayload;
    return {
      id: decoded.sub as string,
      email: '', // populated from cache or DB if needed
      role: decoded.role,
      adminId: decoded.adminId,
      designationId: decoded.designationId,
      mustChangePassword: decoded.mustChangePassword,
    };
  } catch (err) {
    if (err instanceof jwt.TokenExpiredError) {
      throw new UnauthorizedError('Access token expired');
    }
    throw new UnauthorizedError('Invalid access token');
  }
};

export interface StoredRefreshTokenData {
  userId: string;
  familyId: string;
}

export const createRefreshToken = async (
  userId: string,
  familyId?: string,
): Promise<{ token: string; familyId: string }> => {
  const rawToken = generateRandomToken(32);
  const tokenHash = hashToken(rawToken);
  const famId = familyId || generateRandomToken(16);

  const data: StoredRefreshTokenData = {
    userId,
    familyId: famId,
  };

  const redisKey = `${REFRESH_PREFIX}${tokenHash}`;
  const userSessionsKey = `${USER_SESSIONS_PREFIX}${userId}`;

  // Store token in Redis
  await redis.set(redisKey, JSON.stringify(data), 'EX', REFRESH_TTL_SECONDS);
  // Add to user sessions set
  await redis.sadd(userSessionsKey, tokenHash);

  return { token: rawToken, familyId: famId };
};

export const rotateRefreshToken = async (
  oldRawToken: string,
): Promise<{ userId: string; newRefreshToken: string }> => {
  const oldHash = hashToken(oldRawToken);
  const oldKey = `${REFRESH_PREFIX}${oldHash}`;

  const stored = await redis.get(oldKey);
  if (!stored) {
    throw new UnauthorizedError('Invalid or expired refresh token');
  }

  const data: StoredRefreshTokenData = JSON.parse(stored);
  const { userId, familyId } = data;

  // Invalidate old token
  await redis.del(oldKey);
  await redis.srem(`${USER_SESSIONS_PREFIX}${userId}`, oldHash);

  // Issue new token in same family
  const { token: newRawToken } = await createRefreshToken(userId, familyId);

  return { userId, newRefreshToken: newRawToken };
};

export const revokeRefreshToken = async (rawToken: string): Promise<void> => {
  const tokenHash = hashToken(rawToken);
  const key = `${REFRESH_PREFIX}${tokenHash}`;
  const stored = await redis.get(key);

  if (stored) {
    const data: StoredRefreshTokenData = JSON.parse(stored);
    await redis.del(key);
    await redis.srem(`${USER_SESSIONS_PREFIX}${data.userId}`, tokenHash);
  }
};

export const revokeAllUserSessions = async (userId: string): Promise<void> => {
  const userSessionsKey = `${USER_SESSIONS_PREFIX}${userId}`;
  const tokenHashes = await redis.smembers(userSessionsKey);

  if (tokenHashes.length > 0) {
    const keysToDelete = tokenHashes.map((h) => `${REFRESH_PREFIX}${h}`);
    await redis.del(...keysToDelete);
    await redis.del(userSessionsKey);
  }

  // Also invalidate cached user status
  await redis.del(`user_status:${userId}`);
};

