import dotenv from 'dotenv';
import { z } from 'zod';

// Load .env file
dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(5000),
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).default('info'),

  // Frontend & CORS
  FRONTEND_URL: z.string().url().default('http://localhost:3000'),
  CORS_ORIGINS: z
    .string()
    .default('http://localhost:3000')
    .transform((val) => val.split(',').map((origin) => origin.trim())),

  // Database
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),

  // Redis
  REDIS_URL: z.string().min(1, 'REDIS_URL is required'),

  // Auth & Tokens
  JWT_ACCESS_SECRET: z.string().min(32, 'JWT_ACCESS_SECRET must be at least 32 characters'),
  JWT_ACCESS_TTL: z.string().default('15m'),
  REFRESH_TTL_DAYS: z.coerce.number().default(7),
  INVITE_TTL_HOURS: z.coerce.number().default(48),
  RESET_TTL_MINUTES: z.coerce.number().default(60),
  BCRYPT_ROUNDS: z.coerce.number().default(12),

  // Super Admin
  SUPER_ADMIN_EMAIL: z.string().email('SUPER_ADMIN_EMAIL must be a valid email'),
  SUPER_ADMIN_PASSWORD: z.string().min(8, 'SUPER_ADMIN_PASSWORD must be at least 8 characters'),

  // Email / SMTP
  SMTP_HOST: z.string().default('localhost'),
  SMTP_PORT: z.coerce.number().default(1025),
  SMTP_USER: z.string().optional().default(''),
  SMTP_PASS: z.string().optional().default(''),
  MAIL_FROM: z.string().email().default('no-reply@sqlworkspace.com'),
});

export type EnvConfig = z.infer<typeof envSchema>;

const parseEnv = (): EnvConfig => {
  const result = envSchema.safeParse(process.env);
  if (!result.success) {
    const formatted = result.error.format();
    // eslint-disable-next-line no-console
    console.error('❌ Environment validation failed:', JSON.stringify(formatted, null, 2));
    throw new Error('Environment configuration error');
  }
  return result.data;
};

export const env = parseEnv();

