import { Request, Response, NextFunction } from 'express';
import { randomUUID } from 'crypto';

export const requestId = (req: Request, res: Response, next: NextFunction): void => {
  const headerId = req.headers['x-request-id'];
  const id = typeof headerId === 'string' && headerId.trim().length > 0 ? headerId : randomUUID();
  req.id = id;
  res.setHeader('X-Request-Id', id);
  next();
};

