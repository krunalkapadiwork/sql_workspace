import { Router } from 'express';
import { usersController } from './users.controller';
import { validate } from '../../common/middleware/validate';
import { authenticate } from '../../common/middleware/authenticate';
import { authorize } from '../../common/middleware/authorize';
import { requirePasswordChanged } from '../../common/middleware/require-password-changed';
import { inviteRateLimiter } from '../../common/middleware/rate-limiter';
import {
  createUserSchema,
  updateUserSchema,
  userIdParamSchema,
} from './users.schema';

const router = Router();

// Allowed for SUPER_ADMIN and ADMIN
router.use(authenticate, requirePasswordChanged, authorize('SUPER_ADMIN', 'ADMIN'));

/**
 * @openapi
 * /users:
 *   post:
 *     summary: Invite a new user
 *     description: Creates a user account with status INVITED, assigns a required designation, and sends an invitation email. (Admin / Super Admin)
 *     tags:
 *       - Users Management
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: adminId
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Required when called by Super Admin
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
 *               - designationId
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               firstName:
 *                 type: string
 *               lastName:
 *                 type: string
 *               designationId:
 *                 type: string
 *                 format: uuid
 *     responses:
 *       201:
 *         description: User invited
 *       400:
 *         description: Invalid designation or input
 *       409:
 *         description: Email already in use
 */
router.post(
  '/users',
  inviteRateLimiter,
  validate({ body: createUserSchema }),
  (req, res, next) => {
    usersController.createUser(req, res, next);
  },
);

/**
 * @openapi
 * /users:
 *   get:
 *     summary: List users in workspace
 *     description: Returns a paginated list of users belonging to the admin's workspace.
 *     tags:
 *       - Users Management
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
 *       - in: query
 *         name: adminId
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: List of users
 */
router.get('/users', (req, res, next) => {
  usersController.listUsers(req, res, next);
});

/**
 * @openapi
 * /users/{id}:
 *   get:
 *     summary: Get user details
 *     description: Returns detailed profile, role, and designation for a workspace user.
 *     tags:
 *       - Users Management
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: query
 *         name: adminId
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: User details
 *       404:
 *         description: User not found
 */
router.get('/users/:id', validate({ params: userIdParamSchema }), (req, res, next) => {
  usersController.getUserById(req, res, next);
});

/**
 * @openapi
 * /users/{id}:
 *   patch:
 *     summary: Update user
 *     description: Updates name or reassigns designation.
 *     tags:
 *       - Users Management
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: query
 *         name: adminId
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
 *               designationId:
 *                 type: string
 *                 format: uuid
 *     responses:
 *       200:
 *         description: User updated
 */
router.patch(
  '/users/:id',
  validate({ params: userIdParamSchema, body: updateUserSchema }),
  (req, res, next) => {
    usersController.updateUser(req, res, next);
  },
);

/**
 * @openapi
 * /users/{id}/activate:
 *   post:
 *     summary: Activate user account
 *     tags:
 *       - Users Management
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: query
 *         name: adminId
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: User activated
 */
router.post(
  '/users/:id/activate',
  validate({ params: userIdParamSchema }),
  (req, res, next) => {
    usersController.activateUser(req, res, next);
  },
);

/**
 * @openapi
 * /users/{id}/deactivate:
 *   post:
 *     summary: Deactivate user account
 *     description: Deactivates account and terminates all active user sessions immediately.
 *     tags:
 *       - Users Management
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: query
 *         name: adminId
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: User deactivated
 */
router.post(
  '/users/:id/deactivate',
  validate({ params: userIdParamSchema }),
  (req, res, next) => {
    usersController.deactivateUser(req, res, next);
  },
);

/**
 * @openapi
 * /users/{id}:
 *   delete:
 *     summary: Soft-delete user
 *     description: Soft-deletes user account, terminates active sessions, and revokes project memberships.
 *     tags:
 *       - Users Management
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: query
 *         name: adminId
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: User deleted
 */
router.delete('/users/:id', validate({ params: userIdParamSchema }), (req, res, next) => {
  usersController.deleteUser(req, res, next);
});

export const usersRoutes = router;

