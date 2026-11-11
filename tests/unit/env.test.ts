import { z } from 'zod';

describe('Environment Variable Validation Schema', () => {
  const envTestSchema = z.object({
    NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
    PORT: z.coerce.number().default(5000),
    DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
    REDIS_URL: z.string().min(1, 'REDIS_URL is required'),
    JWT_ACCESS_SECRET: z.string().min(32, 'JWT_ACCESS_SECRET must be at least 32 characters'),
    SUPER_ADMIN_EMAIL: z.string().email('SUPER_ADMIN_EMAIL must be a valid email'),
    SUPER_ADMIN_PASSWORD: z.string().min(8, 'SUPER_ADMIN_PASSWORD must be at least 8 characters'),
  });

  it('should parse valid environment variables successfully', () => {
    const validConfig = {
      DATABASE_URL: 'postgres://user:pass@localhost:5432/testdb',
      REDIS_URL: 'redis://localhost:6379',
      JWT_ACCESS_SECRET: 'this-is-a-very-long-secret-key-32-chars-min',
      SUPER_ADMIN_EMAIL: 'admin@sqlworkspace.com',
      SUPER_ADMIN_PASSWORD: 'Password123!',
    };

    const parsed = envTestSchema.safeParse(validConfig);
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.PORT).toBe(5000);
      expect(parsed.data.NODE_ENV).toBe('development');
    }
  });

  it('should fail validation when required variables are missing', () => {
    const invalidConfig = {
      DATABASE_URL: '',
      REDIS_URL: '',
    };

    const parsed = envTestSchema.safeParse(invalidConfig);
    expect(parsed.success).toBe(false);
  });

  it('should reject short JWT_ACCESS_SECRET', () => {
    const invalidConfig = {
      DATABASE_URL: 'postgres://localhost:5432/db',
      REDIS_URL: 'redis://localhost:6379',
      JWT_ACCESS_SECRET: 'too-short',
      SUPER_ADMIN_EMAIL: 'admin@test.com',
      SUPER_ADMIN_PASSWORD: 'password123',
    };

    const parsed = envTestSchema.safeParse(invalidConfig);
    expect(parsed.success).toBe(false);
    if (!parsed.success) {
      const issues = parsed.error.issues;
      expect(issues.some((i) => i.path.includes('JWT_ACCESS_SECRET'))).toBe(true);
    }
  });
});

