import request from 'supertest';
import { getTestApp } from '../helpers/test-app';

describe('Swagger Documentation Endpoints', () => {
  const app = getTestApp();

  it('GET /api/docs should serve Swagger UI HTML', async () => {
    const res = await request(app).get('/api/docs/');
    expect(res.status).toBe(200);
    expect(res.text).toContain('swagger-ui');
  });

  it('GET /api/docs.json should serve OpenAPI specification JSON', async () => {
    const res = await request(app).get('/api/docs.json');
    expect(res.status).toBe(200);
    expect(res.body.openapi).toBe('3.0.0');
    expect(res.body.info.title).toBe('SQL Workspace Backend API');
  });
});

