import jwt from 'jsonwebtoken';
import { env } from './env.ts';

interface TokenPayload {
  sub: number;
  email: string;
}

export const generateActivationToken = (id: number, email: string): string => {
  const payload: TokenPayload = { sub: id, email };
  const secret = env('JWT_SECRET');

  if (!secret) {
    throw new Error('JWT_SECRET is not defined');
  }

  return jwt.sign(payload, secret, { expiresIn: '1d' });
};
