import { Router } from 'express';
import { healthController } from './health.controller';

const router = Router();

/**
 * @openapi
 * /health:
 *   get:
 *     summary: System health check
 *     description: Returns the status of the API, PostgreSQL database, and Redis connections.
 *     tags:
 *       - System
 *     responses:
 *       200:
 *         description: System is healthy or degraded
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     status:
 *                       type: string
 *                       enum: [ok, degraded, down]
 *                       example: ok
 *                     timestamp:
 *                       type: string
 *                       example: '2026-11-10T12:00:00.000Z'
 *                     uptime:
 *                       type: number
 *                       example: 45.23
 *                     services:
 *                       type: object
 *                       properties:
 *                         database:
 *                           type: object
 *                           properties:
 *                             status:
 *                               type: string
 *                               example: up
 *                             responseTimeMs:
 *                               type: number
 *                               example: 12
 *                         redis:
 *                           type: object
 *                           properties:
 *                             status:
 *                               type: string
 *                               example: up
 *                             responseTimeMs:
 *                               type: number
 *                               example: 4
 *       503:
 *         description: System is down
 */
router.get('/health', (req, res, next) => {
  healthController.getHealth(req, res, next);
});

export const healthRoutes = router;

