import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import dotenv from 'dotenv';
import { generateAccessToken } from '../utils/tokens.js';
import { setupSession } from '../utils/setupSession.js';
import {
  prisma,
  ONE_DAY,
  JWT_EXPIRES_IN,
  JWT_SECRET,
} from '../config/constants.js';

dotenv.config();

// Регистрация
export const registerAuthController = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser)
      return res.status(409).json({ message: 'User already exists' });

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: { name, email, password: hashedPassword },
    });

    const accessToken = generateAccessToken(user.id);
    const refreshToken = crypto.randomBytes(40).toString('hex');
    const refreshTokenValidUntil = new Date(Date.now() + ONE_DAY);

    await prisma.user.update({
      where: { id: user.id },
      data: { refreshToken, refreshTokenValidUntil },
    });

    setupSession(res, { id: user.id, refreshToken, refreshTokenValidUntil });

    res.status(201).json({
      accessToken,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        createdAt: user.createdAt,
      },
    });
  } catch (err) {
    console.error('REGISTER ERROR:', err.stack);
    res.status(500).json({ message: 'Server error' });
  }
};

// Логин
export const loginAuthController = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return res.status(400).json({ message: 'Invalid credentials' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch)
      return res.status(400).json({ message: 'Invalid credentials' });

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
export const logoutAuthController = async (req, res) => {
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

// Обновление сессии
export const refreshSessionAuthController = async (req, res) => {
  try {
    const sessionId = Number(req.cookies.sessionId);
    const { refreshToken } = req.cookies;
    if (!sessionId || !refreshToken) throw new Error('No session');

    const user = await prisma.user.findUnique({ where: { id: sessionId } });
    if (
      !user ||
      user.refreshToken !== refreshToken ||
      user.refreshTokenValidUntil < new Date()
    ) {
      return res.status(401).json({ message: 'Invalid session' });
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
    res.status(401).json({ message: err.message });
  }
};

// Подтверждение email
export const confirmEmailAuthController = async (req, res) => {
  try {
    const { token } = req.body;
    const user = await prisma.user.findFirst({
      where: { emailConfirmationToken: token },
    });
    if (!user) return res.status(400).json({ message: 'Invalid token' });

    await prisma.user.update({
      where: { id: user.id },
      data: { emailConfirmed: true, emailConfirmationToken: null },
    });

    res.json({ message: 'Email confirmed' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Сброс пароля
export const requestResetEmailAuthController = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return res.status(404).json({ message: 'User not found' });

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

export const resetPasswordAuthController = async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    const user = await prisma.user.findFirst({ where: { resetToken: token } });
    if (!user || user.resetTokenValidUntil < new Date()) {
      return res
        .status(400)
        .json({ message: 'Invalid or expired reset token' });
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
