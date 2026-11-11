import { createApp } from './app';
import { env } from './config/env';
import { logger } from './config/logger';
import { sequelize } from './config/database';
import { redis } from './config/redis';

const app = createApp();

const server = app.listen(env.PORT, () => {
  logger.info(`🚀 Server running on port ${env.PORT} in [${env.NODE_ENV}] mode`);
  logger.info(`📖 API Documentation available at http://localhost:${env.PORT}/api/docs`);
  logger.info(`🏥 Health check at http://localhost:${env.PORT}/api/v1/health`);

  // In development, start the email worker automatically so a separate terminal isn't required
  if (env.NODE_ENV === 'development') {
    import('./jobs/email.worker.js')
      .then(() => {
        logger.info('📧 Background email worker attached in development mode');
      })
      .catch((err) => {
        logger.error({ err }, 'Failed to initialize background email worker');
      });
  }
});

const gracefulShutdown = async (signal: string): Promise<void> => {
  logger.info(`Received ${signal}. Starting graceful shutdown...`);

  server.close(async () => {
    logger.info('HTTP server closed.');

    try {
      const { emailWorker } = await import('./jobs/email.worker.js');
      await emailWorker.close();
      logger.info('Email worker closed.');
    } catch {
      // ignore
    }

    try {
      await sequelize.close();
      logger.info('Database connection closed.');
    } catch (err) {
      logger.error({ err }, 'Error closing database connection');
    }

    try {
      await redis.quit();
      logger.info('Redis connection closed.');
    } catch (err) {
      logger.error({ err }, 'Error closing Redis connection');
    }

    logger.info('Graceful shutdown completed.');
    process.exit(0);
  });

  // Force exit after 10s if shutdown hangs
  setTimeout(() => {
    logger.error('Shutdown timed out. Forcing process exit.');
    process.exit(1);
  }, 10000).unref();
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

