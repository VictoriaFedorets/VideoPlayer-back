import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import dotenv from 'dotenv';
import type { Request, Response } from 'express';
import { generateAccessToken } from '../utils/tokens.ts';
import { setupSession } from '../utils/setupSession.ts';
import { prisma, ONE_DAY } from '../config/constants.ts';
import type {
  RegisterAuthDTO,
  LoginAuthDTO,
  ConfirmEmailAuthDTO,
  RequestResetEmailAuthDTO,
  ResetPasswordAuthDTO,
} from '../validation/auth.ts';
import path from 'path';
import * as authService from '../services/auth.ts';

dotenv.config();

interface SessionCookies {
  sessionId?: string;
  refreshToken?: string;
}

// Регистрация
export const registerAuthController = async (
  req: Request<{}, {}, RegisterAuthDTO>,
  res: Response,
): Promise<void> => {
  try {
    const { accessToken, user } = await authService.register(req.body);

    res.status(201).json({ accessToken, user });
  } catch (err: any) {
    console.error('REGISTER ERROR:', err.stack || err);
    res
      .status(err.status || 500)
      .json({ message: err.message || 'Server error' });
  }
};

// Логин
export const loginAuthController = async (
  req: Request<{}, {}, LoginAuthDTO>,
  res: Response,
): Promise<void> => {
  try {
    const { email, password } = req.body;
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      res.status(400).json({ message: 'Invalid credentials' });
      return;
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      res.status(400).json({ message: 'Invalid credentials' });
      return;
    }

    const accessToken = generateAccessToken(user.id);
    const refreshToken = crypto.randomBytes(40).toString('hex');
    const refreshTokenValidUntil = new Date(Date.now() + ONE_DAY);

    await prisma.user.update({
      where: { id: user.id },
      data: { refreshToken, refreshTokenValidUntil },
    });

    setupSession(res, { id: user.id, refreshToken, refreshTokenValidUntil });

    res.json({
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        createdAt: user.createdAt,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Логаут
export const logoutAuthController = async (
  req: Request<{}, {}, LoginAuthDTO>,
  res: Response,
): Promise<void> => {
  try {
    const sessionId = Number(req.cookies.sessionId);
    if (sessionId) {
      await prisma.user.update({
        where: { id: sessionId },
        data: { refreshToken: null, refreshTokenValidUntil: null },
      });
    }
    res.clearCookie('sessionId');
    res.clearCookie('refreshToken');
    res.status(204).send();
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};
// Обновление токенов (refresh)
export const refreshAuthController = async (
  req: Request<{}, {}, { refreshToken: string }>,
  res: Response,
): Promise<void> => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      res.status(400).json({ message: 'Refresh token is required' });
      return;
    }

    const user = await prisma.user.findFirst({
      where: { refreshToken },
    });

    if (
      !user ||
      !user.refreshTokenValidUntil ||
      user.refreshTokenValidUntil < new Date()
    ) {
      res.status(401).json({ message: 'Invalid or expired refresh token' });
      return;
    }

    // создаём новые токены
    const newAccessToken = generateAccessToken(user.id);
    const newRefreshToken = crypto.randomBytes(40).toString('hex');
    const refreshTokenValidUntil = new Date(Date.now() + ONE_DAY);

    await prisma.user.update({
      where: { id: user.id },
      data: { refreshToken: newRefreshToken, refreshTokenValidUntil },
    });

    // возвращаем новые токены
    res.json({
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        createdAt: user.createdAt,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Обновление сессии
export const refreshSessionAuthController = async (
  req: Request<{}, {}, {}, SessionCookies>,
  res: Response,
): Promise<void> => {
  try {
    const sessionId = Number(req.cookies.sessionId);
    const { refreshToken } = req.cookies;
    if (!sessionId || !refreshToken) throw new Error('No session');

    const user = await prisma.user.findUnique({ where: { id: sessionId } });
    if (
      !user ||
      user.refreshToken !== refreshToken ||
      !user.refreshTokenValidUntil ||
      user.refreshTokenValidUntil < new Date()
    ) {
      res.status(401).json({ message: 'Invalid session' });
      return;
    }

    const newAccessToken = generateAccessToken(user.id);
    const newRefreshToken = crypto.randomBytes(40).toString('hex');
    const refreshTokenValidUntil = new Date(Date.now() + ONE_DAY);

    await prisma.user.update({
      where: { id: user.id },
      data: { refreshToken: newRefreshToken, refreshTokenValidUntil },
    });

    setupSession(res, {
      id: user.id,
      refreshToken: newRefreshToken,
      refreshTokenValidUntil,
    });

    res.json({ accessToken: newAccessToken });
  } catch (err) {
    console.error(err);
    res.status(401).json({ message: (err as Error).message });
  }
};

// Подтверждение email
export const confirmEmailAuthController = async (
  req: Request<{}, {}, ConfirmEmailAuthDTO>,
  res: Response,
): Promise<void> => {
  try {
    const { token } = req.body;

    if (!token) {
      res.status(400).json({ message: 'Token is required' });
      return;
    }

    const user = await prisma.user.findFirst({
      where: { emailConfirmationToken: { equals: token } },
    });

    if (!user) {
      res.status(400).json({ message: 'Invalid token' });
      return;
    }

    await prisma.user.update({
      where: { id: user.id },
      data: {
        emailConfirmed: true,
        emailConfirmationToken: null,
      },
    });

    res.json({ message: 'Email confirmed' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Сброс пароля
export const requestResetEmailAuthController = async (
  req: Request<{}, {}, RequestResetEmailAuthDTO>,
  res: Response,
): Promise<void> => {
  try {
    const { email } = req.body;
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    const resetToken = crypto.randomBytes(20).toString('hex');
    const resetTokenValidUntil = new Date(Date.now() + 3600 * 1000); // 1 час

    await prisma.user.update({
      where: { id: user.id },
      data: { resetToken, resetTokenValidUntil },
    });

    // TODO: отправка email с resetToken
    console.log(`Reset token for ${email}: ${resetToken}`);

    res.json({ message: 'Reset password email sent' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

export const resetPasswordAuthController = async (
  req: Request<{}, {}, ResetPasswordAuthDTO>,
  res: Response,
): Promise<void> => {
  try {
    const { token, newPassword } = req.body;

    const user = await prisma.user.findFirst({
      where: { resetToken: token },
    });
    if (
      !user ||
      !user.resetTokenValidUntil ||
      user.resetTokenValidUntil < new Date()
    ) {
      res.status(400).json({ message: 'Invalid or expired reset token' });
      return;
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        resetToken: null,
        resetTokenValidUntil: null,
      },
    });

    res.json({ message: 'Password successfully reset' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};
