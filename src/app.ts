import express, { Express } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import pinoHttp from 'pino-http';
import swaggerUi from 'swagger-ui-express';

import { env } from './config/env';
import { logger } from './config/logger';
import { swaggerSpec } from './config/swagger';
import { requestId } from './common/middleware/request-id';
import { notFound } from './common/middleware/not-found';
import { errorHandler } from './common/middleware/error-handler';
import { healthRoutes } from './modules/health';
import { rolesRoutes } from './modules/roles';
import { permissionsRoutes } from './modules/permissions';
import { authRoutes } from './modules/auth';
import { invitationRoutes } from './modules/invitations';
import { adminsRoutes } from './modules/admins';
import { designationsRoutes } from './modules/designations';
import { usersRoutes } from './modules/users';
import { projectsRoutes } from './modules/projects';
import { projectMembersRoutes } from './modules/project-members';
import { initModels } from './models';

export const createApp = (): Express => {
  const app = express();

  // Initialize centralized models
  initModels();

  // Basic security & parsing middleware
  app.use(
    helmet({
      contentSecurityPolicy: env.NODE_ENV === 'production' ? undefined : false,
    }),
  );
  app.use(
    cors({
      origin: env.CORS_ORIGINS,
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-Id'],
    }),
  );
  app.use(cookieParser());
  app.use(express.json({ limit: '100kb' }));
  app.use(express.urlencoded({ extended: true, limit: '100kb' }));

  // Attach Request ID
  app.use(requestId);

  // Request logging
  if (env.NODE_ENV !== 'test') {
    app.use(
      pinoHttp({
        logger,
        genReqId: (req) => req.id || req.headers['x-request-id'] || 'unknown',
        customLogLevel: (_req, res, err) => {
          if (res.statusCode >= 500 || err) return 'error';
          if (res.statusCode >= 400) return 'warn';
          return 'info';
        },
      }),
    );
  }

  // Swagger Documentation (D26)
  app.get('/api/docs.json', (_req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(swaggerSpec);
  });
  app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

  // Base API v1 Router
  const apiV1Router = express.Router();
  apiV1Router.use(healthRoutes);
  apiV1Router.use(rolesRoutes);
  apiV1Router.use(permissionsRoutes);
  apiV1Router.use(authRoutes);
  apiV1Router.use(invitationRoutes);
  apiV1Router.use(adminsRoutes);
  apiV1Router.use(designationsRoutes);
  apiV1Router.use(usersRoutes);
  apiV1Router.use(projectsRoutes);
  apiV1Router.use(projectMembersRoutes);

  app.use('/api/v1', apiV1Router);

  // 404 Catch-All
  app.use(notFound);

  // Centralized Error Handling
  app.use(errorHandler);

  return app;
};

