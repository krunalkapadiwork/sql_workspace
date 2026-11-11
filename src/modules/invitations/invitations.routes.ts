import { Router } from 'express';
import { invitationController } from './invitations.controller';
import { validate } from '../../common/middleware/validate';
import { authenticate } from '../../common/middleware/authenticate';
import { authorize } from '../../common/middleware/authorize';
import { tokenActionRateLimiter, inviteRateLimiter } from '../../common/middleware/rate-limiter';
import {
  acceptInvitationSchema,
  resendInvitationSchema,
  revokeInvitationSchema,
} from './invitations.schema';

const router = Router();

/**
 * @openapi
 * /invitations/{token}/verify:
 *   get:
 *     summary: Verify invitation token
 *     description: Checks whether an invitation link is valid and pending (lazy checks expiration). Returns invitee details.
 *     tags:
 *       - Invitations
 *     parameters:
 *       - in: path
 *         name: token
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Invitation is valid
 *       400:
 *         description: Expired or already accepted
 *       404:
 *         description: Token not found
 */
router.get('/invitations/:token/verify', (req, res, next) => {
  invitationController.verifyToken(req, res, next);
});

/**
 * @openapi
 * /invitations/accept:
 *   post:
 *     summary: Accept invitation
 *     description: Set account password and activate user account. Link can only be used once.
 *     tags:
 *       - Invitations
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - token
 *               - password
 *             properties:
 *               token:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Invitation accepted successfully and account activated
 *       400:
 *         description: Invalid/expired token or password policy violation
 */
router.post(
  '/invitations/accept',
  tokenActionRateLimiter,
  validate({ body: acceptInvitationSchema }),
  (req, res, next) => {
    invitationController.acceptInvitation(req, res, next);
  },
);

/**
 * @openapi
 * /invitations/{id}/resend:
 *   post:
 *     summary: Resend invitation
 *     description: Invalidates previous link (sets status to REVOKED) and issues a new link valid for 48 hours. Allowed for Super Admin, or Admin for their own users.
 *     tags:
 *       - Invitations
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Invitation resent
 *       404:
 *         description: Invitation not found
 */
router.post(
  '/invitations/:id/resend',
  authenticate,
  authorize('SUPER_ADMIN', 'ADMIN'),
  inviteRateLimiter,
  validate({ params: resendInvitationSchema }),
  (req, res, next) => {
    invitationController.resendInvitation(req, res, next);
  },
);

/**
 * @openapi
 * /invitations/{id}/revoke:
 *   post:
 *     summary: Revoke pending invitation
 *     description: Cancels a pending invitation so the link cannot be used.
 *     tags:
 *       - Invitations
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Invitation revoked
 */
router.post(
  '/invitations/:id/revoke',
  authenticate,
  authorize('SUPER_ADMIN', 'ADMIN'),
  validate({ params: revokeInvitationSchema }),
  (req, res, next) => {
    invitationController.revokeInvitation(req, res, next);
  },
);

/**
 * @openapi
 * /invitations:
 *   get:
 *     summary: List invitations
 *     description: Returns paginated list of invitations scoped to the caller's workspace.
 *     tags:
 *       - Invitations
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [PENDING, ACCEPTED, EXPIRED, REVOKED]
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *     responses:
 *       200:
 *         description: List of invitations
 */
router.get(
  '/invitations',
  authenticate,
  authorize('SUPER_ADMIN', 'ADMIN'),
  (req, res, next) => {
    invitationController.listInvitations(req, res, next);
  },
);

export const invitationRoutes = router;

