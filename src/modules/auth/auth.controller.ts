import { Request, Response, NextFunction } from 'express';
import { authService } from './auth.service';
import { sendSuccess } from '../../common/utils/response';
import { env } from '../../config/env';
import { UnauthorizedError } from '../../common/errors';

const getCookieOptions = () => ({
  httpOnly: true,
  secure: env.NODE_ENV === 'production',
  sameSite: (env.NODE_ENV === 'production' ? 'none' : 'lax') as 'none' | 'lax',
  path: '/api/v1/auth',
  maxAge: env.REFRESH_TTL_DAYS * 24 * 60 * 60 * 1000,
});

export class AuthController {
  public async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await authService.login(req.body);

      res.cookie('refresh_token', result.refreshToken, getCookieOptions());

      sendSuccess(res, {
        accessToken: result.accessToken,
        user: result.user,
      });
    } catch (err) {
      next(err);
    }
  }

  public async refresh(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const oldRefreshToken = req.cookies.refresh_token;
      if (!oldRefreshToken) {
        throw new UnauthorizedError('Refresh token required');
      }

      const result = await authService.refresh(oldRefreshToken);

      res.cookie('refresh_token', result.newRefreshToken, getCookieOptions());

      sendSuccess(res, {
        accessToken: result.accessToken,
      });
    } catch (err) {
      next(err);
    }
  }

  public async logout(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const refreshToken = req.cookies.refresh_token;
      await authService.logout(refreshToken);

      res.clearCookie('refresh_token', {
        httpOnly: true,
        secure: env.NODE_ENV === 'production',
        sameSite: (env.NODE_ENV === 'production' ? 'none' : 'lax') as 'none' | 'lax',
        path: '/api/v1/auth',
      });

      sendSuccess(res, { message: 'Logged out successfully' });
    } catch (err) {
      next(err);
    }
  }

  public async getProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = await authService.getProfile(req.user!.id);
      sendSuccess(res, user);
    } catch (err) {
      next(err);
    }
  }

  public async changePassword(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await authService.changePassword(req.user!.id, req.body);
      sendSuccess(res, { message: 'Password changed successfully' });
    } catch (err) {
      next(err);
    }
  }

  public async forgotPassword(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await authService.forgotPassword(req.body);
      sendSuccess(res, {
        message: 'If an account exists with this email, a password reset link has been sent.',
      });
    } catch (err) {
      next(err);
    }
  }

  public async resetPassword(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await authService.resetPassword(req.body);
      sendSuccess(res, { message: 'Password reset successfully. You may now log in.' });
    } catch (err) {
      next(err);
    }
  }
}

export const authController = new AuthController();

