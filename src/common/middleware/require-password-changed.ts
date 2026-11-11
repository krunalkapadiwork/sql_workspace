import { Request, Response, NextFunction } from 'express';
import { ForbiddenError } from '../errors';

const ALLOWED_PATHS = ['/api/v1/auth/me', '/api/v1/auth/change-password', '/api/v1/auth/logout'];

export const requirePasswordChanged = (req: Request, _res: Response, next: NextFunction): void => {
  if (req.user?.mustChangePassword) {
    const isAllowed = ALLOWED_PATHS.some((path) => req.originalUrl.startsWith(path));
    if (!isAllowed) {
      throw new ForbiddenError(
        'Password change required. You must change your temporary password before accessing other resources.',
      );
    }
  }
  next();
};

