import { sequelize } from '../../config/database';
import { redis } from '../../config/redis';

export interface HealthStatus {
  status: 'ok' | 'degraded' | 'down';
  timestamp: string;
  uptime: number;
  services: {
    database: {
      status: 'up' | 'down';
      responseTimeMs: number;
      error?: string;
    };
    redis: {
      status: 'up' | 'down';
      responseTimeMs: number;
      error?: string;
    };
  };
}

export class HealthService {
  public async checkHealth(): Promise<HealthStatus> {
    const startDb = Date.now();
    let dbStatus: 'up' | 'down' = 'up';
    let dbError: string | undefined;

    try {
      await sequelize.authenticate();
    } catch (err) {
      dbStatus = 'down';
      dbError = err instanceof Error ? err.message : 'Database connection error';
    }
    const dbDuration = Date.now() - startDb;

    const startRedis = Date.now();
    let redisStatus: 'up' | 'down' = 'up';
    let redisError: string | undefined;

    try {
      if (redis.status !== 'ready') {
        await redis.connect().catch(() => {
          // If already connecting or connected, ignore
        });
      }
      const pong = await redis.ping();
      if (pong !== 'PONG') {
        redisStatus = 'down';
        redisError = 'Invalid response from Redis';
      }
    } catch (err) {
      redisStatus = 'down';
      redisError = err instanceof Error ? err.message : 'Redis connection error';
    }
    const redisDuration = Date.now() - startRedis;

    const overallStatus: 'ok' | 'degraded' | 'down' =
      dbStatus === 'up' && redisStatus === 'up'
        ? 'ok'
        : dbStatus === 'down' && redisStatus === 'down'
          ? 'down'
          : 'degraded';

    return {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      services: {
        database: {
          status: dbStatus,
          responseTimeMs: dbDuration,
          ...(dbError ? { error: dbError } : {}),
        },
        redis: {
          status: redisStatus,
          responseTimeMs: redisDuration,
          ...(redisError ? { error: redisError } : {}),
        },
      },
    };
  }
}

export const healthService = new HealthService();

