import { Request, Response, NextFunction } from 'express';
import { designationsService } from './designations.service';
import { sendSuccess } from '../../common/utils/response';

export class DesignationsController {
  public async createDesignation(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const designation = await designationsService.createDesignation(
        req.body,
        req.user!,
        req.query.adminId as string | undefined,
      );
      sendSuccess(res, designation, 201);
    } catch (err) {
      next(err);
    }
  }

  public async listDesignations(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const designations = await designationsService.listDesignations(
        req.user!,
        req.query.adminId as string | undefined,
      );
      sendSuccess(res, designations);
    } catch (err) {
      next(err);
    }
  }

  public async getDesignationById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const designation = await designationsService.getDesignationById(
        req.params.id as string,
        req.user!,
        req.query.adminId as string | undefined,
      );
      sendSuccess(res, designation);
    } catch (err) {
      next(err);
    }
  }

  public async updateDesignation(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const designation = await designationsService.updateDesignation(
        req.params.id as string,
        req.body,
        req.user!,
        req.query.adminId as string | undefined,
      );
      sendSuccess(res, designation);
    } catch (err) {
      next(err);
    }
  }

  public async deleteDesignation(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await designationsService.deleteDesignation(
        req.params.id as string,
        req.user!,
        req.query.adminId as string | undefined,
      );
      sendSuccess(res, { message: 'Designation deleted successfully' });
    } catch (err) {
      next(err);
    }
  }

  public async setPermissions(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await designationsService.setDesignationPermissions(
        req.params.id as string,
        req.body,
        req.user!,
        req.query.adminId as string | undefined,
      );
      sendSuccess(res, { message: 'Default permissions updated for designation' });
    } catch (err) {
      next(err);
    }
  }
}

export const designationsController = new DesignationsController();

