import jwt from 'jsonwebtoken';
import { env } from './env.js';

export const generateActivationToken = (id, email) => {
  return jwt.sign({ sub: id, email }, env('JWT_SECRET'), { expiresIn: '1d' });
};
