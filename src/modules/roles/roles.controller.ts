import { Request, Response, NextFunction } from 'express';
import { rolesService } from './roles.service';
import { sendSuccess } from '../../common/utils/response';

export class RolesController {
  public async getRoles(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const roles = await rolesService.getAllRoles();
      sendSuccess(res, roles);
    } catch (err) {
      next(err);
    }
  }
}

export const rolesController = new RolesController();

