import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../utils/tokens';
import { UnauthorizedError, ForbiddenError } from '../errors';
import { redis } from '../../config/redis';
import { User, Role } from '../../models';

const STATUS_CACHE_TTL = 60; // 60 seconds (D18, ARCHITECTURE.md §5.1)

interface CachedStatus {
  id: string;
  email: string;
  role: 'SUPER_ADMIN' | 'ADMIN' | 'USER';
  adminId: string | null;
  designationId: string | null;
  status: string;
  adminStatus: string | null;
  mustChangePassword: boolean;
}

export const authenticate = async (
  req: Request,
  _res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedError('Authentication token missing');
    }

    const token = authHeader.substring(7).trim();
    const payload = verifyAccessToken(token);

    const cacheKey = `user_status:${payload.id}`;
    const cached = await redis.get(cacheKey);

    let userContext: CachedStatus;

    if (cached) {
      userContext = JSON.parse(cached);
    } else {
      const user = await User.findByPk(payload.id, {
        include: [
          { model: Role, as: 'role', attributes: ['name'] },
          { model: User, as: 'admin', attributes: ['status'] },
        ],
      });

      if (!user) {
        throw new UnauthorizedError('User account not found');
      }

      userContext = {
        id: user.id,
        email: user.email,
        role: user.role!.name,
        adminId: user.adminId,
        designationId: user.designationId,
        status: user.status,
        adminStatus: user.admin ? user.admin.status : null,
        mustChangePassword: user.mustChangePassword,
      };

      await redis.set(cacheKey, JSON.stringify(userContext), 'EX', STATUS_CACHE_TTL);
    }

    // 1. Account must be ACTIVE (BR-43)
    if (userContext.status !== 'ACTIVE') {
      throw new UnauthorizedError('Account is not active');
    }

    // 2. If user belongs to an Admin workspace, Admin must also be ACTIVE (BR-9, BR-43, D13)
    if (userContext.adminId && userContext.adminStatus && userContext.adminStatus !== 'ACTIVE') {
      throw new ForbiddenError('Workspace is deactivated');
    }

    req.user = {
      id: userContext.id,
      email: userContext.email,
      role: userContext.role,
      adminId: userContext.adminId,
      designationId: userContext.designationId,
      mustChangePassword: userContext.mustChangePassword,
    };

    next();
  } catch (err) {
    next(err);
  }
};

