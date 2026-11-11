import { Request, Response, NextFunction } from 'express';
import { healthService } from './health.service';
import { sendSuccess } from '../../common/utils/response';

export class HealthController {
  public async getHealth(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const health = await healthService.checkHealth();
      const httpStatus = health.status === 'ok' ? 200 : health.status === 'degraded' ? 200 : 503;
      sendSuccess(res, health, httpStatus);
    } catch (err) {
      next(err);
    }
  }
}

export const healthController = new HealthController();

