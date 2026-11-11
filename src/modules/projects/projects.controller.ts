import { Request, Response, NextFunction } from 'express';
import { projectsService } from './projects.service';
import { sendSuccess } from '../../common/utils/response';

export class ProjectsController {
  public async createProject(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const project = await projectsService.createProject(
        req.body,
        req.user!,
        req.query.adminId as string | undefined,
      );
      sendSuccess(res, project, 201);
    } catch (err) {
      next(err);
    }
  }

  public async listProjects(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 20;

      const { rows, total } = await projectsService.listProjects(
        req.user!,
        { page, limit },
        req.query.adminId as string | undefined,
      );
      sendSuccess(res, rows, 200, { page, limit, total });
    } catch (err) {
      next(err);
    }
  }

  public async getProjectById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const project = await projectsService.getProjectById(req.params.id as string, req.user!);
      sendSuccess(res, project);
    } catch (err) {
      next(err);
    }
  }

  public async updateProject(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const project = await projectsService.updateProject(
        req.params.id as string,
        req.body,
        req.user!,
      );
      sendSuccess(res, project);
    } catch (err) {
      next(err);
    }
  }

  public async deleteProject(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await projectsService.deleteProject(req.params.id as string, req.user!);
      sendSuccess(res, { message: 'Project deleted successfully' });
    } catch (err) {
      next(err);
    }
  }
}

export const projectsController = new ProjectsController();

