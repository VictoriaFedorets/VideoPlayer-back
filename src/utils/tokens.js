import jwt from 'jsonwebtoken';
import { env } from './env.js';

export const generateAccessToken = (id) => {
  return jwt.sign({ id }, env('JWT_SECRET'), {
    expiresIn: env('JWT_EXPIRES_IN') || '1h',
  });
};
