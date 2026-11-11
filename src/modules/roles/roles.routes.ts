import { Router } from 'express';
import { rolesController } from './roles.controller';

const router = Router();

/**
 * @openapi
 * /roles:
 *   get:
 *     summary: Get all system roles
 *     description: Retrieve all predefined system-level roles (SUPER_ADMIN, ADMIN, USER).
 *     tags:
 *       - Catalog
 *     responses:
 *       200:
 *         description: List of system roles
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
 *                         example: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'
 *                       name:
 *                         type: string
 *                         enum: [SUPER_ADMIN, ADMIN, USER]
 *                         example: 'ADMIN'
 */
router.get('/roles', (req, res, next) => {
  rolesController.getRoles(req, res, next);
});

export const rolesRoutes = router;

