import { Request, Response, NextFunction } from 'express';
import { RateLimiterRedis } from 'rate-limiter-flexible';
import { redis } from '../../config/redis';
import { TooManyRequestsError } from '../errors';

const createLimiter = (keyPrefix: string, points: number, duration: number) => {
  const limiter = new RateLimiterRedis({
    storeClient: redis,
    keyPrefix,
    points,
    duration,
  });

  return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    try {
      const clientIp = req.ip || req.socket.remoteAddress || 'unknown';
      const key = req.user ? `${req.user.id}:${clientIp}` : clientIp;
      await limiter.consume(key);
      next();
    } catch {
      next(new TooManyRequestsError());
    }
  };
};

export const loginRateLimiter = createLimiter('rl_login', 10, 60); // 10/min per IP
export const forgotPasswordRateLimiter = createLimiter('rl_forgot_pw', 5, 3600); // 5/hr
export const tokenActionRateLimiter = createLimiter('rl_token_action', 10, 60); // 10/min
export const inviteRateLimiter = createLimiter('rl_invite', 30, 3600); // 30/hr per user
export const generalRateLimiter = createLimiter('rl_general', 300, 60); // 300/min

