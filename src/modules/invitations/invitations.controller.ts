import { Request, Response, NextFunction } from 'express';
import { invitationService } from './invitations.service';
import { sendSuccess } from '../../common/utils/response';

export class InvitationController {
  public async verifyToken(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await invitationService.verifyToken(req.params.token as string);
      sendSuccess(res, result);
    } catch (err) {
      next(err);
    }
  }

  public async acceptInvitation(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await invitationService.acceptInvitation(req.body);
      sendSuccess(res, { message: 'Invitation accepted successfully. Your account is now active.' });
    } catch (err) {
      next(err);
    }
  }

  public async resendInvitation(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await invitationService.resendInvitation(req.params.id as string, req.user!);
      sendSuccess(res, { message: 'Invitation resent successfully' });
    } catch (err) {
      next(err);
    }
  }

  public async revokeInvitation(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await invitationService.revokeInvitation(req.params.id as string, req.user!);
      sendSuccess(res, { message: 'Invitation revoked successfully' });
    } catch (err) {
      next(err);
    }
  }

  public async listInvitations(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 20;
      const status = req.query.status as string | undefined;

      const { rows, total } = await invitationService.listInvitations(req.user!, {
        page,
        limit,
        status,
      });

      sendSuccess(res, rows, 200, { page, limit, total });
    } catch (err) {
      next(err);
    }
  }
}

export const invitationController = new InvitationController();

