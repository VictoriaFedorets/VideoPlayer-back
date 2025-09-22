import { HttpError } from 'http-errors';
import type { Request, Response, NextFunction } from 'express';

export const errorHandler = (
  err: HttpError | Error | unknown,
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  const status = (err as HttpError).status || 500;
  const message = (err as Error).message || 'Server error';

  console.error('ERROR MESSAGE:', message);
  console.error('STACK TRACE:', (err as Error).stack);

  res.status(status).json({ message });
};
