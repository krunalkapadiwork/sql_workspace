import { Request, Response, NextFunction } from 'express';
import { AppError } from '../errors';
import { sendError } from '../utils/response';
import { logger } from '../../config/logger';

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction,
): void => {
  if (err instanceof AppError) {
    if (!err.isOperational) {
      logger.error({ err, reqId: req.id }, `Unexpected operational error: ${err.message}`);
    }
    sendError(res, err.errorCode, err.message, err.statusCode, err.details);
    return;
  }

  // Handle body-parser JSON syntax error
  if ('type' in err && (err as { type: string }).type === 'entity.parse.failed') {
    sendError(res, 'VALIDATION_ERROR', 'Malformed JSON in request body', 400);
    return;
  }

  // Unexpected / unhandled error
  logger.error(
    {
      err: {
        message: err.message,
        stack: err.stack,
      },
      reqId: req.id,
      path: req.originalUrl,
      method: req.method,
    },
    'Unhandled server exception',
  );

  sendError(res, 'INTERNAL_SERVER_ERROR', 'An unexpected error occurred on the server', 500);
};

