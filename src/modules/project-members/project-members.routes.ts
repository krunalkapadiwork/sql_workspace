import { Router } from 'express';
import { projectMembersController } from './project-members.controller';
import { validate } from '../../common/middleware/validate';
import { authenticate } from '../../common/middleware/authenticate';
import { requirePasswordChanged } from '../../common/middleware/require-password-changed';
import { requireProjectPermission } from '../../common/middleware/permission-guard';
import {
  addProjectMemberSchema,
  updateMemberPermissionsSchema,
  projectMemberParamsSchema,
} from './project-members.schema';

const router = Router();

router.use(authenticate, requirePasswordChanged);

/**
 * @openapi
 * /projects/{projectId}/members:
 *   get:
 *     summary: List project members
 *     description: Returns all members of the specified project along with their designations and granted permissions. Requires READ permission or Admin.
 *     tags:
 *       - Project Members
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: List of project members
 *       404:
 *         description: Project not found
 */
router.get(
  '/projects/:projectId/members',
  validate({ params: projectMemberParamsSchema }),
  requireProjectPermission('READ'),
  (req, res, next) => {
    projectMembersController.listMembers(req, res, next);
  },
);

/**
 * @openapi
 * /projects/{projectId}/members:
 *   post:
 *     summary: Add member to project
 *     description: Adds a workspace user to the project. Automatically copies default permissions from their designation unless permission overrides are explicitly provided. Requires MANAGE_MEMBERS permission or Admin.
 *     tags:
 *       - Project Members
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userId
 *             properties:
 *               userId:
 *                 type: string
 *                 format: uuid
 *               permissionIds:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: uuid
 *                 description: Optional custom permission overrides
 *     responses:
 *       201:
 *         description: Member added to project
 *       400:
 *         description: Validation error or invalid permissions
 *       403:
 *         description: Insufficient permissions or privilege escalation attempted
 *       409:
 *         description: User is already a member
 */
router.post(
  '/projects/:projectId/members',
  validate({ params: projectMemberParamsSchema, body: addProjectMemberSchema }),
  (req, res, next) => {
    projectMembersController.addMember(req, res, next);
  },
);

/**
 * @openapi
 * /projects/{projectId}/members/{memberId}/permissions:
 *   put:
 *     summary: Update project member permissions
 *     description: Updates granted permissions for a project member. Privilege escalation limits apply. Requires MANAGE_MEMBERS permission or Admin.
 *     tags:
 *       - Project Members
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: path
 *         name: memberId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - permissionIds
 *             properties:
 *               permissionIds:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: uuid
 *     responses:
 *       200:
 *         description: Member permissions updated
 *       403:
 *         description: Privilege escalation or cannot edit own permissions
 */
router.put(
  '/projects/:projectId/members/:memberId/permissions',
  validate({ params: projectMemberParamsSchema, body: updateMemberPermissionsSchema }),
  (req, res, next) => {
    projectMembersController.updatePermissions(req, res, next);
  },
);

/**
 * @openapi
 * /projects/{projectId}/members/{memberId}:
 *   delete:
 *     summary: Remove member from project
 *     description: Removes a member from the project and immediately revokes all granted permissions. Requires MANAGE_MEMBERS permission or Admin.
 *     tags:
 *       - Project Members
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: path
 *         name: memberId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Member removed from project
 *       403:
 *         description: Cannot remove self or higher-privileged member
 */
router.delete(
  '/projects/:projectId/members/:memberId',
  validate({ params: projectMemberParamsSchema }),
  (req, res, next) => {
    projectMembersController.removeMember(req, res, next);
  },
);

export const projectMembersRoutes = router;

