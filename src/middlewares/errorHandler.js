import { HttpError } from 'http-errors';

export const errorHandler = (err, req, res, next) => {
  console.error('ERROR MESSAGE:', err.message);
  console.error('STACK TRACE:', err.stack);
  res
    .status(err.status || 500)
    .json({ message: err.message || 'Server error' });
};
