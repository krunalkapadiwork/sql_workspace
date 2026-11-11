import request from 'supertest';
import { getTestApp } from '../helpers/test-app';
import { healthService } from '../../src/modules/health/health.service';

describe('GET /api/v1/health', () => {
  const app = getTestApp();

  it('should return 200 with status "ok" when all services are up', async () => {
    jest.spyOn(healthService, 'checkHealth').mockResolvedValueOnce({
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: 10,
      services: {
        database: { status: 'up', responseTimeMs: 5 },
        redis: { status: 'up', responseTimeMs: 2 },
      },
    });

    const res = await request(app).get('/api/v1/health');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe('ok');
    expect(res.body.data.services.database.status).toBe('up');
    expect(res.body.data.services.redis.status).toBe('up');
  });

  it('should return 200 with status "degraded" when one service is down', async () => {
    jest.spyOn(healthService, 'checkHealth').mockResolvedValueOnce({
      status: 'degraded',
      timestamp: new Date().toISOString(),
      uptime: 10,
      services: {
        database: { status: 'up', responseTimeMs: 5 },
        redis: { status: 'down', responseTimeMs: 2, error: 'Connection refused' },
      },
    });

    const res = await request(app).get('/api/v1/health');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe('degraded');
  });

  it('should return 503 with status "down" when both services are down', async () => {
    jest.spyOn(healthService, 'checkHealth').mockResolvedValueOnce({
      status: 'down',
      timestamp: new Date().toISOString(),
      uptime: 10,
      services: {
        database: { status: 'down', responseTimeMs: 5, error: 'Database down' },
        redis: { status: 'down', responseTimeMs: 2, error: 'Redis down' },
      },
    });

    const res = await request(app).get('/api/v1/health');

    expect(res.status).toBe(503);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe('down');
  });
});

