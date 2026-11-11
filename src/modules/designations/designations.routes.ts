import { Router } from 'express';
import { designationsController } from './designations.controller';
import { validate } from '../../common/middleware/validate';
import { authenticate } from '../../common/middleware/authenticate';
import { authorize } from '../../common/middleware/authorize';
import { requirePasswordChanged } from '../../common/middleware/require-password-changed';
import {
  createDesignationSchema,
  updateDesignationSchema,
  designationIdParamSchema,
  setDesignationPermissionsSchema,
} from './designations.schema';

const router = Router();

// Allowed for SUPER_ADMIN or ADMIN (with requirePasswordChanged)
router.use(authenticate, requirePasswordChanged, authorize('SUPER_ADMIN', 'ADMIN'));

/**
 * @openapi
 * /designations:
 *   post:
 *     summary: Create designation
 *     description: Creates a new designation in the admin's workspace with a unique name.
 *     tags:
 *       - Designations
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
 *                 example: 'Senior Developer'
 *               description:
 *                 type: string
 *     responses:
 *       201:
 *         description: Designation created
 *       409:
 *         description: Name already exists in workspace
 */
router.post(
  '/designations',
  validate({ body: createDesignationSchema }),
  (req, res, next) => {
    designationsController.createDesignation(req, res, next);
  },
);

/**
 * @openapi
 * /designations:
 *   get:
 *     summary: List designations
 *     description: Returns all designations and their default permissions for the workspace.
 *     tags:
 *       - Designations
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: adminId
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: List of designations
 */
router.get('/designations', (req, res, next) => {
  designationsController.listDesignations(req, res, next);
});

/**
 * @openapi
 * /designations/{id}:
 *   get:
 *     summary: Get designation details
 *     description: Returns designation details and default permission template.
 *     tags:
 *       - Designations
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
 *         description: Designation details
 *       404:
 *         description: Designation not found
 */
router.get(
  '/designations/:id',
  validate({ params: designationIdParamSchema }),
  (req, res, next) => {
    designationsController.getDesignationById(req, res, next);
  },
);

/**
 * @openapi
 * /designations/{id}:
 *   patch:
 *     summary: Update designation
 *     description: Updates designation name and description.
 *     tags:
 *       - Designations
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
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *     responses:
 *       200:
 *         description: Designation updated
 */
router.patch(
  '/designations/:id',
  validate({ params: designationIdParamSchema, body: updateDesignationSchema }),
  (req, res, next) => {
    designationsController.updateDesignation(req, res, next);
  },
);

/**
 * @openapi
 * /designations/{id}:
 *   delete:
 *     summary: Delete designation
 *     description: Soft-deletes a designation. Blocked if any active users are currently assigned to this designation.
 *     tags:
 *       - Designations
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
 *         description: Designation deleted
 *       409:
 *         description: Blocked because users are assigned
 */
router.delete(
  '/designations/:id',
  validate({ params: designationIdParamSchema }),
  (req, res, next) => {
    designationsController.deleteDesignation(req, res, next);
  },
);

/**
 * @openapi
 * /designations/{id}/permissions:
 *   put:
 *     summary: Update designation default permissions
 *     description: Sets the default project permissions template for this designation. Does not alter permissions for users already added to projects.
 *     tags:
 *       - Designations
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
 *         description: Default permissions updated
 */
router.put(
  '/designations/:id/permissions',
  validate({ params: designationIdParamSchema, body: setDesignationPermissionsSchema }),
  (req, res, next) => {
    designationsController.setPermissions(req, res, next);
  },
);

export const designationsRoutes = router;

