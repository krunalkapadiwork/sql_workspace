import { sequelize } from '../../src/config/database';
import { redis } from '../../src/config/redis';

export default async function globalTeardown(): Promise<void> {
  try {
    await sequelize.close();
  } catch {
    // ignore
  }

  try {
    await redis.quit();
  } catch {
    // ignore
  }
}

