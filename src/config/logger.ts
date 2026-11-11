import pino from 'pino';
import { env } from './env';

export const logger = pino({
  level: env.LOG_LEVEL,
  redact: {
    paths: [
      'req.headers.authorization',
      'req.headers.cookie',
      'body.password',
      'body.newPassword',
      'body.currentPassword',
      'body.token',
      'body.refreshToken',
    ],
    remove: true,
  },
  transport:
    env.NODE_ENV === 'development'
      ? {
          target: 'pino-pretty',
          options: {
            colorize: true,
            translateTime: 'SYS:standard',
            ignore: 'pid,hostname',
          },
        }
      : undefined,
});

