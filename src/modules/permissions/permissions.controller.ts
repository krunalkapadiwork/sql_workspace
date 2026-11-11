import { Request, Response, NextFunction } from 'express';
import { permissionsService } from './permissions.service';
import { sendSuccess } from '../../common/utils/response';

export class PermissionsController {
  public async getPermissions(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const permissions = await permissionsService.getAllPermissions();
      sendSuccess(res, permissions);
    } catch (err) {
      next(err);
    }
  }
}

export const permissionsController = new PermissionsController();

