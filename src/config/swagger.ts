import swaggerJsdoc from 'swagger-jsdoc';
import { env } from './env';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'SQL Workspace Backend API',
      version: '1.0.0',
      description:
        'RESTful API documentation for SQL Workspace multi-tenant backend platform.',
    },
    servers: [
      {
        url: `http://localhost:${env.PORT}/api/v1`,
        description: 'Local development server (v1)',
      },
    ],
    components: {
      securitySchemes: {
        BearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Provide your short-lived access JWT token',
        },
        CookieAuth: {
          type: 'apiKey',
          in: 'cookie',
          name: 'refresh_token',
          description: 'HttpOnly refresh token cookie for session renewal',
        },
      },
      responses: {
        UnauthorizedError: {
          description: 'Authentication token is missing, expired, or invalid',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: false },
                  error: {
                    type: 'object',
                    properties: {
                      code: { type: 'string', example: 'UNAUTHORIZED' },
                      message: { type: 'string', example: 'Authentication required' },
                    },
                  },
                },
              },
            },
          },
        },
        ForbiddenError: {
          description: 'Insufficient permissions or access denied',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: false },
                  error: {
                    type: 'object',
                    properties: {
                      code: { type: 'string', example: 'FORBIDDEN' },
                      message: { type: 'string', example: 'Forbidden' },
                    },
                  },
                },
              },
            },
          },
        },
        NotFoundError: {
          description: 'Requested resource not found',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: false },
                  error: {
                    type: 'object',
                    properties: {
                      code: { type: 'string', example: 'NOT_FOUND' },
                      message: { type: 'string', example: 'Resource not found' },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  },
  apis: ['./src/modules/**/*.ts', './src/app.ts'],
};

export const swaggerSpec = swaggerJsdoc(options);

