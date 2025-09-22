import jwt from 'jsonwebtoken';
import type { SignOptions, Secret } from 'jsonwebtoken';

import { env } from './env.ts';

interface JwtPayload {
  id: number;
}

export const generateAccessToken = (id: number): string => {
  const secret: Secret = env('JWT_SECRET') as string;

  const expiresIn = (env('JWT_EXPIRES_IN') ||
    '1h') as unknown as jwt.SignOptions['expiresIn'];

  const options: SignOptions = { expiresIn };

  return jwt.sign({ id } as JwtPayload, secret, options);
};
