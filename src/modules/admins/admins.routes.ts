import { Router } from 'express';
import { adminsController } from './admins.controller';
import { validate } from '../../common/middleware/validate';
import { authenticate } from '../../common/middleware/authenticate';
import { authorize } from '../../common/middleware/authorize';
import { requirePasswordChanged } from '../../common/middleware/require-password-changed';
import { inviteRateLimiter } from '../../common/middleware/rate-limiter';
import {
  createAdminSchema,
  updateAdminSchema,
  adminIdParamSchema,
} from './admins.schema';

const router = Router();

// All Admins management routes require SUPER_ADMIN role (D3, BR-5)
router.use(authenticate, requirePasswordChanged, authorize('SUPER_ADMIN'));

/**
 * @openapi
 * /admins:
 *   post:
 *     summary: Invite a new Admin
 *     description: Creates an Admin account with status INVITED, seeds the 4 default designations into their workspace, and sends an invitation email. (Super Admin only)
 *     tags:
 *       - Admins Management
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - firstName
 *               - lastName
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               firstName:
 *                 type: string
 *               lastName:
 *                 type: string
 *     responses:
 *       201:
 *         description: Admin invited successfully
 *       409:
 *         description: Email already in use
 */
router.post(
  '/admins',
  inviteRateLimiter,
  validate({ body: createAdminSchema }),
  (req, res, next) => {
    adminsController.createAdmin(req, res, next);
  },
);

/**
 * @openapi
 * /admins:
 *   get:
 *     summary: List all Admins
 *     description: Returns a paginated list of all Admin workspaces. (Super Admin only)
 *     tags:
 *       - Admins Management
 *     security:
 *       - BearerAuth: []
 *     parameters:
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
 *         description: List of Admins
 */
router.get('/admins', (req, res, next) => {
  adminsController.listAdmins(req, res, next);
});

/**
 * @openapi
 * /admins/{id}:
 *   get:
 *     summary: Get Admin details
 *     description: Returns Admin profile and associated designations. (Super Admin only)
 *     tags:
 *       - Admins Management
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
 *         description: Admin details
 *       404:
 *         description: Admin not found
 */
router.get('/admins/:id', validate({ params: adminIdParamSchema }), (req, res, next) => {
  adminsController.getAdminById(req, res, next);
});

/**
 * @openapi
 * /admins/{id}:
 *   patch:
 *     summary: Update Admin profile
 *     description: Updates Admin first name and/or last name. (Super Admin only)
 *     tags:
 *       - Admins Management
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               firstName:
 *                 type: string
 *               lastName:
 *                 type: string
 *     responses:
 *       200:
 *         description: Admin updated
 */
router.patch(
  '/admins/:id',
  validate({ params: adminIdParamSchema, body: updateAdminSchema }),
  (req, res, next) => {
    adminsController.updateAdmin(req, res, next);
  },
);

/**
 * @openapi
 * /admins/{id}/activate:
 *   post:
 *     summary: Activate an Admin account
 *     description: Reactivates an Admin account and clears status cache. (Super Admin only)
 *     tags:
 *       - Admins Management
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
 *         description: Admin activated
 */
router.post(
  '/admins/:id/activate',
  validate({ params: adminIdParamSchema }),
  (req, res, next) => {
    adminsController.activateAdmin(req, res, next);
  },
);

/**
 * @openapi
 * /admins/{id}/deactivate:
 *   post:
 *     summary: Deactivate Admin and workspace
 *     description: Deactivates Admin account, immediately terminates all sessions for Admin and all users in their workspace, and blocks further logins. (Super Admin only)
 *     tags:
 *       - Admins Management
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
 *         description: Admin and workspace users deactivated
 */
router.post(
  '/admins/:id/deactivate',
  validate({ params: adminIdParamSchema }),
  (req, res, next) => {
    adminsController.deactivateAdmin(req, res, next);
  },
);

/**
 * @openapi
 * /admins/{id}:
 *   delete:
 *     summary: Soft-delete Admin
 *     description: Soft-deletes an Admin account and revokes active sessions. (Super Admin only)
 *     tags:
 *       - Admins Management
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
 *         description: Admin deleted
 */
router.delete('/admins/:id', validate({ params: adminIdParamSchema }), (req, res, next) => {
  adminsController.deleteAdmin(req, res, next);
});

export const adminsRoutes = router;

