import request from 'supertest';
import express, { Express } from 'express';
import { getTestApp } from '../helpers/test-app';
import { validate } from '../../src/common/middleware/validate';
import { notFound } from '../../src/common/middleware/not-found';
import { errorHandler } from '../../src/common/middleware/error-handler';
import { z } from 'zod';
import { sendSuccess } from '../../src/common/utils/response';
import { ForbiddenError } from '../../src/common/errors';

describe('Error Handling Middleware', () => {
  const app = getTestApp();

  it('should return 404 in standard error envelope for unknown routes', async () => {
    const res = await request(app).get('/api/v1/unknown-endpoint');

    expect(res.status).toBe(404);
    expect(res.body).toEqual({
      success: false,
      error: {
        code: 'NOT_FOUND',
        message: 'Route not found: GET /api/v1/unknown-endpoint',
      },
    });
  });

  it('should return 400 for malformed JSON request body', async () => {
    const res = await request(app)
      .post('/api/v1/health')
      .set('Content-Type', 'application/json')
      .send('{ "invalidJson": ');

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
    expect(res.body.error.message).toContain('Malformed JSON');
  });

  describe('Validation & Custom AppError', () => {
    let testApp: Express;

    beforeAll(() => {
      testApp = express();
      testApp.use(express.json());

      testApp.post(
        '/api/v1/test/test-validation',
        validate({
          body: z.object({
            email: z.string().email(),
            age: z.number().min(18),
          }),
        }),
        (req, res) => {
          sendSuccess(res, req.body);
        },
      );

      testApp.get('/api/v1/test/test-forbidden', () => {
        throw new ForbiddenError('You do not have permission');
      });

      testApp.use(notFound);
      testApp.use(errorHandler);
    });

    it('should return 400 with details when Zod validation fails', async () => {
      const res = await request(testApp)
        .post('/api/v1/test/test-validation')
        .send({ email: 'not-an-email', age: 12 });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
      expect(res.body.error.details).toHaveLength(2);
      expect(res.body.error.details[0].field).toBe('email');
      expect(res.body.error.details[1].field).toBe('age');
    });

    it('should return 200 when Zod validation succeeds', async () => {
      const res = await request(testApp)
        .post('/api/v1/test/test-validation')
        .send({ email: 'valid@example.com', age: 25 });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toEqual({ email: 'valid@example.com', age: 25 });
    });

    it('should map ForbiddenError to 403 with standard code', async () => {
      const res = await request(testApp).get('/api/v1/test/test-forbidden');

      expect(res.status).toBe(403);
      expect(res.body).toEqual({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'You do not have permission',
        },
      });
    });
  });
});
