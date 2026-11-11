import { Sequelize } from 'sequelize';
import { env } from './env';
import { logger } from './logger';

export const sequelize = new Sequelize(env.DATABASE_URL, {
  dialect: 'postgres',
  logging:
    env.NODE_ENV === 'test'
      ? false
      : (msg: string) => logger.debug({ db: true }, msg),
  pool: {
    max: 20,
    min: 2,
    acquire: 30000,
    idle: 10000,
  },
  define: {
    underscored: true,
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    deletedAt: 'deleted_at',
  },
});

