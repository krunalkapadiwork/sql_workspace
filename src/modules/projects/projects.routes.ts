import { Router } from 'express';
import { projectsController } from './projects.controller';
import { validate } from '../../common/middleware/validate';
import { authenticate } from '../../common/middleware/authenticate';
import { authorize } from '../../common/middleware/authorize';
import { requirePasswordChanged } from '../../common/middleware/require-password-changed';
import { requireProjectPermission } from '../../common/middleware/permission-guard';
import {
  createProjectSchema,
  updateProjectSchema,
  projectIdParamSchema,
} from './projects.schema';

const router = Router();

router.use(authenticate, requirePasswordChanged);

/**
 * @openapi
 * /projects:
 *   post:
 *     summary: Create project
 *     description: Creates a new project in the admin's workspace. (Admin / Super Admin)
 *     tags:
 *       - Projects
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
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *                 example: 'Finance Analytics'
 *               description:
 *                 type: string
 *               status:
 *                 type: string
 *                 enum: [ACTIVE, ARCHIVED]
 *                 default: ACTIVE
 *               startDate:
 *                 type: string
 *                 format: date
 *               endDate:
 *                 type: string
 *                 format: date
 *     responses:
 *       201:
 *         description: Project created
 *       409:
 *         description: Project name already exists in workspace
 */
router.post(
  '/projects',
  authorize('SUPER_ADMIN', 'ADMIN'),
  validate({ body: createProjectSchema }),
  (req, res, next) => {
    projectsController.createProject(req, res, next);
  },
);

/**
 * @openapi
 * /projects:
 *   get:
 *     summary: List projects
 *     description: Returns projects in workspace. Admins see all workspace projects; Users see only projects they are assigned to.
 *     tags:
 *       - Projects
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
 *         description: List of projects
 */
router.get('/projects', (req, res, next) => {
  projectsController.listProjects(req, res, next);
});

/**
 * @openapi
 * /projects/{id}:
 *   get:
 *     summary: Get project details
 *     description: Returns project details and members. Requires READ permission or Admin.
 *     tags:
 *       - Projects
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
 *         description: Project details
 *       404:
 *         description: Project not found
 */
router.get(
  '/projects/:id',
  validate({ params: projectIdParamSchema }),
  requireProjectPermission('READ'),
  (req, res, next) => {
    projectsController.getProjectById(req, res, next);
  },
);

/**
 * @openapi
 * /projects/{id}:
 *   patch:
 *     summary: Update project
 *     description: Updates project name, description, status, or dates. Requires UPDATE permission or Admin.
 *     tags:
 *       - Projects
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
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               status:
 *                 type: string
 *                 enum: [ACTIVE, ARCHIVED]
 *               startDate:
 *                 type: string
 *                 format: date
 *               endDate:
 *                 type: string
 *                 format: date
 *     responses:
 *       200:
 *         description: Project updated
 */
router.patch(
  '/projects/:id',
  validate({ params: projectIdParamSchema, body: updateProjectSchema }),
  requireProjectPermission('UPDATE'),
  (req, res, next) => {
    projectsController.updateProject(req, res, next);
  },
);

/**
 * @openapi
 * /projects/{id}:
 *   delete:
 *     summary: Soft-delete project
 *     description: Soft-deletes a project. Only Admin or Super Admin can delete projects.
 *     tags:
 *       - Projects
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
 *         description: Project deleted
 */
router.delete(
  '/projects/:id',
  authorize('SUPER_ADMIN', 'ADMIN'),
  validate({ params: projectIdParamSchema }),
  (req, res, next) => {
    projectsController.deleteProject(req, res, next);
  },
);

export const projectsRoutes = router;

