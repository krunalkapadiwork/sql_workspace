import { Request, Response, NextFunction } from 'express';
import { PermissionAction } from '../../models/permission.model';
import { ForbiddenError, NotFoundError, UnauthorizedError } from '../errors';
import { redis } from '../../config/redis';
import { Project, ProjectMember, Permission } from '../../models';

const PERM_CACHE_TTL = 300; // 5 minutes

export const requireProjectPermission = (action: PermissionAction) => {
  return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = req.user;
      if (!user) {
        throw new UnauthorizedError('Authentication required');
      }

      const projectId = req.params.projectId || req.params.id;
      if (!projectId) {
        throw new NotFoundError('Project ID missing in request');
      }

      // 1. Super Admin has full control across all workspaces (D3)
      if (user.role === 'SUPER_ADMIN') {
        return next();
      }

      // Check project existence & ownership
      const project = await Project.findByPk(projectId);
      if (!project) {
        throw new NotFoundError('Project not found');
      }

      // 2. Admin has full control over their own projects (BR-23)
      if (user.role === 'ADMIN') {
        if (project.adminId !== user.id) {
          throw new NotFoundError('Project not found'); // Hide other admin's projects (tenant isolation)
        }
        return next();
      }

      // 3. User check: Must belong to same workspace
      if (project.adminId !== user.adminId) {
        throw new NotFoundError('Project not found');
      }

      // If project is ARCHIVED, only READ is allowed for non-admin members (BR-21)
      if (project.status === 'ARCHIVED' && action !== 'READ') {
        throw new ForbiddenError('Project is archived and read-only');
      }

      // 4. Check user's granted permissions for this project
      const cacheKey = `perm:${projectId}:${user.id}`;
      let grantedActions: string[];

      const cached = await redis.get(cacheKey);
      if (cached) {
        grantedActions = JSON.parse(cached);
      } else {
        const membership = await ProjectMember.findOne({
          where: { projectId, userId: user.id },
          include: [{ model: Permission, as: 'permissions', attributes: ['action'] }],
        });

        if (!membership) {
          throw new NotFoundError('Project not found'); // User is not a member (BR-22)
        }

        grantedActions = (membership.permissions || []).map((p) => p.action);
        await redis.set(cacheKey, JSON.stringify(grantedActions), 'EX', PERM_CACHE_TTL);
      }

      if (!grantedActions.includes(action)) {
        throw new ForbiddenError(`Missing required permission: ${action}`);
      }

      next();
    } catch (err) {
      next(err);
    }
  };
};

export const invalidateProjectPermissionCache = async (
  projectId: string,
  userId?: string,
): Promise<void> => {
  if (userId) {
    await redis.del(`perm:${projectId}:${userId}`);
  } else {
    // Invalidate all cached permissions for this project
    const keys = await redis.keys(`perm:${projectId}:*`);
    if (keys.length > 0) {
      await redis.del(...keys);
    }
  }
};

