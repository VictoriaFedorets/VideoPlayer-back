import type { NextFunction } from 'express';

interface CustomError extends Error {
  status?: number;
  data?: any;
}

export const handleServerError = (
  error: CustomError,
  _data: any,
  next: NextFunction,
): void => {
  error.status = error.status || 400;
  next(error);
};
