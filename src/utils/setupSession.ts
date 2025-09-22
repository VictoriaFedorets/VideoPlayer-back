import type { Response } from 'express';

interface SessionData {
  id: number;
  refreshToken: string;
  refreshTokenValidUntil: Date;
}

export const setupSession = (res: Response, session: SessionData): void => {
  const { id, refreshToken, refreshTokenValidUntil } = session;

  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    sameSite: 'none', // lowercase в TypeScript
    secure: process.env.NODE_ENV === 'production',
    expires: refreshTokenValidUntil,
  });

  res.cookie('sessionId', id, {
    httpOnly: true,
    sameSite: 'none',
    secure: process.env.NODE_ENV === 'production',
    expires: refreshTokenValidUntil,
  });
};
