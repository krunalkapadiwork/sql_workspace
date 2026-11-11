import { Request, Response, NextFunction } from 'express';
import { adminsService } from './admins.service';
import { sendSuccess } from '../../common/utils/response';

export class AdminsController {
  public async createAdmin(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const admin = await adminsService.createAdmin(req.body, req.user!);
      sendSuccess(res, admin, 201);
    } catch (err) {
      next(err);
    }
  }

  public async listAdmins(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 20;

      const { rows, total } = await adminsService.listAdmins({ page, limit });
      sendSuccess(res, rows, 200, { page, limit, total });
    } catch (err) {
      next(err);
    }
  }

  public async getAdminById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const admin = await adminsService.getAdminById(req.params.id as string);
      sendSuccess(res, admin);
    } catch (err) {
      next(err);
    }
  }

  public async updateAdmin(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const admin = await adminsService.updateAdmin(req.params.id as string, req.body);
      sendSuccess(res, admin);
    } catch (err) {
      next(err);
    }
  }

  public async activateAdmin(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await adminsService.activateAdmin(req.params.id as string);
      sendSuccess(res, { message: 'Admin activated successfully' });
    } catch (err) {
      next(err);
    }
  }

  public async deactivateAdmin(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await adminsService.deactivateAdmin(req.params.id as string);
      sendSuccess(res, {
        message: 'Admin and all associated workspace users deactivated successfully',
      });
    } catch (err) {
      next(err);
    }
  }

  public async deleteAdmin(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await adminsService.deleteAdmin(req.params.id as string);
      sendSuccess(res, { message: 'Admin soft-deleted successfully' });
    } catch (err) {
      next(err);
    }
  }
}

export const adminsController = new AdminsController();

