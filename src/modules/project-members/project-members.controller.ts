import { Request, Response, NextFunction } from 'express';
import { projectMembersService } from './project-members.service';
import { sendSuccess } from '../../common/utils/response';

export class ProjectMembersController {
  public async listMembers(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const members = await projectMembersService.listMembers(
        req.params.projectId as string,
        req.user!,
      );
      sendSuccess(res, members);
    } catch (err) {
      next(err);
    }
  }

  public async addMember(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const member = await projectMembersService.addMember(
        req.params.projectId as string,
        req.body,
        req.user!,
      );
      sendSuccess(res, member, 201);
    } catch (err) {
      next(err);
    }
  }

  public async updatePermissions(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await projectMembersService.updateMemberPermissions(
        req.params.projectId as string,
        req.params.memberId as string,
        req.body,
        req.user!,
      );
      sendSuccess(res, { message: 'Member project permissions updated successfully' });
    } catch (err) {
      next(err);
    }
  }

  public async removeMember(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await projectMembersService.removeMember(
        req.params.projectId as string,
        req.params.memberId as string,
        req.user!,
      );
      sendSuccess(res, { message: 'Member removed from project successfully' });
    } catch (err) {
      next(err);
    }
  }
}

export const projectMembersController = new ProjectMembersController();

