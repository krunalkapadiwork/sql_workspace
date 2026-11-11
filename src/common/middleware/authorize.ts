import { Request, Response, NextFunction } from 'express';
import { SystemRole } from '../../models/role.model';
import { ForbiddenError, UnauthorizedError } from '../errors';

export const authorize = (...allowedRoles: SystemRole[]) => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      next(new UnauthorizedError('Authentication required'));
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      next(new ForbiddenError('You do not have permission to access this resource'));
      return;
    }

    next();
  };
};

