import { Router } from 'express';
import { permissionsController } from './permissions.controller';

const router = Router();

/**
 * @openapi
 * /permissions:
 *   get:
 *     summary: Get all system permissions
 *     description: Retrieve all predefined project and module permissions.
 *     tags:
 *       - Catalog
 *     responses:
 *       200:
 *         description: List of permissions
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                         format: uuid
 *                         example: 'b1ffcd88-8b1c-4ef8-aa5d-7aa8bd390b22'
 *                       module:
 *                         type: string
 *                         nullable: true
 *                         example: null
 *                       action:
 *                         type: string
 *                         enum: [READ, CREATE, UPDATE, DELETE, MANAGE_MEMBERS]
 *                         example: 'READ'
 */
router.get('/permissions', (req, res, next) => {
  permissionsController.getPermissions(req, res, next);
});

export const permissionsRoutes = router;

