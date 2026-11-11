import { Request, Response, NextFunction } from 'express';
import { usersService } from './users.service';
import { sendSuccess } from '../../common/utils/response';

export class UsersController {
  public async createUser(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = await usersService.createUser(
        req.body,
        req.user!,
        req.query.adminId as string | undefined,
      );
      sendSuccess(res, user, 201);
    } catch (err) {
      next(err);
    }
  }

  public async listUsers(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 20;

      const { rows, total } = await usersService.listUsers(
        req.user!,
        { page, limit },
        req.query.adminId as string | undefined,
      );
      sendSuccess(res, rows, 200, { page, limit, total });
    } catch (err) {
      next(err);
    }
  }

  public async getUserById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = await usersService.getUserById(
        req.params.id as string,
        req.user!,
        req.query.adminId as string | undefined,
      );
      sendSuccess(res, user);
    } catch (err) {
      next(err);
    }
  }

  public async updateUser(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = await usersService.updateUser(
        req.params.id as string,
        req.body,
        req.user!,
        req.query.adminId as string | undefined,
      );
      sendSuccess(res, user);
    } catch (err) {
      next(err);
    }
  }

  public async activateUser(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await usersService.activateUser(
        req.params.id as string,
        req.user!,
        req.query.adminId as string | undefined,
      );
      sendSuccess(res, { message: 'User activated successfully' });
    } catch (err) {
      next(err);
    }
  }

  public async deactivateUser(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await usersService.deactivateUser(
        req.params.id as string,
        req.user!,
        req.query.adminId as string | undefined,
      );
      sendSuccess(res, { message: 'User deactivated successfully' });
    } catch (err) {
      next(err);
    }
  }

  public async deleteUser(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await usersService.deleteUser(
        req.params.id as string,
        req.user!,
        req.query.adminId as string | undefined,
      );
      sendSuccess(res, { message: 'User soft-deleted successfully' });
    } catch (err) {
      next(err);
    }
  }
}

export const usersController = new UsersController();

