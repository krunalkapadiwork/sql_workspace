import request from 'supertest';
import { getTestApp } from '../helpers/test-app';

describe('Catalog Endpoints', () => {
  const app = getTestApp();

  describe('GET /api/v1/roles', () => {
    it('should return all seeded system roles', async () => {
      const res = await request(app).get('/api/v1/roles');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);

      const roleNames = res.body.data.map((r: { name: string }) => r.name);
      expect(roleNames).toContain('SUPER_ADMIN');
      expect(roleNames).toContain('ADMIN');
      expect(roleNames).toContain('USER');
      expect(res.body.data.length).toBe(3);
    });
  });

  describe('GET /api/v1/permissions', () => {
    it('should return all 5 global v1 permissions with module = null', async () => {
      const res = await request(app).get('/api/v1/permissions');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);

      const actions = res.body.data.map((p: { action: string; module: string | null }) => {
        expect(p.module).toBeNull();
        return p.action;
      });

      expect(actions).toContain('READ');
      expect(actions).toContain('CREATE');
      expect(actions).toContain('UPDATE');
      expect(actions).toContain('DELETE');
      expect(actions).toContain('MANAGE_MEMBERS');
      expect(res.body.data.length).toBe(5);
    });
  });
});

